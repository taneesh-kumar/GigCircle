package com.sih.cooperative.dto;

import com.sih.cooperative.entity.ProposalCategory;
import com.sih.cooperative.entity.ProposalStatus;
import com.sih.cooperative.entity.VoteType;

import java.time.LocalDateTime;

public class ProposalResponse {

    private Long id;
    private String title;
    private String description;
    private ProposalCategory category;
    private ProposalStatus status;
    private Long createdById;
    private String createdByName;
    private String createdByRole;
    private LocalDateTime votingStartsAt;
    private LocalDateTime votingEndsAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Derived vote tallies
    private long totalVotes;
    private long yesVotes;
    private long noVotes;
    private long abstainVotes;

    // Current viewer's state
    private boolean userHasVoted;
    private VoteType userVote;
    private boolean userCanVote;

    public ProposalResponse() {
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

    public Long getCreatedById() {
        return createdById;
    }

    public void setCreatedById(Long createdById) {
        this.createdById = createdById;
    }

    public String getCreatedByName() {
        return createdByName;
    }

    public void setCreatedByName(String createdByName) {
        this.createdByName = createdByName;
    }

    public String getCreatedByRole() {
        return createdByRole;
    }

    public void setCreatedByRole(String createdByRole) {
        this.createdByRole = createdByRole;
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

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public long getTotalVotes() {
        return totalVotes;
    }

    public void setTotalVotes(long totalVotes) {
        this.totalVotes = totalVotes;
    }

    public long getYesVotes() {
        return yesVotes;
    }

    public void setYesVotes(long yesVotes) {
        this.yesVotes = yesVotes;
    }

    public long getNoVotes() {
        return noVotes;
    }

    public void setNoVotes(long noVotes) {
        this.noVotes = noVotes;
    }

    public long getAbstainVotes() {
        return abstainVotes;
    }

    public void setAbstainVotes(long abstainVotes) {
        this.abstainVotes = abstainVotes;
    }

    public boolean isUserHasVoted() {
        return userHasVoted;
    }

    public void setUserHasVoted(boolean userHasVoted) {
        this.userHasVoted = userHasVoted;
    }

    public VoteType getUserVote() {
        return userVote;
    }

    public void setUserVote(VoteType userVote) {
        this.userVote = userVote;
    }

    public boolean isUserCanVote() {
        return userCanVote;
    }

    public void setUserCanVote(boolean userCanVote) {
        this.userCanVote = userCanVote;
    }
}
