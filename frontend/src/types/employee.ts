// Shared TypeScript types for the Shiftly frontend.
// Used by both Member 3 (profile/attendance) and Member 4 (directory/admin).

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  loginId: string;
  name: string;
  email: string;
  role: "ADMIN" | "EMPLOYEE";
  mustChangePassword: boolean;
}

// ─── Employee / User ─────────────────────────────────────────────────────────

/** Shape returned by GET /api/employees (directory listing) */
export interface DirectoryEmployee {
  id: string;
  name: string;
  profilePictureUrl: string | null;
  department: string | null;
  jobTitle: string | null;
  loginId: string;
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
  dateOfBirth: string | null;
  gender: string | null;
  maritalStatus: string | null;
  personalEmail: string | null;
  panCode: string | null;
  uanCode: string | null;
  accountNumber: string | null;
  homeAddress: string | null;
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

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workHours: number | string | null;
  extraHours: number | string | null;
  status: "PRESENT" | "ABSENT" | "HALF_DAY";
}

export interface DayAttendanceRecord {
  user: Pick<DirectoryEmployee, "id" | "loginId" | "name" | "department" | "jobTitle">;
  status: "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE";
  attendance: AttendanceRecord | null;
}

// ─── Leave ───────────────────────────────────────────────────────────────────

export interface LeaveRecord {
  id: string;
  userId: string;
  leaveType: "PAID" | "SICK" | "UNPAID";
  startDate: string;
  endDate: string;
  allocationDays: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason: string | null;
  attachmentUrl: string | null;
  adminComment: string | null;
  createdAt: string;
  user?: Pick<DirectoryEmployee, "id" | "loginId" | "name" | "department">;
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

export type EmployeeStatus = "present" | "on-leave" | "absent" | "unknown";
