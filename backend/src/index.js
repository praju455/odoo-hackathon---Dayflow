// src/index.js
// Dayflow HRMS — Express entry point
// Member 1 owns auth & employee routes (added below when ready).
// Member 2 owns attendance, leave, salary routes.

const express = require("express");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// ── Health check ─────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Member 1 routes (will be uncommented when Member 1 merges) ──
// app.use("/api/auth",      require("./routes/auth"));
// app.use("/api/employees", require("./routes/employees"));
// app.use("/api/companies", require("./routes/companies"));

// ── Member 2 routes ──────────────────────────────────────────
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/leave",      require("./routes/leave"));
app.use("/api/salary",     require("./routes/salary"));

// ── Global error handler ──────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

app.listen(port, () => {
  console.log(`Dayflow backend running on port ${port}`);
});
