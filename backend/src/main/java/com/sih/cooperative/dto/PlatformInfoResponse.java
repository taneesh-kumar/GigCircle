package com.sih.cooperative.dto;

import java.util.List;

public record PlatformInfoResponse(
        String name,
        String tagline,
        List<String> architecture,
        List<RoleRouteResponse> roles,
        String phase
) {
}