package com.sih.cooperative.repository;

import com.sih.cooperative.entity.AdminActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminActivityRepository extends JpaRepository<AdminActivity, Long>, JpaSpecificationExecutor<AdminActivity> {

    List<AdminActivity> findAllByOrderByCreatedAtDesc();

    List<AdminActivity> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, Long entityId);
}

