package com.sih.cooperative.dto;

import com.sih.cooperative.entity.ServiceCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CreateServiceRequestRequest {

    @NotNull(message = "Service category is required")
    private ServiceCategory category;

    @NotBlank(message = "Description is required")
    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;

    @NotBlank(message = "Location is required")
    @Size(max = 255, message = "Location must not exceed 255 characters")
    private String location;

    @NotNull(message = "Budget is required")
    @DecimalMin(value = "0.01", message = "Budget must be greater than 0")
    private BigDecimal budget;

    @NotNull(message = "Preferred time is required")
    private LocalDateTime preferredTime;

    public CreateServiceRequestRequest() {
    }

    public CreateServiceRequestRequest(ServiceCategory category, String description, String location, BigDecimal budget, LocalDateTime preferredTime) {
        this.category = category;
        this.description = description;
        this.location = location;
        this.budget = budget;
        this.preferredTime = preferredTime;
    }

    public ServiceCategory getCategory() {
        return category;
    }

    public void setCategory(ServiceCategory category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public BigDecimal getBudget() {
        return budget;
    }

    public void setBudget(BigDecimal budget) {
        this.budget = budget;
    }

    public LocalDateTime getPreferredTime() {
        return preferredTime;
    }

    public void setPreferredTime(LocalDateTime preferredTime) {
        this.preferredTime = preferredTime;
    }
}
