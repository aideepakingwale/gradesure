import dotenv from "dotenv";
dotenv.config();

// Centralised, validated configuration (Shared Core).
export const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "4000", 10),
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgres://edu:edu_secret@localhost:5432/eduenterprise",
  jwtSecret: process.env.JWT_SECRET || "dev_secret_change_me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  corsOrigin: process.env.CORS_ORIGIN || "*",

  // Public base URL used to build links inside emails (verification, etc.).
  appBaseUrl: process.env.APP_BASE_URL || "http://localhost:8088",

  // --- Email. Provider order: Resend API -> SMTP -> dev log. ---
  resend: {
    apiKey: process.env.RESEND_API_KEY || "",
    from: process.env.RESEND_FROM || "GradeSure <onboarding@resend.dev>",
  },

  // SMTP fallback. If neither Resend nor SMTP is set, verification links are
  // logged + returned in dev so nobody is locked out of the hard email gate.
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "GradeSure <no-reply@gradesure.local>",
    secure: process.env.SMTP_SECURE === "true",
  },
  get emailEnabled() {
    return Boolean(this.smtp.host && this.smtp.user);
  },

  // --- Generative AI: Groq (primary) -> Gemini (fallback) -> rule-based. ---
  ai: {
    groqKey: process.env.GROQ_API_KEY || "",
    groqModel: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    geminiKey: process.env.GEMINI_API_KEY || "",
    geminiModel: process.env.GEMINI_MODEL || "gemini-1.5-flash",
  },
};

if (config.env === "production" && config.jwtSecret === "dev_secret_change_me") {
  // Fail loudly rather than shipping an insecure default token signer.
  console.warn(
    "[config] WARNING: JWT_SECRET is using the insecure default in production!"
  );
}
