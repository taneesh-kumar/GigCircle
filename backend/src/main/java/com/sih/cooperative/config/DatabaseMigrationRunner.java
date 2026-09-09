package com.sih.cooperative.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseMigrationRunner implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseMigrationRunner.class);

    private final JdbcTemplate jdbcTemplate;

    public DatabaseMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        try {
            // Drop outdated PostgreSQL check constraint created when JobStatus only had OPEN, ACCEPTED
            jdbcTemplate.execute("ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check");
            logger.info("Database migration: Successfully dropped legacy jobs_status_check constraint if present.");

            // Drop outdated PostgreSQL check constraint for NotificationType enum values
            jdbcTemplate.execute("ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check");
            logger.info("Database migration: Successfully dropped legacy notifications_type_check constraint if present.");

            // Ensure users active column exists for legacy databases
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE");
            logger.info("Database migration: Successfully verified users active column.");

            // Drop outdated PostgreSQL check constraints for worker verification enums if present
            jdbcTemplate.execute("ALTER TABLE worker_verifications DROP CONSTRAINT IF EXISTS worker_verifications_status_check");
            jdbcTemplate.execute("ALTER TABLE verification_documents DROP CONSTRAINT IF EXISTS verification_documents_document_type_check");
            jdbcTemplate.execute("ALTER TABLE verification_documents DROP CONSTRAINT IF EXISTS verification_documents_status_check");
            logger.info("Database migration: Successfully verified worker verification check constraints.");

            // Create partial unique index for active disputes if running against PostgreSQL
            try {
                jdbcTemplate.execute("CREATE UNIQUE INDEX IF NOT EXISTS uk_disputes_active_job ON disputes(job_id) WHERE status IN ('OPEN', 'UNDER_REVIEW', 'ACTION_REQUIRED')");
                logger.info("Database migration: Successfully verified active disputes partial index.");
            } catch (Exception ex) {
                logger.debug("Active dispute partial index skipped (non-PostgreSQL dialect or index exists): {}", ex.getMessage());
            }

            // Create invoices table if not exists for non-Hibernate managed environments or legacy schema sync
            try {
                jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS invoices (
                        id BIGSERIAL PRIMARY KEY,
                        invoice_number VARCHAR(64) NOT NULL UNIQUE,
                        job_id BIGINT NOT NULL UNIQUE,
                        customer_id BIGINT NOT NULL,
                        worker_id BIGINT NOT NULL,
                        service_name VARCHAR(255) NOT NULL,
                        service_description VARCHAR(1000),
                        service_charge NUMERIC(12, 2) NOT NULL,
                        platform_fee NUMERIC(12, 2) NOT NULL,
                        tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
                        discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
                        total_amount NUMERIC(12, 2) NOT NULL,
                        payment_status VARCHAR(50) NOT NULL,
                        payment_reference VARCHAR(64),
                        issued_at TIMESTAMP NOT NULL,
                        paid_at TIMESTAMP,
                        created_at TIMESTAMP NOT NULL,
                        updated_at TIMESTAMP NOT NULL,
                        CONSTRAINT fk_invoices_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE RESTRICT,
                        CONSTRAINT fk_invoices_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE RESTRICT,
                        CONSTRAINT fk_invoices_worker FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE RESTRICT
                    )
                """);
                logger.info("Database migration: Successfully verified invoices table.");
            } catch (Exception ex) {
                logger.debug("Invoices table creation migration skipped or handled by Hibernate: {}", ex.getMessage());
            }
        } catch (Exception e) {
            logger.warn("Database migration warning: {}", e.getMessage());
        }
    }
}

