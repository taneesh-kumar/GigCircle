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
        String cleanEmail = adminEmail.toLowerCase().trim();
        if (!userRepository.existsByEmail(cleanEmail) && !userRepository.existsByRole(Role.ADMIN)) {
            User admin = new User(
                    "System Admin",
                    cleanEmail,
                    "0000000000",
                    passwordEncoder.encode(adminPassword),
                    Role.ADMIN
            );
            userRepository.save(admin);
            logger.info("Default Admin account seeded successfully: {}", cleanEmail);
        }
    }
}
