// ===========================================================================
// Icon system — consistent 24px stroke icons (heroicons-style, stroke 1.8).
// Includes a per-GCSE-subject icon set used across calendar, panels & pages.
// ===========================================================================

const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
const I = ({ children, ...props }) => (
  <svg {...base} {...props}>{children}</svg>
);

/* ---------- brand / shell ---------- */

// GradeSure brand mark: a shield (the guarantee) carrying a check.
export const GradeSureIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"
       strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M12 3 5 5.6v5.2c0 4.4 2.9 7.6 7 9.2 4.1-1.6 7-4.8 7-9.2V5.6L12 3Z" />
    <path d="m8.8 11.8 2.3 2.4 4.1-5" />
  </svg>
);

export const GraduationCapIcon = (p) => (
  <I {...p}><path d="M12 4 2.5 8.5 12 13l9.5-4.5L12 4Z" /><path d="M6.5 10.7V15c0 1.6 2.5 3 5.5 3s5.5-1.4 5.5-3v-4.3" /><path d="M21.5 8.5V14" /></I>
);
export const DashboardIcon = (p) => (
  <I {...p}><rect x="3" y="3" width="7.5" height="7.5" rx="2" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="2" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="2" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" /></I>
);
export const LibraryIcon = (p) => (
  <I {...p}><path d="M4 19.5V5a1 1 0 0 1 1-1h3v16H5a1 1 0 0 1-1-.5ZM8 4h4v16H8" /><path d="m13.5 4.6 4.2-.8a1 1 0 0 1 1.2.8L21 18.9a1 1 0 0 1-.8 1.1l-4.1.8" /></I>
);
export const LogoutIcon = (p) => (
  <I {...p}><path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" /><path d="m16 17 5-5-5-5M21 12H9" /></I>
);
export const ChevronLeftIcon = (p) => <I {...p}><path d="m14.5 5.5-6.5 6.5 6.5 6.5" /></I>;
export const ChevronRightIcon = (p) => <I {...p}><path d="m9.5 5.5 6.5 6.5-6.5 6.5" /></I>;
export const ChevronDownIcon = (p) => <I {...p}><path d="m6 9.5 6 6 6-6" /></I>;
export const ChevronUpIcon = (p) => <I {...p}><path d="m6 14.5 6-6 6 6" /></I>;
export const PlusIcon = (p) => <I {...p}><path d="M12 5v14M5 12h14" /></I>;
export const ArrowLeftIcon = (p) => <I {...p}><path d="M19 12H5m6-7-7 7 7 7" /></I>;
export const ExternalLinkIcon = (p) => (
  <I {...p}><path d="M14 4h6v6" /><path d="M20 4 10.5 13.5" /><path d="M20 14v5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19V6a1.5 1.5 0 0 1 1.5-1.5H10" /></I>
);

/* ---------- planner / status ---------- */

