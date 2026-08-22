const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'backend', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

schema = schema.replace(/skills\s+String\[\]\s+@default\(\[\]\)/g, 'skills String @default("")');
schema = schema.replace(/certifications\s+String\[\]\s+@default\(\[\]\)/g, 'certifications String @default("")');
schema = schema.replace(/interests\s+String\[\]\s+@default\(\[\]\)/g, 'interests String @default("")');

fs.writeFileSync(schemaPath, schema);
console.log('Fixed arrays for SQLite');
