// src/middleware/auth.js
// JWT auth middleware — aligned with Member 1's User schema.
// Token payload: { id, loginId, role, companyId }

const jwt = require("jsonwebtoken");

/**
 * authenticate — verifies the Bearer JWT on every protected route.
 * Attaches { id, loginId, role, companyId } to req.user on success.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, loginId, role, companyId }
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

/**
 * requireAdmin — must be used AFTER authenticate.
 * Member 1's schema only has ADMIN and EMPLOYEE roles.
 * Rejects non-ADMIN users with 403.
 */
function requireAdmin(req, res, next) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  next();
}

module.exports = { authenticate, requireAdmin };
