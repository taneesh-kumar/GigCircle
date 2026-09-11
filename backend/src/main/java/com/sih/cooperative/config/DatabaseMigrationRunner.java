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

            // Drop outdated PostgreSQL check constraint for NotificationType enum values
            jdbcTemplate.execute("ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check");

            // Ensure users active column and status column exist for legacy databases
            try {
                jdbcTemplate.execute("ALTER TABLE jobs DROP COLUMN IF EXISTS payment_status");
            } catch (Exception ex) {
                logger.debug("Payment column cleanup skipped: {}", ex.getMessage());
            }

            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE");
            try {
                jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE'");
                jdbcTemplate.execute("UPDATE users SET status = 'DEACTIVATED' WHERE active = FALSE AND (status IS NULL OR status = 'ACTIVE')");
            } catch (Exception ex) {
                logger.debug("Users status column migration skipped or existing: {}", ex.getMessage());
            }

            // Drop outdated PostgreSQL check constraints for worker verification enums if present
            jdbcTemplate.execute("ALTER TABLE worker_verifications DROP CONSTRAINT IF EXISTS worker_verifications_status_check");
            jdbcTemplate.execute("ALTER TABLE verification_documents DROP CONSTRAINT IF EXISTS verification_documents_document_type_check");
            jdbcTemplate.execute("ALTER TABLE verification_documents DROP CONSTRAINT IF EXISTS verification_documents_status_check");

            // Create partial unique index for active disputes if running against PostgreSQL
            try {
                jdbcTemplate.execute("CREATE UNIQUE INDEX IF NOT EXISTS uk_disputes_active_job ON disputes(job_id) WHERE status IN ('OPEN', 'UNDER_REVIEW', 'ACTION_REQUIRED')");
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
            } catch (Exception ex) {
                logger.debug("Invoices table creation migration skipped or handled by Hibernate: {}", ex.getMessage());
            }

            // Sync PostgreSQL sequence for invoices if table already has rows or sequence is out of sync
            try {
                jdbcTemplate.execute("""
                    SELECT setval(
                        pg_get_serial_sequence('invoices', 'id'),
                        COALESCE((SELECT MAX(id) FROM invoices), 0) + 1,
                        false
                    )
                """);
            } catch (Exception ex) {
                logger.debug("Invoices sequence sync skipped (non-PostgreSQL or empty): {}", ex.getMessage());
            }

            // Create governance_proposals table if not exists
            try {
                jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS governance_proposals (
                        id BIGSERIAL PRIMARY KEY,
                        title VARCHAR(255) NOT NULL,
                        description VARCHAR(4000) NOT NULL,
                        category VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
                        status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
                        created_by_id BIGINT NOT NULL,
                        voting_starts_at TIMESTAMP,
                        voting_ends_at TIMESTAMP,
                        created_at TIMESTAMP NOT NULL,
                        updated_at TIMESTAMP NOT NULL,
                        CONSTRAINT fk_gov_proposals_creator FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE RESTRICT
                    )
                """);
            } catch (Exception ex) {
                logger.debug("Governance proposals table creation skipped or handled by Hibernate: {}", ex.getMessage());
            }

            // Create governance_votes table if not exists with UNIQUE(proposal_id, voter_id)
            try {
                jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS governance_votes (
                        id BIGSERIAL PRIMARY KEY,
                        proposal_id BIGINT NOT NULL,
                        voter_id BIGINT NOT NULL,
                        vote_choice VARCHAR(20) NOT NULL,
                        voted_at TIMESTAMP NOT NULL,
                        CONSTRAINT uk_governance_vote_proposal_worker UNIQUE (proposal_id, voter_id),
                        CONSTRAINT fk_gov_votes_proposal FOREIGN KEY (proposal_id) REFERENCES governance_proposals(id) ON DELETE CASCADE,
                        CONSTRAINT fk_gov_votes_voter FOREIGN KEY (voter_id) REFERENCES users(id) ON DELETE RESTRICT
                    )
                """);
            } catch (Exception ex) {
                logger.debug("Governance votes table creation skipped or handled by Hibernate: {}", ex.getMessage());
            }

            // Ensure unique index exists on governance_votes
            try {
                jdbcTemplate.execute("CREATE UNIQUE INDEX IF NOT EXISTS uk_governance_vote_proposal_worker ON governance_votes(proposal_id, voter_id)");
            } catch (Exception ex) {
                logger.debug("Governance votes unique index creation skipped: {}", ex.getMessage());
            }

            logger.info("Database schema verification and migrations completed successfully.");
        } catch (Exception e) {
            logger.warn("Database migration warning: {}", e.getMessage());
        }
    }
}

