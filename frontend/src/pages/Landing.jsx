import { Link } from "react-router-dom";
import { GradeSureIcon } from "../components/icons.jsx";

// ===========================================================================
// Public landing page — styled after Colorlib's "Imagine" one-page template:
// clean white canvas, blue accent, pill buttons, line-icon feature cards and
// flat unDraw-style vector illustrations (hand-drawn SVG, zero image files).
// ===========================================================================

const BLUE = "#4285F4";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-700 antialiased">
      <Nav />
      <main>
        <Hero />
        <Features />
        <SplitAI />
        <SplitProgress />
        <Testimonials />
        <Mission />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

/* ================= nav ================= */

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <span className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-900">
          <GradeSureIcon className="h-7 w-7" style={{ color: BLUE }} />
          Grade<span style={{ color: BLUE }}>Sure</span>
        </span>
        <nav className="hidden items-center gap-8 text-[15px] font-medium text-slate-500 lg:flex">
          <a href="#features" className="transition hover:text-slate-900">Features</a>
          <a href="#ai" className="transition hover:text-slate-900">AI Planner</a>
          <a href="#progress" className="transition hover:text-slate-900">Progress</a>
          <a href="#testimonials" className="transition hover:text-slate-900">Families</a>
          <a href="#mission" className="transition hover:text-slate-900">Our Mission</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-[15px] font-semibold text-slate-500 transition hover:text-slate-900">
            Sign in
          </Link>
          <Link to="/register"
                className="rounded-full px-6 py-2.5 text-[15px] font-semibold text-white shadow-md transition hover:shadow-lg"
                style={{ backgroundColor: BLUE }}>
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ================= hero ================= */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-20 pt-14 lg:grid-cols-2 lg:pt-20">
        <div className="order-2 text-center lg:order-1 lg:text-left">
          <p className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: BLUE }}>
            GCSE · AI study planning
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            The smart plan you can <span style={{ color: BLUE }}>trust</span> — all the way to Grade 9.
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-slate-500 lg:mx-0">
            GradeSure's AI turns current grades, target grades and your school's term dates into a
            personalised day-by-day study plan — then measures every fortnight that it's working,
            so following the plan means hitting the target.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            <Link to="/register"
                  className="rounded-full px-8 py-3.5 font-semibold text-white shadow-lg transition hover:shadow-xl"
                  style={{ backgroundColor: BLUE }}>
              Get Started — it's free
            </Link>
            <a href="#ai" className="rounded-full border-2 px-8 py-3 font-semibold transition hover:bg-blue-50"
               style={{ borderColor: BLUE, color: BLUE }}>
              How it works
            </a>
          </div>
          <p className="mt-4 text-sm text-slate-400">No card · 2-minute setup · 9 GCSE subjects</p>
        </div>
        <div className="order-1 lg:order-2">
          <StudentIllustration className="mx-auto w-full max-w-lg" />
        </div>
      </div>
    </section>
  );
}

/* ================= features ================= */

const FEATURES = [
  { Icon: SparkIcon, title: "AI-Curated Plans", body: "Groq & Gemini AI read grades, targets and tier risk, then write a personalised study strategy — saved to your account." },
  { Icon: CalendarIcon, title: "Calendar Views", body: "Month, week and day views of the whole plan. Tap any date to see that day's exact tasks and time blocks." },
  { Icon: CheckIconBig, title: "Progress Marking", body: "Students mark work in-progress, completed or halted with notes — so nothing silently slips." },
  { Icon: BookIcon, title: "Free Resources", body: "Every task links to elite free material: Maths Genie, Cognito, Mr Bruff, Craig 'n' Dave and more." },
  { Icon: ChartIcon, title: "Parent Analytics", body: "Completion trajectories, per-subject breakdowns and study time — clarity without nagging." },
  { Icon: TargetIcon, title: "Fortnightly Check-ins", body: "Automatic adherence verdicts — on-track, at-risk or off-track — prove the plan is working." },
];

