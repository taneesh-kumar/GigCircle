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

### 4. Security & Access Boundary Verification
- **Unrelated Job Access**: Attempt to access a job chat or dispute ID belonging to another user. Verify API returns `403 FORBIDDEN`.
- **Non-Admin Access**: Attempt to navigate to `/admin/disputes` as Customer or Worker. Verify client redirects or returns `403 Access Denied`.
- **Closed Dispute Protection**: Verify participant response input is disabled on `RESOLVED` or `DISMISSED` disputes.
- **Session Refresh**: Refresh page (F5) during an active chat/dispute view. Verify authenticated session restores and data reloads cleanly.
