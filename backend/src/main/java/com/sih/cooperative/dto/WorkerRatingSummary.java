package com.sih.cooperative.dto;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class WorkerRatingSummary {

    private Long workerId;
    private Double averageRating;
    private Long totalRatings;

    public WorkerRatingSummary() {
        this.averageRating = 0.0;
        this.totalRatings = 0L;
    }

    public WorkerRatingSummary(Long workerId, Double averageRating, Long totalRatings) {
        this.workerId = workerId;
        this.totalRatings = totalRatings != null ? totalRatings : 0L;
        if (averageRating != null && this.totalRatings > 0) {
            // Round average rating to 1 decimal place safely
            this.averageRating = BigDecimal.valueOf(averageRating)
                    .setScale(1, RoundingMode.HALF_UP)
                    .doubleValue();
        } else {
            this.averageRating = 0.0;
        }
    }

    public Long getWorkerId() {
        return workerId;
    }

    public void setWorkerId(Long workerId) {
        this.workerId = workerId;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }

    public Long getTotalRatings() {
        return totalRatings;
    }

    public void setTotalRatings(Long totalRatings) {
        this.totalRatings = totalRatings;
    }
}
