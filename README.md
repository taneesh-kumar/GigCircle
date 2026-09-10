# Cooperative Gig Services Platform (GigCircle V1)

An **Smart India Hackathon (SIH)** ready full-stack cooperative gig platform connecting local communities and households with verified, skilled gig workers through a transparent, cooperative-driven economic model.

---

## 📌 Table of Contents

- [Overview](#overview)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Completed Phases (Phases 1–5)](#completed-phases-phases-15)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started & Local Setup](#getting-started--local-setup)
  - [1. Environment Setup](#1-environment-setup)
  - [2. Database Configuration](#2-database-configuration)
  - [3. Running the Backend](#3-running-the-backend)
  - [4. Running the Frontend](#4-running-the-frontend)
- [Verification & Automated Test Suite](#verification--automated-test-suite)
- [REST Endpoints Overview](#rest-endpoints-overview)
- [Chat & Dispute Management Workflow](#chat--dispute-management-workflow)
- [Invoice Generation & Billing System](#invoice-generation--billing-system)
- [Team Collaboration & Workflow](#team-collaboration--workflow)
- [SIH Demo Readiness](#sih-demo-readiness)

---

## 🌟 Overview

The **GigCircle Cooperative Gig Services Platform** provides a structured digital ecosystem built around three primary stakeholder perspectives:

- 👤 **Customer**: Create service requests across local categories, view matched worker assignments, track job progress (`ACCEPTED` → `IN_PROGRESS` → `COMPLETED`), communicate via job chat, raise disputes if service issues arise, inspect transparent financial breakdowns, submit 1–5 star ratings & reviews, and receive in-app notifications.
- 🛠️ **Worker**: Register worker profiles, manage skills, categories, hourly rates, location, and availability toggles; view eligible job feeds, accept assignments, manage job lifecycles, chat with customers for assigned jobs, respond to active disputes, receive automated earnings (90% net payout after 10% cooperative fee), and view customer ratings.
- 🛡️ **Admin / Cooperative Steward**: Platform governance overview, registered user directory, worker account inspection & active/deactivate status toggling, worker verification review, comprehensive dispute resolution dashboard (move under review, request information, resolve with notes, or dismiss with notes), financial gross volume oversight, and server-derived activity audit stream.

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
│            Supabase PostgreSQL Database (5432)          │
│                Host: db.*.supabase.co                   │
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

## 🎯 Completed Phases (Phases 1–5)

| Phase | Module | Description | Status |
| :---: | :--- | :--- | :---: |
| **Phase 1** | **Account Status & Governance** | `AccountStatus` enum (`ACTIVE`, `SUSPENDED`, `DEACTIVATED`), login enforcement, admin user activation/deactivation/suspension controls, self-deactivation protection, audit logging. | **COMPLETE** |
| **Phase 2** | **Full Admin Dashboard & Analytics** | Enhanced Overview KPIs, backend completion & cancellation rate calculations, service demand by category API, filterable active jobs API, dynamic operational alerts API, and UI sections. | **COMPLETE** |
| **Phase 3** | **Dispute Management Backend** | Single active dispute constraint per job, participant dispute creation/response, admin dispute resolution workflow, audit logging & history. | **COMPLETE** |
| **Phase 4** | **Financial Audit & Operational Management** | Read-only administrative financial metrics DTO, paginated financial audit transaction list, deep transaction inspection modal, job operational status filters (`UNASSIGNED`, `UNRESOLVED_DISPUTE`, `OVERDUE`), audit activity filter bar. | **COMPLETE** |
| **Phase 5** | **Dispute Resolution, Worker Verification & Governance** | Database-level paginated disputes (`GET /api/admin/disputes`) and worker verifications (`GET /api/admin/verifications`) with search filters, expanded platform governance overview KPIs (pending verifications, unresolved & recently resolved disputes), integrated governance panels, and 100% backend/frontend verification. | **COMPLETE** |


---

## 📁 Project Structure

```text
GigCircle/
├── .env.example             # Git-safe environment template
├── .gitignore               # Ignored files (node_modules, target, .env)
├── README.md                # Project documentation & onboarding guide
├── MANUAL_TESTING.md        # Comprehensive step-by-step manual testing guide
├── package.json             # Root NPM configuration & convenience scripts
├── schema.sql               # Database schema & initial seeds
│
├── frontend/                # React + TypeScript + Vite client application
│   ├── src/
│   │   ├── components/      # Layout elements, ChatPanel, Dispute components, Modals (User Detail, Financial Detail)
│   │   ├── pages/           # Customer, Worker, Admin dashboards & AdminDisputesPage
│   │   ├── services/api/    # Axios API services for auth, chat, dispute, jobs, payments, admin
│   │   ├── types/           # TypeScript DTO interfaces (chat, dispute, admin, etc.)
│   │   ├── App.tsx          # Router setup
│   │   └── main.tsx         # Entry point
│   ├── package.json         # Dependencies & build scripts
│   └── vite.config.ts       # Vite proxy & build settings
│
└── backend/                 # Java Spring Boot REST API
    ├── src/
    │   ├── main/java/com/sih/cooperative/
    │   │   ├── config/       # Security, CORS, and DatabaseMigrationRunner
    │   │   ├── controller/   # REST Controllers (Auth, Chat, Dispute, AdminDispute, AdminOperations, Requests, Worker, Rating, Payment)
    │   │   ├── dto/          # Data Transfer Objects (AdminFinancialSummaryResponse, AdminFinancialTransactionResponse, etc.)
    │   │   ├── entity/       # JPA Entities (User, Job, ChatConversation, ChatMessage, Dispute, DisputeHistory, DisputeEvidence, AdminActivity, Invoice, Payment)
    │   │   ├── repository/   # Spring Data JPA Repositories (Specification Executors)
    │   │   ├── security/     # JwtTokenProvider, JwtAuthFilter
    │   │   └── service/      # Business logic & transaction handlers
    │   └── test/java/com/sih/cooperative/
    │       └── *IntegrationTest.java # 16 Integration Test Suites (231 tests)
    └── pom.xml              # Maven dependencies
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

Ensure your `.env` contains your Supabase PostgreSQL credentials:

```env
PORT=8080
DATABASE_URL=jdbc:postgresql://db.lbpkqjcbekjktpopkphd.supabase.co:5432/postgres?sslmode=require
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_supabase_password
JWT_SECRET=your-super-secret-jwt-key-must-be-long-and-secure
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

---

### 2. Database Setup (Supabase PostgreSQL)

1. Open your [Supabase SQL Editor](https://supabase.com/dashboard).
2. Execute [`schema.sql`](file:///t:/Taneesh/Documents/Git%20Repos/Smart%20India%20Hackathon/GigCircle/schema.sql) to provision all tables, enums, checks, foreign keys, and partial active-dispute unique index (`uk_disputes_active_job`).

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

- **Tests Executed**: **231**
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
| **Chat** | `GET` | `/api/chat/job/{jobId}` | Authenticated | Get/create chat conversation for job |
| **Chat** | `GET` | `/api/chat/job/{jobId}/messages` | Authenticated | Get chronological chat messages |
| **Chat** | `POST` | `/api/chat/job/{jobId}/messages` | Authenticated | Send message to job chat |
| **Chat** | `POST` | `/api/chat/job/{jobId}/read` | Authenticated | Mark unread messages as read |
| **Disputes** | `POST` | `/api/disputes` | Authenticated | Create dispute for assigned job |
| **Disputes** | `GET` | `/api/disputes/my-disputes` | Authenticated | List disputes involving current user |
| **Disputes** | `GET` | `/api/disputes/job/{jobId}` | Authenticated | Get dispute details for job |
| **Disputes** | `POST` | `/api/disputes/{id}/respond` | Authenticated | Respond to active dispute |
| **Admin Ops** | `GET` | `/api/admin/overview` | ADMIN | Enhanced platform overview KPIs & analytics |
| **Admin Ops** | `GET` | `/api/admin/users` | ADMIN | Database-level paginated & filtered user directory |
| **Admin Ops** | `GET` | `/api/admin/users/{userId}` | ADMIN | Detailed administrative user inspection |
| **Admin Ops** | `POST` | `/api/admin/users/{userId}/activate` | ADMIN | Activate target user account |
| **Admin Ops** | `POST` | `/api/admin/users/{userId}/deactivate` | ADMIN | Deactivate target user account with reason |
| **Admin Ops** | `POST` | `/api/admin/users/{userId}/suspend` | ADMIN | Suspend target user account with reason |
| **Admin Ops** | `POST` | `/api/admin/users/{userId}/reactivate` | ADMIN | Reactivate target user account |
| **Financial Audit** | `GET` | `/api/admin/financial/summary` | ADMIN | Aggregated gross volume, platform fees, worker payouts, and transaction metrics |
| **Financial Audit** | `GET` | `/api/admin/financial/transactions` | ADMIN | Paginated transaction list with status, search, and date range filters |
| **Financial Audit** | `GET` | `/api/admin/financial/transactions/{id}` | ADMIN | Full read-only financial audit detail inspection for transaction |
| **Audit Activity** | `GET` | `/api/admin/activity` | ADMIN | Paginated activity audit trail with action type, search, and date range filters |
| **Admin Governance**| `GET` | `/api/admin/disputes` | ADMIN | Database-level paginated disputes with status & text search |
| **Admin Governance**| `POST` | `/api/admin/disputes/{id}/review` | ADMIN | Move dispute under review |
| **Admin Governance**| `POST` | `/api/admin/disputes/{id}/request-response`| ADMIN | Request additional info |
| **Admin Governance**| `POST` | `/api/admin/disputes/{id}/resolve` | ADMIN | Resolve dispute with mandatory resolution notes |
| **Admin Governance**| `POST` | `/api/admin/disputes/{id}/dismiss` | ADMIN | Dismiss dispute with mandatory dismissal notes |
| **Admin Governance**| `GET` | `/api/admin/verifications` | ADMIN | Database-level paginated worker verifications with status & search |
| **Admin Governance**| `POST` | `/api/admin/verifications/{id}/verify` | ADMIN | Approve worker verification request |
| **Admin Governance**| `POST` | `/api/admin/verifications/{id}/reject` | ADMIN | Reject worker verification request with mandatory reason |

---

## 💳 Phase 4 Financial Audit & Operational Management

1. **Read-Only Financial Metrics (`GET /api/admin/financial/summary`)**:
   - Calculates gross transaction volume, 10% cooperative platform fees, 90% worker payouts, payment status breakdowns, and transaction counts over optional date ranges.
2. **Filterable Transaction Audit Ledger (`GET /api/admin/financial/transactions`)**:
   - Supports page controls, payment status filter (`SUCCESS`, `REFUNDED`, `FAILED`), customer/worker/reference search, and date range filtering.
3. **Deep Financial Inspection Modal (`GET /api/admin/financial/transactions/{id}`)**:
   - Displays full payment method info, sanitized method details, customer/worker metadata, job contract info, linked invoice details, dispute status, and timeline audit logs.
4. **Enhanced Active Job Filtering**:
   - Operational filters for `UNASSIGNED` (unassigned service requests), `UNRESOLVED_DISPUTE` (jobs with active disputes), and `OVERDUE` (stalled job executions).
5. **Security & Financial Integrity**:
   - Strictly read-only views for administrators. No secret gateway credentials or card details exposed; no unverified financial mutations permitted.

---

## 🛠️ Phase 3 Advanced Admin User Management & Unified UX

1. **User Detail Inspection (`GET /api/admin/users/{userId}`)**:
   - Returns complete administrative overview (profile, request/job metrics, financial volume, rating stats, worker verification status, recent audit history).
   - Sensitive fields (password hashes, tokens) are strictly excluded.
2. **Database-Level User Search & Pagination (`GET /api/admin/users`)**:
   - Supports filtering by `role` (`CUSTOMER`, `WORKER`, `ADMIN`), `status` (`ACTIVE`, `SUSPENDED`, `DEACTIVATED`), `active` flag, and string `search` (name & email).
   - Returns structured `PageResponse` containing page index, size, total elements, total pages, first/last flags, and content array.
3. **Status Management & Protection Rules**:
   - Requires non-blank reason for deactivation or suspension.
   - Enforces self-deactivation/suspension prevention and final active admin protection.
   - Every status change records an `AdminActivity` audit log entry.
4. **Unified Frontend UX**:
   - Reusable `AdminUserDetailModal` for deep inspection.
   - Explicit confirmation dialog for suspension and deactivation (replacing browser `prompt()`).
   - Integrated search bar, role filter dropdown, status filter dropdown, and page controls.

---

## 🏆 SIH Demo Readiness

GigCircle V1 is fully prepared for **Smart India Hackathon** evaluation:
- Demonstrates transparent local household service matching.
- Implements worker cooperative fee economic distribution.
- Features integrated Customer–Worker Job Chat and Dispute Resolution workflows.
- Features complete Admin Dashboard KPIs, analytics, operational alerts, and Advanced User Governance.
- Enforces multi-tier security, database notifications, and administrative platform governance.
