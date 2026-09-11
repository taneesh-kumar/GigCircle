package com.sih.cooperative.dto;

import com.sih.cooperative.entity.ProposalCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateProposalRequest {

    @NotBlank(message = "Proposal title is required")
    @Size(min = 5, max = 255, message = "Title must be between 5 and 255 characters")
    private String title;

    @NotBlank(message = "Proposal description is required")
    @Size(min = 20, max = 4000, message = "Description must be between 20 and 4000 characters")
    private String description;

    private ProposalCategory category;

    public CreateProposalRequest() {
    }

    public CreateProposalRequest(String title, String description, ProposalCategory category) {
        this.title = title;
        this.description = description;
        this.category = category;
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
}
