# Dayflow HRMS - Member 2 Backend Documentation

This document outlines the API endpoints, logic, and payloads for the **Attendance**, **Leave/Time-Off**, and **Salary Calculation** features.

---

## 1. Attendance module
Endpoints reside under `/api/attendance`

### `POST /api/attendance/checkin`
- **Auth**: `Bearer <token>` (Employee/Admin)
- **Logic**: Creates a record for today with `checkIn = now()` and `status = PRESENT`. Rejects with 409 if already checked in today.

### `POST /api/attendance/checkout`
- **Auth**: `Bearer <token>` (Employee/Admin)
- **Logic**: Updates today's record with `checkOut = now()`.
  - Calculates `workHours` and `extraHours`.
  - If `workHours < 4`, changes status to `HALF_DAY`.

### `GET /api/attendance/me?month=YYYY-MM`
- **Auth**: `Bearer <token>` (Employee/Admin)
- **Logic**: Returns the current user's attendance records for the given month. Defaults to current month if omitted.

### `GET /api/attendance/today`
- **Auth**: `Bearer <token>` (Admin Only)
- **Logic**: Returns everyone's attendance status for today. Used for the employee directory status dots.

---

## 2. Leave / Time-off module
Endpoints reside under `/api/leave`

### Setup Hook
> **@Member 1**: When you create a new User, please call `seedDefaultLeaveAllocations(userId)` from `src/utils/leaveHelpers.js` so they get their default 24 PAID, 7 SICK, and 9999 UNPAID days.

### `GET /api/leave/allocations/me`
- **Auth**: `Bearer <token>` (Employee/Admin)
- **Logic**: Shows the user's available leave types, `totalDays`, and `usedDays` for the current year.

### `POST /api/leave`
- **Auth**: `Bearer <token>` (Employee/Admin)
- **Logic**: Submits a new leave request. Automatically calculates the required days (`allocationDays`). Rejects if the user doesn't have enough balance for `PAID` or `SICK`.
- **Payload Example**:
  ```json
  {
    "leaveType": "SICK",
    "startDate": "2026-08-25",
    "endDate": "2026-08-26",
    "reason": "Flu",
    "attachmentUrl": "https://example.com/certificate.pdf" 
  }
  ```
  *(Note: `attachmentUrl` is soft-required for `SICK` leave).*

### `PATCH /api/leave/requests/:id`
- **Auth**: `Bearer <token>` (Admin Only)
- **Logic**: Admin approves or rejects the request. If `APPROVED`, a database transaction automatically deducts the requested days from the user's `LeaveAllocation.usedDays`.
- **Payload Example**:
  ```json
  {
    "status": "APPROVED",
    "adminComment": "Take care!"
  }
  ```

---

## 3. Salary Engine
Endpoints reside under `/api/salary`

### `POST /api/salary/:userId`
- **Auth**: `Bearer <token>` (Admin Only)
- **Logic**: Defines the basic wage, tax deductions, and flexible components (earnings). Uses a transaction to safely update everything.
- **Payload Example**:
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

### `GET /api/salary/:userId`
- **Auth**: `Bearer <token>` (Employee views self, Admin views anyone)
- **Logic**: Returns the stored salary structure AND a dynamically calculated `breakdown` representing the generated payslip data:
  - `grossEarnings`: Base + Components
  - `deductions`: PF + PT
  - `netSalary`: Gross - Deductions

---
**Error Handling:**
All endpoints return standard error responses conforming to Member 1's format:
`{ "success": false, "message": "Reason..." }`
