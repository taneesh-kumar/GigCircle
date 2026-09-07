package com.sih.cooperative.repository;

import com.sih.cooperative.entity.Payment;
import com.sih.cooperative.entity.PaymentStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @EntityGraph(attributePaths = {"job", "job.worker", "job.serviceRequest", "customer", "earning"})
    Optional<Payment> findByJobId(Long jobId);

    boolean existsByJobId(Long jobId);

    @EntityGraph(attributePaths = {"job", "job.worker", "job.serviceRequest", "customer", "earning"})
    List<Payment> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    @EntityGraph(attributePaths = {"job", "job.worker", "job.serviceRequest", "customer", "earning"})
    Optional<Payment> findByTransactionId(String transactionId);

    @EntityGraph(attributePaths = {"job", "job.worker", "job.serviceRequest", "customer", "earning"})
    List<Payment> findByPaymentStatusOrderByCreatedAtDesc(PaymentStatus paymentStatus);

    @EntityGraph(attributePaths = {"job", "job.worker", "job.serviceRequest", "customer", "earning"})
    @Override
    List<Payment> findAll();

    @EntityGraph(attributePaths = {"job", "job.worker", "job.serviceRequest", "customer", "earning"})
    @Override
    Optional<Payment> findById(Long id);

    Optional<Payment> findByMerchantOrderId(String merchantOrderId);
}
