package com.sih.cooperative.repository;

import com.sih.cooperative.entity.Payment;
import com.sih.cooperative.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long>, JpaSpecificationExecutor<Payment> {

    Optional<Payment> findByJobId(Long jobId);

    boolean existsByJobId(Long jobId);

    long countByStatus(PaymentStatus status);

    long countByPaymentMethod(String paymentMethod);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.status = :status")
    BigDecimal sumAmountByStatus(@Param("status") PaymentStatus status);

    List<Payment> findAllByOrderByCreatedAtDesc();
}
