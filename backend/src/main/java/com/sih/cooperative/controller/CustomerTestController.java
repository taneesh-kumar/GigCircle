package com.sih.cooperative.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/customer")
public class CustomerTestController {

    @GetMapping("/ping")
    public ResponseEntity<Map<String, String>> ping() {
        return ResponseEntity.ok(Map.of(
                "status", "OK",
                "role", "CUSTOMER",
                "message", "Welcome Customer! Authorized access confirmed."
        ));
    }
}
