import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, setUnauthorizedHandler } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("edu_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  const persist = useCallback((token, u) => {
    localStorage.setItem("edu_token", token);
    localStorage.setItem("edu_user", JSON.stringify(u));
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("edu_token");
    localStorage.removeItem("edu_user");
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => logout());
  }, [logout]);

  // Validate stored session on load.
  useEffect(() => {
    async function check() {
      if (localStorage.getItem("edu_token")) {
        try {
          const { user: u } = await api.me();
          setUser(u);
        } catch {
          logout();
        }
      }
      setLoading(false);
    }
    check();
  }, [logout]);

  const login = async (email, password) => {
    const { token, user: u } = await api.login({ email, password });
    persist(token, u);
    return u;
  };

  // Hard email gate: registration does NOT create a session. It returns a
  // message (and, in dev without SMTP, a verify link) for the "check your email" step.
  const register = async (payload) => api.register(payload);

  // Verify returns a JWT so the user is logged straight in after confirming.
  const verify = async (token) => {
    const { token: jwt, user: u } = await api.verify(token);
    persist(jwt, u);
    return u;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verify, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
