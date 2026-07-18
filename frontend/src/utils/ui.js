// Subject accent colours (for calendar chips/dots) + status/priority styling.

const SUBJECT_COLORS = {
  maths: "#4f46e5",
  combined_science: "#0d9488",
  english_lit: "#db2777",
  english_lang: "#e11d48",
  computer_science: "#0284c7",
  sociology: "#7c3aed",
  religious_studies: "#b45309",
  french: "#2563eb",
  geography: "#16a34a",
};
const FALLBACK = "#64748b";

export function subjectColor(key) {
  return SUBJECT_COLORS[key] || FALLBACK;
}

export function subjectShort(name) {
  const map = {
    Mathematics: "Maths",
    "Combined Science": "Science",
    "English Literature": "Eng Lit",
    "English Language": "Eng Lang",
    "Computer Science": "Comp Sci",
    "Religious Studies": "RS",
    Sociology: "Sociology",
    Geography: "Geog",
    French: "French",
  };
  return map[name] || name;
}

export const STATUS = {
  not_started: { label: "Not started", cls: "bg-slate-100 text-slate-600", dot: "bg-slate-300" },
  in_progress: { label: "In progress", cls: "bg-amber-100 text-amber-700", dot: "bg-amber-400" },
  completed: { label: "Completed", cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  halted: { label: "Halted", cls: "bg-rose-100 text-rose-700", dot: "bg-rose-500" },
};

// Quick-tap cycle (Week view). Halted is set explicitly from the Day view.
export const NEXT_STATUS = {
  not_started: "in_progress",
  in_progress: "completed",
  completed: "not_started",
  halted: "in_progress",
};

export const PRIORITY = {
  critical: { label: "Critical", cls: "bg-rose-100 text-rose-700" },
  high: { label: "High", cls: "bg-orange-100 text-orange-700" },
  medium: { label: "Stretch", cls: "bg-brand-100 text-brand-700" },
  maintain: { label: "Maintain", cls: "bg-slate-100 text-slate-600" },
};

export const ACTIVITY_LABELS = {
  study: "Study session",
  past_paper: "Timed past paper",
  consolidation: "Consolidation",
};
