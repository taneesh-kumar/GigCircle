package com.sih.cooperative.repository;

import com.sih.cooperative.entity.GovernanceProposal;
import com.sih.cooperative.entity.ProposalCategory;
import com.sih.cooperative.entity.ProposalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GovernanceProposalRepository extends JpaRepository<GovernanceProposal, Long>, JpaSpecificationExecutor<GovernanceProposal> {

    List<GovernanceProposal> findByStatus(ProposalStatus status);

    Page<GovernanceProposal> findByStatus(ProposalStatus status, Pageable pageable);

    Page<GovernanceProposal> findByCategory(ProposalCategory category, Pageable pageable);

    Page<GovernanceProposal> findByStatusAndCategory(ProposalStatus status, ProposalCategory category, Pageable pageable);

    List<GovernanceProposal> findByCreatedById(Long createdById);

    List<GovernanceProposal> findByStatusAndVotingEndsAtBefore(ProposalStatus status, java.time.LocalDateTime dateTime);
}
