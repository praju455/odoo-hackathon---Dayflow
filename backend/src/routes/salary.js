// src/routes/salary.js — stub (Step 7 will flesh this out)
const express = require("express");
const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, message: "Salary routes active" });
});

module.exports = router;
