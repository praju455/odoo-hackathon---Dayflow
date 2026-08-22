// Shared TypeScript types for the Dayflow frontend.
// Used by both Member 3 (profile/attendance) and Member 4 (directory/admin).

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  loginId: string;
  name: string;
  email: string;
  role: "ADMIN" | "EMPLOYEE";
}

// ─── Employee / User ─────────────────────────────────────────────────────────

/** Shape returned by GET /api/employees (directory listing) */
export interface DirectoryEmployee {
  id: string;
  name: string;
  profilePictureUrl: string | null;
  department: string | null;
  role: "ADMIN" | "EMPLOYEE";
}

/** Shape returned by GET /api/employees/:id or GET /api/users/me */
export interface UserProfile {
  id: string;
  companyId: string;
  loginId: string;
  name: string;
  email: string;
  phone: string | null;
  role: "ADMIN" | "EMPLOYEE";
  department: string | null;
  jobTitle: string | null;
  managerId: string | null;
  profilePictureUrl: string | null;
  joiningDate: string; // ISO date string
  about: string | null;
  skills: string[];
  certifications: string[];
  interests: string[];
  mustChangePassword: boolean;
}

// ─── Attendance ───────────────────────────────────────────────────────────────

// TODO: replace mock with real API shape when Members 1&2 ship attendance routes
export interface AttendanceRecord {
  userId: string;
  date: string; // YYYY-MM-DD
  checkIn: string | null; // HH:mm
  checkOut: string | null; // HH:mm
  status: "PRESENT" | "ABSENT" | "HALF_DAY";
}

// ─── Leave ───────────────────────────────────────────────────────────────────

// TODO: replace mock with real API shape when Members 1&2 ship leave routes
export interface LeaveRecord {
  id: string;
  userId: string;
  leaveType: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason: string | null;
}

export interface LeaveAllocation {
  id: string;
  userId: string;
  leaveType: string;
  totalDays: number;
  usedDays: number;
  year: number;
}

// ─── Directory card status ────────────────────────────────────────────────────

export type EmployeeStatus = "present" | "on-leave" | "absent";
