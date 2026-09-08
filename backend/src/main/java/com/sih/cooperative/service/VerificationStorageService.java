package com.sih.cooperative.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Service
public class VerificationStorageService {

    private static final Logger log = LoggerFactory.getLogger(VerificationStorageService.class);

    private static final long DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
    private static final Set<String> ALLOWED_EXTENSIONS = new HashSet<>(Arrays.asList("pdf", "png", "jpg", "jpeg", "webp"));

    private final Path storageDirectory;

    public VerificationStorageService(@Value("${app.storage.verification-dir:./storage/verifications}") String storageDir) {
        this.storageDirectory = Paths.get(storageDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.storageDirectory);
        } catch (IOException e) {
            log.error("Failed to initialize verification storage directory at {}: {}", this.storageDirectory, e.getMessage());
        }
    }

    public void validateFileReference(String fileReference) {
        if (fileReference == null || fileReference.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File reference cannot be empty");
        }

        String ref = fileReference.trim();
        if (ref.contains("..") || ref.contains("\0") || ref.contains(":") || ref.startsWith("/") || ref.startsWith("\\")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or unsafe file reference format");
        }

        String extension = StringUtils.getFilenameExtension(ref);
        if (extension == null || !ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported document file extension. Allowed types: PDF, PNG, JPG, JPEG, WEBP");
        }
    }

    public void validateFileContent(byte[] bytes) {
        if (bytes == null || bytes.length == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded file content cannot be empty");
        }
        if (bytes.length > DEFAULT_MAX_FILE_SIZE_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File size exceeds maximum allowed limit of 10MB");
        }
    }

    public String storeDocumentFile(String originalReference, byte[] content) {
        validateFileReference(originalReference);
        if (content != null && content.length > 0) {
            validateFileContent(content);
        }

        String extension = StringUtils.getFilenameExtension(originalReference);
        String extensionPart = (extension != null && !extension.trim().isEmpty()) ? "." + extension.toLowerCase() : ".pdf";
        String uniquePhysicalName = "doc_" + UUID.randomUUID().toString() + extensionPart;

        Path targetPath = storageDirectory.resolve(uniquePhysicalName).normalize();
        if (!targetPath.startsWith(storageDirectory)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Path traversal error detected");
        }

        try {
            byte[] fileData = (content != null && content.length > 0) ? content : ("DOCUMENT_CONTENT:" + originalReference).getBytes();
            Files.write(targetPath, fileData, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
            return uniquePhysicalName;
        } catch (IOException e) {
            log.error("Failed to store verification document file: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to save verification document to storage");
        }
    }

    public void deletePhysicalFile(String physicalFilename) {
        if (physicalFilename == null || physicalFilename.trim().isEmpty()) {
            return;
        }
        try {
            Path targetPath = storageDirectory.resolve(physicalFilename.trim()).normalize();
            if (targetPath.startsWith(storageDirectory) && Files.exists(targetPath)) {
                Files.delete(targetPath);
                log.info("Successfully cleaned up replaced verification document file: {}", physicalFilename);
            }
        } catch (IOException e) {
            log.warn("Failed to delete old verification document file {}: {}", physicalFilename, e.getMessage());
        }
    }

    public Path resolvePhysicalPath(String physicalFilename) {
        validateFileReference(physicalFilename);
        Path targetPath = storageDirectory.resolve(physicalFilename.trim()).normalize();

        if (!targetPath.startsWith(storageDirectory)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file access path");
        }

        return targetPath;
    }
}
