package com.sih.cooperative.service;

import com.sih.cooperative.dto.*;
import com.sih.cooperative.entity.*;
import com.sih.cooperative.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class GovernanceService {

    private static final Logger logger = LoggerFactory.getLogger(GovernanceService.class);

    private final GovernanceProposalRepository proposalRepository;
    private final GovernanceVoteRepository voteRepository;
    private final UserRepository userRepository;
    private final WorkerVerificationRepository workerVerificationRepository;
    private final AdminActivityRepository adminActivityRepository;
    private final NotificationService notificationService;

    public GovernanceService(
            GovernanceProposalRepository proposalRepository,
            GovernanceVoteRepository voteRepository,
            UserRepository userRepository,
            WorkerVerificationRepository workerVerificationRepository,
            AdminActivityRepository adminActivityRepository,
            NotificationService notificationService
    ) {
        this.proposalRepository = proposalRepository;
        this.voteRepository = voteRepository;
        this.userRepository = userRepository;
        this.workerVerificationRepository = workerVerificationRepository;
        this.adminActivityRepository = adminActivityRepository;
        this.notificationService = notificationService;
    }

    /**
     * Create a governance proposal.
     * Allowed for WORKER or ADMIN.
     */
    @Transactional
    public ProposalResponse createProposal(CreateProposalRequest request, String authenticatedUsername) {
        User creator = getAuthenticatedUser(authenticatedUsername);

        if (creator.getRole() != Role.WORKER && creator.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only workers or administrators can create governance proposals");
        }

        if (creator.getRole() == Role.WORKER) {
            validateWorkerEligibility(creator);
        }

        ProposalCategory category = request.getCategory() != null ? request.getCategory() : ProposalCategory.GENERAL;
        GovernanceProposal proposal = new GovernanceProposal(
                request.getTitle().trim(),
                request.getDescription().trim(),
                category,
                creator
        );
        proposal.setStatus(ProposalStatus.DRAFT);
        proposal = proposalRepository.save(proposal);

        logAdminActivity(creator, "CREATE_PROPOSAL", "GOVERNANCE_PROPOSAL", proposal.getId(),
                "Created governance proposal: " + proposal.getTitle());

        return mapToProposalResponse(proposal, creator);
    }

    /**
     * List all proposals with optional status/category filtering and pagination.
     */
    @Transactional(readOnly = true)
    public Page<ProposalResponse> getProposals(
            ProposalStatus status,
            ProposalCategory category,
            Pageable pageable,
            String authenticatedUsername
    ) {
        User currentUser = authenticatedUsername != null ? userRepository.findByEmail(authenticatedUsername).orElse(null) : null;

        Page<GovernanceProposal> page;
        if (status != null && category != null) {
            page = proposalRepository.findByStatusAndCategory(status, category, pageable);
        } else if (status != null) {
            page = proposalRepository.findByStatus(status, pageable);
        } else if (category != null) {
            page = proposalRepository.findByCategory(category, pageable);
        } else {
            page = proposalRepository.findAll(pageable);
        }

        return page.map(p -> mapToProposalResponse(p, currentUser));
    }

    /**
     * Get a single proposal by ID.
     */
    @Transactional(readOnly = true)
    public ProposalResponse getProposalById(Long proposalId, String authenticatedUsername) {
        GovernanceProposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proposal not found with id: " + proposalId));

        User currentUser = authenticatedUsername != null ? userRepository.findByEmail(authenticatedUsername).orElse(null) : null;
        return mapToProposalResponse(proposal, currentUser);
    }

    /**
     * Open a proposal for voting.
     * Allowed for ADMIN or Proposal Creator.
     */
    @Transactional
    public ProposalResponse openVoting(Long proposalId, OpenProposalRequest request, String authenticatedUsername) {
        User caller = getAuthenticatedUser(authenticatedUsername);
        GovernanceProposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proposal not found with id: " + proposalId));

        boolean isCreator = proposal.getCreatedBy().getId().equals(caller.getId());
        boolean isAdmin = caller.getRole() == Role.ADMIN;

        if (!isCreator && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the creator or an administrator can open voting for this proposal");
        }

        if (proposal.getStatus() != ProposalStatus.DRAFT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only proposals in DRAFT status can be opened for voting. Current status: " + proposal.getStatus());
        }

        LocalDateTime now = LocalDateTime.now();
        proposal.setVotingStartsAt(now);

        if (request != null && request.getVotingEndsAt() != null) {
            if (request.getVotingEndsAt().isBefore(now)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Voting end time cannot be in the past");
            }
            proposal.setVotingEndsAt(request.getVotingEndsAt());
        } else {
            int durationDays = (request != null && request.getVotingDurationDays() != null && request.getVotingDurationDays() > 0)
                    ? request.getVotingDurationDays()
                    : 7; // Default 7 days voting window
            proposal.setVotingEndsAt(now.plusDays(durationDays));
        }

        proposal.setStatus(ProposalStatus.OPEN);
        proposal = proposalRepository.save(proposal);

        logAdminActivity(caller, "OPEN_PROPOSAL", "GOVERNANCE_PROPOSAL", proposal.getId(),
                "Opened voting for proposal: " + proposal.getTitle());

        // Notify active workers that a proposal is open for voting
        notifyWorkersProposalOpened(proposal);

        return mapToProposalResponse(proposal, caller);
    }

    /**
     * Cast a vote on a proposal.
     * Enforces:
     * - Voter must be authenticated WORKER.
     * - Worker must be active.
     * - Proposal must be OPEN and within voting time window.
     * - Duplicate votes rejected (Service & DB level).
     * - Authenticated identity is used directly (No client-supplied voter ID / No IDOR).
     */
    @Transactional
    public ProposalResponse castVote(Long proposalId, CastVoteRequest request, String authenticatedUsername) {
        User voter = getAuthenticatedUser(authenticatedUsername);

        if (voter.getRole() != Role.WORKER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only authenticated workers are eligible to vote in cooperative governance");
        }

        validateWorkerEligibility(voter);

        GovernanceProposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proposal not found with id: " + proposalId));

        if (proposal.getStatus() != ProposalStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Voting is not open for this proposal. Current status: " + proposal.getStatus());
        }

        LocalDateTime now = LocalDateTime.now();
        if (proposal.getVotingStartsAt() != null && now.isBefore(proposal.getVotingStartsAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Voting has not started yet for this proposal");
        }

        if (proposal.getVotingEndsAt() != null && now.isAfter(proposal.getVotingEndsAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Voting period has expired for this proposal");
        }

        if (voteRepository.existsByProposalIdAndVoterId(proposal.getId(), voter.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You have already cast a vote on this proposal");
        }

        GovernanceVote vote = new GovernanceVote(proposal, voter, request.getVoteChoice());
        voteRepository.save(vote);

        return mapToProposalResponse(proposal, voter);
    }

    /**
     * Internal method to close an OPEN proposal, resolve tally, update status, and notify creator.
     */
    @Transactional
    public ProposalResultResponse closeProposalEntity(GovernanceProposal proposal, User actor) {
        if (proposal.getStatus() != ProposalStatus.OPEN) {
            return calculateProposalResults(proposal);
        }

        long yesVotes = voteRepository.countByProposalIdAndVoteChoice(proposal.getId(), VoteType.YES);
        long noVotes = voteRepository.countByProposalIdAndVoteChoice(proposal.getId(), VoteType.NO);
        long totalVotes = voteRepository.countByProposalId(proposal.getId());

        // Simple majority rule: YES > NO results in PASSED, otherwise REJECTED
        ProposalStatus finalStatus;
        if (totalVotes > 0 && yesVotes > noVotes) {
            finalStatus = ProposalStatus.PASSED;
        } else {
            finalStatus = ProposalStatus.REJECTED;
        }

        proposal.setStatus(finalStatus);
        if (proposal.getVotingEndsAt() == null || LocalDateTime.now().isBefore(proposal.getVotingEndsAt())) {
            proposal.setVotingEndsAt(LocalDateTime.now());
        }
        proposal = proposalRepository.save(proposal);

        if (actor != null) {
            logAdminActivity(actor, "CLOSE_PROPOSAL", "GOVERNANCE_PROPOSAL", proposal.getId(),
                    "Closed voting on proposal: " + proposal.getTitle() + ". Final status: " + finalStatus);
        }

        // Notify proposal creator of final outcome
        notifyCreatorProposalClosed(proposal, finalStatus, yesVotes, noVotes, totalVotes);

        return calculateProposalResults(proposal);
    }

    /**
     * Close/finalize voting on a proposal and calculate final status (PASSED/REJECTED).
     * Allowed for ADMIN or Proposal Creator.
     */
    @Transactional
    public ProposalResultResponse closeVoting(Long proposalId, String authenticatedUsername) {
        User caller = getAuthenticatedUser(authenticatedUsername);
        GovernanceProposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proposal not found with id: " + proposalId));

        boolean isCreator = proposal.getCreatedBy().getId().equals(caller.getId());
        boolean isAdmin = caller.getRole() == Role.ADMIN;

        if (!isCreator && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the creator or an administrator can close voting for this proposal");
        }

        if (proposal.getStatus() != ProposalStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only OPEN proposals can be closed. Current status: " + proposal.getStatus());
        }

        return closeProposalEntity(proposal, caller);
    }

    /**
     * Retrieve derived proposal results.
     */
    @Transactional(readOnly = true)
    public ProposalResultResponse getProposalResults(Long proposalId) {
        GovernanceProposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proposal not found with id: " + proposalId));

        return calculateProposalResults(proposal);
    }

    // Helper methods

    private User getAuthenticatedUser(String username) {
        return userRepository.findByEmail(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private void validateWorkerEligibility(User worker) {
        if (!worker.isActive() || worker.getStatus() == AccountStatus.DEACTIVATED || worker.getStatus() == AccountStatus.SUSPENDED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Worker account is inactive or suspended");
        }
    }

    private ProposalResponse mapToProposalResponse(GovernanceProposal proposal, User currentUser) {
        ProposalResponse dto = new ProposalResponse();
        dto.setId(proposal.getId());
        dto.setTitle(proposal.getTitle());
        dto.setDescription(proposal.getDescription());
        dto.setCategory(proposal.getCategory());
        dto.setStatus(proposal.getStatus());

        if (proposal.getCreatedBy() != null) {
            dto.setCreatedById(proposal.getCreatedBy().getId());
            dto.setCreatedByName(proposal.getCreatedBy().getName());
            dto.setCreatedByRole(proposal.getCreatedBy().getRole().name());
        }

        dto.setVotingStartsAt(proposal.getVotingStartsAt());
        dto.setVotingEndsAt(proposal.getVotingEndsAt());
        dto.setCreatedAt(proposal.getCreatedAt());
        dto.setUpdatedAt(proposal.getUpdatedAt());

        // Derive vote counts strictly from persisted votes
        Map<VoteType, Long> counts = getVoteCountsMap(proposal.getId());
        long yesCount = counts.getOrDefault(VoteType.YES, 0L);
        long noCount = counts.getOrDefault(VoteType.NO, 0L);
        long abstainCount = counts.getOrDefault(VoteType.ABSTAIN, 0L);
        long total = yesCount + noCount + abstainCount;

        dto.setYesVotes(yesCount);
        dto.setNoVotes(noCount);
        dto.setAbstainVotes(abstainCount);
        dto.setTotalVotes(total);

        // Compute current viewer status
        if (currentUser != null) {
            Optional<GovernanceVote> existingVote = voteRepository.findByProposalIdAndVoterId(proposal.getId(), currentUser.getId());
            if (existingVote.isPresent()) {
                dto.setUserHasVoted(true);
                dto.setUserVote(existingVote.get().getVoteChoice());
                dto.setUserCanVote(false);
            } else {
                dto.setUserHasVoted(false);
                dto.setUserVote(null);
                boolean isEligibleWorker = currentUser.getRole() == Role.WORKER && currentUser.isActive() && currentUser.getStatus() == AccountStatus.ACTIVE;
                boolean isOpen = proposal.getStatus() == ProposalStatus.OPEN;
                boolean notExpired = proposal.getVotingEndsAt() == null || LocalDateTime.now().isBefore(proposal.getVotingEndsAt());
                dto.setUserCanVote(isEligibleWorker && isOpen && notExpired);
            }
        } else {
            dto.setUserHasVoted(false);
            dto.setUserVote(null);
            dto.setUserCanVote(false);
        }

        return dto;
    }

    private ProposalResultResponse calculateProposalResults(GovernanceProposal proposal) {
        ProposalResultResponse res = new ProposalResultResponse();
        res.setProposalId(proposal.getId());
        res.setTitle(proposal.getTitle());
        res.setCategory(proposal.getCategory());
        res.setStatus(proposal.getStatus());
        res.setVotingStartsAt(proposal.getVotingStartsAt());
        res.setVotingEndsAt(proposal.getVotingEndsAt());

        Map<VoteType, Long> counts = getVoteCountsMap(proposal.getId());
        long yesCount = counts.getOrDefault(VoteType.YES, 0L);
        long noCount = counts.getOrDefault(VoteType.NO, 0L);
        long abstainCount = counts.getOrDefault(VoteType.ABSTAIN, 0L);
        long total = yesCount + noCount + abstainCount;

        res.setTotalVotes(total);
        res.setYesVotes(yesCount);
        res.setNoVotes(noCount);
        res.setAbstainVotes(abstainCount);

        if (total > 0) {
            res.setYesPercentage(Math.round((yesCount * 100.0 / total) * 100.0) / 100.0);
            res.setNoPercentage(Math.round((noCount * 100.0 / total) * 100.0) / 100.0);
            res.setAbstainPercentage(Math.round((abstainCount * 100.0 / total) * 100.0) / 100.0);
        } else {
            res.setYesPercentage(0.0);
            res.setNoPercentage(0.0);
            res.setAbstainPercentage(0.0);
        }

        res.setPassed(proposal.getStatus() == ProposalStatus.PASSED || (proposal.getStatus() == ProposalStatus.OPEN && yesCount > noCount));
        return res;
    }

    private Map<VoteType, Long> getVoteCountsMap(Long proposalId) {
        List<Object[]> rows = voteRepository.countVotesGroupedByChoice(proposalId);
        return rows.stream().collect(Collectors.toMap(
                row -> (VoteType) row[0],
                row -> ((Number) row[1]).longValue()
        ));
    }

    private void logAdminActivity(User actor, String actionType, String entityType, Long entityId, String description) {
        try {
            AdminActivity activity = new AdminActivity(
                    actor.getId(),
                    actor.getRole(),
                    actionType,
                    entityType,
                    entityId,
                    description
            );
            adminActivityRepository.save(activity);
        } catch (Exception e) {
            logger.warn("Could not write audit log for governance action: {}", e.getMessage());
        }
    }

    private void notifyWorkersProposalOpened(GovernanceProposal proposal) {
        try {
            List<User> activeWorkers = userRepository.findByRoleAndStatus(Role.WORKER, AccountStatus.ACTIVE);
            for (User worker : activeWorkers) {
                notificationService.createNotification(
                        worker,
                        NotificationType.PROPOSAL_OPENED,
                        "Cooperative Voting Open: " + proposal.getTitle(),
                        "A new cooperative proposal is now open for voting. Cast your vote before the voting window closes.",
                        "GOVERNANCE_PROPOSAL",
                        proposal.getId()
                );
            }
        } catch (Exception e) {
            logger.warn("Failed to notify workers of opened proposal {}: {}", proposal.getId(), e.getMessage());
        }
    }

    private void notifyCreatorProposalClosed(GovernanceProposal proposal, ProposalStatus finalStatus, long yesVotes, long noVotes, long totalVotes) {
        try {
            User creator = proposal.getCreatedBy();
            if (creator != null) {
                String outcomeText = finalStatus == ProposalStatus.PASSED ? "PASSED" : "REJECTED";
                String message = String.format("Proposal '%s' has concluded and %s. Final tally: %d YES, %d NO (%d total votes).",
                        proposal.getTitle(), outcomeText, yesVotes, noVotes, totalVotes);

                notificationService.createNotification(
                        creator,
                        NotificationType.PROPOSAL_CLOSED,
                        "Voting Concluded: " + proposal.getTitle() + " (" + outcomeText + ")",
                        message,
                        "GOVERNANCE_PROPOSAL",
                        proposal.getId()
                );
            }
        } catch (Exception e) {
            logger.warn("Failed to notify creator of closed proposal {}: {}", proposal.getId(), e.getMessage());
        }
    }
}
