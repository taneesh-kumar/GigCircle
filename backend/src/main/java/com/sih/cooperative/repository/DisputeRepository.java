package com.sih.cooperative.repository;

import com.sih.cooperative.entity.Dispute;
import com.sih.cooperative.entity.DisputeStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, Long>, JpaSpecificationExecutor<Dispute> {

    @EntityGraph(attributePaths = {"job", "job.serviceRequest", "raisedBy", "againstUser", "resolvedBy"})
    List<Dispute> findByJobIdOrderByCreatedAtDesc(Long jobId);

    @EntityGraph(attributePaths = {"job", "job.serviceRequest", "raisedBy", "againstUser", "resolvedBy"})
    Optional<Dispute> findFirstByJobIdAndStatusInOrderByCreatedAtDesc(Long jobId, Collection<DisputeStatus> statuses);

    boolean existsByJobIdAndStatusIn(Long jobId, Collection<DisputeStatus> statuses);

    @EntityGraph(attributePaths = {"job", "job.serviceRequest", "raisedBy", "againstUser", "resolvedBy"})
    @Query("SELECT d FROM Dispute d WHERE d.job.id = :jobId AND d.status IN (com.sih.cooperative.entity.DisputeStatus.OPEN, com.sih.cooperative.entity.DisputeStatus.UNDER_REVIEW, com.sih.cooperative.entity.DisputeStatus.ACTION_REQUIRED)")
    Optional<Dispute> findActiveDisputeByJobId(@Param("jobId") Long jobId);

    @EntityGraph(attributePaths = {"job", "job.serviceRequest", "raisedBy", "againstUser", "resolvedBy"})
    @Query("SELECT d FROM Dispute d WHERE d.raisedBy.id = :userId OR d.againstUser.id = :userId ORDER BY d.createdAt DESC")
    List<Dispute> findByUserIdInvolvingOrderByCreatedAtDesc(@Param("userId") Long userId);

    @EntityGraph(attributePaths = {"job", "job.serviceRequest", "raisedBy", "againstUser", "resolvedBy"})
    List<Dispute> findByStatusOrderByCreatedAtDesc(DisputeStatus status);

    @EntityGraph(attributePaths = {"job", "job.serviceRequest", "raisedBy", "againstUser", "resolvedBy"})
    List<Dispute> findAllByOrderByCreatedAtDesc();
}
