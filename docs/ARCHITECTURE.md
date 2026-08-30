# Architecture Guide

## High-Level Design

GigCircle uses a standard full-stack web architecture:

1. The React frontend handles user interaction and dashboard flows.
2. The frontend calls backend REST endpoints over HTTP.
3. The Spring Boot backend applies authentication, business rules, and persistence.
4. PostgreSQL stores users, profiles, jobs, notifications, ratings, and earnings.

## Runtime Flow

```text
Browser
  -> React + Vite frontend
  -> REST API calls with JWT
  -> Spring Boot backend
  -> JPA/Hibernate
  -> PostgreSQL
```

## Frontend Structure

Important frontend areas:

- `src/pages/` contains route-level screens such as login, registration, and dashboards
- `src/components/` contains shared UI, layouts, dialogs, and panels
- `src/services/api/` contains API clients grouped by domain
- `src/types/` contains TypeScript interfaces for API data contracts
- `src/context/` contains shared app state such as authentication

## Backend Structure

Important backend areas:

- `controller/` exposes REST endpoints
- `service/` contains core business logic
- `repository/` contains Spring Data JPA repositories
- `entity/` defines persistence models
- `dto/` contains request and response payload types
- `security/` contains JWT and authentication-related logic
- `config/` contains platform configuration such as CORS, bootstrap, and migrations

## Domain Concepts

- `User`: base account with role information
- `WorkerProfile`: worker-specific service metadata
- `ServiceRequest`: customer-created request for work
- `Job`: accepted unit of work derived from a service request
- `Rating`: customer feedback on completed jobs
- `Earning`: worker payout and cooperative fee calculation
- `Notification`: user-facing activity updates
- `AdminActivity`: audit-friendly admin action history

## Request Lifecycle

1. A customer creates a service request.
2. Eligible workers are matched based on category and profile details.
3. A worker accepts the job.
4. The worker moves the job through `ACCEPTED`, `IN_PROGRESS`, and `COMPLETED`.
5. The system creates earnings and notifications.
6. The customer can submit a rating after completion.

## Security Model

- authentication is handled with JWT
- authorization is role-based
- customer, worker, and admin APIs are separated by responsibility
- sensitive configuration is loaded from environment variables

## Integration Notes

- the frontend typically uses `/api` as the base path
- the backend runs on port `8080` by default
- the frontend dev server runs on port `5173` by default
- CORS is controlled through `CORS_ALLOWED_ORIGINS`
