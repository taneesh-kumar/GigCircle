package com.sih.cooperative.repository;

import com.sih.cooperative.entity.Job;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {

    @Override
    @EntityGraph(attributePaths = {"serviceRequest", "serviceRequest.customer", "worker"})
    Optional<Job> findById(Long id);

    @EntityGraph(attributePaths = {"serviceRequest", "serviceRequest.customer", "worker"})
    Optional<Job> findByServiceRequestId(Long serviceRequestId);

    @EntityGraph(attributePaths = {"serviceRequest", "serviceRequest.customer", "worker"})
    Optional<Job> findByServiceRequestIdAndWorkerId(Long serviceRequestId, Long workerId);

    @EntityGraph(attributePaths = {"serviceRequest", "serviceRequest.customer", "worker"})
    Optional<Job> findByIdAndWorkerId(Long id, Long workerId);

    @EntityGraph(attributePaths = {"serviceRequest", "serviceRequest.customer", "worker"})
    List<Job> findByWorkerIdOrderByCreatedAtDesc(Long workerId);

    boolean existsByServiceRequestId(Long serviceRequestId);

    @EntityGraph(attributePaths = {"serviceRequest", "serviceRequest.customer", "worker"})
    List<Job> findAllByOrderByCreatedAtDesc();

    long countByStatus(com.sih.cooperative.entity.JobStatus status);
}
