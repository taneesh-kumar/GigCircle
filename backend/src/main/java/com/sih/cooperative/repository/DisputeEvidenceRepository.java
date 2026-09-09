package com.sih.cooperative.repository;

import com.sih.cooperative.entity.DisputeEvidence;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DisputeEvidenceRepository extends JpaRepository<DisputeEvidence, Long> {

    @EntityGraph(attributePaths = {"uploadedBy"})
    List<DisputeEvidence> findByDisputeIdOrderByCreatedAtAsc(Long disputeId);
}
