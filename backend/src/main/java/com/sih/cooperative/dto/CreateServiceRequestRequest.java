package com.sih.cooperative.dto;

import com.sih.cooperative.entity.ServiceCategory;
import jakarta.validation.constraints.DecimalMax;
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

    @DecimalMin(value = "-90.0", message = "Latitude must be greater than or equal to -90")
    @DecimalMax(value = "90.0", message = "Latitude must be less than or equal to 90")
    private Double latitude;

    @DecimalMin(value = "-180.0", message = "Longitude must be greater than or equal to -180")
    @DecimalMax(value = "180.0", message = "Longitude must be less than or equal to 180")
    private Double longitude;

    @Size(max = 500, message = "Address must not exceed 500 characters")
    private String address;

    @Size(max = 100, message = "City must not exceed 100 characters")
    private String city;

    @NotNull(message = "Budget is required")
    @DecimalMin(value = "0.01", message = "Budget must be greater than 0")
    private BigDecimal budget;

    @NotNull(message = "Preferred time is required")
    private LocalDateTime preferredTime;

    public CreateServiceRequestRequest() {
    }

    public CreateServiceRequestRequest(ServiceCategory category, String description, String location, BigDecimal budget, LocalDateTime preferredTime) {
        this(category, description, location, budget, preferredTime, null, null, null, null);
    }

    public CreateServiceRequestRequest(ServiceCategory category, String description, String location, BigDecimal budget, LocalDateTime preferredTime, Double latitude, Double longitude, String address, String city) {
        this.category = category;
        this.description = description;
        this.location = location;
        this.budget = budget;
        this.preferredTime = preferredTime;
        this.latitude = latitude;
        this.longitude = longitude;
        this.address = address;
        this.city = city;
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

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
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
