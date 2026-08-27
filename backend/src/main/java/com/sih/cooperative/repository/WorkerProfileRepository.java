package com.sih.cooperative.repository;

import com.sih.cooperative.entity.WorkerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WorkerProfileRepository extends JpaRepository<WorkerProfile, Long> {

    Optional<WorkerProfile> findByWorkerId(Long workerId);

    boolean existsByWorkerId(Long workerId);
}
