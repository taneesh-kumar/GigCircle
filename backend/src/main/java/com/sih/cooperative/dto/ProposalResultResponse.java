package com.sih.cooperative.dto;

import com.sih.cooperative.entity.ProposalCategory;
import com.sih.cooperative.entity.ProposalStatus;

import java.time.LocalDateTime;

public class ProposalResultResponse {

    private Long proposalId;
    private String title;
    private ProposalCategory category;
    private ProposalStatus status;
    private LocalDateTime votingStartsAt;
    private LocalDateTime votingEndsAt;
    private long totalVotes;
    private long yesVotes;
    private long noVotes;
    private long abstainVotes;
    private double yesPercentage;
    private double noPercentage;
    private double abstainPercentage;
    private boolean passed;

    public ProposalResultResponse() {
    }

    public Long getProposalId() {
        return proposalId;
    }

    public void setProposalId(Long proposalId) {
        this.proposalId = proposalId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
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

    public double getYesPercentage() {
        return yesPercentage;
    }

    public void setYesPercentage(double yesPercentage) {
        this.yesPercentage = yesPercentage;
    }

    public double getNoPercentage() {
        return noPercentage;
    }

    public void setNoPercentage(double noPercentage) {
        this.noPercentage = noPercentage;
    }

    public double getAbstainPercentage() {
        return abstainPercentage;
    }

    public void setAbstainPercentage(double abstainPercentage) {
        this.abstainPercentage = abstainPercentage;
    }

    public boolean isPassed() {
        return passed;
    }

    public void setPassed(boolean passed) {
        this.passed = passed;
    }
}
