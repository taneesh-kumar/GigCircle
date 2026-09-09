package com.sih.cooperative.repository;

import com.sih.cooperative.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByJobId(Long jobId);

    boolean existsByJobId(Long jobId);

    boolean existsByInvoiceNumber(String invoiceNumber);

    List<Invoice> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<Invoice> findByWorkerIdOrderByCreatedAtDesc(Long workerId);

    List<Invoice> findAllByOrderByCreatedAtDesc();
}
