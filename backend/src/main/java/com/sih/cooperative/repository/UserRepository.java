package com.sih.cooperative.repository;

import com.sih.cooperative.entity.Role;
import com.sih.cooperative.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByRole(Role role);

    long countByRole(Role role);

    long countByStatus(com.sih.cooperative.entity.AccountStatus status);

    java.util.List<User> findByRole(Role role);

    java.util.List<User> findByRoleAndStatus(Role role, com.sih.cooperative.entity.AccountStatus status);

    java.util.List<User> findAllByOrderByCreatedAtDesc();
}

