// src/routes/leave.js — stub (Steps 4, 5 & 6 will flesh this out)
const express = require("express");
const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, message: "Leave routes active" });
});

module.exports = router;
