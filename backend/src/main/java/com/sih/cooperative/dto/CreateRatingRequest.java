package com.sih.cooperative.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateRatingRequest {

    @NotNull(message = "Rating score is required")
    @Min(value = 1, message = "Score must be at least 1")
    @Max(value = 5, message = "Score cannot be greater than 5")
    private Integer score;

    @Size(max = 500, message = "Review text cannot exceed 500 characters")
    private String review;

    public CreateRatingRequest() {
    }

    public CreateRatingRequest(Integer score, String review) {
        this.score = score;
        this.review = review;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public String getReview() {
        return review;
    }

    public void setReview(String review) {
        this.review = review;
    }
}
