package com.sih.cooperative.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "governance_proposals",
        indexes = {
                @Index(name = "idx_gov_proposal_status", columnList = "status"),
                @Index(name = "idx_gov_proposal_creator", columnList = "created_by_id"),
                @Index(name = "idx_gov_proposal_category", columnList = "category"),
                @Index(name = "idx_gov_proposal_created_at", columnList = "created_at")
        }
)
public class GovernanceProposal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, length = 4000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ProposalCategory category = ProposalCategory.GENERAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ProposalStatus status = ProposalStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @Column(name = "voting_starts_at")
    private LocalDateTime votingStartsAt;

    @Column(name = "voting_ends_at")
    private LocalDateTime votingEndsAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public GovernanceProposal() {
    }

    public GovernanceProposal(String title, String description, ProposalCategory category, User createdBy) {
        this.title = title;
        this.description = description;
        this.category = category != null ? category : ProposalCategory.GENERAL;
        this.createdBy = createdBy;
        this.status = ProposalStatus.DRAFT;
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.status == null) {
            this.status = ProposalStatus.DRAFT;
        }
        if (this.category == null) {
            this.category = ProposalCategory.GENERAL;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public ProposalCategory getCategory() {
        return category;
    }

    public void setCategory(ProposalCategory category) {
        this.category = category;
    }

    public ProposalStatus getStatus() {
        return status;
    }

    public void setStatus(ProposalStatus status) {
        this.status = status;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getVotingStartsAt() {
        return votingStartsAt;
    }

    public void setVotingStartsAt(LocalDateTime votingStartsAt) {
        this.votingStartsAt = votingStartsAt;
    }

    public LocalDateTime getVotingEndsAt() {
        return votingEndsAt;
    }

    public void setVotingEndsAt(LocalDateTime votingEndsAt) {
        this.votingEndsAt = votingEndsAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
