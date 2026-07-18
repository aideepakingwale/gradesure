import jwt from "jsonwebtoken";
import { config } from "../config.js";

// Verify the Bearer JWT and attach the user payload to req.user.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Authentication required." });
  }
  try {
    req.user = jwt.verify(token, config.jwtSecret); // { sub, email, role }
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

// RBAC guard: allow only the listed roles.
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions." });
    }
    next();
  };
}
