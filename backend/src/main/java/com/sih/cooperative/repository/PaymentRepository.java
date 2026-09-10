package com.sih.cooperative.repository;

import com.sih.cooperative.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByJobId(Long jobId);

    boolean existsByJobId(Long jobId);
}
