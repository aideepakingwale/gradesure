import { Outlet, Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { GradeSureIcon, DashboardIcon, LibraryIcon, LogoutIcon } from "./icons.jsx";
import Copyright from "./Copyright.jsx";

// App shell — LearnHub-style: white top bar, indigo primary, icon-led nav.
export default function Layout() {
  const { user, logout } = useAuth();
  const initial = (user?.full_name || "?").charAt(0).toUpperCase();

  const navCls = ({ isActive }) =>
    `flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
      isActive ? "bg-brand-50 text-brand-700" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
    }`;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/app" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white shadow-sm">
              <GradeSureIcon className="h-5 w-5" />
            </span>
            <span className="hidden text-lg font-extrabold tracking-tight text-slate-900 sm:block">
              Grade<span className="text-brand-600">Sure</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            <NavLink to="/app" end className={navCls}>
              <DashboardIcon className="h-[18px] w-[18px]" />
              <span className="hidden sm:inline">Dashboard</span>
            </NavLink>
            <NavLink to="/app/resources" className={navCls}>
              <LibraryIcon className="h-[18px] w-[18px]" />
              <span className="hidden sm:inline">Resources</span>
            </NavLink>
            {user?.role === "admin" && (
              <NavLink to="/app/admin" className={navCls}>
                <GradeSureIcon className="h-[18px] w-[18px]" />
                <span className="hidden sm:inline">Admin</span>
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2.5 sm:flex">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                {initial}
              </span>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-slate-800">{user?.full_name}</p>
                <p className="text-xs capitalize text-slate-400">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <LogoutIcon className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>

      <footer className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-4 py-8 text-center text-xs text-slate-400">
        <span>GradeSure · the smart plan you can trust, all the way to Grade 9</span>
        <Copyright />
      </footer>
    </div>
  );
}
