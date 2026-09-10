# GigCircle Supabase Schema Verification Guide

This guide provides step-by-step instructions for executing and verifying `schema.sql` in Supabase PostgreSQL, as well as SQL verification scripts for testing constraints, indexes, foreign keys, and Spring Boot application connectivity.

---

## 1. Executing `schema.sql` in Supabase

1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project (e.g. `db.lbpkqjcbekjktpopkphd.supabase.co`).
3. Click on **SQL Editor** in the left sidebar menu.
4. Click **New Query**.
5. Copy the complete contents of [`schema.sql`](file:///t:/Taneesh/Documents/Git%20Repos/Smart%20India%20Hackathon/GigCircle/schema.sql) and paste into the query editor.
6. Click **Run** (or press `Ctrl+Enter`).
7. Confirm that the execution banner returns `Success` with zero errors.

---

## 2. Table Verification Queries

Run the following query in Supabase SQL Editor to verify that all 11 required platform tables exist in the `public` schema:

```sql
SELECT 
    table_name,
    table_type
FROM 
    information_schema.tables 
WHERE 
    table_schema = 'public' 
ORDER BY 
    table_name;
```

### Expected Output Tables
1. `admin_activity`
2. `earnings`
3. `jobs`
4. `notifications`
5. `payments`
6. `ratings`
7. `service_requests`
8. `users`
9. `worker_profile_categories`
10. `worker_profile_skills`
11. `worker_profiles`

---

## 3. Column Structure & Nullability Verification

Verify column names, data types, and nullability across tables:

```sql
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
ORDER BY 
    table_name, 
    ordinal_position;
```

---

## 4. Foreign Key Integrity Verification

Verify that all relationships and foreign keys are active:

```sql
SELECT
    tc.table_name AS source_table,
    kcu.column_name AS source_column,
    ccu.table_name AS target_table,
    ccu.column_name AS target_column,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE 
    tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY 
    source_table, 
    source_column;
```

---

## 5. Index Verification

Verify that explicit JPA indexes and foreign key indexes are created:

```sql
SELECT
    tablename,
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    schemaname = 'public'
ORDER BY
    tablename,
    indexname;
```

---

## 6. Constraint & Enum Check Verification

Verify check constraints on enum fields and numerical boundaries:

```sql
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM 
    pg_constraint c
JOIN 
    pg_namespace n ON n.oid = c.connamespace
WHERE 
    n.nspname = 'public'
    AND c.contype = 'c'
ORDER BY 
    table_name, 
    constraint_name;
```

---

## 7. Verifying Default Admin Seed Data

Verify that the system admin account was seeded properly:

```sql
SELECT 
    id, 
    name, 
    email, 
    role, 
    active, 
    created_at 
FROM 
    users 
WHERE 
    role = 'ADMIN';
```

---

## 8. Verifying Spring Boot Application Connection

To verify that the Spring Boot application connects successfully to Supabase PostgreSQL:

1. Update `.env` or `application.yml` with your Supabase direct connection parameters:
   ```properties
   DATABASE_URL=jdbc:postgresql://db.lbpkqjcbekjktpopkphd.supabase.co:5432/postgres?sslmode=require
   DATABASE_USERNAME=postgres
   DATABASE_PASSWORD=your_supabase_password
   ```
2. Execute the connection test script in PowerShell:
   ```powershell
   .\scripts\verify-db-connection.ps1
   ```
3. Start the Spring Boot backend:
   ```powershell
   cd backend
   mvn spring-boot:run
   ```
4. Check the application health endpoint:
   ```bash
   curl http://localhost:8080/api/healthz
   ```
   **Expected Response**:
   ```json
   {"status":"UP","databaseConfigured":true}
   ```
