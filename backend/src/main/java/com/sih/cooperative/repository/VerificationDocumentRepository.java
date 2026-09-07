package com.sih.cooperative.repository;

import com.sih.cooperative.entity.VerificationDocument;
import com.sih.cooperative.entity.VerificationDocumentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VerificationDocumentRepository extends JpaRepository<VerificationDocument, Long> {

    List<VerificationDocument> findByVerificationId(Long verificationId);

    List<VerificationDocument> findByVerificationIdAndStatus(Long verificationId, VerificationDocumentStatus status);
}
