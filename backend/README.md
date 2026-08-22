# Dayflow Backend

## Setup

From the project root:

```sh
docker compose up -d
```

From `backend/`:

```sh
npm install
npx prisma migrate dev
npm start
```

Create `backend/.env` from `backend/.env.example`.

## Database

The backend uses local PostgreSQL through Docker Compose:

- user: `dayflow`
- password: `dayflow`
- database: `dayflow`
- port: `5432`

Prisma uses real PostgreSQL enum types for `Role`, `AttendanceStatus`, and `LeaveRequestStatus`.

## Error Shape

Errors return this shape:

```json
{ "error": "message" }
```

## Routes

### GET `/api/health`

Returns:

```json
{ "status": "ok" }
```

### POST `/api/setup`

One-time company and first-admin setup. Refuses once any admin exists.

Request:

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

Returns JWT, company, and admin details.

### POST `/api/auth/login`

Login with Login ID or email.

Request:

```json
{
  "identifier": "OCBOCA20250001",
  "password": "Password123"
}
```

Returns:

```json
{
  "token": "jwt",
  "mustChangePassword": true,
  "user": {}
}
```

### PUT `/api/auth/change-password`

Requires `Authorization: Bearer <token>`.

Request:

```json
{
  "currentPassword": "TempPassword123",
  "newPassword": "NewPassword123"
}
```

Clears `mustChangePassword`.

### POST `/api/employees`

Admin only. Creates an employee, auto-generates Login ID and temporary password.

Request:

```json
{
  "name": "Bob Carter",
  "email": "bob.carter@orbit.test",
  "phone": "9876543211",
  "department": "Engineering",
  "jobTitle": "Software Engineer",
  "managerId": "optional-user-id",
  "joiningDate": "2025-01-15"
}
```

Returns the employee plus `tempPassword`. The temp password is shown once.

### GET `/api/employees`

Authenticated users. Returns directory cards only:

```json
{
  "employees": [
    {
      "id": "user-id",
      "name": "Bob Carter",
      "profilePictureUrl": null,
      "department": "Engineering",
      "role": "EMPLOYEE"
    }
  ]
}
```

### GET `/api/employees/:id`

Authenticated users. Returns one employee profile without password or salary data.

### PUT `/api/employees/:id`

Admin only. Updates employee work/profile fields.

### GET `/api/users/me`

Authenticated users. Returns own full profile without password or salary data.

### PUT `/api/users/me`

Authenticated users can update:

- `phone`
- `dateOfBirth`
- `gender`
- `maritalStatus`
- `personalEmail`
- `panCode`
- `uanCode`
- `accountNumber`
- `homeAddress`
- `profilePictureUrl`
- `about`
- `skills`
- `certifications`
- `interests`

The route rejects protected fields like `role`, `department`, `jobTitle`, salary-related fields, `email`, `loginId`, `managerId`, and `joiningDate`.

## Login ID Format

Login IDs are generated as:

```txt
[company code][first 2 first-name letters][first 2 last-name letters][joining year][4-digit serial]
```

Example:

```txt
OCBOCA20250001
```
