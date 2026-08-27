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
        } catch (Exception e) {
            logger.warn("Database migration warning when dropping jobs_status_check: {}", e.getMessage());
        }
    }
}
