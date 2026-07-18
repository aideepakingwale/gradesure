// ===========================================================================
// Email service. Provider order:
//   1. Resend API   (RESEND_API_KEY in .env)  — recommended, free tier
//   2. SMTP         (SMTP_HOST/USER/PASS)     — any classic provider
//   3. Dev log      (nothing configured)      — link is logged so the hard
//                                               email gate never locks anyone out.
// Verification links use the ORIGIN the user registered from (so deployed apps
// don't send localhost links) — see auth.js. APP_BASE_URL is an optional override.
// ===========================================================================
import nodemailer from "nodemailer";
import { Resend } from "resend";
import { config } from "../config.js";

const RESEND_SAFE_FROM = "GradeSure <onboarding@resend.dev>";

let resend = null;
let smtp = null;

if (config.resend.apiKey) {
  resend = new Resend(config.resend.apiKey);
  console.log("[email] Resend API transport ready.");
  if (!/@resend\.dev>?\s*$/i.test(config.resend.from)) {
    console.warn(
      `[email] RESEND_FROM is "${config.resend.from}". On Resend's free tier you can only send from ` +
      `onboarding@resend.dev (and only TO your own account email) until you verify a domain at ` +
      `https://resend.com/domains. Unverified sends auto-fall back to ${RESEND_SAFE_FROM}.`
    );
  }
} else if (config.emailEnabled) {
  smtp = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
  });
  console.log(`[email] SMTP transport ready (${config.smtp.host}).`);
} else {
  console.log("[email] No email provider configured — verification links will be logged (dev mode).");
}

export function verificationLink(baseUrl, token) {
  const base = (baseUrl || config.appBaseUrl).replace(/\/+$/, "");
  return `${base}/verify?token=${encodeURIComponent(token)}`;
}

const isDomainError = (msg = "") => /not verified|domain/i.test(msg);

async function sendViaResend(from, payload) {
  const { data, error } = await resend.emails.send({ from, ...payload });
  if (error) throw new Error(`Resend: ${error.message || JSON.stringify(error)}`);
  return { delivered: true, provider: "resend", id: data?.id };
}

async function deliver({ to, subject, text, html }) {
  if (resend) {
    try {
      return await sendViaResend(config.resend.from, { to, subject, html, text });
    } catch (err) {
      // Most common footgun: sending from an unverified domain. Retry once with
      // the always-allowed onboarding sender so real emails still go out.
      if (isDomainError(err.message) && config.resend.from !== RESEND_SAFE_FROM) {
        console.warn(`[email] ${err.message} — retrying from ${RESEND_SAFE_FROM}.`);
        return await sendViaResend(RESEND_SAFE_FROM, { to, subject, html, text });
      }
      throw err;
    }
  }
  if (smtp) {
    await smtp.sendMail({ from: config.smtp.from, to, subject, text, html });
    return { delivered: true, provider: "smtp" };
  }
  return { delivered: false, provider: "dev-log" };
}

export async function sendVerificationEmail(user, token, baseUrl) {
  const link = verificationLink(baseUrl, token);
  const subject = "Verify your GradeSure account";
  const text = `Hi ${user.full_name},\n\nWelcome to GradeSure! Please confirm your email to activate your account:\n\n${link}\n\nIf you didn't sign up, ignore this message.`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto">
      <h2 style="color:#4285F4">🛡️ Welcome to GradeSure</h2>
      <p>Hi ${user.full_name},</p>
      <p>Please confirm your email address to activate your account and start
         the smart plan you can trust — all the way to Grade 9.</p>
      <p><a href="${link}" style="display:inline-block;background:#4285F4;color:#fff;
         padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">
         Verify my email</a></p>
      <p style="color:#64748b;font-size:13px">Or paste this link: ${link}</p>
    </div>`;

  try {
    const result = await deliver({ to: user.email, subject, text, html });
    if (result.delivered) {
      console.log(`[email] Verification sent to ${user.email} via ${result.provider}.`);
      return { delivered: true, link };
    }
  } catch (err) {
    console.error(`[email] Send failed (${err.message}) — link logged below as a fallback.`);
  }

  console.log("\n==================== EMAIL (dev log) ====================");
  console.log(`To: ${user.email}\nSubject: ${subject}`);
  console.log(`Verify link: ${link}`);
  console.log("========================================================\n");
  return { delivered: false, link };
}
