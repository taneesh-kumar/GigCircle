# GigCircle Database Schema Audit Report

This report documents the audit of the **GigCircle** cooperative gig/service marketplace codebase and details the corresponding PostgreSQL schema design for Supabase.

---

## 1. Codebase Inspection Summary

- **Backend Stack**: Spring Boot 3, Java 17, Spring Data JPA / Hibernate, Spring Security, PostgreSQL Driver.
- **ORM Configuration**: `spring.jpa.hibernate.ddl-auto: update`, open-in-view disabled.
- **Entities Audited**: `User`, `WorkerProfile`, `ServiceRequest`, `Job`, `Payment`, `Rating`, `Notification`, `Earning`, `AdminActivity`.
- **Collection Tables Audited**: `worker_profile_skills`, `worker_profile_categories`.
- **Enums Audited**: `Role`, `ServiceCategory`, `ServiceRequestStatus`, `JobStatus`, `PaymentMethod`, `PaymentStatus`, `NotificationType`, `EarningStatus`.
- **Migrations & Bootstrap**: `DatabaseMigrationRunner.java` (drops legacy checks), `AdminBootstrapRunner.java` (seeds default admin).

---

## 2. Table-by-Table Architectural Audit

### Table 1: `users`
Represents platform accounts across three system roles (`CUSTOMER`, `WORKER`, `ADMIN`).

| Column Name | PostgreSQL Type | Nullable | Key / Constraint | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | No | PK (IDENTITY) | Generated | Primary surrogate key |
| `name` | `VARCHAR(255)` | No | - | - | Full name of the user |
| `email` | `VARCHAR(255)` | No | UNIQUE | - | Email used for authentication |
| `phone` | `VARCHAR(255)` | No | - | - | Phone number |
| `password` | `VARCHAR(255)` | No | - | - | BCrypt hashed password |
| `role` | `VARCHAR(255)` | No | CHECK (`role IN ('CUSTOMER', 'WORKER', 'ADMIN')`) | - | Role enum value stored as string |
| `active` | `BOOLEAN` | No | - | `TRUE` | User account active status flag |
| `created_at` | `TIMESTAMP` | No | - | `CURRENT_TIMESTAMP` | Entity creation timestamp |
| `updated_at` | `TIMESTAMP` | No | - | `CURRENT_TIMESTAMP` | Last modification timestamp |

- **Foreign Keys**: None.
- **Unique Constraints**: `users_email_key` on `email`.
- **Indexes**: `idx_users_email` (email lookup for login), `idx_users_role` (filtering by user role).

---

### Table 2: `worker_profiles`
Stores worker details, rates, experience, availability, and geographic locations. Linked 1-to-1 with `users`.

| Column Name | PostgreSQL Type | Nullable | Key / Constraint | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | No | PK (IDENTITY) | Generated | Primary surrogate key |
| `worker_id` | `BIGINT` | No | FK, UNIQUE | - | Foreign key to `users.id` |
| `bio` | `VARCHAR(500)` | Yes | - | - | Professional bio / description |
| `experience_years` | `INTEGER` | No | CHECK (`>= 0`) | - | Years of work experience |
| `hourly_rate` | `NUMERIC(10,2)`| No | CHECK (`>= 0`) | - | Worker hourly rate in INR |
| `is_available` | `BOOLEAN` | No | - | `TRUE` | Availability flag for accepting jobs |
| `service_location` | `VARCHAR(255)` | Yes | - | - | General service area name |
| `service_radius_km`| `INTEGER` | Yes | CHECK (`>= 0`) | - | Coverage radius in kilometers |
| `latitude` | `DOUBLE PRECISION`| Yes | - | - | Geographic latitude coordinate |
| `longitude` | `DOUBLE PRECISION`| Yes | - | - | Geographic longitude coordinate |
| `address` | `VARCHAR(500)` | Yes | - | - | Street address |
| `city` | `VARCHAR(100)` | Yes | - | - | City name |
| `created_at` | `TIMESTAMP` | No | - | `CURRENT_TIMESTAMP` | Entity creation timestamp |
| `updated_at` | `TIMESTAMP` | No | - | `CURRENT_TIMESTAMP` | Last modification timestamp |

