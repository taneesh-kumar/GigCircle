package com.sih.cooperative.repository;

import com.sih.cooperative.entity.DisputeHistory;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DisputeHistoryRepository extends JpaRepository<DisputeHistory, Long> {

    @EntityGraph(attributePaths = {"actor"})
    List<DisputeHistory> findByDisputeIdOrderByCreatedAtAsc(Long disputeId);
}
