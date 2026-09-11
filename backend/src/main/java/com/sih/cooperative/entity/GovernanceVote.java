package com.sih.cooperative.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "governance_votes",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_governance_vote_proposal_worker", columnNames = {"proposal_id", "voter_id"})
        },
        indexes = {
                @Index(name = "idx_gov_vote_proposal", columnList = "proposal_id"),
                @Index(name = "idx_gov_vote_voter", columnList = "voter_id")
        }
)
public class GovernanceVote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "proposal_id", nullable = false)
    private GovernanceProposal proposal;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "voter_id", nullable = false)
    private User voter;

    @Enumerated(EnumType.STRING)
    @Column(name = "vote_choice", nullable = false, length = 20)
    private VoteType voteChoice;

    @Column(name = "voted_at", nullable = false, updatable = false)
    private LocalDateTime votedAt;

    public GovernanceVote() {
    }

    public GovernanceVote(GovernanceProposal proposal, User voter, VoteType voteChoice) {
        this.proposal = proposal;
        this.voter = voter;
        this.voteChoice = voteChoice;
    }

    @PrePersist
    protected void onCreate() {
        if (this.votedAt == null) {
            this.votedAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public GovernanceProposal getProposal() {
        return proposal;
    }

    public void setProposal(GovernanceProposal proposal) {
        this.proposal = proposal;
    }

    public User getVoter() {
        return voter;
    }

    public void setVoter(User voter) {
        this.voter = voter;
    }

    public VoteType getVoteChoice() {
        return voteChoice;
    }

    public void setVoteChoice(VoteType voteChoice) {
        this.voteChoice = voteChoice;
    }

    public LocalDateTime getVotedAt() {
        return votedAt;
    }

    public void setVotedAt(LocalDateTime votedAt) {
        this.votedAt = votedAt;
    }
}