- **Foreign Keys**: `fk_worker_profiles_worker` on `worker_id` REFERENCES `users(id)` ON DELETE CASCADE.
- **Unique Constraints**: `worker_profiles_worker_id_key` on `worker_id`.
- **Indexes**: `idx_worker_profiles_worker_id`.

---

### Table 3: `worker_profile_skills` (Collection Table)
Element collection table managed by Hibernate `@ElementCollection` on `WorkerProfile`.

| Column Name | PostgreSQL Type | Nullable | Key / Constraint | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `worker_profile_id` | `BIGINT` | No | FK | - | Foreign key to `worker_profiles.id` |
| `skill` | `VARCHAR(255)` | No | - | - | Skill tag string (e.g. "Pipe Fitting") |

- **Foreign Keys**: `fk_worker_profile_skills_profile` on `worker_profile_id` REFERENCES `worker_profiles(id)` ON DELETE CASCADE.
- **Indexes**: `idx_worker_profile_skills_wp_id`.

---

### Table 4: `worker_profile_categories` (Collection Table)
Element collection table storing service categories offered by workers.

| Column Name | PostgreSQL Type | Nullable | Key / Constraint | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `worker_profile_id` | `BIGINT` | No | FK | - | Foreign key to `worker_profiles.id` |
| `category` | `VARCHAR(255)` | No | CHECK (enum values) | - | Enum category string |

- **Allowed Enums**: `'PLUMBING'`, `'ELECTRICAL'`, `'CLEANING'`, `'CARPENTRY'`, `'APPLIANCE_REPAIR'`, `'PAINTING'`, `'GARDENING'`, `'OTHER'`.
- **Foreign Keys**: `fk_worker_profile_categories_profile` REFERENCES `worker_profiles(id)` ON DELETE CASCADE.
- **Indexes**: `idx_worker_profile_categories_wp_id`.

---

### Table 5: `service_requests`
Created by customers to request specific service tasks with budget and location preferences.

| Column Name | PostgreSQL Type | Nullable | Key / Constraint | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | No | PK (IDENTITY) | Generated | Primary surrogate key |
| `customer_id` | `BIGINT` | No | FK | - | Foreign key to `users.id` (Customer) |
| `category` | `VARCHAR(255)` | No | CHECK (enum values) | - | Requested service category |
| `description` | `VARCHAR(1000)`| No | - | - | Task details and requirements |
| `location` | `VARCHAR(255)` | No | - | - | Target service location name |
| `latitude` | `DOUBLE PRECISION`| Yes | - | - | Customer location latitude |
| `longitude` | `DOUBLE PRECISION`| Yes | - | - | Customer location longitude |
| `address` | `VARCHAR(500)` | Yes | - | - | Detailed address |
| `city` | `VARCHAR(100)` | Yes | - | - | City |
| `budget` | `NUMERIC(10,2)`| No | CHECK (`>= 0`) | - | Proposed budget in INR |
| `preferred_time` | `TIMESTAMP` | No | - | - | Preferred appointment time |
| `status` | `VARCHAR(255)` | No | CHECK (`'OPEN'`, `'CANCELLED'`) | `'OPEN'` | Status enum string |
| `created_at` | `TIMESTAMP` | No | - | `CURRENT_TIMESTAMP` | Request creation time |
| `updated_at` | `TIMESTAMP` | No | - | `CURRENT_TIMESTAMP` | Request update time |

- **Foreign Keys**: `fk_service_requests_customer` ON `customer_id` REFERENCES `users(id)` ON DELETE CASCADE.
- **Indexes**: `idx_service_requests_customer_id`, `idx_service_requests_status`.

---

### Table 6: `jobs`
Main lifecycle entity representing accepted worker assignments for a `service_request`.

| Column Name | PostgreSQL Type | Nullable | Key / Constraint | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | No | PK (IDENTITY) | Generated | Primary surrogate key |
| `service_request_id` | `BIGINT` | No | FK, UNIQUE | - | Foreign key to `service_requests.id` |
| `worker_id` | `BIGINT` | No | FK | - | Foreign key to `users.id` (Worker) |
| `status` | `VARCHAR(255)` | No | CHECK (JobStatus) | `'ACCEPTED'` | Current state of job lifecycle |
| `created_at` | `TIMESTAMP` | No | - | `CURRENT_TIMESTAMP` | Job creation timestamp |
| `accepted_at` | `TIMESTAMP` | Yes | - | - | Timestamp when worker accepted |
| `started_at` | `TIMESTAMP` | Yes | - | - | Timestamp when work started |
| `completed_at` | `TIMESTAMP` | Yes | - | - | Timestamp when job completed |
| `updated_at` | `TIMESTAMP` | No | - | `CURRENT_TIMESTAMP` | Last updated timestamp |

