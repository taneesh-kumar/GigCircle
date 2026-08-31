package com.sih.cooperative.repository;

import com.sih.cooperative.entity.Payment;
import com.sih.cooperative.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByJobIdOrderByCreatedAtDesc(Long jobId);

    Optional<Payment> findFirstByJobIdAndStatusOrderByCreatedAtDesc(Long jobId, PaymentStatus status);

    boolean existsByJobIdAndStatus(Long jobId, PaymentStatus status);

    List<Payment> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<Payment> findAllByOrderByCreatedAtDesc();

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.status = :status")
    long countByStatus(PaymentStatus status);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'SUCCESS'")
    BigDecimal sumTotalSuccessfulAmount();

    @Query("SELECT COALESCE(SUM(p.platformFee), 0) FROM Payment p WHERE p.status = 'SUCCESS'")
    BigDecimal sumTotalSuccessfulPlatformFee();
}
