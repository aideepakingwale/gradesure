// Thin fetch wrapper with JWT injection + JSON handling.
const BASE = import.meta.env.VITE_API_BASE_URL || "/api";

let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

function token() {
  return localStorage.getItem("edu_token");
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth && token()) headers.Authorization = `Bearer ${token()}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && onUnauthorized) onUnauthorized();

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }
  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: payload, auth: false }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload, auth: false }),
  verify: (token) => request("/auth/verify", { method: "POST", body: { token }, auth: false }),
  resend: (email) => request("/auth/resend", { method: "POST", body: { email }, auth: false }),
  me: () => request("/auth/me"),

  listStudents: () => request("/students"),
  createStudent: (payload) => request("/students", { method: "POST", body: payload }),
  getStudent: (id) => request(`/students/${id}`),
  updateStudent: (id, payload) => request(`/students/${id}`, { method: "PATCH", body: payload }),
  deleteStudent: (id) => request(`/students/${id}`, { method: "DELETE" }),
  upsertSubject: (id, payload) => request(`/students/${id}/subjects`, { method: "PUT", body: payload }),

  getPlan: (id, start, days = 30) =>
    request(`/students/${id}/plan?start=${start}&days=${days}`),
  getDay: (id, date) => request(`/students/${id}/plan/day/${date}`),
  getProfile: (id) => request(`/students/${id}/plan/profile`),
  saveProgress: (id, payload) =>
    request(`/students/${id}/progress`, { method: "PUT", body: payload }),

  getAnalytics: (id, days = 60) => request(`/students/${id}/analytics?days=${days}`),
  getResources: () => request("/resources"),
  getCatalog: () => request("/catalog/subjects"),

  // Admin: master reference library
  adminRefOverview: () => request("/admin/references/overview"),
  adminRefList: (subjectKey, topicSlug) =>
    request(`/admin/references?subject_key=${encodeURIComponent(subjectKey)}${topicSlug !== undefined ? `&topic_slug=${encodeURIComponent(topicSlug)}` : ""}`),
  adminRefCreate: (payload) => request("/admin/references", { method: "POST", body: payload }),
  adminRefUpdate: (id, payload) => request(`/admin/references/${id}`, { method: "PUT", body: payload }),
  adminRefDelete: (id) => request(`/admin/references/${id}`, { method: "DELETE" }),
  adminRefreshPlans: () => request("/admin/references/refresh-plans", { method: "POST" }),

  generatePlan: (id) => request(`/students/${id}/plan/generate`, { method: "POST" }),
  getCurrentPlan: (id) => request(`/students/${id}/plan/current`),
  getEvaluations: (id, periods = 6) => request(`/students/${id}/evaluations?periods=${periods}`),
};
