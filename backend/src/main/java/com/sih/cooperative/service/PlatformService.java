package com.sih.cooperative.service;

import java.util.List;

import com.sih.cooperative.dto.PlatformInfoResponse;
import com.sih.cooperative.dto.RoleRouteResponse;
import org.springframework.stereotype.Service;

@Service
public class PlatformService {

    public PlatformInfoResponse getPlatformInfo() {
        return new PlatformInfoResponse(
                "Cooperative Gig Services Platform",
                "Trusted local services, fair opportunities, stronger communities.",
                List.of("React + TypeScript", "Spring Boot REST API", "PostgreSQL"),
                List.of(
                        new RoleRouteResponse("CUSTOMER", "/customer/dashboard",
                                "Request and track household or community services."),
                        new RoleRouteResponse("WORKER", "/worker/dashboard",
                                "Manage job opportunities and service availability."),
                        new RoleRouteResponse("ADMIN", "/admin/dashboard",
                                "Oversee worker verification and cooperative health.")
                ),
                "Phase 1 — Foundation"
        );
    }
}