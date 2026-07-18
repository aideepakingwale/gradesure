import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";
import { GradeSureIcon } from "../components/icons.jsx";
import Copyright from "../components/Copyright.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("parent@demo.local");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsVerify, setNeedsVerify] = useState(false);
  const [resent, setResent] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    setResent("");
    setBusy(true);
    try {
      await login(identifier, password);
      navigate("/app");
    } catch (err) {
      setError(err.message);
      if (/verify/i.test(err.message)) setNeedsVerify(true);
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setResent("");
    try {
      const r = await api.resend(identifier);
      setResent(r.verify_link ? `Dev link: ${r.verify_link}` : "Verification email re-sent — check your inbox.");
    } catch (err) {
      setResent(err.message);
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to track the road to Grade 9.">
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="rounded-lg bg-accent-500/10 px-3 py-2 text-sm text-accent-500">{error}</div>}
        {needsVerify && (
          <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Your email isn't verified.{" "}
            <button type="button" onClick={resend} className="font-semibold underline">Resend link</button>
            {resent && <div className="mt-1 break-all text-xs text-amber-800">{resent}</div>}
          </div>
        )}
        <div>
          <label className="label">Email or username</label>
          <input className="input" type="text" autoComplete="username" value={identifier}
                 onChange={(e) => setIdentifier(e.target.value)} required
                 placeholder="parent@email.com or student username" />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" autoComplete="current-password" value={password}
                 onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Parent?{" "}
        <Link to="/register" className="font-semibold text-brand-600 hover:underline">
          Create an account
        </Link>
        <span className="mt-1 block text-xs text-slate-400">
          Students sign in with the username &amp; password their parent set up.
        </span>
      </p>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5 text-2xl font-extrabold">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
            <GradeSureIcon className="h-6 w-6" />
          </span>
          GradeSure
        </div>
        <div>
          <h1 className="text-4xl font-extrabold leading-tight">
            The single source of truth on the road to Grade 8–9.
          </h1>
          <p className="mt-4 max-w-md text-brand-100">
            A daily, board-specific study engine for your GCSEs — with parent
            analytics, curated free resources, and active-recall techniques baked in.
          </p>
          <ul className="mt-8 space-y-2 text-brand-100">
            <li>✓ Daily plan mapped to your school's term dates</li>
            <li>✓ Correct exam boards, tiers &amp; set texts</li>
            <li>✓ Progress tracking + trajectory charts</li>
          </ul>
        </div>
        <div className="text-sm text-brand-200">For any GCSE exam series</div>
      </div>
      <div className="flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center lg:text-left">
            <h2 className="text-2xl font-extrabold text-slate-800">{title}</h2>
            <p className="text-slate-500">{subtitle}</p>
          </div>
          {children}
        </div>
        <Copyright className="mt-10 text-center text-xs text-slate-400" />
      </div>
    </div>
  );
}