export const CalendarIcon = (p) => (
  <I {...p}><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M8 3v4m8-4v4M3 10.5h18" /></I>
);
export const SparklesIcon = (p) => (
  <I {...p}><path d="M11 4.5 12.6 9 17 10.5 12.6 12 11 16.5 9.4 12 5 10.5 9.4 9 11 4.5Z" /><path d="M18.5 14.5l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9.9-2.4Z" /></I>
);
export const TargetIcon = (p) => (
  <I {...p}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /></I>
);
export const TrendingUpIcon = (p) => (
  <I {...p}><path d="m3 17 6-6 4 4 8-8" /><path d="M15 7h6v6" /></I>
);
export const ChartBarIcon = (p) => (
  <I {...p}><path d="M4 20V11m6 9V4m6 16v-6" /><path d="M2.5 20h19" /></I>
);
export const ClockIcon = (p) => (
  <I {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></I>
);
export const CheckIcon = (p) => <I {...p} strokeWidth="2.2"><path d="m5 13 4.5 4.5L19 8" /></I>;
export const CheckCircleIcon = (p) => (
  <I {...p}><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12.5 2.4 2.4 4.6-5.4" /></I>
);
export const PlayIcon = (p) => <I {...p}><path d="M7 5.5v13l11-6.5-11-6.5Z" /></I>;
export const PauseIcon = (p) => <I {...p}><path d="M8.5 5.5v13m7-13v13" strokeWidth="2.4" /></I>;
export const ResetIcon = (p) => (
  <I {...p}><path d="M4.5 12a7.5 7.5 0 1 0 2.5-5.6" /><path d="M4.5 4v4.5H9" /></I>
);
export const NoteIcon = (p) => (
  <I {...p}><path d="M16.8 3.7a2.1 2.1 0 0 1 3 3L8.5 18l-4 1 1-4L16.8 3.7Z" /></I>
);
export const AlertIcon = (p) => (
  <I {...p}><path d="M12 4 2.5 20h19L12 4Z" /><path d="M12 10v4.5" /><circle cx="12" cy="17.2" r=".4" fill="currentColor" stroke="none" /></I>
);
export const FileTextIcon = (p) => (
  <I {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></I>
);
export const BrainIcon = (p) => (
  <I {...p}><path d="M9.5 4A2.5 2.5 0 0 0 7 6.5c-1.7.3-3 1.7-3 3.5 0 .9.3 1.7.9 2.3A3.5 3.5 0 0 0 7 18.4a3 3 0 0 0 5-2.2V6.5A2.5 2.5 0 0 0 9.5 4Z" /><path d="M14.5 4A2.5 2.5 0 0 1 17 6.5c1.7.3 3 1.7 3 3.5 0 .9-.3 1.7-.9 2.3a3.5 3.5 0 0 1-2.1 6.1 3 3 0 0 1-5-2.2V6.5A2.5 2.5 0 0 1 14.5 4Z" /></I>
);
export const BoltIcon = (p) => <I {...p}><path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12l1-8Z" /></I>;
export const UserIcon = (p) => (
  <I {...p}><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5c1.2-3.4 4-5 7.5-5s6.3 1.6 7.5 5" /></I>
);
export const MailIcon = (p) => (
  <I {...p}><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m3.5 7 8.5 6 8.5-6" /></I>
);
export const BookOpenIcon = (p) => (
  <I {...p}><path d="M12 6.5C10 4.8 7 4.5 4 5.4v13.2c3-.9 6-.6 8 1.1 2-1.7 5-2 8-1.1V5.4c-3-.9-6-.6-8 1.1Z" /><path d="M12 6.5v13.2" /></I>
);

/* ---------- subject icons ---------- */

export const MathsIcon = (p) => (
  <I {...p}><rect x="4" y="3" width="16" height="18" rx="2.5" /><path d="M8 7.5h8M8 12h.01M12 12h.01M16 12h.01M8 16.5h.01M12 16.5h.01M16 16.5h.01" strokeWidth="2.1" /></I>
);
export const ScienceIcon = (p) => (
  <I {...p}><path d="M9.5 3h5M10.5 3v6L5 18a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5.5-9V3" /><path d="M8 15h8" /></I>
);
export const LiteratureIcon = (p) => (
  <I {...p}><path d="M12 6.5C10 4.8 7 4.5 4 5.4v13.2c3-.9 6-.6 8 1.1 2-1.7 5-2 8-1.1V5.4c-3-.9-6-.6-8 1.1Z" /><path d="M12 6.5v13.2M7.5 9.5H9m-1.5 3H9m6-3h1.5m-1.5 3h1.5" /></I>
);
export const LanguageArtsIcon = (p) => (
  <I {...p}><path d="M16.8 3.7a2.1 2.1 0 0 1 3 3L8.5 18l-4 1 1-4L16.8 3.7Z" /><path d="M4 21h16" /></I>
);
export const CodeIcon = (p) => (
  <I {...p}><path d="m8 8-4.5 4L8 16m8-8 4.5 4L16 16" /><path d="m13.2 5.5-2.4 13" /></I>
);
export const PeopleIcon = (p) => (
  <I {...p}><circle cx="9" cy="8.5" r="3.2" /><path d="M2.8 19.5c.9-2.9 3.2-4.4 6.2-4.4s5.3 1.5 6.2 4.4" /><circle cx="16.8" cy="9.5" r="2.6" /><path d="M16.4 15.2c2.5.2 4.3 1.6 5 4.3" /></I>
);
export const ScalesIcon = (p) => (
  <I {...p}><path d="M12 4v16M7 4.8 12 4l5 .8M4 20h16" /><path d="M7 5 4.5 11a2.6 2.6 0 0 0 5 0L7 5Zm10 0-2.5 6a2.6 2.6 0 0 0 5 0L17 5Z" /></I>
);
export const GlobeIcon = (p) => (
  <I {...p}><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.3 2.3 3.5 5.2 3.5 8.5s-1.2 6.2-3.5 8.5c-2.3-2.3-3.5-5.2-3.5-8.5s1.2-6.2 3.5-8.5Z" /></I>
);
export const TranslateIcon = (p) => (
  <I {...p}><path d="M4 5.5h9M8.5 3.5v2M11.5 5.5c-.8 3.6-3 6.6-6.5 8.5" /><path d="M6 9.5c1.4 2.6 3.6 4.4 6.5 5.5" /><path d="m13 20.5 4-9.5 4 9.5m-6.7-3h5.4" /></I>
);

// Subject-key → icon component (fallback: BookOpenIcon).
export const SUBJECT_ICONS = {
  maths: MathsIcon,
  combined_science: ScienceIcon,
  english_lit: LiteratureIcon,
  english_lang: LanguageArtsIcon,
  computer_science: CodeIcon,
  sociology: PeopleIcon,
  religious_studies: ScalesIcon,
  french: TranslateIcon,
  geography: GlobeIcon,
};

export function SubjectIcon({ subject, ...props }) {
  const Cmp = SUBJECT_ICONS[subject] || BookOpenIcon;
  return <Cmp {...props} />;
}

// Activity-kind icon (study / past paper / consolidation).
export const ACTIVITY_ICONS = {
  study: BookOpenIcon,
  past_paper: FileTextIcon,
  consolidation: BrainIcon,
};
export function ActivityIcon({ activity, ...props }) {
  const Cmp = ACTIVITY_ICONS[activity] || BookOpenIcon;
  return <Cmp {...props} />;
}
