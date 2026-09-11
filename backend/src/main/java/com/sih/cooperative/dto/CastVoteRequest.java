package com.sih.cooperative.dto;

import com.sih.cooperative.entity.VoteType;
import jakarta.validation.constraints.NotNull;

public class CastVoteRequest {

    @NotNull(message = "Vote choice is required (YES, NO, ABSTAIN)")
    private VoteType voteChoice;

    public CastVoteRequest() {
    }

    public CastVoteRequest(VoteType voteChoice) {
        this.voteChoice = voteChoice;
    }

    public VoteType getVoteChoice() {
        return voteChoice;
    }

    public void setVoteChoice(VoteType voteChoice) {
        this.voteChoice = voteChoice;
    }
}