- **Allowed Status Enums**: `'OPEN'`, `'ACCEPTED'`, `'IN_PROGRESS'`, `'PAYMENT_REQUIRED'`, `'COMPLETED'`, `'DECLINED'`.
- **Foreign Keys**:
  - `fk_jobs_service_request` ON `service_request_id` REFERENCES `service_requests(id)` ON DELETE CASCADE.
  - `fk_jobs_worker` ON `worker_id` REFERENCES `users(id)` ON DELETE CASCADE.
- **Unique Constraints**: `jobs_service_request_id_key` on `service_request_id`.
- **Indexes**: `idx_jobs_service_request_id`, `idx_jobs_worker_id`, `idx_jobs_status`.

---

### Table 7: `payments`
Financial transaction records and payment gateway gate between `IN_PROGRESS` and `COMPLETED`.

| Column Name | PostgreSQL Type | Nullable | Key / Constraint | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | No | PK (IDENTITY) | Generated | Primary surrogate key |
| `job_id` | `BIGINT` | No | FK | - | Foreign key to `jobs.id` |
| `customer_id` | `BIGINT` | No | FK | - | Foreign key to `users.id` |
| `service_amount` | `NUMERIC(12,2)`| No | CHECK (`>= 0`) | - | Base fee for worker service |
| `platform_fee` | `NUMERIC(12,2)`| No | CHECK (`>= 0`) | - | Platform fee amount (e.g. 10%) |
| `amount` | `NUMERIC(12,2)`| No | CHECK (`>= 0`) | - | Total customer payment amount |
| `currency` | `VARCHAR(10)` | No | - | `'INR'` | Currency code |
| `payment_method` | `VARCHAR(255)` | No | CHECK (`'UPI'`, `'CARD'`, `'CASH'`) | - | Payment method used |
| `payment_method_details`| `VARCHAR(255)`| Yes | - | - | Details (e.g., UPI ID, masked card) |
| `status` | `VARCHAR(255)` | No | CHECK (PaymentStatus) | - | Status (`PENDING`, `PROCESSING`, `SUCCESS`, `FAILED`, `CANCELLED`, `REFUNDED`) |
| `transaction_reference`| `VARCHAR(64)` | No | UNIQUE | - | Gateway transaction reference |
| `paid_at` | `TIMESTAMP` | Yes | - | - | Payment completion timestamp |
| `failure_reason` | `VARCHAR(500)`| Yes | - | - | Failure explanation if payment failed |
| `refund_amount` | `NUMERIC(12,2)`| Yes | CHECK (`>= 0`) | - | Refunded amount |
| `refunded_at` | `TIMESTAMP` | Yes | - | - | Refund timestamp |
| `created_at` | `TIMESTAMP` | No | - | `CURRENT_TIMESTAMP` | Payment creation timestamp |
| `updated_at` | `TIMESTAMP` | No | - | `CURRENT_TIMESTAMP` | Payment update timestamp |

- **Foreign Keys**:
  - `fk_payments_job` ON `job_id` REFERENCES `jobs(id)` ON DELETE CASCADE.
  - `fk_payments_customer` ON `customer_id` REFERENCES `users(id)` ON DELETE CASCADE.
- **Indexes**:
  - `idx_payments_job_id` ON `job_id`
  - `idx_payments_customer_id` ON `customer_id`
  - `idx_payments_status` ON `status`
  - `idx_payments_txn_ref` ON `transaction_reference` (UNIQUE)

---

### Table 8: `ratings`
Customer ratings and reviews submitted after job completion.

