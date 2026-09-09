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

### 7. Security & Access Boundary Verification
- **Unrelated Job Access**: Attempt to access a job chat, dispute, or invoice belonging to another user. Verify API returns `403 FORBIDDEN`.
- **Non-Admin Access**: Attempt to navigate to `/admin/disputes` or call `/api/admin/overview` as Customer or Worker. Verify client redirects or returns `403 Access Denied`.
- **Closed Dispute Protection**: Verify participant response input is disabled on `RESOLVED` or `DISMISSED` disputes.
- **Session Refresh**: Refresh page (F5) during an active chat/dispute/invoice view. Verify authenticated session restores and data reloads cleanly.

