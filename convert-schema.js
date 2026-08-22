const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'backend', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Remove enum blocks
schema = schema.replace(/enum \w+ \{[\s\S]*?\}/g, '');

// Replace field types
schema = schema.replace(/role\s+Role\s+@default\(EMPLOYEE\)/g, 'role String @default("EMPLOYEE")');
schema = schema.replace(/status\s+AttendanceStatus\s+@default\(ABSENT\)/g, 'status String @default("ABSENT")');
schema = schema.replace(/leaveType\s+LeaveType/g, 'leaveType String');
schema = schema.replace(/status\s+LeaveRequestStatus\s+@default\(PENDING\)/g, 'status String @default("PENDING")');
schema = schema.replace(/wageType\s+WageType\s+@default\(MONTHLY\)/g, 'wageType String @default("MONTHLY")');
schema = schema.replace(/compType\s+ComponentType/g, 'compType String');

fs.writeFileSync(schemaPath, schema);
console.log('Schema updated successfully for SQLite.');
