# Development Guide

## Prerequisites

Install the following before working on the project:

- Node.js and npm
- Java 17 or newer
- Maven
- PostgreSQL

## Environment Setup

Create a local environment file from the template:

```bash
cp .env.example .env
```

Required variables:

- `VITE_API_BASE_URL=/api`
- `DATABASE_URL=jdbc:postgresql://db.lbpkqjcbekjktpopkphd.supabase.co:5432/postgres?sslmode=require`
- `DATABASE_USERNAME=postgres`
- `DATABASE_PASSWORD=your_supabase_password`
- `JWT_SECRET=your_secure_secret`
- `CORS_ALLOWED_ORIGINS=http://localhost:5173`
- `PORT=8080`

## Database Setup (Supabase PostgreSQL)

Execute [`schema.sql`](file:///t:/Taneesh/Documents/Git%20Repos/Smart%20India%20Hackathon/GigCircle/schema.sql) in the Supabase SQL Editor to initialize all tables, constraints, indexes, and reference admin account.

Optional connection verification script:

```powershell
powershell -ExecutionPolicy Bypass -File "scripts/verify-db-connection.ps1"
```

## Running the Project

### Backend

```bash
cd backend
mvn spring-boot:run
```

Expected default URL: `http://localhost:8080`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Expected default URL: `http://localhost:5173`

## Useful Commands

From the repo root:

```bash
npm run dev
npm run build
npm run install:frontend
```

From `frontend/`:

```bash
npm run dev
npm run typecheck
npm run build
```

From `backend/`:

```bash
mvn spring-boot:run
mvn clean test
```

## Testing Expectations

Before opening a PR, contributors should try to run:

- frontend type checks
- frontend production build
- backend automated tests

If something cannot be run locally, mention that clearly in the PR description.

## Development Workflow

1. Pull the latest changes from the target branch.
2. Create a focused feature or fix branch.
3. Make small, reviewable commits.
4. Verify the impacted area locally.
5. Open a PR with a clear summary and test notes.
