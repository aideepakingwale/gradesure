import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { AuthShell } from "./Login.jsx";
import { ClockIcon, CheckCircleIcon, AlertIcon } from "../components/icons.jsx";

export default function Verify() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { verify } = useAuth();
  const [status, setStatus] = useState("working"); // working | ok | error
  const [message, setMessage] = useState("Verifying your email…");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard StrictMode double-run
    ran.current = true;
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }
    verify(token)
      .then(() => {
        setStatus("ok");
        setMessage("Email verified! Taking you to your dashboard…");
        setTimeout(() => navigate("/app"), 1200);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.message || "Verification failed.");
      });
  }, [params, verify, navigate]);

  return (
    <AuthShell title="Email verification" subtitle="Activating your GradeSure account.">
      <div className="space-y-4 text-center">
        <div className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${
          status === "ok" ? "bg-emerald-100 text-emerald-600" : status === "error" ? "bg-rose-100 text-rose-600" : "bg-brand-100 text-brand-600"
        }`}>
          {status === "working" && <ClockIcon className="h-8 w-8 animate-pulse" />}
          {status === "ok" && <CheckCircleIcon className="h-8 w-8" />}
          {status === "error" && <AlertIcon className="h-8 w-8" />}
        </div>
        <p className={status === "error" ? "text-accent-500" : "text-slate-600"}>{message}</p>
        {status === "error" && <Link to="/login" className="btn-ghost inline-block">Back to sign in</Link>}
      </div>
    </AuthShell>
  );
}
