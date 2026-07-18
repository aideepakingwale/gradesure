import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Verify from "./pages/Verify.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import StudentPlanner from "./pages/StudentPlanner.jsx";
import Analytics from "./pages/Analytics.jsx";
import Resources from "./pages/Resources.jsx";
import Admin from "./pages/Admin.jsx";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid h-screen place-items-center text-slate-400">Loading…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid h-screen place-items-center text-slate-400">Loading…</div>;
  return user ? <Navigate to="/app" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicOnly><Landing /></PublicOnly>} />
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
      <Route path="/verify" element={<Verify />} />

      <Route
        path="/app"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="students/:id" element={<StudentPlanner />} />
        <Route path="students/:id/analytics" element={<Analytics />} />
        <Route path="resources" element={<Resources />} />
        <Route path="admin" element={<Admin />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