| Column Name | PostgreSQL Type | Nullable | Key / Constraint | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | No | PK (IDENTITY) | Generated | Primary surrogate key |
| `job_id` | `BIGINT` | No | FK, UNIQUE | - | Foreign key to `jobs.id` |
| `customer_id` | `BIGINT` | No | FK | - | Foreign key to `users.id` |
| `worker_id` | `BIGINT` | No | FK | - | Foreign key to `users.id` |
| `score` | `INTEGER` | No | CHECK (`score BETWEEN 1 AND 5`) | - | Rating score (1 to 5 stars) |
| `review` | `VARCHAR(500)` | Yes | - | - | Optional textual review |
| `created_at` | `TIMESTAMP` | No | - | `CURRENT_TIMESTAMP` | Submission timestamp |
| `updated_at` | `TIMESTAMP` | No | - | `CURRENT_TIMESTAMP` | Update timestamp |

- **Foreign Keys**:
  - `fk_ratings_job` ON `job_id` REFERENCES `jobs(id)` ON DELETE CASCADE.
  - `fk_ratings_customer` ON `customer_id` REFERENCES `users(id)` ON DELETE CASCADE.
  - `fk_ratings_worker` ON `worker_id` REFERENCES `users(id)` ON DELETE CASCADE.
- **Unique Constraints**: `ratings_job_id_key` on `job_id`.
- **Indexes**: `idx_ratings_customer_id`, `idx_ratings_worker_id`.

---

### Table 9: `notifications`
Stores system alerts and workflow notifications sent to users.

| Column Name | PostgreSQL Type | Nullable | Key / Constraint | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | No | PK (IDENTITY) | Generated | Primary surrogate key |
| `recipient_id` | `BIGINT` | No | FK | - | Foreign key to `users.id` |
| `type` | `VARCHAR(255)` | No | CHECK (NotificationType) | - | Notification event type enum |
| `title` | `VARCHAR(255)` | No | - | - | Brief title |
| `message` | `VARCHAR(1000)`| No | - | - | Notification body message |
| `related_entity_type`| `VARCHAR(50)` | Yes | - | - | Associated entity name ("JOB", "PAYMENT") |
| `related_entity_id` | `BIGINT` | Yes | - | - | Associated entity primary key ID |
| `read` | `BOOLEAN` | No | - | `FALSE` | Read / unread status flag |
| `created_at` | `TIMESTAMP` | No | - | `CURRENT_TIMESTAMP` | Notification creation time |
| `read_at` | `TIMESTAMP` | Yes | - | - | Timestamp when user marked read |

- **Foreign Keys**: `fk_notifications_recipient` ON `recipient_id` REFERENCES `users(id)` ON DELETE CASCADE.
- **Indexes**: `idx_noti_recipient`, `idx_noti_read`, `idx_noti_created_at`.

---

### Table 10: `earnings`
Worker earnings ledger populated automatically when job payments succeed.

| Column Name | PostgreSQL Type | Nullable | Key / Constraint | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | No | PK (IDENTITY) | Generated | Primary surrogate key |
| `job_id` | `BIGINT` | No | FK, UNIQUE | - | Foreign key to `jobs.id` |
| `worker_id` | `BIGINT` | No | FK | - | Foreign key to `users.id` |
| `customer_id` | `BIGINT` | No | FK | - | Foreign key to `users.id` |
| `gross_amount` | `NUMERIC(12,2)`| No | CHECK (`>= 0`) | - | Total job amount |
| `platform_fee` | `NUMERIC(12,2)`| No | CHECK (`>= 0`) | - | Fee retained by platform |
| `worker_earning` | `NUMERIC(12,2)`| No | CHECK (`>= 0`) | - | Net amount credited to worker |
| `fee_percentage` | `NUMERIC(5,2)` | No | CHECK (`>= 0`) | - | Percentage fee applied |
| `status` | `VARCHAR(255)` | No | CHECK (`'PENDING'`, `'AVAILABLE'`) | - | Earning payout availability status |
| `created_at` | `TIMESTAMP` | No | - | `CURRENT_TIMESTAMP` | Ledger entry timestamp |
| `updated_at` | `TIMESTAMP` | No | - | `CURRENT_TIMESTAMP` | Last updated timestamp |
| `available_at` | `TIMESTAMP` | Yes | - | - | Timestamp when funds became available |

