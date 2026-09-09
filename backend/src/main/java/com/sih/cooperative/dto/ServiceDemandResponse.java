package com.sih.cooperative.dto;

import com.sih.cooperative.entity.ServiceCategory;

import java.math.BigDecimal;

public class ServiceDemandResponse {

    private ServiceCategory category;
    private Long requestCount;
    private Long completedJobCount;
    private BigDecimal grossServiceValue;
    private BigDecimal demandPercentage;

    public ServiceDemandResponse() {
    }

    public ServiceDemandResponse(ServiceCategory category, Long requestCount, Long completedJobCount, BigDecimal grossServiceValue, BigDecimal demandPercentage) {
        this.category = category;
        this.requestCount = requestCount;
        this.completedJobCount = completedJobCount;
        this.grossServiceValue = grossServiceValue;
        this.demandPercentage = demandPercentage;
    }

    public ServiceCategory getCategory() {
        return category;
    }

    public void setCategory(ServiceCategory category) {
        this.category = category;
    }

    public Long getRequestCount() {
        return requestCount;
    }

    public void setRequestCount(Long requestCount) {
        this.requestCount = requestCount;
    }

    public Long getCompletedJobCount() {
        return completedJobCount;
    }

    public void setCompletedJobCount(Long completedJobCount) {
        this.completedJobCount = completedJobCount;
    }

    public BigDecimal getGrossServiceValue() {
        return grossServiceValue;
    }

    public void setGrossServiceValue(BigDecimal grossServiceValue) {
        this.grossServiceValue = grossServiceValue;
    }

    public BigDecimal getDemandPercentage() {
        return demandPercentage;
    }

    public void setDemandPercentage(BigDecimal demandPercentage) {
        this.demandPercentage = demandPercentage;
    }
}
