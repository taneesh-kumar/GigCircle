package com.sih.cooperative.repository;

import com.sih.cooperative.entity.User;
import com.sih.cooperative.entity.VerificationStatus;
import com.sih.cooperative.entity.WorkerVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;


import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface WorkerVerificationRepository extends JpaRepository<WorkerVerification, Long>, JpaSpecificationExecutor<WorkerVerification> {

    Optional<WorkerVerification> findByWorkerId(Long workerId);

    Optional<WorkerVerification> findByWorker(User worker);

    boolean existsByWorkerId(Long workerId);

    boolean existsByWorkerIdAndStatus(Long workerId, VerificationStatus status);

    @Query("SELECT v.worker.id FROM WorkerVerification v WHERE v.worker.id IN :workerIds AND v.status = com.sih.cooperative.entity.VerificationStatus.VERIFIED")
    Set<Long> findVerifiedWorkerIdsIn(@Param("workerIds") Collection<Long> workerIds);

    List<WorkerVerification> findByStatus(VerificationStatus status);
}

