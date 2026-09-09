package com.sih.cooperative.repository;

import com.sih.cooperative.entity.ServiceRequest;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {

    @Override
    @EntityGraph(attributePaths = {"customer"})
    List<ServiceRequest> findAll();

    @Override
    @EntityGraph(attributePaths = {"customer"})
    Optional<ServiceRequest> findById(Long id);

    @EntityGraph(attributePaths = {"customer"})
    List<ServiceRequest> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    @EntityGraph(attributePaths = {"customer"})
    Optional<ServiceRequest> findByIdAndCustomerId(Long id, Long customerId);

    @EntityGraph(attributePaths = {"customer"})
    List<ServiceRequest> findAllByOrderByCreatedAtDesc();

    long countByStatus(com.sih.cooperative.entity.ServiceRequestStatus status);

    @EntityGraph(attributePaths = {"customer"})
    List<ServiceRequest> findByStatusOrderByCreatedAtDesc(com.sih.cooperative.entity.ServiceRequestStatus status);
}

