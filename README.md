<div align="center">

# Dayflow

**A multi-tenant HR workspace for employee onboarding, attendance, leave, profiles, and salary structures.**

![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)

</div>

## Overview

Dayflow provides one connected workspace for company setup, employee onboarding, personal profiles, daily attendance, leave approvals, annual allocations, and configurable salary calculations. The API enforces company isolation and role-based authorization, while the Next.js client provides separate employee and administrator workflows.

## Capabilities

- One-time company setup with the first administrator account
- Generated employee login IDs and one-time temporary credentials
- Mandatory password change for newly created employees
- Employee directory and read-only coworker profiles
- Check-in, check-out, monthly attendance, and admin day view
- Paid, sick, and unpaid leave requests with transactional approval deductions
- Current-year leave allocation reporting
- Monthly or yearly salary structures with fixed, percent-of-wage, and percent-of-Basic components
- Employee and employer PF, professional tax, gross, deductions, and net salary calculations
- Seeded demo organization with employees, attendance, leave, and salary data

## Architecture

```mermaid
flowchart LR
    Browser[Next.js 14 client] -->|REST + JWT| API[Express API]
    API --> Guard[JWT authentication and role guards]
    Guard --> Validation[Zod request validation]
    Validation --> Services[Attendance, leave, salary, and profile logic]
    Services --> Prisma[Prisma ORM]
    Prisma --> DB[(PostgreSQL 16)]

    Services --> Transactions[Atomic leave and salary writes]
    Transactions --> Prisma
```

```text
Dayflow/
├── backend/                 Express, Prisma, migrations, seed, tests
├── frontend/                Next.js App Router and Tailwind CSS
├── docker-compose.yml       Local PostgreSQL service
└── README.md
```

## Technology

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, Axios |
| Backend | Node.js, Express 5, Zod, JSON Web Tokens, bcryptjs |
| Data | PostgreSQL 16, Prisma 6, versioned SQL migrations |
| Testing | Node test runner, Next.js production build, Prisma validation |

## Local Setup

### Prerequisites

- Node.js 20 or newer
- npm
- Docker Desktop or a local PostgreSQL 16 instance

### 1. Start PostgreSQL

```bash
docker compose up -d
```

The default development database is exposed at `localhost:5432` with database, user, and password all set to `dayflow`.

### 2. Start the API

```bash
cd backend
npm install
cp .env.example .env
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

The API runs at [http://localhost:4000](http://localhost:4000). Replace `JWT_SECRET` in `backend/.env` before using Dayflow outside local development.

### 3. Start the web client

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo account

After running the seed script:

```text
Login ID: admin@dayflow.local
Password: Dayflow123!
```

The seed is idempotent and can be rerun without duplicating the demo company.

## Environment Variables

### Backend

| Variable | Purpose | Development value |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://dayflow:dayflow@localhost:5432/dayflow` |
| `JWT_SECRET` | JWT signing secret | Change the example value |
| `PORT` | API port | `4000` |
| `FRONTEND_ORIGIN` | Allowed browser origin | `http://localhost:3000` |

### Frontend

| Variable | Purpose | Development value |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Browser-visible API base URL | `http://localhost:4000/api` |

## Roles And Privacy

| Capability | Employee | Admin |
|---|:---:|:---:|
| View directory and public profiles | Yes | Yes |
| Edit own profile and private information | Yes | Yes |
| Check in/out and view own attendance | Yes | Yes |
| Request leave and view own balances | Yes | Yes |
| Create employees | No | Yes |
| View company attendance and leave status | No | Yes |
| Approve or reject leave | No | Yes |
| View and edit salary structures | No | Yes |

Detailed coworker attendance, leave, salary, and private profile data remain administrator-only. The directory intentionally omits live HR status for regular employee accounts.

## API Summary

All protected routes require `Authorization: Bearer <token>`.

| Area | Routes |
|---|---|
| Setup and auth | `POST /api/setup`, `POST /api/auth/login`, `PUT /api/auth/change-password` |
| Users | `GET/PUT /api/users/me` |
| Employees | `GET/POST /api/employees`, `GET/PUT /api/employees/:id` |
| Attendance | `POST /api/attendance/checkin`, `POST /api/attendance/checkout`, `GET /api/attendance/me`, `GET /api/attendance/day` |
| Leave | `GET /api/leave/allocations/me`, `GET /api/leave/allocations/:userId`, `POST /api/leave`, `GET /api/leave/me`, `GET /api/leave`, `PUT /api/leave/:id/status` |
| Salary | `GET /api/salary/me`, `GET/PUT /api/salary/:userId` |

API errors use a consistent JSON shape:

```json
{ "error": "Human-readable message" }
```

## Salary Contract

Every salary structure requires a unique component named `Basic`. Percent-of-Basic components are calculated from that resolved Basic amount, and the total of all earning components cannot exceed the fixed wage.

```json
{
  "wageType": "MONTHLY",
  "fixedWage": 50000,
  "pfEmployeePercent": 12,
  "pfEmployerPercent": 12,
  "professionalTax": 200,
  "components": [
    { "name": "Basic", "compType": "PERCENT_OF_WAGE", "value": 50 },
    { "name": "HRA", "compType": "PERCENT_OF_BASIC", "value": 40 }
  ]
}
```

## Verification

```bash
cd backend
npm test
npx prisma validate
npx prisma migrate status

cd ../frontend
npm run build
```

The backend tests cover login-ID generation and salary calculation invariants. The production frontend build performs TypeScript and ESLint checks across every route.

## Deployment Notes

- Use a strong, externally managed `JWT_SECRET`.
- Run `npm run db:deploy` during backend deployment, not `prisma migrate dev`.
- Restrict `FRONTEND_ORIGIN` to the deployed web origin.
- Terminate TLS at a reverse proxy or managed platform.
- Back up PostgreSQL and test restore procedures before production use.
- Do not use the seeded credentials outside local development.