function Features() {
  return (
    <section id="features" className="scroll-mt-20 bg-slate-50/70 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHead
          title="Everything in GradeSure"
          sub="Everything a family needs to plan, study and track the road to the top grades."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ Icon, title, body }) => (
            <div key={title}
                 className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-100 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-blue-50">
                <Icon className="h-7 w-7" style={{ color: BLUE }} />
              </span>
              <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-500">{body}</p>
              <Link to="/register" className="mt-4 inline-block text-sm font-semibold" style={{ color: BLUE }}>
                Learn More →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================= AI split ================= */

function SplitAI() {
  return (
    <section id="ai" className="scroll-mt-20 py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-2">
        <AiIllustration className="mx-auto w-full max-w-md" />
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: BLUE }}>AI Planner</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            The AI builds the plan. Your child just follows it.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-500">
            Enter each subject's current and target grade plus your school's term dates. The AI
            weights every study week toward the biggest gaps and flags structural risks — like
            Foundation-tier papers that cap the grade at 5.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Foundation-tier alerts for Maths & French — request the Higher-tier move early",
              "15 weekly sessions, weighted by grade gap and tier risk",
              "Board-specific strategies: Edexcel, AQA and OCR J277",
              "Works even offline — a built-in engine guarantees a plan",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-[15px] text-slate-600">
                <span className="mt-1 grid h-5 w-5 flex-none place-items-center rounded-full" style={{ backgroundColor: "#e8f0fe" }}>
                  <CheckIcon className="h-3 w-3" style={{ color: BLUE }} />
                </span>
                {t}
              </li>
            ))}
          </ul>
          <Link to="/register" className="mt-8 inline-block rounded-full px-8 py-3.5 font-semibold text-white shadow-lg transition hover:shadow-xl"
                style={{ backgroundColor: BLUE }}>
            Generate a plan
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ================= progress split ================= */

