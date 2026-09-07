package com.sih.cooperative.service;

import com.sih.cooperative.dto.*;
import com.sih.cooperative.entity.*;
import com.sih.cooperative.repository.AdminActivityRepository;
import com.sih.cooperative.repository.UserRepository;
import com.sih.cooperative.repository.VerificationDocumentRepository;
import com.sih.cooperative.repository.WorkerVerificationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class WorkerVerificationService {

    private final UserRepository userRepository;
    private final WorkerVerificationRepository workerVerificationRepository;
    private final VerificationDocumentRepository verificationDocumentRepository;
    private final AdminActivityRepository adminActivityRepository;

    public WorkerVerificationService(UserRepository userRepository,
                                     WorkerVerificationRepository workerVerificationRepository,
                                     VerificationDocumentRepository verificationDocumentRepository,
                                     AdminActivityRepository adminActivityRepository) {
        this.userRepository = userRepository;
        this.workerVerificationRepository = workerVerificationRepository;
        this.verificationDocumentRepository = verificationDocumentRepository;
        this.adminActivityRepository = adminActivityRepository;
    }

    private User getAuthenticatedWorker(String workerEmail) {
        User user = userRepository.findByEmail(workerEmail.toLowerCase().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getRole() != Role.WORKER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Worker role required");
        }

        return user;
    }

    private User getAuthenticatedAdmin(String adminEmail) {
        User user = userRepository.findByEmail(adminEmail.toLowerCase().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Admin role required");
        }

        return user;
    }

    private void recordAdminActivity(User admin, String actionType, Long entityId, String description) {
        if (adminActivityRepository != null) {
            AdminActivity activity = new AdminActivity(
                    admin.getId(),
                    admin.getRole(),
                    actionType,
                    "WORKER_VERIFICATION",
                    entityId,
                    description
            );
            adminActivityRepository.save(activity);
        }
    }

    private void validateFileReference(String fileReference) {
        if (fileReference == null || fileReference.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File reference is required");
        }
        String ref = fileReference.trim();
        if (ref.contains("..") || ref.contains("\0")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file reference format");
        }
    }

    @Transactional(readOnly = true)
    public WorkerVerificationResponse getWorkerVerification(String workerEmail) {
        User worker = getAuthenticatedWorker(workerEmail);
        WorkerVerification verification = workerVerificationRepository.findByWorkerId(worker.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Worker verification record not found"));

        return new WorkerVerificationResponse(verification);
    }

    @Transactional
    public WorkerVerificationResponse createWorkerVerification(String workerEmail) {
        User worker = getAuthenticatedWorker(workerEmail);

        if (workerVerificationRepository.existsByWorkerId(worker.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verification record already exists for worker");
        }

        WorkerVerification verification = new WorkerVerification(worker, VerificationStatus.NOT_SUBMITTED);
        WorkerVerification saved = workerVerificationRepository.save(verification);
        return new WorkerVerificationResponse(saved);
    }

    @Transactional
    public VerificationDocumentResponse submitDocument(SubmitVerificationDocumentRequest request, String workerEmail) {
        User worker = getAuthenticatedWorker(workerEmail);
        validateFileReference(request.getFileReference());

        WorkerVerification verification = workerVerificationRepository.findByWorkerId(worker.getId())
                .orElseGet(() -> workerVerificationRepository.save(new WorkerVerification(worker, VerificationStatus.NOT_SUBMITTED)));

        if (verification.getStatus() == VerificationStatus.VERIFIED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot modify documents for an already verified profile without a resubmission review flow");
        }

        Optional<VerificationDocument> existingDocOpt = verification.getDocuments().stream()
                .filter(d -> d.getDocumentType() == request.getDocumentType())
                .findFirst();

        VerificationDocument document;
        if (existingDocOpt.isPresent()) {
            document = existingDocOpt.get();
            document.setFileReference(request.getFileReference());
            document.setStatus(VerificationDocumentStatus.PENDING);
            document.setReviewNote(null);
        } else {
            document = new VerificationDocument(verification, request.getDocumentType(), request.getFileReference());
            verification.addDocument(document);
        }

        WorkerVerification updatedVerification = workerVerificationRepository.save(verification);
        VerificationDocument savedDoc = updatedVerification.getDocuments().stream()
                .filter(d -> d.getDocumentType() == request.getDocumentType())
                .findFirst()
                .orElse(document);

        return new VerificationDocumentResponse(savedDoc);
    }

    @Transactional
    public VerificationDocumentResponse updateDocument(Long documentId, UpdateVerificationDocumentRequest request, String workerEmail) {
        User worker = getAuthenticatedWorker(workerEmail);

        VerificationDocument document = verificationDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Verification document not found"));

        WorkerVerification verification = document.getVerification();
        if (verification == null || !verification.getWorker().getId().equals(worker.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Document does not belong to authenticated worker");
        }

        if (verification.getStatus() == VerificationStatus.VERIFIED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot modify documents for an already verified profile");
        }

        if (request.getDocumentType() != null) {
            document.setDocumentType(request.getDocumentType());
        }
        if (request.getFileReference() != null) {
            validateFileReference(request.getFileReference());
            document.setFileReference(request.getFileReference());
        }
        document.setStatus(VerificationDocumentStatus.PENDING);

        VerificationDocument saved = verificationDocumentRepository.save(document);
        return new VerificationDocumentResponse(saved);
    }

    @Transactional(readOnly = true)
    public VerificationDocumentResponse previewWorkerDocument(Long documentId, String workerEmail) {
        User worker = getAuthenticatedWorker(workerEmail);

        VerificationDocument document = verificationDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Verification document not found"));

        WorkerVerification verification = document.getVerification();
        if (verification == null || !verification.getWorker().getId().equals(worker.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Document does not belong to authenticated worker");
        }

        validateFileReference(document.getFileReference());
        return new VerificationDocumentResponse(document);
    }

    @Transactional(readOnly = true)
    public VerificationDocumentResponse previewAdminDocument(Long verificationId, Long documentId, String adminEmail) {
        getAuthenticatedAdmin(adminEmail);

        VerificationDocument document = verificationDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Verification document not found"));

        WorkerVerification verification = document.getVerification();
        if (verification == null || !verification.getId().equals(verificationId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Document does not belong to the specified verification record");
        }

        validateFileReference(document.getFileReference());
        return new VerificationDocumentResponse(document);
    }


    @Transactional
    public WorkerVerificationResponse resubmitVerification(String workerEmail) {
        User worker = getAuthenticatedWorker(workerEmail);

        WorkerVerification verification = workerVerificationRepository.findByWorkerId(worker.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Worker verification record not found"));

        VerificationStatus currentStatus = verification.getStatus();
        if (currentStatus == VerificationStatus.PENDING_REVIEW) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verification review is already pending");
        }
        if (currentStatus == VerificationStatus.VERIFIED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Worker profile is already verified");
        }
        if (currentStatus == VerificationStatus.SUSPENDED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Worker profile is suspended");
        }

        if (verification.getDocuments() == null || verification.getDocuments().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one verification document is required before submission");
        }

        verification.setStatus(VerificationStatus.PENDING_REVIEW);
        verification.setSubmittedAt(LocalDateTime.now());
        verification.setRejectionReason(null);

        WorkerVerification saved = workerVerificationRepository.save(verification);
        return new WorkerVerificationResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<WorkerVerificationResponse> getAdminVerifications(VerificationStatus statusFilter, String adminEmail) {
        getAuthenticatedAdmin(adminEmail);

        List<WorkerVerification> list;
        if (statusFilter != null) {
            list = workerVerificationRepository.findByStatus(statusFilter);
        } else {
            list = workerVerificationRepository.findAll();
        }

        return list.stream()
                .map(WorkerVerificationResponse::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public WorkerVerificationResponse getAdminVerificationById(Long verificationId, String adminEmail) {
        getAuthenticatedAdmin(adminEmail);

        WorkerVerification verification = workerVerificationRepository.findById(verificationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Worker verification not found with id: " + verificationId));

        return new WorkerVerificationResponse(verification);
    }

    @Transactional
    public WorkerVerificationResponse approveVerification(Long verificationId, String adminEmail) {
        User admin = getAuthenticatedAdmin(adminEmail);

        WorkerVerification verification = workerVerificationRepository.findById(verificationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Worker verification not found with id: " + verificationId));

        VerificationStatus currentStatus = verification.getStatus();
        if (currentStatus == VerificationStatus.VERIFIED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verification is already approved");
        }
        if (currentStatus != VerificationStatus.PENDING_REVIEW && currentStatus != VerificationStatus.SUSPENDED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot approve worker verification in status: " + currentStatus);
        }

        LocalDateTime now = LocalDateTime.now();
        verification.setStatus(VerificationStatus.VERIFIED);
        verification.setReviewedBy(admin);
        verification.setReviewedAt(now);
        verification.setVerifiedAt(now);
        verification.setRejectionReason(null);

        if (verification.getDocuments() != null) {
            for (VerificationDocument doc : verification.getDocuments()) {
                if (doc.getStatus() == VerificationDocumentStatus.PENDING) {
                    doc.setStatus(VerificationDocumentStatus.APPROVED);
                }
            }
        }

        WorkerVerification saved = workerVerificationRepository.save(verification);
        recordAdminActivity(admin, "APPROVE_WORKER_VERIFICATION", saved.getId(), "Approved worker verification for user ID: " + verification.getWorker().getId());

        return new WorkerVerificationResponse(saved);
    }

    @Transactional
    public WorkerVerificationResponse requestChanges(Long verificationId, AdminVerificationReviewRequest request, String adminEmail) {
        User admin = getAuthenticatedAdmin(adminEmail);

        WorkerVerification verification = workerVerificationRepository.findById(verificationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Worker verification not found with id: " + verificationId));

        if (request == null || request.getReason() == null || request.getReason().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reason is required when requesting changes");
        }

        if (verification.getStatus() != VerificationStatus.PENDING_REVIEW) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot request changes for worker verification in status: " + verification.getStatus());
        }

        verification.setStatus(VerificationStatus.CHANGES_REQUIRED);
        verification.setRejectionReason(request.getReason());
        verification.setReviewedBy(admin);
        verification.setReviewedAt(LocalDateTime.now());

        WorkerVerification saved = workerVerificationRepository.save(verification);
        recordAdminActivity(admin, "REQUEST_CHANGES_WORKER_VERIFICATION", saved.getId(), "Requested changes for worker verification: " + request.getReason());

        return new WorkerVerificationResponse(saved);
    }

    @Transactional
    public WorkerVerificationResponse rejectVerification(Long verificationId, AdminVerificationReviewRequest request, String adminEmail) {
        User admin = getAuthenticatedAdmin(adminEmail);

        WorkerVerification verification = workerVerificationRepository.findById(verificationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Worker verification not found with id: " + verificationId));

        if (request == null || request.getReason() == null || request.getReason().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reason is required when rejecting worker verification");
        }

        if (verification.getStatus() != VerificationStatus.PENDING_REVIEW) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot reject worker verification in status: " + verification.getStatus());
        }

        verification.setStatus(VerificationStatus.REJECTED);
        verification.setRejectionReason(request.getReason());
        verification.setReviewedBy(admin);
        verification.setReviewedAt(LocalDateTime.now());

        WorkerVerification saved = workerVerificationRepository.save(verification);
        recordAdminActivity(admin, "REJECT_WORKER_VERIFICATION", saved.getId(), "Rejected worker verification: " + request.getReason());

        return new WorkerVerificationResponse(saved);
    }

    @Transactional
    public WorkerVerificationResponse suspendVerification(Long verificationId, AdminVerificationReviewRequest request, String adminEmail) {
        User admin = getAuthenticatedAdmin(adminEmail);

        WorkerVerification verification = workerVerificationRepository.findById(verificationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Worker verification not found with id: " + verificationId));

        if (verification.getStatus() != VerificationStatus.VERIFIED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only verified worker profiles can be suspended. Current status: " + verification.getStatus());
        }

        String reason = (request != null && request.getReason() != null && !request.getReason().isBlank())
                ? request.getReason()
                : "Suspended by platform administrator";

        verification.setStatus(VerificationStatus.SUSPENDED);
        verification.setRejectionReason(reason);
        verification.setReviewedBy(admin);
        verification.setReviewedAt(LocalDateTime.now());

        WorkerVerification saved = workerVerificationRepository.save(verification);
        recordAdminActivity(admin, "SUSPEND_WORKER_VERIFICATION", saved.getId(), "Suspended worker verification: " + reason);

        return new WorkerVerificationResponse(saved);
    }
}
