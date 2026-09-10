# GigCircle V1 Manual End-to-End Testing & Verification Guide

This document outlines the step-by-step manual test plan for validating the Customer–Worker Chat and Dispute Management workflows across the three platform roles: **Customer**, **Worker**, and **Admin**.

---

## 👥 Test Accounts Setup

Ensure test accounts exist in the database (or register via `/register`):

| Role | Email | Password | Role Description |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@gigcircle.com` | `password123` | Registered household customer |
| **Worker** | `worker@gigcircle.com` | `password123` | Verified skilled worker |
| **Admin** | `admin@gigcircle.com` | `password123` | Cooperative platform admin steward |

---

## 🧪 Test Scenarios & Acceptance Checklist

### 1. Customer Workflow: Job Chat & Dispute Submission
1. Log in as **Customer** (`customer@gigcircle.com`).
2. Navigate to **Customer Dashboard** -> Locate an assigned Job (status `ACCEPTED` or `IN_PROGRESS`).
3. Click **"Open Job Chat"**:
   - Verify chat panel loads conversation messages.
   - Enter message `"Please confirm expected arrival time"` and click **Send**.
   - Verify message appears on the right with Customer label and timestamp.
4. Click **"Dispute / Help"**:
   - Select reason `QUALITY_ISSUE`.
   - Enter description `"Work quality did not meet agreed standards"`.
   - Click **Submit Dispute**.
   - Verify dispute panel loads showing status badge **`Open`**.
5. Attempt Duplicate Dispute:
   - Attempt to raise another dispute for the same job.
   - Verify error banner appears: *"An active dispute already exists for this job."*

---

### 2. Worker Workflow: Job Chat & Dispute Response
1. Log in as **Worker** (`worker@gigcircle.com`).
2. Navigate to **Worker Dashboard** -> Open the same assigned Job.
3. Click **"Open Job Chat"**:
   - Verify Customer's message is visible.
   - Send reply: `"En route, arriving in 10 minutes"`.
   - Verify unread message indicator updates.
4. Click **"Dispute / Help"**:
   - Verify Customer's dispute details and timeline are visible.
   - Enter response: `"Work completed per specifications, replacement parts installed"`.
   - Click **Submit Response**.
   - Verify response entry appears in the **Dispute History Timeline**.

---

### 3. Admin Workflow: Dispute Governance & Resolution
1. Log in as **Admin** (`admin@gigcircle.com`).
2. Navigate to **Admin Disputes** (`/admin/disputes`):
   - Filter disputes by status `OPEN`.
   - Locate the dispute submitted above and click **"View & Manage"**.
3. Move to Under Review:
   - Click **"Move to Under Review"**.
   - Verify status badge updates to **`Under Review`**.
4. Resolve Dispute:
   - Click **"Resolve Dispute"**.
   - Enter resolution note: *"Reviewed job details. Partial refund approved."*
   - Click **Confirm RESOLVE**.
   - Verify status updates to **`Resolved`**, `resolvedAt` timestamp is recorded, and `AdminActivity` log entry is generated.

---

### 4. Invoice Generation & Transaction Records
1. Log in as **Customer** (`customer@gigcircle.com`).
2. Open job details for a completed or payment-required job.
3. Click **"View Service Invoice"**:
   - Verify modal opens showing unique invoice number (e.g. `GC-2026-000001`).
   - Verify itemized breakdown: Service Charge, Platform Fee (10%), Taxes (0%), Total Amount.
   - Verify payment status badge accurately reflects payment status (`PENDING` or `PAID`).
   - Verify payment reference is populated when paid.
4. Log in as **Worker** (`worker@gigcircle.com`):
   - Access the same job details and click **"View Service Invoice"**.
   - Verify worker views the exact same idempotent invoice record.
5. Log in as **Admin** (`admin@gigcircle.com`):
   - Query `/api/invoices/admin` or view invoice by job ID.
   - Verify full platform invoice governance access.

### 5. Account Status Management & Admin User Controls
1. Log in as **Admin** (`admin@gigcircle.com`).
2. Navigate to **User Directory** tab (`/dashboard?tab=users`).
3. Search for customer account `customer1@test.com`.
4. Click **Deactivate**:
   - Prompt requests a non-blank deactivation reason: Enter `"TOS violation"`.
   - Verify user status badge changes to **`DEACTIVATED`**.
   - Attempt login as `customer1@test.com`: Verify API rejects login with `403 FORBIDDEN` ("Account has been deactivated by administration.").
5. Search for worker account `worker1@test.com`.
6. Click **Suspend**:
   - Prompt requests reason: Enter `"Investigation pending"`.
   - Verify worker status badge changes to **`SUSPENDED`**.
   - Attempt login as `worker1@test.com`: Verify API rejects login with `403 FORBIDDEN` ("Account has been suspended by administration.").
   - Verify worker is automatically excluded from worker job matching feed.
7. Reactivate Users:
   - Click **Reactivate** for both accounts.
   - Verify both users return to **`ACTIVE`** status and can log in normally.
8. Admin Self-Deactivation Protection:
   - Verify action buttons are disabled for the currently logged-in Admin account.

---

### 6. Phase 2: Full Admin Dashboard KPIs, Analytics, and Operational Alerts
1. Log in as **Admin** (`admin@gigcircle.com`).
2. Navigate to **Admin Dashboard Overview** (`/dashboard?tab=overview`):
   - Verify KPI cards display backend-calculated metrics: Total Users, Active Users, Suspended Users, Deactivated Users, Active Jobs, Completion Rate %, Cancellation Rate %, Platform Gross Volume, and Platform Fees.
   - Verify rates display exactly 2 decimal places and return `0.00%` when denominators are zero.
3. Verify **Service Demand by Category**:
   - Check category demand breakdown cards.
   - Verify categories display request count, completed count, and percentage of total demand sorted descending.
4. Verify **Active Jobs Filtering**:
   - Navigate to **Job Executions** tab (`/dashboard?tab=jobs`).
   - Filter by status `ACTIVE`: Verify only jobs in status `ACCEPTED`, `IN_PROGRESS`, or `PAYMENT_REQUIRED` are displayed.
   - Filter by status `COMPLETED`: Verify completed jobs are listed.
   - Enter invalid query status (e.g. `INVALID`): Verify backend returns `400 BAD REQUEST`.
5. Verify **Operational Alerts**:
   - Create test conditions (e.g. an unassigned OPEN service request or pending worker verification).
   - Check **Operational System Alerts** section on overview dashboard.
   - Verify alert cards display severity badges (`INFO`, `WARNING`, `CRITICAL`), title, description, and entity ID.
   - Resolve the underlying condition and verify the alert disappears on refresh.

---

### 8. Phase 3: Advanced Admin User Management and Unified Dashboard UX
1. Log in as **Admin** (`admin@gigcircle.com`).
2. **User Search and Dynamic Filtering**:
   - Navigate to **User Directory** tab (`/dashboard?tab=users`).
   - Enter name search (e.g., `"John"`) or email search (e.g., `"customer1@test.com"`): Verify list filters dynamically at database level.
   - Filter by Role (`CUSTOMER`, `WORKER`, `ADMIN`): Verify table filters accordingly.
   - Filter by Account Status (`ACTIVE`, `SUSPENDED`, `DEACTIVATED`): Verify table filters accordingly.
   - Click **Clear Filters**: Verify filters reset and list reloads.
3. **Database Pagination**:
   - Verify pagination bar displays current page index, total page count, and total result count.
   - Click **Next** and **Previous** buttons: Verify user list pages smoothly.
4. **User Detail Inspection Modal**:
   - Click **View Details** on any Customer account:
     - Verify basic profile info (Name, Email, Phone, Created Date, Role, Account Status).
     - Verify Customer service request metrics (Created, Open, Completed, Cancelled).
     - Verify Customer financial summary and ratings submitted.
     - Verify sensitive fields (password hash, JWT tokens) are **never** present.
   - Click **View Details** on any Worker account:
     - Verify Worker profile details (Bio, Skills, Categories, Experience, Hourly Rate, Availability).
     - Verify Worker verification status, submission/review timestamps.
     - Verify Worker job execution metrics (Assigned, Completed, Active) and Earnings summary (Gross, Net, Platform Fees).
     - Verify audit history log of recent admin actions affecting this worker.
   - Click **View Details** on another Admin account:
     - Verify admin profile details display cleanly without exposing security credentials.
5. **Enhanced Account Status Management & Dialog Confirmations**:
   - Select an active user and click **Suspend** or **Deactivate**:
     - Verify action opens a modal confirmation dialog displaying target user name and current status.
     - Attempt submit with blank reason: Verify submit button is disabled.
     - Enter non-blank reason (e.g., `"Suspicious account activity"`) and click Confirm:
       - Verify loading indicator while request is processing.
       - Verify success feedback toast and user list reloads.
       - Verify AdminActivity audit log records acting admin ID, target user ID, action, reason, and timestamp.
   - Select a suspended/deactivated user and click **Reactivate**:
     - Verify user returns to `ACTIVE` status and audit log entry is saved.
   - Self-Action and Final Admin Protections:
     - Verify suspend/deactivate actions are hidden for logged-in admin user.
     - Deactivate all other admin accounts, then attempt to deactivate the final active admin via direct API: Verify API rejects with error protection.
6. **Non-Admin Security Verification**:
   - Attempt to call `GET /api/admin/users/{userId}` or `GET /api/admin/users` as Customer or Worker: Verify server returns `403 FORBIDDEN`.
   - Attempt unauthenticated request: Verify server returns `401 UNAUTHORIZED`.

---

### 9. Phase 4: Financial Audit and Operational Management
1. Log in as **Admin** (`admin@gigcircle.com`).
2. Navigate to **Financial Audit** tab (`/dashboard?tab=financial`):
   - Verify summary metric cards display: Gross Transaction Volume, Cooperative Platform Fees (10%), Worker Payouts (90%), and Transaction Stats breakdown (`SUCCESS`, `REFUNDED`, `FAILED`, Total).
   - Enter Date Range filters (`fromDate` and `toDate`): Click **Search** and verify metric cards and transaction list recalculate over specified range.
3. **Transaction Audit Ledger & Filters**:
   - Filter by Payment Status (`SUCCESS`, `REFUNDED`, `FAILED`): Verify ledger filters accordingly.
   - Search by transaction reference, customer name, or worker name: Verify table filters dynamically.
   - Click **Clear Filters**: Verify filters reset and list reloads.
   - Verify pagination controls work smoothly for financial transactions.
4. **Deep Financial Inspection Modal**:
   - Click **View Audit** on any transaction:
     - Verify transaction metadata (reference, payment method, status, currency, timestamp, paid/refunded timestamps).
     - Verify financial breakdown (gross service amount, platform fee, net worker earning, refund amount).
     - Verify customer & worker identity strips with quick contact details.
     - Verify job contract info, linked invoice details, dispute status, and activity audit timeline.
5. **Job Executions Operational Filters**:
   - Navigate to **Job Executions** tab (`/dashboard?tab=jobs`).
   - Select `UNASSIGNED REQS`: Verify unassigned service requests are retrieved.
   - Select `DISPUTED`: Verify jobs with active disputes are filtered.
   - Select `OVERDUE`: Verify stalled/overdue job executions are listed.
6. **Activity Audit Trail Filter Bar**:
   - Navigate to **Audit Activity** tab (`/dashboard?tab=activity`).
   - Filter by action type (`USER_SUSPENDED`, `DISPUTE_CREATED`, etc.), search text, or date range.
   - Verify audit trail logs update accordingly with page navigation controls.

---

### 10. Phase 5: Dispute Resolution, Worker Verification, and Admin Governance
1. Log in as **Admin** (`admin@gigcircle.com`).
2. **Platform Governance Overview KPIs**:
   - Navigate to **Admin Overview** (`/dashboard?tab=overview`).
   - Check the **Governance & Verification** summary strip.
   - Verify KPI cards display counts for **Pending Verifications**, **Unresolved Disputes**, and **Recently Resolved Disputes (30d)**.
3. **Paginated Worker Verifications (`/api/admin/verifications`)**:
   - Navigate to **Worker Verification** tab (`/dashboard?tab=verifications`).
   - Test text search (e.g. search worker name or email) and status filter (`PENDING`, `VERIFIED`, `REJECTED`).
   - Verify list paginates cleanly via backend `PageResponse`.
   - Click **Approve Verification**: Verify status changes to `VERIFIED` and worker account verification timestamp is set.
   - Click **Reject Verification**: Verify modal requires a non-blank rejection reason, updates status to `REJECTED`, and saves audit log entry.
4. **Paginated Administrative Disputes (`/api/admin/disputes`)**:
   - Navigate to **Dispute Resolution** tab (`/dashboard?tab=disputes`).
   - Test status filter (`OPEN`, `UNDER_REVIEW`, `INFO_REQUESTED`, `RESOLVED`, `DISMISSED`) and search parameter.
   - Verify page navigation controls work smoothly.
   - Test dispute status transitions (**Move under review**, **Request info**, **Resolve with mandatory notes**, **Dismiss with mandatory notes**).
   - Verify all actions log to `AdminActivity` and reject unauthorized non-admin attempts with `403 FORBIDDEN`.



