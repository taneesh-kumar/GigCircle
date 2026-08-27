package com.sih.cooperative.repository;

import com.sih.cooperative.entity.ServiceRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {

    List<ServiceRequest> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    Optional<ServiceRequest> findByIdAndCustomerId(Long id, Long customerId);
}
