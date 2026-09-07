package com.sih.cooperative.repository;

import com.sih.cooperative.entity.User;
import com.sih.cooperative.entity.VerificationStatus;
import com.sih.cooperative.entity.WorkerVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkerVerificationRepository extends JpaRepository<WorkerVerification, Long> {

    Optional<WorkerVerification> findByWorkerId(Long workerId);

    Optional<WorkerVerification> findByWorker(User worker);

    boolean existsByWorkerId(Long workerId);

    List<WorkerVerification> findByStatus(VerificationStatus status);
}
