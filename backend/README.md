# Dayflow Backend

## Setup

From the project root:

```sh
docker compose up -d
```

From `backend/`:

```sh
npm install
npx prisma db push
node src/seed.js
npm start
```

Create `backend/.env` from `backend/.env.example`.

> **Note:** The project uses Supabase (PostgreSQL). Use `prisma db push` instead of `prisma migrate dev` since the migration history references SQLite enums not available in PostgreSQL.

## Test Accounts (from Database Seed)

You can log in to the frontend using either the **Email** or **Login ID** and the universal password `Dayflow123!`.

**Admin Account**
- **Email:** `admin@dayflow.local`
- **Login ID:** `SFAVMO20260001`
- **Role:** Admin (Access to all overviews, company projects, and employee management)

**Employee Accounts (Examples)**
- **Email:** `mason@shiftly.local` (Login ID: `SFMAAL20260004`) — Engineering
- **Email:** `amara@shiftly.local` (Login ID: `SFAMDI20260021`) — Sales
- **Email:** `ethan@dayflow.local` (Login ID: `SFETWI20260016`) — Finance

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (Supabase) |
| `JWT_SECRET` | ✅ | Secret used to sign JWTs |
| `GEMINI_API_KEY` | Optional | Google Gemini API key for AI assistant |
| `GROQ_API_KEY` | Optional | Groq API key (fallback AI provider) |
| `PORT` | Optional | Server port (default: `4000`) |
| `FRONTEND_ORIGIN` | Optional | Comma-separated allowed CORS origins |

## Database Schema

The backend uses PostgreSQL via Supabase. Models are defined in `prisma/schema.prisma`.

### Models

#### Company
| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `name` | String | Company name |
| `code` | String | Unique short code |
| `logoUrl` | String? | Optional logo URL |

#### User
| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `companyId` | String | FK → Company |
| `loginId` | String | Unique, auto-generated |
| `name` | String | Full name |
| `email` | String | Unique |
| `role` | String | `EMPLOYEE` or `ADMIN` |
| `department` | String? | Department name |
| `jobTitle` | String? | Job title |
| `managerId` | String? | FK → User (self-reference) |
| `joiningDate` | DateTime | Date of joining |
| `passwordHash` | String | bcrypt hash |
| `mustChangePassword` | Boolean | Force password change on first login |
| `phone` | String? | Phone number |
| `dateOfBirth` | DateTime? | |
| `gender` | String? | |
| `maritalStatus` | String? | |
| `personalEmail` | String? | |
| `panCode` | String? | PAN card number |
| `uanCode` | String? | UAN number |
| `accountNumber` | String? | Bank account |
| `homeAddress` | String? | |
| `profilePictureUrl` | String? | |
| `about` | String? | Bio |
| `skills` | String | Comma-separated (default: `""`) |
| `certifications` | String | Comma-separated (default: `""`) |
| `interests` | String | Comma-separated (default: `""`) |

#### Attendance
| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `userId` | String | FK → User |
| `date` | DateTime | Calendar date |
| `checkIn` | DateTime? | Check-in timestamp |
| `checkOut` | DateTime? | Check-out timestamp |
| `workHours` | Float? | Hours worked |
| `extraHours` | Float? | Hours beyond 8h |
| `status` | String | `PRESENT`, `ABSENT`, `HALF_DAY`, `LEAVE` |

Unique constraint: `(userId, date)` — one record per employee per day.

#### LeaveAllocation
| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `userId` | String | FK → User |
| `leaveType` | String | `PAID`, `SICK`, `UNPAID` |
| `totalDays` | Int | Annual entitlement |
| `usedDays` | Int | Used so far |
| `year` | Int | Calendar year |

Unique constraint: `(userId, leaveType, year)`.

#### LeaveRequest
| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `userId` | String | FK → User |
| `leaveType` | String | `PAID`, `SICK`, `UNPAID` |
| `startDate` | DateTime | |
| `endDate` | DateTime | |
| `allocationDays` | Int | Days requested (computed) |
| `reason` | String? | Employee notes |
| `attachmentUrl` | String? | Certificate path |
| `status` | String | `PENDING`, `APPROVED`, `REJECTED` |
| `adminComment` | String? | Admin response |

#### SalaryStructure
| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `userId` | String | Unique FK → User |
| `wageType` | String | `MONTHLY` or `YEARLY` |
| `fixedWage` | Float | Gross wage |
| `pfEmployeePercent` | Float | PF deduction % (default: 12) |
| `pfEmployerPercent` | Float | PF contribution % (default: 12) |
| `professionalTax` | Float | Monthly PT deduction (default: 200) |

#### SalaryComponent
| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `salaryStructureId` | String | FK → SalaryStructure |
| `name` | String | e.g. `Basic`, `HRA` |
| `compType` | String | `FIXED`, `PERCENT_OF_WAGE`, `PERCENT_OF_BASIC` |
| `value` | Float | Raw amount or percentage |
| `calculatedAmount` | Float | Computed on save |

#### Notification
| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `userId` | String | FK → User |
| `message` | String | Notification text |
| `read` | Boolean | Default: false |

