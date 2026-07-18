import { Router } from "express";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { query } from "../db.js";
import { config } from "../config.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { sendVerificationEmail } from "../services/email.js";

const router = Router();

const registerSchema = z.object({
  full_name: z.string().min(2).max(120),
  email: z.string().email().max(160),
  password: z.string().min(8).max(128),
});
const loginSchema = z
  .object({
    identifier: z.string().min(1).max(160).optional(),
    email: z.string().min(1).max(160).optional(),
    password: z.string().min(1),
  })
  .refine((d) => d.identifier || d.email, { message: "Email or username is required." });
const emailSchema = z.object({ email: z.string().email() });
const tokenSchema = z.object({ token: z.string().min(10) });

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.full_name },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}
const newToken = () => crypto.randomBytes(32).toString("hex");

// Base URL for links in emails, resolved in priority order:
//  1. X-Forwarded-Host (real domain when behind a proxy / cloud LB),
//  2. an explicit non-localhost APP_BASE_URL override,
//  3. the request's own Host (includes the port for local use).
// So deployed apps email real-domain links and local dev keeps :PORT.
function emailBaseUrl(req) {
  const clean = (u) => u.replace(/\/+$/, "");
  const fwdHost = req.headers["x-forwarded-host"];
  const fwdProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  if (fwdHost) return clean(`${fwdProto || "https"}://${fwdHost}`);

  const configured = config.appBaseUrl || "";
  if (configured && !/localhost|127\.0\.0\.1/.test(configured)) return clean(configured);

  const proto = fwdProto || req.protocol || "http";
  return req.headers.host ? clean(`${proto}://${req.headers.host}`) : clean(configured);
}

// Only expose the raw verification link in API responses outside production,
// so tokens are never leaked in a live deployment's HTTP responses.
const devLink = (link, delivered) =>
  !delivered && config.env !== "production" ? link : undefined;

// POST /api/auth/register — creates an UNVERIFIED parent + sends a verify email.
router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { full_name, email, password } = req.body;
    const exists = await query("SELECT 1 FROM users WHERE email = $1", [email]);
    if (exists.rowCount > 0) {
      return res.status(409).json({ error: "An account with that email already exists." });
    }
    const hash = await bcrypt.hash(password, 10);
    const token = newToken();
    const { rows } = await query(
      `INSERT INTO users (email, password_hash, full_name, role, verification_token, verification_sent_at)
       VALUES ($1,$2,$3,'parent',$4, now())
       RETURNING id, email, full_name, role`,
      [email, hash, full_name, token]
    );
    const user = rows[0];
    const { delivered, link } = await sendVerificationEmail(user, token, emailBaseUrl(req));
    res.status(201).json({
      message: "Account created. Check your email to verify your account before signing in.",
      email: user.email,
      email_delivered: delivered,
      // Dev-only convenience so the hard gate isn't a dead-end without email.
      verify_link: devLink(link, delivered),
    });
  })
);

// POST /api/auth/verify — confirm the email; returns a JWT so the user is logged in.
router.post(
  "/verify",
  validate(tokenSchema),
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `UPDATE users SET email_verified = TRUE, verification_token = NULL
        WHERE verification_token = $1
        RETURNING id, email, full_name, role`,
      [req.body.token]
    );
    if (rows.length === 0) {
      return res.status(400).json({ error: "Invalid or already-used verification link." });
    }
    const user = rows[0];
    res.json({ token: signToken(user), user, message: "Email verified — you're all set!" });
  })
);

// POST /api/auth/resend — reissue a verification email.
router.post(
  "/resend",
  validate(emailSchema),
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      "SELECT id, email, full_name, role, email_verified FROM users WHERE email = $1",
      [req.body.email]
    );
    const user = rows[0];
    // Always respond the same to avoid leaking which emails exist.
    if (!user || user.email_verified) {
      return res.json({ message: "If that account exists and is unverified, a new link has been sent." });
    }
    const token = newToken();
    await query("UPDATE users SET verification_token = $1, verification_sent_at = now() WHERE id = $2", [token, user.id]);
    const { delivered, link } = await sendVerificationEmail(user, token, emailBaseUrl(req));
    res.json({
      message: "Verification email re-sent.",
      email_delivered: delivered,
      verify_link: devLink(link, delivered),
    });
  })
);

// POST /api/auth/login — blocked until the email is verified (hard gate).
router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const identifier = (req.body.identifier || req.body.email || "").trim();
    const { password } = req.body;
    // Match on email OR username (students sign in with a username, no email).
    const { rows } = await query(
      "SELECT id, email, username, full_name, role, password_hash, email_verified FROM users WHERE email = $1 OR username = $1",
      [identifier]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid credentials." });
    }
    // Email verification applies only to email accounts (parents/admins).
    if (user.email && !user.email_verified) {
      return res.status(403).json({ error: "Please verify your email before signing in.", code: "email_unverified" });
    }
    delete user.password_hash;
    delete user.email_verified;
    res.json({ token: signToken(user), user });
  })
);

// GET /api/auth/me
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      "SELECT id, email, full_name, role, email_verified, created_at FROM users WHERE id = $1",
      [req.user.sub]
    );
    if (rows.length === 0) return res.status(404).json({ error: "User not found." });
    res.json({ user: rows[0] });
  })
);

export default router;
