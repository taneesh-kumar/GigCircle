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

            // Add payment_status column to jobs table if not exists (for optional payment status tracking)
            jdbcTemplate.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT NULL");
            logger.info("Database migration: Verified jobs payment_status column.");

            // Add unique payment constraint for earnings — one earning per job
            // (Earning entity already has uniqueConstraint, JPA will enforce this)
            logger.info("Database migration: Payments table will be auto-created by JPA ddl-auto update.");

            // Ensure users active column exists for legacy databases
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE");
            logger.info("Database migration: Successfully verified users active column.");

            // Add PhonePe-related columns to payments table if not exists
            jdbcTemplate.execute("ALTER TABLE payments ADD COLUMN IF NOT EXISTS merchant_order_id VARCHAR(80)");
            jdbcTemplate.execute("ALTER TABLE payments ADD COLUMN IF NOT EXISTS phonepe_transaction_id VARCHAR(64)");
            jdbcTemplate.execute("ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_instrument VARCHAR(32)");
            jdbcTemplate.execute("ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_response TEXT");
            jdbcTemplate.execute("ALTER TABLE payments ADD COLUMN IF NOT EXISTS redirect_url VARCHAR(1024)");
            logger.info("Database migration: Verified PhonePe payment columns.");
        } catch (Exception e) {
            logger.warn("Database migration warning: {}", e.getMessage());
        }
    }
}
