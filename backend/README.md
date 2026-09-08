# Cooperative Gig Services Platform — Backend

This directory contains the Phase 1 Spring Boot foundation. It exposes the
REST contract used by the React frontend and is prepared for the PostgreSQL
domain model that will be introduced in later phases.

## Run locally

```bash
cd backend
mvn spring-boot:run
```

The API starts on `http://localhost:8080` by default. Override the port with
`PORT`.

## Phase 1 endpoints

- `GET /api/healthz` — service and database configuration health
- `GET /api/platform/info` — platform identity, architecture, and role routes

## Configuration

Use environment variables rather than committing credentials:

- `DATABASE_URL` — Supabase JDBC PostgreSQL URL, for example
  `jdbc:postgresql://db.lbpkqjcbekjktpopkphd.supabase.co:5432/postgres?sslmode=require`
- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`
- `JWT_SECRET` — reserved for the authentication phase
- `CORS_ALLOWED_ORIGINS`

The backend includes Spring Security and JWT libraries now so the planned
authentication phase can be added without changing the foundation. Phase 1
intentionally leaves the API open and does not implement authentication.