# Cooperative Gig Services Platform (GigCircle V1)

An **Smart India Hackathon (SIH)** ready full-stack cooperative gig platform connecting local communities and households with verified, skilled gig workers through a transparent, cooperative-driven economic model.

---

## 📌 Table of Contents

- [Overview](#overview)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Completed Segments (Segments 1–10)](#completed-segments-segments-110)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started & Local Setup](#getting-started--local-setup)
  - [1. Environment Setup](#1-environment-setup)
  - [2. Database Configuration](#2-database-configuration)
  - [3. Running the Backend](#3-running-the-backend)
  - [4. Running the Frontend](#4-running-the-frontend)
- [Verification & Automated Test Suite](#verification--automated-test-suite)
- [REST Endpoints Overview](#rest-endpoints-overview)
- [Team Collaboration & Workflow](#team-collaboration--workflow)
- [SIH Demo Readiness](#sih-demo-readiness)

---

## 🌟 Overview

The **GigCircle Cooperative Gig Services Platform** provides a structured digital ecosystem built around three primary stakeholder perspectives:

- 👤 **Customer**: Create service requests across 8 local categories, view real-time matched worker assignments, track job progress (`ACCEPTED` → `IN_PROGRESS` → `COMPLETED`), inspect transparent financial breakdowns, submit 1–5 star ratings & reviews, and receive in-app notifications.
- 🛠️ **Worker**: Register worker profiles, manage skills, categories, hourly rates, location, and availability toggles; view real-time eligible job feeds, accept assignments, manage job lifecycles, receive automated earnings (90% net payout after 10% cooperative fee), and view customer ratings.
- 🛡️ **Admin / Cooperative Steward**: Platform governance overview, registered user directory, worker account inspection & active/deactivate status toggling, service request/job/rating monitoring, financial gross volume oversight, and server-derived activity audit stream.

---

## 🛠️ Architecture & Tech Stack

```text
┌─────────────────────────────────────────────────────────┐
│                    Browser Client                       │
│           (React 18 + TypeScript + Tailwind v4)        │
└────────────────────────────┬────────────────────────────┘
                             │  HTTP / REST Requests (JWT)
                             ▼
┌─────────────────────────────────────────────────────────┐
│             Vite Dev Server (Port 5173)                 │
│          Proxy: /api  ──►  http://localhost:8080        │
└────────────────────────────┬────────────────────────────┘
                             │  Proxied Backend Calls
                             ▼
┌─────────────────────────────────────────────────────────┐
│           Spring Boot Backend (Port 8080)              │
│       Spring Security + Data JPA + REST Controllers     │
└────────────────────────────┬────────────────────────────┘
                             │  JDBC Connection
                             ▼
┌─────────────────────────────────────────────────────────┐
│               PostgreSQL Database (5432)                │
│                 DB: cooperative_gig                     │
└─────────────────────────────────────────────────────────┘
```

### **Frontend Stack**
- **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Styling & UI**: Tailwind CSS v4, Radix UI Primitives, Lucide Icons, Framer Motion
- **Form & Validation**: React Hook Form + Zod
- **Networking**: Axios service layer with centralized base configuration & JWT bearer interceptors
- **Routing**: React Router DOM v6

### **Backend Stack**
- **Framework**: [Java 17 / 25](https://www.oracle.com/java/) + [Spring Boot 3.4.4](https://spring.io/projects/spring-boot)
- **Security & JWT**: Spring Security + JJWT (`0.12.6`) + BCrypt Password Encoder
- **Persistence**: Spring Data JPA + Hibernate + PostgreSQL Driver
- **Configuration**: `dotenv-java` for environment variable loading
- **Build Tool**: Apache Maven

---

## 🎯 Completed Segments (Segments 1–10)

| Segment | Module | Description | Status |
| :---: | :--- | :--- | :---: |
| **Segment 1** | **Authentication & RBAC** | JWT Auth, Customer/Worker/Admin registration & login, password hashing, role protection, Admin bootstrap (`admin@gigcircle.com`). | **COMPLETE** |
| **Segment 2** | **Service Requests** | Customer creation of requests across 8 categories, listing, request details, cancellation, ownership validation. | **COMPLETE** |
| **Segment 3** | **Worker Profiles** | Worker profile creation, skills cataloguing, service categories, hourly rate, location, radius, and availability toggles. | **COMPLETE** |
| **Segment 4** | **Matching & Acceptance** | Algorithmic worker matching by category/location, single-worker job acceptance, and concurrency protection. | **COMPLETE** |
| **Segment 5** | **Job Lifecycle** | Full state machine (`ACCEPTED` $\to$ `IN_PROGRESS` $\to$ `COMPLETED`), timestamp recording (`acceptedAt`, `startedAt`, `completedAt`). | **COMPLETE** |
| **Segment 6** | **Ratings & Reviews** | 1–5 rating submission, written reviews, single-rating per job constraint, real-time worker rating summaries. | **COMPLETE** |
| **Segment 7** | **Cooperative Revenue** | Automated earning creation, 10% platform fee calculation (`BigDecimal`), worker earnings ledgers, admin gross volume views. | **COMPLETE** |
| **Segment 8** | **Notifications** | Database-backed notifications, unread counters, mark-read, lifecycle notification triggers, cross-role isolation. | **COMPLETE** |
| **Segment 9** | **Admin Governance** | Platform overview statistics, user directory, worker activate/deactivate controls, monitoring endpoints, audit stream. | **COMPLETE** |
| **Segment 10** | **V1 Hardening & Acceptance** | Transactional isolation (`REQUIRES_NEW`), database migration runner, regression testing, Vite production build, demo checklist. | **COMPLETE** |

---

## 📁 Project Structure

```text
Cooperative-Gig-Services-Platform/
├── .env.example             # Git-safe environment template
├── .gitignore               # Ignored files (node_modules, target, .env)
├── README.md                # Project documentation & onboarding guide
├── package.json             # Root NPM configuration & convenience scripts
│
├── frontend/                # React + TypeScript + Vite client application
│   ├── src/
│   │   ├── components/      # Layout elements & NotificationPanel dropdown
│   │   ├── pages/           # Customer, Worker, and Admin role dashboards
│   │   ├── services/api/    # Axios API services for auth, requests, workers, jobs, ratings, earnings, notifications, admin
│   │   ├── types/           # TypeScript DTO interfaces
│   │   ├── App.tsx          # Router setup
│   │   └── main.tsx         # Entry point
│   ├── package.json         # Dependencies & build scripts
│   └── vite.config.ts       # Vite proxy & build settings
│
├── backend/                 # Java Spring Boot REST API
│   ├── src/
│   │   ├── main/java/com/sih/cooperative/
│   │   │   ├── config/       # Security, CORS, and DatabaseMigrationRunner
│   │   │   ├── controller/   # REST Controllers (Auth, Requests, Worker, Rating, Earning, Notification, Admin)
│   │   │   ├── dto/          # Data Transfer Objects
│   │   │   ├── entity/       # JPA Entities (User, ServiceRequest, WorkerProfile, Job, Rating, Earning, Notification, AdminActivity)
│   │   │   ├── repository/   # Spring Data JPA Repositories
│   │   │   ├── security/     # JwtTokenProvider, JwtAuthFilter
│   │   │   └── service/      # Business logic & transaction handlers
│   │   └── test/java/com/sih/cooperative/
│   │       └── *IntegrationTest.java # 9 Integration Test Suites (98 tests)
│   └── pom.xml              # Maven dependencies
│
└── scripts/                 # Verification & operational scripts
    └── verify-db-connection.ps1 # Database connection verification script
```

---

## 🚀 Getting Started & Local Setup

### 1. Environment Setup

Clone the repository and prepare the local environment configuration:

```bash
git clone https://github.com/taneesh-kumar/GigCircle.git
cd GigCircle
cp .env.example .env
```

Ensure your `.env` contains:

```env
PORT=8080
DATABASE_URL=jdbc:postgresql://localhost:5432/cooperative_gig
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_postgres_password
JWT_SECRET=your-super-secret-jwt-key-must-be-long-and-secure
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

---

### 2. Database Configuration

Start your PostgreSQL server and create the database:

```sql
CREATE DATABASE cooperative_gig;
```

To verify PostgreSQL port connection and health:

```powershell
powershell -ExecutionPolicy Bypass -File "scripts/verify-db-connection.ps1"
```

---

### 3. Running the Backend

```bash
cd backend
mvn spring-boot:run
```

- Backend runs at **`http://localhost:8080`**.

---

### 4. Running the Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

- Frontend client runs at **`http://localhost:5173`**.

---

## 🧪 Verification & Automated Test Suite

### 1. Backend Automated Tests

Run the complete backend integration test suite:

```bash
cd backend
mvn clean test
```

- **Tests Executed**: **98**
- **Failures**: **0**
- **Errors**: **0**
- **Skipped**: **0**

### 2. Frontend TypeScript Typecheck

```bash
cd frontend
npm run typecheck
```

- **Result**: **Exit Code 0** (Zero TypeScript compilation errors).

### 3. Production Build Verification

```bash
cd frontend
npm run build
```

- **Result**: **Exit Code 0** (Vite minified client bundle created in `frontend/dist/`).

---

## 📡 REST Endpoints Overview

| Area | Method | Endpoint | Role / Auth | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/register` | Public | Register Customer or Worker |
| **Auth** | `POST` | `/api/auth/login` | Public | Authenticate user & return JWT token |
| **Requests** | `POST` | `/api/customer/service-requests` | CUSTOMER | Create a new service request |
| **Requests** | `GET` | `/api/customer/service-requests` | CUSTOMER | List customer's service requests |
| **Requests** | `POST` | `/api/customer/service-requests/{id}/cancel` | CUSTOMER | Cancel open request |
| **Worker** | `POST` | `/api/worker/profile` | WORKER | Create worker profile |
| **Worker** | `GET` | `/api/worker/jobs` | WORKER | View eligible matched jobs |
| **Worker** | `POST` | `/api/worker/jobs/{id}/accept` | WORKER | Accept a matched job |
| **Worker** | `POST` | `/api/worker/jobs/{id}/start` | WORKER | Mark job as in-progress |
| **Worker** | `POST` | `/api/worker/jobs/{id}/complete` | WORKER | Complete job & trigger earnings |
| **Ratings** | `POST` | `/api/customer/ratings` | CUSTOMER | Rate completed job (1–5 stars) |
| **Earnings** | `GET` | `/api/worker/earnings` | WORKER | View worker net earnings & ledger |
| **Notifications** | `GET` | `/api/notifications` | Authenticated | List user's notifications |
| **Admin** | `GET` | `/api/admin/overview` | ADMIN | View platform overview metrics |
| **Admin** | `POST` | `/api/admin/workers/{id}/deactivate` | ADMIN | Deactivate worker account |
| **Admin** | `POST` | `/api/admin/workers/{id}/activate` | ADMIN | Reactivate worker account |
| **Admin** | `GET` | `/api/admin/activity` | ADMIN | View administrative audit stream |

---

## 🏆 SIH Demo Readiness

GigCircle V1 is fully prepared for **Smart India Hackathon** evaluation:
- Demonstrates transparent local household service matching.
- Implements worker cooperative 10% platform fee economic distribution.
- Enforces multi-tier security, database notifications, and administrative platform governance.
