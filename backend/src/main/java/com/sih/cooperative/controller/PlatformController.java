package com.sih.cooperative.controller;

import com.sih.cooperative.dto.PlatformInfoResponse;
import com.sih.cooperative.service.PlatformService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/platform")
public class PlatformController {

    private final PlatformService platformService;

    public PlatformController(PlatformService platformService) {
        this.platformService = platformService;
    }

    @GetMapping("/info")
    public ResponseEntity<PlatformInfoResponse> info() {
        return ResponseEntity.ok(platformService.getPlatformInfo());
    }
}