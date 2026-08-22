<div align="center">
  
# 🌊 Dayflow HRMS
**Every workday, perfectly aligned.**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![License](https://img.shields.io/badge/license-MIT-blue)](#)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma)](#)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?logo=nodedotjs)](#)

*Dayflow is a lightweight, transparent, locally-deployable HRMS core that digitizes the core loop of everyday HR work: who's in the office today, who's on leave, how attendance rolls into pay, and how salary is actually structured.*

</div>

---

## 📖 Overview

Most small and mid-sized organizations run HR operations on a patchwork of spreadsheets, WhatsApp groups, and paper registers. Dayflow removes this friction by digitizing core HR operations end-to-end: **onboarding, profile management, attendance tracking, leave management, and payroll visibility**.

**The One-Line Pitch:**
> *"Dayflow is the HRMS core that shows its work — live presence, transparent salary math, and real leave balances — running entirely offline on a single laptop."*

---

## ✨ Key Features & Unique Selling Points

*   🔐 **Credentials you don't type, you earn:** Auto-generated Login IDs (company code + initials + join year + serial) mirroring real enterprise HR systems.
*   🟢 **Presence as a first-class citizen:** Live status dots on the employee directory (Present, On Leave, Absent) — closer to a Slack status indicator than a spreadsheet.
*   🧮 **A salary engine, not a salary field:** Percentage-based, auto-recalculating, cascading components with hard caps against over-allocation.
*   ⚖️ **Balances that actually move:** Approving a leave request deducts real days from a real balance, offering a true before/after ledger.
*   💻 **Local-first Architecture:** Designed to run with zero external cloud dependencies. Perfect for high-privacy organizations or offline deployments.

---

## 🛠️ System Architecture & Tech Stack

Dayflow's stack was chosen specifically to satisfy the constraint of having **dynamic data** while being fully **local/offline capable**.

*   **Frontend:** React (Next.js / Vite), Tailwind CSS, Axios
*   **Backend:** Node.js, Express.js
*   **Database & ORM:** PostgreSQL / SQLite, Prisma ORM
*   **Security:** JWT (JSON Web Tokens), Bcrypt for password hashing, Zod for robust input validation.

---

## 🚀 Getting Started

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18+)
*   [Docker](https://www.docker.com/) (Optional: if running PostgreSQL locally)
*   Alternatively, a cloud PostgreSQL URI (e.g., Neon or Supabase)

### Backend Setup

1. **Clone the repository and navigate to the backend:**
   ```bash
   git clone https://github.com/praju455/odoo-hackathon---Dayflow.git
   cd odoo-hackathon---Dayflow/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Create a `.env` file in the `backend` directory and add your database URL and JWT secret:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/dayflow?schema=public"
   JWT_SECRET="your_super_secret_jwt_key"
   PORT=3000
   ```

4. **Database Migrations & Prisma Client:**
   Generate the Prisma client and push the schema to your database:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   *The backend will now be running on `http://localhost:3000`.*

---

## 📚 API Reference (Member 2 Module)

Dayflow's backend exposes modular RESTful APIs. Below is the documentation for the **Attendance**, **Leave**, and **Salary** engines.

### 🕒 Attendance Module

| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/attendance/checkin` | Employee | Clocks in the user. Sets status to `PRESENT`. |
| `POST` | `/api/attendance/checkout` | Employee | Clocks out. Auto-calculates `workHours` & `extraHours`. |
| `GET` | `/api/attendance/me` | Employee | Fetches the logged-in user's attendance records (supports `?month=YYYY-MM`). |
| `GET` | `/api/attendance/today` | Admin | Fetches today's attendance for the entire company (powers the live directory dots). |

### 🌴 Leave & Time-Off Module

> 💡 **Implementation Note for Onboarding:** When a new user is created, the system triggers `seedDefaultLeaveAllocations(userId)` to provision 24 PAID, 7 SICK, and 9999 UNPAID days.

| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/leave/allocations/me` | Employee | Retrieves available leave balances for the current year. |
| `POST` | `/api/leave` | Employee | Applies for leave. Auto-calculates requested days and validates against available balance. |
| `GET` | `/api/leave/requests` | Admin | Fetches all company-wide leave requests. |
| `PATCH` | `/api/leave/requests/:id` | Admin | Approves/Rejects leave. **Approvals automatically deduct from the real allocation balance via DB transactions.** |

**Leave Application Payload Example:**
```json
{
  "leaveType": "SICK",
  "startDate": "2026-08-25",
  "endDate": "2026-08-26",
  "reason": "Flu",
  "attachmentUrl": "https://example.com/certificate.pdf" // Soft-required for SICK leave
}
```

### 💰 Salary Engine

| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/salary/:userId` | Admin | Configures base wage, tax deductions, and cascading flexible components (earnings). |
| `GET` | `/api/salary/:userId` | Both | Returns the base structure alongside a **dynamically calculated payslip breakdown** (Gross, Deductions, Net). |

**Salary Structure Definition Payload:**
```json
{
  "wageType": "MONTHLY",
  "fixedWage": 50000,
  "pfEmployeePercent": 12,
  "pfEmployerPercent": 12,
  "professionalTax": 200,
  "components": [
    {
      "name": "House Rent Allowance",
      "compType": "PERCENT_OF_BASIC",
      "value": 40
    },
    {
      "name": "Travel Allowance",
      "compType": "FIXED",
      "value": 2000
    }
  ]
}
```

---

## 🛡️ Validation & Constraints (Must-Haves Achieved)

As per the hackathon constraints, Dayflow ensures:
*   **Zero Static JSON:** All data flows through a live relational database using Prisma ORM.
*   **Robust Input Validation:** Handled globally using **Zod** schema parsing, ensuring bad data never touches the database.
*   **Transactional Integrity:** Leave approvals and salary recalculations use Prisma `$transaction` blocks to prevent race conditions and guarantee mathematical accuracy.

---

## 👥 Team Split & Execution

Dayflow was built in an 8-hour sprint divided across 4 members:
*   **Member 1 (Backend):** Auth, Admin setup, Login ID generator, Employee CRUD, Profile APIs.
*   **Member 2 (Backend):** Attendance core, Leave allocation/approval engine, Salary calculation math & PF/tax.
*   **Member 3 (Frontend):** Login flows, Profile views, Check-in/out widgets, Personal Time-Off screens.
*   **Member 4 (Frontend):** Live Directory grid, Add Employee workflows, Admin approval interfaces, Final integration.

---
<div align="center">
  <i>Prepared for the 8-Hour Hackathon Build</i>
</div>