function SplitProgress() {
  return (
    <section id="progress" className="scroll-mt-20 bg-slate-50/70 py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <p className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: BLUE }}>For Parents</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            See the progress without asking for it
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-500">
            Your dashboard shows completion trajectories, per-subject breakdowns and study time.
            Fortnightly check-ins measure whether the plan is actually being followed — and tell
            you when to step in.
          </p>
          <div className="mt-7 grid grid-cols-3 gap-4">
            {[
              { k: "9", l: "subjects tracked" },
              { k: "82%", l: "adherence example" },
              { k: "£0", l: "cost, forever" },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-100">
                <p className="text-2xl font-extrabold" style={{ color: BLUE }}>{s.k}</p>
                <p className="mt-0.5 text-xs text-slate-400">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
        <ProgressIllustration className="order-1 mx-auto w-full max-w-md lg:order-2" />
      </div>
    </section>
  );
}

/* ================= testimonials ================= */

const QUOTES = [
  { name: "A Year 11 parent", role: "Hounslow, London", color: "#4285F4",
    q: "The Foundation-tier alert alone was worth it — we'd never have known Maths was capped at a 5 until it was too late." },
  { name: "A Year 11 student", role: "Lampton School", color: "#f4a742",
    q: "I stopped wondering what to revise. I open today, do the three blocks, tick them off. Done by 7:30." },
  { name: "A busy working parent", role: "Two children on the platform", color: "#42c8a0",
    q: "I check the chart on Sunday evening. Green means we talk about football instead of homework." },
];

function Testimonials() {
  return (
    <section id="testimonials" className="scroll-mt-20 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHead title="Built for real families" sub="The moments GradeSure is designed around." />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {QUOTES.map((t) => (
            <div key={t.name} className="flex flex-col rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
              <QuoteIcon className="h-8 w-8" style={{ color: "#dbeafe" }} />
              <p className="mt-4 flex-1 text-[15px] leading-relaxed text-slate-600">“{t.q}”</p>
              <div className="mt-6 flex items-center gap-3">
                <AvatarIllustration seed={t.color} className="h-12 w-12" />
                <div>
                  <p className="text-sm font-bold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================= mission ================= */

function Mission() {
  return (
    <section id="mission" className="scroll-mt-20 bg-slate-50/70 py-20">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <SectionHead
          title="Our Mission"
          sub="Grade 9 students aren't smarter — they train differently. We exist to give every family that
               training system: active recall over highlighting, past papers over re-reading, and a plan
               that adapts to the child instead of the other way round."
        />
        <div className="mx-auto mt-8 flex flex-wrap justify-center gap-3">
          {["Active recall built-in", "Mark-scheme training", "Free elite resources", "Tier-risk alerts"].map((c) => (
            <span key={c} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-100">
              <CheckIcon className="h-3.5 w-3.5" style={{ color: BLUE }} /> {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================= CTA + footer ================= */

function CTA() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="rounded-3xl px-8 py-14 text-center shadow-xl"
             style={{ background: `linear-gradient(120deg, ${BLUE}, #2b6cd4)` }}>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Start the Grade 8–9 plan tonight
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-blue-100">
            Exam day is already on the calendar. Every week you start earlier compounds.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/register" className="rounded-full bg-white px-8 py-3.5 font-semibold shadow-lg transition hover:bg-blue-50" style={{ color: BLUE }}>
              Create free account
            </Link>
            <Link to="/login" className="rounded-full border-2 border-white/60 px-8 py-3 font-semibold text-white transition hover:bg-white/10">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-slate-900 py-12 text-slate-400">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm sm:flex-row">
        <span className="flex items-center gap-2 text-lg font-extrabold text-white">
          <GradeSureIcon className="h-5 w-5" style={{ color: "#7baaf7" }} />
          Grade<span style={{ color: "#7baaf7" }}>Sure</span>
        </span>
        <p>GCSE Grade 8–9 Master Planner</p>
        <div className="flex gap-6">
          <a href="#features" className="transition hover:text-white">Features</a>
          <a href="#ai" className="transition hover:text-white">AI Planner</a>
          <a href="#mission" className="transition hover:text-white">Mission</a>
        </div>
      </div>
    </footer>
  );
}

function SectionHead({ title, sub }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
      <span className="mx-auto mt-4 block h-1 w-14 rounded-full" style={{ backgroundColor: BLUE }} />
      <p className="mt-5 leading-relaxed text-slate-500">{sub}</p>
    </div>
  );
}

/* ===========================================================================
   Flat unDraw-style illustrations (hand-drawn SVG — the same visual language
   the "Imagine" template uses via undraw_*.svg files).
   Palette: #4285F4 accent · #2f2e41 ink · #ffb8b8 skin · soft blue tints.
   ======================================================================== */

function StudentIllustration(props) {
  return (
    <svg viewBox="0 0 560 430" role="img" aria-label="Student studying at a desk with a laptop, books and a floating study calendar" {...props}>
      {/* backdrop blob + ground */}
      <ellipse cx="290" cy="240" rx="250" ry="185" fill="#e8f0fe" />
      <ellipse cx="290" cy="402" rx="215" ry="14" fill="#dbe7fb" />

      {/* floating calendar card */}
      <g className="anim-float">
        <rect x="352" y="38" width="150" height="118" rx="12" fill="#fff" stroke="#e2e8f0" strokeWidth="2" />
        <rect x="352" y="38" width="150" height="30" rx="12" fill="#4285F4" />
        <rect x="352" y="56" width="150" height="12" fill="#4285F4" />
        <circle cx="368" cy="53" r="4" fill="#fff" opacity=".85" />
        <rect x="380" y="49" width="58" height="8" rx="4" fill="#fff" opacity=".85" />
        {[0, 1, 2].map((r) => (
          <g key={r}>
            <circle cx="370" cy={86 + r * 22} r="6" fill={r < 2 ? "#34a853" : "#e2e8f0"} />
            {r < 2 && <path d={`M367 ${86 + r * 22} l2.2 2.5 4-4.6`} stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" />}
            <rect x="384" y={82 + r * 22} width={r === 1 ? 74 : 92} height="8" rx="4" fill="#e2e8f0" />
          </g>
        ))}
      </g>

      {/* sparkles */}
      <g fill="#f4b942">
        <path d="M116 84 l4 10 10 4 -10 4 -4 10 -4-10 -10-4 10-4z" />
        <path d="M494 208 l3 7 7 3 -7 3 -3 7 -3-7 -7-3 7-3z" opacity=".8" />
        <circle cx="152" cy="150" r="4" fill="#4285F4" opacity=".5" />
      </g>

      {/* desk */}
      <rect x="120" y="300" width="330" height="14" rx="7" fill="#2f2e41" />
      <rect x="142" y="314" width="12" height="88" rx="5" fill="#3f3d56" />
      <rect x="416" y="314" width="12" height="88" rx="5" fill="#3f3d56" />

      {/* books on desk */}
      <g>
        <rect x="366" y="272" width="72" height="10" rx="3" fill="#4285F4" />
        <rect x="372" y="262" width="60" height="10" rx="3" fill="#f4b942" />
        <rect x="378" y="252" width="48" height="10" rx="3" fill="#34a853" />
      </g>

      {/* plant */}
      <g>
        <path d="M150 268 q-16 -30 4 -46 q6 24 4 46z" fill="#34a853" />
        <path d="M158 268 q18 -26 2 -50 q-12 22 -10 50z" fill="#2d9147" />
        <path d="M144 300 h28 l-4 -32 h-20 z" fill="#c96f4a" />
      </g>

      {/* laptop */}
      <g>
        <path d="M232 236 h96 q6 0 6 6 v56 h-108 v-56 q0 -6 6 -6z" fill="#3f3d56" />
        <rect x="234" y="244" width="94" height="46" rx="4" fill="#e8f0fe" />
        <path d="M252 262 h40 M252 272 h58" stroke="#4285F4" strokeWidth="4" strokeLinecap="round" opacity=".7" />
        <path d="M214 298 h134 l8 12 h-150z" fill="#2f2e41" />
      </g>

      {/* student (seated, unDraw-flat) */}
      <g>
        {/* chair */}
        <rect x="150" y="330" width="14" height="72" rx="6" fill="#3f3d56" transform="rotate(8 157 366)" />
        <rect x="236" y="330" width="14" height="72" rx="6" fill="#3f3d56" transform="rotate(-8 243 366)" />
        <rect x="152" y="322" width="96" height="16" rx="8" fill="#2f2e41" />
        <rect x="146" y="212" width="18" height="118" rx="9" fill="#2f2e41" />
        {/* legs */}
        <path d="M196 320 q4 30 -2 46 l-16 22 h18 l18 -26 q6 -22 2 -42z" fill="#3f3d56" />
        <path d="M212 320 q10 26 6 48 l-4 20 h18 l6 -28 q2 -24 -8 -40z" fill="#35334a" />
        {/* torso */}
        <path d="M188 232 q26 -10 44 4 q10 32 4 56 l-52 2 q-6 -34 4 -62z" fill="#4285F4" />
        {/* arm to laptop */}
        <path d="M226 244 q26 14 34 40 l-10 8 q-22 -18 -34 -34z" fill="#4285F4" />
        <circle cx="256" cy="290" r="8" fill="#ffb8b8" />
        {/* neck + head */}
        <rect x="200" y="208" width="14" height="20" rx="6" fill="#ffb8b8" />
        <circle cx="208" cy="192" r="24" fill="#ffb8b8" />
        {/* hair: long bob */}
        <path d="M186 176 q6 -26 30 -22 q22 4 20 30 q-2 14 -8 18 q4 -18 -8 -22 q-4 10 -18 8 q-10 -2 -12 10 q-6 -10 -4 -22z" fill="#2f2e41" />
        <path d="M184 186 q-4 26 6 40 l8 -4 q-8 -16 -6 -34z" fill="#2f2e41" />
      </g>
    </svg>
  );
}

function AiIllustration(props) {
  return (
    <svg viewBox="0 0 520 400" role="img" aria-label="Friendly robot assembling a study calendar" {...props}>
      <ellipse cx="255" cy="215" rx="230" ry="165" fill="#e8f0fe" />
      <ellipse cx="255" cy="372" rx="190" ry="12" fill="#dbe7fb" />

      {/* calendar board */}
      <g>
        <rect x="70" y="72" width="250" height="228" rx="16" fill="#fff" stroke="#e2e8f0" strokeWidth="2" />
        <rect x="70" y="72" width="250" height="44" rx="16" fill="#4285F4" />
        <rect x="70" y="100" width="250" height="16" fill="#4285F4" />
        <rect x="88" y="86" width="110" height="12" rx="6" fill="#fff" opacity=".9" />
        {/* grid: 4x3 cells, some filled */}
        {[0, 1, 2].map((r) =>
          [0, 1, 2, 3].map((c) => {
            const filled = (r === 0 && c < 3) || (r === 1 && c < 2) || (r === 2 && c === 0);
            return (
              <rect key={`${r}${c}`} x={90 + c * 54} y={132 + r * 52} width="44" height="40" rx="8"
                    fill={filled ? "#e8f0fe" : "#f8fafc"} stroke={filled ? "#4285F4" : "#e2e8f0"} strokeWidth="1.5" />
            );
          })
        )}
        {/* ticks in filled cells */}
        {[[0, 0], [0, 1], [1, 0]].map(([r, c]) => (
          <path key={`t${r}${c}`} d={`M${102 + c * 54} ${152 + r * 52} l6 7 11 -13`} stroke="#34a853" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        ))}
        <rect x="102" y="240" width="60" height="8" rx="4" fill="#4285F4" opacity=".5" />
      </g>

      {/* robot */}
      <g className="anim-float-slow">
        {/* antenna */}
        <line x1="405" y1="118" x2="405" y2="140" stroke="#2f2e41" strokeWidth="5" strokeLinecap="round" />
        <circle cx="405" cy="112" r="8" fill="#f4b942" />
        {/* head */}
        <rect x="371" y="138" width="68" height="54" rx="16" fill="#fff" stroke="#2f2e41" strokeWidth="4" />
        <circle cx="392" cy="164" r="6" fill="#4285F4" />
        <circle cx="418" cy="164" r="6" fill="#4285F4" />
        <path d="M396 178 q9 7 18 0" stroke="#2f2e41" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* body */}
        <rect x="363" y="198" width="84" height="86" rx="20" fill="#4285F4" />
        <circle cx="405" cy="238" r="17" fill="#fff" opacity=".95" />
        <path d="M405 227 v22 M394 238 h22" stroke="#4285F4" strokeWidth="4" strokeLinecap="round" />
        {/* left arm placing a tile onto the board */}
        <path d="M366 214 q-30 -6 -42 -28 l10 -10 q22 14 38 24z" fill="#4285F4" />
        <rect x="308" y="160" width="30" height="26" rx="6" fill="#f4b942" stroke="#2f2e41" strokeWidth="3" />
        {/* right arm */}
        <path d="M444 216 q22 10 26 34 l-12 6 q-12 -18 -22 -28z" fill="#3b78dc" />
        {/* legs */}
        <rect x="380" y="284" width="16" height="34" rx="8" fill="#2f2e41" />
        <rect x="414" y="284" width="16" height="34" rx="8" fill="#2f2e41" />
        <ellipse cx="388" cy="322" rx="14" ry="6" fill="#2f2e41" />
        <ellipse cx="422" cy="322" rx="14" ry="6" fill="#2f2e41" />
      </g>

      {/* sparkles */}
      <g fill="#f4b942">
        <path d="M348 84 l4 9 9 4 -9 4 -4 9 -4-9 -9-4 9-4z" />
        <path d="M470 160 l3 7 7 3 -7 3 -3 7 -3-7 -7-3 7-3z" opacity=".85" />
        <circle cx="462" cy="96" r="4" fill="#4285F4" opacity=".5" />
      </g>
    </svg>
  );
}

function ProgressIllustration(props) {
  return (
    <svg viewBox="0 0 520 400" role="img" aria-label="Parent reviewing a rising progress chart" {...props}>
      <ellipse cx="265" cy="212" rx="230" ry="165" fill="#e8f0fe" />
      <ellipse cx="265" cy="372" rx="190" ry="12" fill="#dbe7fb" />

      {/* chart card */}
      <g>
        <rect x="176" y="76" width="270" height="204" rx="16" fill="#fff" stroke="#e2e8f0" strokeWidth="2" />
        <rect x="196" y="96" width="96" height="10" rx="5" fill="#e2e8f0" />
        {/* bars */}
        {[
          { x: 206, h: 52, c: "#c6d8fb" },
          { x: 262, h: 84, c: "#9fc0f8" },
          { x: 318, h: 112, c: "#6ba0f6" },
          { x: 374, h: 142, c: "#4285F4" },
        ].map((b) => (
          <rect key={b.x} x={b.x} y={252 - b.h} width="36" height={b.h} rx="7" fill={b.c} />
        ))}
        {/* trend arrow */}
        <path d="M212 216 L276 184 L330 156 L398 112" stroke="#f4b942" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M382 108 l18 -2 -4 18" stroke="#f4b942" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* adherence donut */}
      <g className="anim-float">
        <circle cx="150" cy="120" r="42" fill="#fff" stroke="#e2e8f0" strokeWidth="2" />
        <circle cx="150" cy="120" r="30" fill="none" stroke="#e8f0fe" strokeWidth="9" />
        <circle cx="150" cy="120" r="30" fill="none" stroke="#34a853" strokeWidth="9"
                strokeDasharray="188.5" strokeDashoffset="34" strokeLinecap="round" transform="rotate(-90 150 120)" />
        <text x="150" y="126" textAnchor="middle" fontSize="17" fontWeight="800" fill="#2f2e41">82%</text>
      </g>

      {/* parent figure */}
      <g>
        {/* legs */}
        <path d="M96 262 q-2 44 4 74 l6 30 h16 l-2 -34 q0 -38 -4 -70z" fill="#2f2e41" />
        <path d="M120 262 q8 42 8 74 l2 30 h16 l2 -36 q-2 -38 -8 -68z" fill="#3f3d56" />
        <ellipse cx="116" cy="370" rx="16" ry="6" fill="#2f2e41" />
        <ellipse cx="142" cy="370" rx="16" ry="6" fill="#2f2e41" />
        {/* torso */}
        <path d="M94 182 q22 -12 44 0 q10 44 4 84 l-54 0 q-6 -44 6 -84z" fill="#f4a742" />
        {/* pointing arm to chart */}
        <path d="M134 192 q34 6 56 2 l0 14 q-30 8 -58 2z" fill="#f4a742" />
        <circle cx="192" cy="200" r="8" fill="#ffb8b8" />
        {/* other arm holding tablet */}
        <path d="M96 196 q-16 22 -12 46 l14 2 q6 -22 12 -38z" fill="#e0963a" />
        <rect x="70" y="234" width="34" height="46" rx="6" fill="#2f2e41" transform="rotate(-12 87 257)" />
        <rect x="76" y="240" width="22" height="32" rx="3" fill="#e8f0fe" transform="rotate(-12 87 256)" />
        {/* neck + head */}
        <rect x="108" y="158" width="14" height="22" rx="6" fill="#ffb8b8" />
        <circle cx="116" cy="142" r="22" fill="#ffb8b8" />
        {/* short professional hair */}
        <path d="M96 132 q4 -24 26 -22 q20 2 18 24 q-2 8 -6 10 q2 -14 -10 -16 q-6 8 -16 6 q-8 -2 -8 10 q-4 -6 -4 -12z" fill="#2f2e41" />
      </g>

      <g fill="#f4b942">
        <path d="M456 300 l3 8 8 3 -8 3 -3 8 -3-8 -8-3 8-3z" opacity=".85" />
        <circle cx="440" cy="70" r="4" fill="#4285F4" opacity=".5" />
      </g>
    </svg>
  );
}

// Simple flat avatar for testimonial personas (deterministic per color).
function AvatarIllustration({ seed = BLUE, ...props }) {
  return (
    <svg viewBox="0 0 48 48" role="img" aria-label="Illustrated avatar" {...props}>
      <circle cx="24" cy="24" r="24" fill="#e8f0fe" />
      <circle cx="24" cy="19" r="9" fill="#ffb8b8" />
      <path d="M15 15 q2 -9 11 -8 q8 1 7 10 q-1 3 -3 4 q1 -7 -5 -8 q-3 4 -8 3 q-2 3 -2 -1z" fill="#2f2e41" />
      <path d="M8 44 q2 -14 16 -14 q14 0 16 14z" fill={seed} />
      <circle cx="48" cy="48" r="0" fill="none" />
    </svg>
  );
}

/* ================= line icons ================= */

function SparkIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" strokeLinejoin="round" />
      <path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z" strokeLinejoin="round" />
    </svg>
  );
}
function CalendarIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 3v4m8-4v4M3 10h18M8 15h3" strokeLinecap="round" />
    </svg>
  );
}
function CheckIconBig(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 5-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function BookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 6c-2-1.8-5-2-8-1v14c3-1 6-.8 8 1 2-1.8 5-2 8-1V5c-3-1-6-.8-8 1z" strokeLinejoin="round" />
      <path d="M12 6v14" strokeLinecap="round" />
    </svg>
  );
}
function ChartIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4 20V10m6 10V4m6 16v-7" strokeLinecap="round" />
      <path d="M2 20h20" strokeLinecap="round" />
    </svg>
  );
}
function TargetIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}
function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" {...props}>
      <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function QuoteIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M6.5 11c-.3 0-.6 0-.9.1C6.1 8.8 7.6 7.4 9 7l-.7-2C5.7 5.8 3 8.4 3 12.7 3 15.3 4.5 17 6.6 17c1.9 0 3.2-1.4 3.2-3.1 0-1.7-1.3-2.9-3.3-2.9zm8.5 0c-.3 0-.6 0-.9.1.5-2.3 2-3.7 3.4-4.1l-.7-2c-2.6.8-5.3 3.4-5.3 7.7 0 2.6 1.5 4.3 3.6 4.3 1.9 0 3.2-1.4 3.2-3.1 0-1.7-1.3-2.9-3.3-2.9z" />
    </svg>
  );
}
