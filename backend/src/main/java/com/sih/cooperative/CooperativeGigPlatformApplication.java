package com.sih.cooperative;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CooperativeGigPlatformApplication {

    public static void main(String[] args) {
        // Load .env from root directory or current directory
        loadDotenv("../");
        loadDotenv("./");

        SpringApplication.run(CooperativeGigPlatformApplication.class, args);
    }

    private static void loadDotenv(String directory) {
        try {
            Dotenv dotenv = Dotenv.configure()
                    .directory(directory)
                    .ignoreIfMissing()
                    .load();
            dotenv.entries().forEach(entry -> {
                if (System.getProperty(entry.getKey()) == null && System.getenv(entry.getKey()) == null) {
                    System.setProperty(entry.getKey(), entry.getValue());
                }
            });
        } catch (Exception ignored) {
        }
    }
}