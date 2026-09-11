package com.sih.cooperative.service;

import com.sih.cooperative.entity.GovernanceProposal;
import com.sih.cooperative.entity.ProposalStatus;
import com.sih.cooperative.repository.GovernanceProposalRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class GovernanceProposalScheduler {

    private static final Logger logger = LoggerFactory.getLogger(GovernanceProposalScheduler.class);

    private final GovernanceProposalRepository proposalRepository;
    private final GovernanceService governanceService;

    public GovernanceProposalScheduler(
            GovernanceProposalRepository proposalRepository,
            GovernanceService governanceService
    ) {
        this.proposalRepository = proposalRepository;
        this.governanceService = governanceService;
    }

    /**
     * Run every minute to check for expired proposals whose voting period has ended.
     * Closes them idempotently and calculates final PASSED / REJECTED status.
     */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void autoCloseExpiredProposals() {
        LocalDateTime now = LocalDateTime.now();
        List<GovernanceProposal> expiredProposals = proposalRepository.findByStatusAndVotingEndsAtBefore(
                ProposalStatus.OPEN,
                now
        );

        if (expiredProposals.isEmpty()) {
            return;
        }

        logger.info("Found {} expired governance proposals to close automatically.", expiredProposals.size());

        for (GovernanceProposal proposal : expiredProposals) {
            try {
                logger.info("Auto-closing expired governance proposal ID #{} ('{}')", proposal.getId(), proposal.getTitle());
                governanceService.closeProposalEntity(proposal, null);
            } catch (Exception e) {
                logger.error("Error auto-closing expired proposal ID #{}: {}", proposal.getId(), e.getMessage(), e);
            }
        }
    }
}