- **Foreign Keys**:
  - `fk_earnings_job` ON `job_id` REFERENCES `jobs(id)` ON DELETE CASCADE.
  - `fk_earnings_worker` ON `worker_id` REFERENCES `users(id)` ON DELETE CASCADE.
  - `fk_earnings_customer` ON `customer_id` REFERENCES `users(id)` ON DELETE CASCADE.
- **Unique Constraints**: `earnings_job_id_key` on `job_id`.
- **Indexes**: `idx_earnings_worker_id`, `idx_earnings_customer_id`.

---

### Table 11: `admin_activity`
Audit trail recording administrative actions across users, jobs, and platform features.

| Column Name | PostgreSQL Type | Nullable | Key / Constraint | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | No | PK (IDENTITY) | Generated | Primary surrogate key |
| `actor_user_id` | `BIGINT` | No | - | - | ID of admin user taking action |
| `actor_role` | `VARCHAR(255)` | No | CHECK (Role) | - | Role of actor (`ADMIN`, etc.) |
| `action_type` | `VARCHAR(255)` | No | - | - | Type of action (e.g. "DEACTIVATE_WORKER") |
| `entity_type` | `VARCHAR(255)` | No | - | - | Target entity (e.g. "USER") |
| `entity_id` | `BIGINT` | Yes | - | - | Target entity ID |
| `description` | `VARCHAR(1000)`| No | - | - | Human-readable log description |
| `created_at` | `TIMESTAMP` | No | - | `CURRENT_TIMESTAMP` | Action timestamp |

- **Foreign Keys**: None (stored raw `actor_user_id` for audit decoupling).
- **Indexes**: `idx_admin_activity_created_at`, `idx_admin_activity_actor_user_id`.

---

## 3. Workflow State Machine Audit

### Job Lifecycle State Machine
```
   [Service Request OPEN]
            │
            ▼ (Worker accepts request)
     [Job ACCEPTED]
            │
            ▼ (Worker starts job)
    [Job IN_PROGRESS]
            │
            ▼ (Worker requests completion)
 [Job PAYMENT_REQUIRED]
            │
            ▼ (Customer submits successful payment)
    [Job COMPLETED] ──► [Earning AVAILABLE] & [Rating Allowed]
```
- Alternative branch: Worker declines job -> `Job DECLINED`.
- Alternative branch: Customer cancels request -> `ServiceRequest CANCELLED`.

---

## 4. Index Justification Matrix

| Index Name | Table | Columns | Rationale / Workflow Impact |
| :--- | :--- | :--- | :--- |
| `idx_users_email` | `users` | `email` | Critical for fast login lookups in `AuthService` (`findByEmail`) |
| `idx_users_role` | `users` | `role` | Admin filtering and user classification queries |
| `idx_payments_job_id` | `payments` | `job_id` | Fast payment retrieval by job ID during payment gate validation |
| `idx_payments_customer_id` | `payments` | `customer_id` | Customer payment history dashboards |
| `idx_payments_status` | `payments` | `status` | Revenue analytics and pending payment filtering |
| `idx_payments_txn_ref` | `payments` | `transaction_reference` | Unique verification of gateway callbacks |
| `idx_noti_recipient` | `notifications` | `recipient_id` | User notification inbox fetching |
| `idx_noti_read` | `notifications` | `read` | Filtering unread notification counts |
| `idx_noti_created_at` | `notifications` | `created_at` | Sorting notification feed chronologically |
| `idx_admin_activity_created_at`| `admin_activity` | `created_at` | Sorting admin audit logs chronologically |
| `idx_admin_activity_actor_user_id`| `admin_activity` | `actor_user_id` | Auditing specific admin user actions |

---

## 5. Mappings & Assumptions

1. **Monetary Values**: Mapped to `NUMERIC(10,2)` for hourly rates/budgets and `NUMERIC(12,2)` for payment transaction amounts to eliminate float rounding errors.
2. **String Enums**: JPA specifies `@Enumerated(EnumType.STRING)` on all enums. In PostgreSQL, these are represented as `VARCHAR(255)` with explicit `CHECK` constraints to ensure performance and easy database portability.
3. **Surrogate Keys**: Hibernate `@GeneratedValue(strategy = GenerationType.IDENTITY)` maps directly to PostgreSQL `BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY`.
