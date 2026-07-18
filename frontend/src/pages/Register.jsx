import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { AuthShell } from "./Login.jsx";
import { MailIcon } from "../components/icons.jsx";

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null); // { email, email_delivered, verify_link }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await register(form);
      setDone(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <AuthShell title="Check your email" subtitle="One quick step to activate your account.">
        <div className="space-y-4 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-100 text-brand-600">
            <MailIcon className="h-8 w-8" />
          </div>
          <p className="text-slate-600">
            We've sent a verification link to <b className="text-slate-800">{done.email}</b>.
            Click it to activate your account, then sign in.
          </p>
          {done.verify_link && (
            <div className="rounded-xl bg-amber-50 p-4 text-left text-sm text-amber-800">
              <p className="font-semibold">Dev mode (no email server configured):</p>
              <a href={done.verify_link} className="mt-1 block break-all font-medium text-brand-600 underline">
                {done.verify_link}
              </a>
            </div>
          )}
          <Link to="/login" className="btn-ghost inline-block">Back to sign in</Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your account" subtitle="Register as a parent and add your child's profile.">
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="rounded-lg bg-accent-500/10 px-3 py-2 text-sm text-accent-500">{error}</div>}
        <div>
          <label className="label">Full name</label>
          <input className="input" value={form.full_name} onChange={set("full_name")} required minLength={2} />
        </div>
        <div>
          <label className="label">Email <span className="text-accent-500">*</span></label>
          <input className="input" type="email" value={form.email} onChange={set("email")} required />
          <p className="mt-1 text-xs text-slate-400">We'll send a confirmation link here.</p>
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" value={form.password} onChange={set("password")} required minLength={8} />
          <p className="mt-1 text-xs text-slate-400">At least 8 characters.</p>
        </div>
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-brand-600 hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}