#### Project *(added)*
| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `companyId` | String | FK → Company |
| `name` | String | Project name |
| `description` | String? | |
| `department` | String? | |
| `status` | String | `ACTIVE`, `COMPLETED`, `IN_REVIEW` |
| `progress` | Int | 0–100 |
| `dueDate` | DateTime? | |

#### ProjectAssignment *(added)*
| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `projectId` | String | FK → Project |
| `userId` | String | FK → User |

Unique constraint: `(projectId, userId)`.

#### Message *(added — Direct Messages)*
| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `senderId` | String | FK → User |
| `receiverId` | String | FK → User |
| `content` | String | Message text |
| `createdAt` | DateTime | |

#### ChannelMessage *(added — Team Channels)*
| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `companyId` | String | FK → Company |
| `channel` | String | `general`, `engineering`, `announcements`, `design-reviews` |
| `userId` | String | FK → User |
| `content` | String | Message text |
| `createdAt` | DateTime | |

---

## Error Shape

```json
{ "error": "message" }
```

---

## Routes

### `GET /api/health`
Returns `{ "status": "ok" }`.

---

### `POST /api/setup`
One-time company + first admin setup.

```json
{
  "companyName": "Orbit Corp",
  "companyCode": "OC",
  "adminName": "Alice Admin",
  "email": "alice.admin@orbit.test",
  "phone": "9876543210",
  "password": "Password123"
}
```

---

### `POST /api/auth/login`
Login with Login ID or email.

```json
{ "identifier": "OCBOCA20250001", "password": "Password123" }
```

Returns `{ token, mustChangePassword, user }`.

### `PUT /api/auth/change-password`
Auth required. Body: `{ currentPassword, newPassword }`.

---

### `GET /api/employees` · `POST /api/employees`
- GET: All authenticated users — returns directory cards.
- POST: Admin only — creates employee, auto-generates loginId and temp password.

### `GET /api/employees/:id` · `PUT /api/employees/:id`
- GET: Authenticated — returns full profile (no salary/password).
- PUT: Admin only — updates work fields.

---

### `GET /api/users/me` · `PUT /api/users/me`
- GET: Returns own full profile.
- PUT: Employees update their own personal info (phone, DOB, address, skills, etc.). Protected fields (role, department, email, salary) are rejected.

---

### `GET /api/attendance/day` · `POST /api/attendance/checkin` · `POST /api/attendance/checkout`
- GET: Admin — list all attendance for a date. Employee — own records.
- POST: Employee check-in / check-out.

### `GET /api/analytics/summary`
Admin only. Returns company-wide attendance totals, headcount, recent hires, leave requests.

### `GET /api/analytics/me`
Employee. Returns own attendance totals and history.

---

### `GET /api/leave/me` · `POST /api/leave/request`
Employee leave — own requests and allocations.

### `GET /api/leave/requests` · `PUT /api/leave/requests/:id`
Admin — all leave requests; approve/reject with comment.

---

### `GET /api/salary/:userId` · `PUT /api/salary/:userId`
Admin only. Get or upsert salary structure + components.

---

### `GET /api/projects` *(new)*
- Admin: All company projects with assignee details.
- Employee: Only projects they are assigned to.

### `POST /api/projects` *(new — Admin only)*
Create a project. Body: `{ name, description?, department?, status?, progress?, dueDate?, memberIds? }`.

### `PUT /api/projects/:id` *(new — Admin only)*
Update project fields.

### `DELETE /api/projects/:id` *(new — Admin only)*
Delete project and all assignments.

### `POST /api/projects/:id/assign` *(new — Admin only)*
Replace member list. Body: `{ memberIds: string[] }`.

---

### `GET /api/messages/conversations` *(new)*
List DM conversation partners for the current user with last message preview.

### `GET /api/messages/dm/:userId` · `POST /api/messages/dm/:userId` *(new)*
- GET: Full DM thread with a user.
- POST: Send a DM. Body: `{ content: string }`.

### `GET /api/messages/people` *(new)*
All company employees (excluding self) — for starting new DMs.

### `GET /api/messages/channels` *(new)*
List available channels with last message preview.

### `GET /api/messages/channels/:channel` · `POST /api/messages/channels/:channel` *(new)*
- GET: Up to 100 recent messages in a channel.
- POST: Post a message. Body: `{ content: string }`. Channels: `general`, `announcements`, `engineering`, `design-reviews`.

---

### `POST /api/chat` *(AI assistant)*
Auth required. Body: `{ message: string, history?: { role: "user"|"model", text: string }[] }`.
Tries Gemini first, falls back to Groq. Returns `{ success, reply, provider }`.
Requires valid `GEMINI_API_KEY` or `GROQ_API_KEY` in `.env`.

---

### `GET /api/notifications` · `PATCH /api/notifications/:id/read`
In-app notifications for the current user.

---

## Login ID Format

```
[company code][first 2 first-name letters][first 2 last-name letters][joining year][4-digit serial]
```

Example: `OCBOCA20250001`
