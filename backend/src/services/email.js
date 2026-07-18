// ===========================================================================
// Email service. Provider order:
//   1. Resend API   (RESEND_API_KEY in .env)  — recommended, free tier
//   2. SMTP         (SMTP_HOST/USER/PASS)     — any classic provider
//   3. Dev log      (nothing configured)      — link is logged + returned so
//                                               the hard email gate never
//                                               locks anyone out locally.
// ===========================================================================
import nodemailer from "nodemailer";
import { Resend } from "resend";
import { config } from "../config.js";

let resend = null;
let smtp = null;

if (config.resend.apiKey) {
  resend = new Resend(config.resend.apiKey);
  console.log("[email] Resend API transport ready.");
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

export function verificationLink(token) {
  return `${config.appBaseUrl}/verify?token=${encodeURIComponent(token)}`;
}

async function deliver({ to, subject, text, html }) {
  if (resend) {
    const { data, error } = await resend.emails.send({
      from: config.resend.from,
      to,
      subject,
      html,
      text,
    });
    if (error) throw new Error(`Resend: ${error.message || JSON.stringify(error)}`);
    return { delivered: true, provider: "resend", id: data?.id };
  }
  if (smtp) {
    await smtp.sendMail({ from: config.smtp.from, to, subject, text, html });
    return { delivered: true, provider: "smtp" };
  }
  return { delivered: false, provider: "dev-log" };
}

export async function sendVerificationEmail(user, token) {
  const link = verificationLink(token);
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
    // Delivery failure must not strand the user: fall through to the dev link.
    console.error(`[email] Send failed (${err.message}) — falling back to logged link.`);
  }

  console.log("\n==================== EMAIL (dev log) ====================");
  console.log(`To: ${user.email}\nSubject: ${subject}`);
  console.log(`Verify link: ${link}`);
  console.log("========================================================\n");
  return { delivered: false, link };
}
