package com.sih.cooperative;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sih.cooperative.dto.CastVoteRequest;
import com.sih.cooperative.dto.CreateProposalRequest;
import com.sih.cooperative.dto.OpenProposalRequest;
import com.sih.cooperative.entity.*;
import com.sih.cooperative.repository.GovernanceProposalRepository;
import com.sih.cooperative.repository.GovernanceVoteRepository;
import com.sih.cooperative.repository.UserRepository;
import com.sih.cooperative.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class GovernanceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GovernanceProposalRepository proposalRepository;

    @Autowired
    private GovernanceVoteRepository voteRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User adminUser;
    private User workerUser1;
    private User workerUser2;
    private User customerUser;
    private User deactivatedWorker;

    private String adminToken;
    private String worker1Token;
    private String worker2Token;
    private String customerToken;
    private String deactivatedWorkerToken;

    @Autowired
    private com.sih.cooperative.repository.WorkerProfileRepository workerProfileRepository;

    @Autowired
    private com.sih.cooperative.repository.WorkerVerificationRepository workerVerificationRepository;

    @Autowired
    private com.sih.cooperative.repository.VerificationDocumentRepository verificationDocumentRepository;

    @Autowired
    private com.sih.cooperative.repository.NotificationRepository notificationRepository;

    @Autowired
    private com.sih.cooperative.repository.AdminActivityRepository adminActivityRepository;

    @Autowired
    private com.sih.cooperative.repository.InvoiceRepository invoiceRepository;

    @Autowired
    private com.sih.cooperative.repository.PaymentRepository paymentRepository;

    @Autowired
    private com.sih.cooperative.repository.DisputeRepository disputeRepository;

    @Autowired
    private com.sih.cooperative.repository.JobRepository jobRepository;

    @Autowired
    private com.sih.cooperative.repository.ServiceRequestRepository serviceRequestRepository;

    @BeforeEach
    public void setUp() {
        voteRepository.deleteAll();
        proposalRepository.deleteAll();
        paymentRepository.deleteAll();
        invoiceRepository.deleteAll();
        notificationRepository.deleteAll();
        disputeRepository.deleteAll();
        jobRepository.deleteAll();
        serviceRequestRepository.deleteAll();
        verificationDocumentRepository.deleteAll();
        workerVerificationRepository.deleteAll();
        workerProfileRepository.deleteAll();
        adminActivityRepository.deleteAll();
        userRepository.deleteAll();

        adminUser = new User("Admin Steward", "admin.test@gigcircle.com", "9000000010", passwordEncoder.encode("Secret123"), Role.ADMIN);
        adminUser.setStatus(AccountStatus.ACTIVE);
        adminUser = userRepository.save(adminUser);
        adminToken = "Bearer " + jwtTokenProvider.generateToken(adminUser);

        workerUser1 = new User("Aarav Electrician", "aarav.worker@gigcircle.com", "9000000011", passwordEncoder.encode("Secret123"), Role.WORKER);
        workerUser1.setStatus(AccountStatus.ACTIVE);
        workerUser1 = userRepository.save(workerUser1);
        worker1Token = "Bearer " + jwtTokenProvider.generateToken(workerUser1);

        workerUser2 = new User("Bhavna Plumber", "bhavna.worker@gigcircle.com", "9000000012", passwordEncoder.encode("Secret123"), Role.WORKER);
        workerUser2.setStatus(AccountStatus.ACTIVE);
        workerUser2 = userRepository.save(workerUser2);
        worker2Token = "Bearer " + jwtTokenProvider.generateToken(workerUser2);

        customerUser = new User("Chetan Customer", "chetan.cust@gigcircle.com", "9000000013", passwordEncoder.encode("Secret123"), Role.CUSTOMER);
        customerUser.setStatus(AccountStatus.ACTIVE);
        customerUser = userRepository.save(customerUser);
        customerToken = "Bearer " + jwtTokenProvider.generateToken(customerUser);

        deactivatedWorker = new User("Inactive Worker", "inactive.worker@gigcircle.com", "9000000014", passwordEncoder.encode("Secret123"), Role.WORKER);
        deactivatedWorker.setStatus(AccountStatus.DEACTIVATED);
        deactivatedWorker.setActive(false);
        deactivatedWorker = userRepository.save(deactivatedWorker);
        deactivatedWorkerToken = "Bearer " + jwtTokenProvider.generateToken(deactivatedWorker);
    }

    @Test
    @DisplayName("Worker can create a proposal in DRAFT status")
    public void testWorkerCanCreateProposal() throws Exception {
        CreateProposalRequest req = new CreateProposalRequest(
                "Lower Platform Commission to 8%",
                "Proposal to reduce cooperative platform commission from 10% to 8% to increase worker earnings.",
                ProposalCategory.PLATFORM_FEE
        );

        mockMvc.perform(post("/api/governance/proposals")
                        .header("Authorization", worker1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.title").value("Lower Platform Commission to 8%"))
                .andExpect(jsonPath("$.category").value("PLATFORM_FEE"))
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.createdById").value(workerUser1.getId()))
                .andExpect(jsonPath("$.createdByName").value("Aarav Electrician"))
                .andExpect(jsonPath("$.totalVotes").value(0));
    }

    @Test
    @DisplayName("Customer cannot create proposal or vote (403 Forbidden)")
    public void testCustomerCannotCreateProposalOrVote() throws Exception {
        CreateProposalRequest req = new CreateProposalRequest(
                "Customer Initiated Proposal",
                "Customer attempting to initiate internal cooperative governance policy proposal.",
                ProposalCategory.POLICY
        );

        // Cannot create proposal
        mockMvc.perform(post("/api/governance/proposals")
                        .header("Authorization", customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());

        // Setup open proposal
        GovernanceProposal proposal = new GovernanceProposal(
                "Cooperative Healthcare Policy",
                "Subsidized medical checkup camps for verified active cooperative members.",
                ProposalCategory.BENEFITS,
                adminUser
        );
        proposal.setStatus(ProposalStatus.OPEN);
        proposal.setVotingStartsAt(LocalDateTime.now().minusHours(1));
        proposal.setVotingEndsAt(LocalDateTime.now().plusDays(7));
        proposal = proposalRepository.save(proposal);

        // Customer cannot vote
        CastVoteRequest voteReq = new CastVoteRequest(VoteType.YES);
        mockMvc.perform(post("/api/governance/proposals/" + proposal.getId() + "/vote")
                        .header("Authorization", customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(voteReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Proposals can be listed with optional filters and queried by ID")
    public void testListAndGetProposals() throws Exception {
        GovernanceProposal p1 = new GovernanceProposal("Proposal 1", "Detailed description for proposal 1 testing.", ProposalCategory.POLICY, adminUser);
        p1.setStatus(ProposalStatus.OPEN);
        proposalRepository.save(p1);

        GovernanceProposal p2 = new GovernanceProposal("Proposal 2", "Detailed description for proposal 2 testing.", ProposalCategory.BENEFITS, adminUser);
        p2.setStatus(ProposalStatus.DRAFT);
        proposalRepository.save(p2);

        mockMvc.perform(get("/api/governance/proposals")
                        .header("Authorization", worker1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)));

        mockMvc.perform(get("/api/governance/proposals?status=OPEN")
                        .header("Authorization", worker1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].title").value("Proposal 1"));

        mockMvc.perform(get("/api/governance/proposals/" + p1.getId())
                        .header("Authorization", worker1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(p1.getId()))
                .andExpect(jsonPath("$.userHasVoted").value(false));
    }

    @Test
    @DisplayName("Creator or Admin can open voting on draft proposal")
    public void testOpenVotingOnDraftProposal() throws Exception {
        GovernanceProposal proposal = new GovernanceProposal(
                "Annual Cooperative Surplus Distribution",
                "Proposal to distribute 40% of platform operational surplus to workers based on gig count.",
                ProposalCategory.POLICY,
                workerUser1
        );
        proposal.setStatus(ProposalStatus.DRAFT);
        proposal = proposalRepository.save(proposal);

        // Non-creator, non-admin (worker2) cannot open proposal
        mockMvc.perform(post("/api/governance/proposals/" + proposal.getId() + "/open")
                        .header("Authorization", worker2Token))
                .andExpect(status().isForbidden());

        // Creator opens proposal
        OpenProposalRequest openReq = new OpenProposalRequest(5);
        mockMvc.perform(post("/api/governance/proposals/" + proposal.getId() + "/open")
                        .header("Authorization", worker1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(openReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.votingStartsAt").isNotEmpty())
                .andExpect(jsonPath("$.votingEndsAt").isNotEmpty());

        // Cannot re-open already OPEN proposal
        mockMvc.perform(post("/api/governance/proposals/" + proposal.getId() + "/open")
                        .header("Authorization", worker1Token))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Valid worker vote is recorded and reflected in tallies")
    public void testValidWorkerVote() throws Exception {
        GovernanceProposal proposal = new GovernanceProposal(
                "Tool Equipment Subsidy",
                "Cooperative fund will subsidize 30% of essential tools for active certified technicians.",
                ProposalCategory.BENEFITS,
                adminUser
        );
        proposal.setStatus(ProposalStatus.OPEN);
        proposal.setVotingStartsAt(LocalDateTime.now().minusMinutes(10));
        proposal.setVotingEndsAt(LocalDateTime.now().plusDays(5));
        proposal = proposalRepository.save(proposal);

        CastVoteRequest voteReq = new CastVoteRequest(VoteType.YES);

        mockMvc.perform(post("/api/governance/proposals/" + proposal.getId() + "/vote")
                        .header("Authorization", worker1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(voteReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalVotes").value(1))
                .andExpect(jsonPath("$.yesVotes").value(1))
                .andExpect(jsonPath("$.noVotes").value(0))
                .andExpect(jsonPath("$.userHasVoted").value(true))
                .andExpect(jsonPath("$.userVote").value("YES"))
                .andExpect(jsonPath("$.userCanVote").value(false));

        // Worker 2 votes NO
        CastVoteRequest voteReq2 = new CastVoteRequest(VoteType.NO);
        mockMvc.perform(post("/api/governance/proposals/" + proposal.getId() + "/vote")
                        .header("Authorization", worker2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(voteReq2)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalVotes").value(2))
                .andExpect(jsonPath("$.yesVotes").value(1))
                .andExpect(jsonPath("$.noVotes").value(1));
    }

    @Test
    @DisplayName("Duplicate vote by same worker is rejected with 409 Conflict")
    public void testDuplicateVoteRejected() throws Exception {
        GovernanceProposal proposal = new GovernanceProposal(
                "Overtime Surge Pricing Share",
                "Ensure 95% of peak-hour surge fees go directly to the participating worker.",
                ProposalCategory.PLATFORM_FEE,
                adminUser
        );
        proposal.setStatus(ProposalStatus.OPEN);
        proposal.setVotingStartsAt(LocalDateTime.now().minusMinutes(10));
        proposal.setVotingEndsAt(LocalDateTime.now().plusDays(5));
        proposal = proposalRepository.save(proposal);

        CastVoteRequest voteReq = new CastVoteRequest(VoteType.YES);

        // First vote succeeds
        mockMvc.perform(post("/api/governance/proposals/" + proposal.getId() + "/vote")
                        .header("Authorization", worker1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(voteReq)))
                .andExpect(status().isOk());

        // Second vote fails with 409 Conflict
        mockMvc.perform(post("/api/governance/proposals/" + proposal.getId() + "/vote")
                        .header("Authorization", worker1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(voteReq)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Worker cannot vote on expired or closed proposal")
    public void testVotingOnExpiredOrClosedProposalFails() throws Exception {
        GovernanceProposal expiredProposal = new GovernanceProposal(
                "Expired Proposal",
                "Proposal whose voting period has already concluded.",
                ProposalCategory.POLICY,
                adminUser
        );
        expiredProposal.setStatus(ProposalStatus.OPEN);
        expiredProposal.setVotingStartsAt(LocalDateTime.now().minusDays(10));
        expiredProposal.setVotingEndsAt(LocalDateTime.now().minusMinutes(5));
        expiredProposal = proposalRepository.save(expiredProposal);

        CastVoteRequest voteReq = new CastVoteRequest(VoteType.YES);

        mockMvc.perform(post("/api/governance/proposals/" + expiredProposal.getId() + "/vote")
                        .header("Authorization", worker1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(voteReq)))
                .andExpect(status().isBadRequest());

        // Draft proposal
        GovernanceProposal draftProposal = new GovernanceProposal(
                "Draft Proposal",
                "Proposal still in draft formulation mode.",
                ProposalCategory.POLICY,
                adminUser
        );
        draftProposal.setStatus(ProposalStatus.DRAFT);
        draftProposal = proposalRepository.save(draftProposal);

        mockMvc.perform(post("/api/governance/proposals/" + draftProposal.getId() + "/vote")
                        .header("Authorization", worker1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(voteReq)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Deactivated worker cannot vote")
    public void testDeactivatedWorkerCannotVote() throws Exception {
        GovernanceProposal proposal = new GovernanceProposal(
                "Safety Gear Standards",
                "Mandatory safety inspection standards for on-site electrician work.",
                ProposalCategory.POLICY,
                adminUser
        );
        proposal.setStatus(ProposalStatus.OPEN);
        proposal.setVotingStartsAt(LocalDateTime.now().minusMinutes(10));
        proposal.setVotingEndsAt(LocalDateTime.now().plusDays(5));
        proposal = proposalRepository.save(proposal);

        CastVoteRequest voteReq = new CastVoteRequest(VoteType.YES);

        mockMvc.perform(post("/api/governance/proposals/" + proposal.getId() + "/vote")
                        .header("Authorization", deactivatedWorkerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(voteReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Closing proposal resolves PASSED if YES > NO and derives percentages")
    public void testCloseAndCalculateProposalResults() throws Exception {
        GovernanceProposal proposal = new GovernanceProposal(
                "Quarterly Transparency Report Mandate",
                "Require administrative steward board to publish detailed quarterly operational expenditures.",
                ProposalCategory.POLICY,
                adminUser
        );
        proposal.setStatus(ProposalStatus.OPEN);
        proposal.setVotingStartsAt(LocalDateTime.now().minusMinutes(10));
        proposal.setVotingEndsAt(LocalDateTime.now().plusDays(5));
        proposal = proposalRepository.save(proposal);

        // Worker 1 votes YES
        mockMvc.perform(post("/api/governance/proposals/" + proposal.getId() + "/vote")
                        .header("Authorization", worker1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CastVoteRequest(VoteType.YES))))
                .andExpect(status().isOk());

        // Worker 2 votes YES
        mockMvc.perform(post("/api/governance/proposals/" + proposal.getId() + "/vote")
                        .header("Authorization", worker2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CastVoteRequest(VoteType.YES))))
                .andExpect(status().isOk());

        // Admin closes voting
        mockMvc.perform(post("/api/governance/proposals/" + proposal.getId() + "/close")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PASSED"))
                .andExpect(jsonPath("$.totalVotes").value(2))
                .andExpect(jsonPath("$.yesVotes").value(2))
                .andExpect(jsonPath("$.noVotes").value(0))
                .andExpect(jsonPath("$.yesPercentage").value(100.0))
                .andExpect(jsonPath("$.passed").value(true));

        // Get results endpoint reflects same derived tally
        mockMvc.perform(get("/api/governance/proposals/" + proposal.getId() + "/results")
                        .header("Authorization", worker1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.proposalId").value(proposal.getId()))
                .andExpect(jsonPath("$.status").value("PASSED"))
                .andExpect(jsonPath("$.totalVotes").value(2));
    }

    @Test
    @DisplayName("Database enforces uniqueness constraint for (proposal_id, voter_id)")
    public void testDatabaseUniquenessConstraint() {
        GovernanceProposal proposal = new GovernanceProposal(
                "DB Constraint Test Proposal",
                "Proposal to verify database level uniqueness constraint.",
                ProposalCategory.GENERAL,
                adminUser
        );
        proposal.setStatus(ProposalStatus.OPEN);
        proposal = proposalRepository.save(proposal);

        GovernanceVote vote1 = new GovernanceVote(proposal, workerUser1, VoteType.YES);
        voteRepository.saveAndFlush(vote1);

        GovernanceVote vote2 = new GovernanceVote(proposal, workerUser1, VoteType.NO);
        assertThrows(DataIntegrityViolationException.class, () -> {
            voteRepository.saveAndFlush(vote2);
        });
    }

    @org.junit.jupiter.api.AfterEach
    public void tearDown() {
        voteRepository.deleteAll();
        proposalRepository.deleteAll();
    }
}
