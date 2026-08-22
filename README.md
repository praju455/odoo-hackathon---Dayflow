<div align="center">
  
# 🌊 Dayflow HRMS
**Every workday, perfectly aligned.**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![License](https://img.shields.io/badge/license-MIT-blue)](#)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js%20%7C%20React-000000?logo=nextdotjs)](#)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?logo=nodedotjs)](#)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20Prisma-336791?logo=postgresql)](#)

*Dayflow is a lightweight, transparent, locally-deployable HRMS core that digitizes the core loop of everyday HR work: who's in the office today, who's on leave, how attendance rolls into pay, and how salary is actually structured.*

</div>

---

## 📖 The Problem We're Solving

Most small and mid-sized organizations run HR operations on a patchwork of spreadsheets, WhatsApp groups, and paper registers. This creates three concrete failure modes:
1. **No single source of truth:** Attendance, leave balances, and salary structure live in three different places.
2. **No self-service:** Employees have to constantly ask HR for their own leave balances or attendance records.
3. **No auditability:** Approvals happen informally with no record of who approved what leave or why a salary component changed.

**Dayflow** removes this friction by digitizing core HR operations end-to-end: **onboarding, profile management, attendance tracking, leave management, and payroll visibility**.

---

## ✨ Novelty & Unique Selling Points

*   🔐 **Credentials you don't type, you earn:** Auto-generated Login IDs (company code + initials + join year + serial) mirroring real enterprise HR systems.
*   🟢 **Presence as a first-class citizen:** Live status dots on the employee directory (Present, On Leave, Absent) — closer to a Slack status indicator than a static spreadsheet.
*   🧮 **A salary engine, not a salary field:** Percentage-based, auto-recalculating, cascading components with hard caps against over-allocation.
*   ⚖️ **Balances that actually move:** Approving a leave request deducts real days from a real balance, offering a true before/after ledger.
*   💻 **Local-first Architecture:** Designed to run with zero external cloud dependencies if needed. The stack is heavily data-driven, storing state in a relational database rather than mocking with static JSON.

---

## 🏗️ System Architecture & Tech Stack

Dayflow is built on a modern, robust tech stack emphasizing data integrity and offline capabilities. 

### Technology Stack
*   **Frontend:** Next.js (React), Tailwind CSS, Axios
*   **Backend:** Node.js, Express.js
*   **Database & ORM:** PostgreSQL, Prisma ORM
*   **Security:** JWT (JSON Web Tokens), Bcrypt for password hashing, Zod for robust input validation.

### Architecture Diagram

```mermaid
graph TD
    User([End User / Admin]) -->|Interacts with UI| UI[Next.js Frontend]
    
    subgraph Dayflow System Architecture
        UI -->|REST API Requests| API[Express.js Backend API]
        
        API -->|Validates Input| Zod[Zod Validation Layer]
        API -->|Authenticates| Auth[JWT & Bcrypt Security]
        
        Zod --> Core[Core Business Logic Engines]
        Auth --> Core
        
        Core -->|Computes| Salary[Salary & Tax Calculation Engine]
        Core -->|Updates| Leave[Leave & Attendance Ledger]
        
        Core -->|Queries & Mutates| Prisma[Prisma ORM]
    end
    
    Prisma -->|Reads / Writes| DB[(PostgreSQL Database)]
```

---

## 🚀 Getting Started

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18+)
*   [Docker](https://www.docker.com/) (if running PostgreSQL locally via docker-compose)
*   Git

### 1. Backend Setup

Open your first terminal window:

```bash
# Clone the repository
git clone https://github.com/praju455/odoo-hackathon---Dayflow.git
cd odoo-hackathon---Dayflow

# Start the PostgreSQL Database using Docker
docker-compose up -d

# Navigate to backend and install dependencies
cd backend
npm install

# Setup environment variables
cp .env.example .env
# Edit .env to match: DATABASE_URL="postgresql://dayflow:dayflow@localhost:5432/dayflow?schema=public"

# Run database migrations
npm run db:generate
npm run db:migrate

# Start the Backend Server
npm run dev
```
*The backend API will run on `http://localhost:3000`.*

### 2. Frontend Setup

Open your second terminal window:

```bash
# Navigate to the frontend directory
cd frontend
npm install

# Start the Next.js Frontend Server
npm run dev
```
*The web app will run on `http://localhost:3001` (or whatever port Next.js assigns).*

---

## 🛡️ Hackathon Constraints Achieved

*   ✅ **Real/Dynamic Data Sources:** No static JSON mocking. All features read/write to the Prisma relational database.
*   ✅ **Robust Validation:** Implemented using Zod on the backend, ensuring guaranteed data integrity.
*   ✅ **Responsive & Clean UI:** Hand-crafted using Tailwind CSS for a seamless user experience.
*   ✅ **Proper Git Usage:** Cleanly merged and tracked version history showcasing full stack development across both frontend and backend modules.

<div align="center">
  <i>Prepared for the 8-Hour Hackathon Submission</i>
</div>
