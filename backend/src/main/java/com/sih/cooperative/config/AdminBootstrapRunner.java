package com.sih.cooperative.config;

import com.sih.cooperative.entity.Role;
import com.sih.cooperative.entity.User;
import com.sih.cooperative.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminBootstrapRunner implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(AdminBootstrapRunner.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@gigcircle.com}")
    private String adminEmail;

    @Value("${app.admin.password:AdminPass123!}")
    private String adminPassword;

    public AdminBootstrapRunner(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // 1. Admin Account
        String cleanAdminEmail = adminEmail.toLowerCase().trim();
        User admin = userRepository.findByEmail(cleanAdminEmail).orElseGet(() -> new User(
                "System Admin",
                cleanAdminEmail,
                "0000000000",
                passwordEncoder.encode(adminPassword),
                Role.ADMIN
        ));
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setActive(true);
        userRepository.save(admin);
        logger.info("Default Admin account verified and password updated successfully: {}", cleanAdminEmail);

        // 2. Default Customer Account
        String customerEmail = "john.customer@example.com";
        User customer = userRepository.findByEmail(customerEmail).orElseGet(() -> new User(
                "John Customer",
                customerEmail,
                "9876543210",
                passwordEncoder.encode("Password123!"),
                Role.CUSTOMER
        ));
        customer.setPassword(passwordEncoder.encode("Password123!"));
        customer.setActive(true);
        userRepository.save(customer);
        logger.info("Default Customer account verified and password updated successfully: {}", customerEmail);

        // 3. Default Worker Account
        String workerEmail = "john.worker@example.com";
        User worker = userRepository.findByEmail(workerEmail).orElseGet(() -> new User(
                "John Worker",
                workerEmail,
                "9876543211",
                passwordEncoder.encode("Password123!"),
                Role.WORKER
        ));
        worker.setPassword(passwordEncoder.encode("Password123!"));
        worker.setActive(true);
        userRepository.save(worker);
        logger.info("Default Worker account verified and password updated successfully: {}", workerEmail);
    }
}
