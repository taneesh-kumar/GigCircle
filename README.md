# Cooperative Gig Services Platform

An **Smart India Hackathon (SIH)** ready full-stack platform connecting local communities and households with verified, skilled gig workers through a transparent, cooperative-driven economic model.

---

## 📌 Table of Contents

- [Overview](#overview)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started & Local Setup](#getting-started--local-setup)
  - [1. Environment Setup](#1-environment-setup)
  - [2. Database Configuration](#2-database-configuration)
  - [3. Running the Backend](#3-running-the-backend)
  - [4. Running the Frontend](#4-running-the-frontend)
- [Foundation REST Endpoints](#foundation-rest-endpoints)
- [Team Collaboration & Workflow](#team-collaboration--workflow)
  - [Division of Responsibilities](#division-of-responsibilities)
  - [Git Branching Strategy](#git-branching-strategy)
  - [Commit Conventions](#commit-conventions)
  - [Pull Request & Code Review Process](#pull-request--code-review-process)
  - [Environment & Secret Management](#environment--secret-management)
- [Troubleshooting & Common Issues](#troubleshooting--common-issues)
- [Project Roadmap](#project-roadmap)

---

## 🌟 Overview

The **Cooperative Gig Services Platform** provides a structured digital ecosystem built around three primary stakeholder perspectives:

- 👤 **Customer**: Discover, request, and rate trusted local household & community services with fair transparent pricing.
- 🛠️ **Worker**: Register local skills, receive algorithmic work opportunities, build transparent reputation metrics, and benefit from cooperative profit-sharing.
- 🛡️ **Admin / Cooperative Steward**: Oversee worker background verifications, platform activity, fair profit distributions, and dispute resolutions.

---

## 🛠️ Architecture & Tech Stack

```text
┌─────────────────────────────────────────────────────────┐
│                    Browser Client                       │
│           (React 19 + TypeScript + Tailwind v4)        │
└────────────────────────────┬────────────────────────────┘
                             │  HTTP / REST Requests
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
└────────────────────────────?────────────────────────────┘
```

### **Frontend Stack**
- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Styling & UI**: Tailwind CSS v4, Radix UI Primitives, Lucide Icons, Framer Motion
- **Form & Validation**: React Hook Form + Zod
- **Networking**: Axios service layer with centralized base configurations
- **Routing**: React Router DOM v6

### **Backend Stack**
- **Framework**: [Java 17](https://www.oracle.com/java/) + [Spring Boot 3.4.4](https://spring.io/projects/spring-boot)
- **Security & JWT**: Spring Security + JJWT (`0.12.6`)
- **Persistence**: Spring Data JPA + Hibernate + PostgreSQL Driver
- **Configuration**: `dotenv-java` for environment variable loading
- **Build Tool**: Apache Maven

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
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # UI components (Radix UI, layout elements)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility helpers & class merger scripts
│   │   ├── pages/           # Application views/routes (Customer, Worker, Admin)
│   │   ├── services/        # Axios API clients & endpoints
│   │   ├── types/           # TypeScript interfaces & types
│   │   ├── App.tsx          # App root routing structure
│   │   └── main.tsx         # Application entry point
│   ├── package.json         # Frontend dependencies & scripts
│   ├── tsconfig.json        # TypeScript configuration
│   └── vite.config.ts       # Vite build & backend proxy config
│
├── backend/                 # Java Spring Boot REST API
│   ├── src/
│   │   └── main/
│   │       ├── java/com/sih/cooperative/
│   │       │   ├── config/       # Security & CORS configuration
│   │       │   ├── controller/   # REST Controllers (/api/healthz, /api/platform)
│   │       │   ├── dto/          # Data Transfer Objects
│   │       │   ├── entity/       # Database JPA Entities
│   │       │   ├── exception/    # Global Exception Handling
│   │       │   ├── repository/   # Spring Data JPA Repositories
│   │       │   ├── security/     # JWT Auth components & filters
│   │       │   ├── service/      # Business logic services
│   │       │   └── util/         # Helper classes
│   │       └── resources/
│   │           └── application.properties # Spring configuration
│   └── pom.xml              # Maven dependencies & build setup
│
├── scripts/                  # Utility & operational scripts
│   └── verify-db-connection.ps1 # PostgreSQL connection verification script
│
└── docs/                    # Architectural documents & design specs
```

---

## 📋 Prerequisites

Before running the application locally, ensure you have the following installed:

- **Node.js**: `v20.0.0` or higher
- **npm**: `v10.0.0` or higher
- **Java Development Kit (JDK)**: `JDK 17` or higher
- **Apache Maven**: `v3.8+` (or use your IDE's embedded Maven)
- **PostgreSQL**: `v14` or higher

---

## 🚀 Getting Started & Local Setup

Follow these steps to set up the repository on your local system.

### 1. Environment Setup

Clone the repository and prepare the environment configuration file:

```bash
git clone https://github.com/taneesh-kumar/Cooperative-Gig-Services-Platform.git
cd Cooperative-Gig-Services-Platform
```

Copy `.env.example` to create your local `.env` file:

```bash
cp .env.example .env
```

Ensure your `.env` contains the required keys:

```env
# Frontend Configuration
VITE_API_BASE_URL=/api

# Backend Configuration
PORT=8080
DATABASE_URL=jdbc:postgresql://localhost:5432/cooperative_gig
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_postgres_password
JWT_SECRET=your-super-secret-jwt-key-must-be-long-and-secure
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

---

### 2. Database Configuration

Start your local PostgreSQL service and create the database:

```sql
CREATE DATABASE cooperative_gig;
```

#### Verifying Database Connection

To quickly verify your PostgreSQL network connection, credentials, health endpoint, and table status, run:

```powershell
powershell -ExecutionPolicy Bypass -File "scripts/verify-db-connection.ps1"
```


---

### 3. Running the Backend

Navigate to the `backend` folder and start the Spring Boot application:

```bash
cd backend
mvn spring-boot:run
```

- The Spring Boot server will initialize on **`http://localhost:8080`**.
- It automatically loads settings from your root `.env` file via `dotenv-java`.

> 💡 **Tip for Maven Build/Test**: To build the `.jar` package without running tests:
> ```bash
> mvn clean package -DskipTests
> ```

---

### 4. Running the Frontend

In a separate terminal, navigate to the `frontend` folder and start the Vite dev server:

```bash
cd frontend
npm install
npm run dev
```

Alternatively, from the project root directory, you can run:

```bash
npm run dev
```

- The frontend will open at **`http://localhost:5173`**.
- Requests made to `/api/*` are automatically proxied to `http://localhost:8080/api/*`.

---

## 📡 Foundation REST Endpoints

The backend currently exposes core foundation & system health endpoints:

| Method | Endpoint | Description | Public / Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/healthz` | System health check & database connection status | Public |
| `GET` | `/api/platform/info` | Platform identity, active phase, and available routes | Public |

---

## 🤝 Team Collaboration & Workflow

To maintain clean code quality, avoid merge conflicts, and streamline team contributions, all team members should strictly adhere to the following workflow guidelines.

### 👥 Division of Responsibilities

- **Frontend Developers**: Work inside `frontend/src/` (components, pages, styles, hooks, and API integration).
- **Backend Developers**: Work inside `backend/src/main/java/com/sih/cooperative/` (entities, DTOs, controllers, services, repositories).
- **Full-Stack / Integration**: Coordinate API contracts (`dto/` and `services/api/`) before building new features.

---

### 🌿 Git Branching Strategy

- **`main`**: Production-ready, stable code. Only merge into `main` via approved Pull Requests.
- **`dev`**: Main integration branch for active development.
- **Feature Branches**: Create focused branches off `dev` for every task or bug fix:
  - `feature/auth-jwt-backend`
  - `feature/worker-dashboard-ui`
  - `fix/cors-origin-issue`
  - `docs/update-api-specs`

#### Branch Setup Commands:
```bash
# Fetch latest updates
git checkout dev
git pull origin dev

# Create a new feature branch
git checkout -b feature/your-feature-name
```

---

### 📝 Commit Conventions

Follow standard **Conventional Commits** to keep the Git history readable:

- `feat: add worker registration form schema`
- `fix: resolve CORS policy blocking request headers`
- `docs: update setup steps in README`
- `refactor: extract reusable card component for customer view`
- `style: apply Tailwind glassmorphism styles to navigation bar`

---

### 🔀 Pull Request & Code Review Process

1. **Test Locally Before Pushing**:
   - **Frontend Check**:
     ```bash
     cd frontend
     npm run typecheck
     npm run build
     ```
   - **Backend Check**:
     ```bash
     cd backend
     mvn test
     ```
2. **Push to Remote**:
   ```bash
   git push -u origin feature/your-feature-name
   ```
3. **Open a Pull Request (PR)** against `dev` or `main`.
4. **Code Review**: At least 1 teammate must review and approve the PR before merging.
5. **Delete Merged Branch**: Clean up feature branches post-merge.

---

### 🔐 Environment & Secret Management

- **NEVER commit sensitive credentials** (database passwords, API keys, JWT secrets) to Git.
- `.env` is listed in `.gitignore` and must remain local to your machine.
- Always update `.env.example` if you introduce new environment variables so teammates know what variables are required.

---

## 🔧 Troubleshooting & Common Issues

### ❌ Port 8080 is already in use
If another process is using port `8080`:
- Update `PORT=8081` in your root `.env` file.
- Update `vite.config.ts` target proxy if you change backend ports.
- Alternatively, stop the conflicting process on Windows:
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess | Stop-Process
  ```

### ❌ Database connection failure (`PSQLException`)
- Ensure your PostgreSQL server is running.
- Verify database existence (`CREATE DATABASE cooperative_gig;`).
- Check `DATABASE_USERNAME` and `DATABASE_PASSWORD` in `.env`.

### ❌ CORS Error in Browser Console
- Verify `CORS_ALLOWED_ORIGINS` in `.env` includes `http://localhost:5173`.
- Ensure Spring Security CORS configuration matches the client origin.

---

## 🗺️ Project Roadmap

- [x] **Phase 1 — Foundation Setup** *(Current)*: Project skeleton, Spring Boot REST controllers, Vite React frontend, Tailwind v4 integration, Health APIs.
- [ ] **Phase 2 — Authentication & RBAC**: JWT authorization, Spring Security filters, User Login/Signup, Role-based route guards (Customer, Worker, Admin).
- [ ] **Phase 3 — Worker & Customer Profiles**: Skill cataloguing, worker verification document uploads, customer address profiles.
- [ ] **Phase 4 — Gig Discovery & Matching Engine**: Service listings, location/skill-based matching algorithm, booking requests.
- [ ] **Phase 5 — Cooperative Economics & Dashboard**: Fair revenue distribution formulas, transparent worker dividend tracking, cooperative analytics.
