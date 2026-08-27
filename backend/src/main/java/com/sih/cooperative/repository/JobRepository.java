package com.sih.cooperative.repository;

import com.sih.cooperative.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {

    Optional<Job> findByServiceRequestId(Long serviceRequestId);

    Optional<Job> findByServiceRequestIdAndWorkerId(Long serviceRequestId, Long workerId);

    List<Job> findByWorkerIdOrderByCreatedAtDesc(Long workerId);

    boolean existsByServiceRequestId(Long serviceRequestId);
}
