import { useState } from "react";
import { api } from "../api.js";
import { UserIcon, CheckCircleIcon } from "./icons.jsx";

// Parent-managed student login: set/replace a username + password, or revoke.
export default function StudentLoginModal({ studentId, studentName, login, onClose, onSaved }) {
  const [username, setUsername] = useState(login?.username || "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function save() {
    setBusy(true);
    setError("");
    try {
      await api.setStudentLogin(studentId, { username: username.trim(), password });
      setDone(true);
      onSaved?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    if (!confirm(`Remove ${studentName}'s login? They won't be able to sign in.`)) return;
    setBusy(true);
    setError("");
    try {
      await api.removeStudentLogin(studentId);
      onSaved?.();
      onClose();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-brand-50 text-brand-600">
            <UserIcon className="h-6 w-6" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Student login</h3>
            <p className="text-sm text-slate-500">
              Give {studentName} their own sign-in to view the plan and tick off tasks.
            </p>
          </div>
        </div>

        {done ? (
          <div className="mt-5 rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
            <p className="flex items-center gap-2 font-semibold text-emerald-700">
              <CheckCircleIcon className="h-5 w-5" /> Login ready
            </p>
            <p className="mt-1 text-sm text-emerald-700">
              {studentName} can now sign in at the login page with:
            </p>
            <p className="mt-2 rounded-lg bg-white px-3 py-2 text-sm">
              Username: <b>{username}</b><br />Password: <b>the one you just set</b>
            </p>
            <button className="btn-primary mt-4 w-full" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            {error && <div className="mt-4 rounded-lg bg-accent-500/10 px-3 py-2 text-sm text-accent-500">{error}</div>}
            <div className="mt-4 space-y-3">
              <div>
                <label className="label">Username</label>
                <input className="input" value={username} onChange={(e) => setUsername(e.target.value)}
                       placeholder="e.g. divya" autoComplete="off" />
                <p className="mt-1 text-xs text-slate-400">3–40 characters: letters, numbers, . _ -</p>
              </div>
              <div>
                <label className="label">{login?.enabled ? "New password" : "Password"}</label>
                <input className="input" type="text" value={password} onChange={(e) => setPassword(e.target.value)}
                       placeholder="At least 6 characters" autoComplete="off" />
                <p className="mt-1 text-xs text-slate-400">Shown in plain text so you can share it with your child.</p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between gap-2">
              {login?.enabled ? (
                <button className="btn px-3 py-2 text-sm text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50"
                        onClick={revoke} disabled={busy}>Remove login</button>
              ) : <span />}
              <div className="flex gap-2">
                <button className="btn-ghost" onClick={onClose}>Cancel</button>
                <button className="btn-primary" onClick={save}
                        disabled={busy || username.trim().length < 3 || password.length < 6}>
                  {busy ? "Saving…" : login?.enabled ? "Update login" : "Create login"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
