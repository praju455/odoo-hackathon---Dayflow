// src/routes/attendance.js — stub (Step 2 & 3 will flesh this out)
const express = require("express");
const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, message: "Attendance routes active" });
});

module.exports = router;
