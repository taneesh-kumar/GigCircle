package com.sih.cooperative.repository;

import com.sih.cooperative.entity.ChatConversation;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChatConversationRepository extends JpaRepository<ChatConversation, Long> {

    @EntityGraph(attributePaths = {"job", "job.serviceRequest", "job.serviceRequest.customer", "job.worker"})
    Optional<ChatConversation> findByJobId(Long jobId);

    boolean existsByJobId(Long jobId);
}
