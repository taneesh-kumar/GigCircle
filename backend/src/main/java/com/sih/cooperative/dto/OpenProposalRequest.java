package com.sih.cooperative.dto;

import java.time.LocalDateTime;

public class OpenProposalRequest {

    private Integer votingDurationDays;
    private LocalDateTime votingEndsAt;

    public OpenProposalRequest() {
    }

    public OpenProposalRequest(Integer votingDurationDays) {
        this.votingDurationDays = votingDurationDays;
    }

    public Integer getVotingDurationDays() {
        return votingDurationDays;
    }

    public void setVotingDurationDays(Integer votingDurationDays) {
        this.votingDurationDays = votingDurationDays;
    }

    public LocalDateTime getVotingEndsAt() {
        return votingEndsAt;
    }

    public void setVotingEndsAt(LocalDateTime votingEndsAt) {
        this.votingEndsAt = votingEndsAt;
    }
}
