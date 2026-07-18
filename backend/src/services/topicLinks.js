// ===========================================================================
// Topic-exact resource links. Instead of a subject's homepage, every recorded
// task gets links that land on THAT topic, using each provider's stable
// deep-link patterns (channel-scoped YouTube search, WordPress site search,
// BBC Bitesize search, Quizlet set search, site-scoped web search). These
// patterns are stable and cannot 404 the way hand-guessed page URLs can.
// ===========================================================================

const enc = encodeURIComponent;
const yt = (handle, q) => `https://www.youtube.com/${handle}/search?query=${enc(q)}`;
const ytAll = (q) => `https://www.youtube.com/results?search_query=${enc(q)}`;
const bitesize = (q) => `https://www.bbc.co.uk/bitesize/search?q=${enc(q)}`;
const wp = (domain, q) => `https://${domain}/?s=${enc(q)}`;
const siteSearch = (domain, q) => `https://www.google.com/search?q=${enc(`site:${domain} ${q}`)}`;
const quizlet = (q) => `https://quizlet.com/search?query=${enc(q)}&type=sets`;

// Distil a topic title into a focused search query.
// "Quadratics: factorising, formula, completing square" -> "Quadratics factorising formula completing square"
export function topicQuery(title) {
  return String(title || "")
    .replace(/\(.*?\)/g, " ")          // drop parentheticals
    .replace(/[:&,+./–—-]+/g, " ")     // punctuation -> spaces
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 6)
    .join(" ");
}

// Per-subject link builders (2–3 topic-exact links each).
const TEMPLATES = {
  maths: (q) => [
    { name: "Corbettmaths", url: wp("corbettmaths.com", q), tag: `Videos & worksheets: ${q}` },
    { name: "The GCSE Maths Tutor", url: yt("@TheGCSEMathsTutor", q), tag: `Walkthroughs: ${q}` },
    { name: "Maths Genie", url: siteSearch("mathsgenie.co.uk", q), tag: `Topic questions: ${q}` },
  ],
  combined_science: (q) => [
    { name: "Cognito", url: yt("@cognitoedu", q), tag: `Topic videos: ${q}` },
    { name: "Freesciencelessons", url: yt("@Freesciencelessons", q), tag: `AQA lessons: ${q}` },
    { name: "BBC Bitesize", url: bitesize(`GCSE ${q}`), tag: `Revision notes: ${q}` },
  ],
  biology: (q) => TEMPLATES.combined_science(q),
  chemistry: (q) => TEMPLATES.combined_science(q),
  physics: (q) => TEMPLATES.combined_science(q),
  english_lit: (q) => [
    { name: "Mr Bruff", url: yt("@mrbruff", q), tag: `Analysis videos: ${q}` },
    { name: "Mr Salles", url: yt("@MrSallesTeachesEnglish", q), tag: `Top-band technique: ${q}` },
    { name: "BBC Bitesize", url: bitesize(`GCSE English Literature ${q}`), tag: `Notes: ${q}` },
  ],
  english_lang: (q) => [
    { name: "Mr Bruff", url: yt("@mrbruff", `English Language ${q}`), tag: `Question technique: ${q}` },
    { name: "First Rate Tutors", url: yt("@FirstRateTutors", q), tag: `Model answers: ${q}` },
    { name: "BBC Bitesize", url: bitesize(`GCSE English Language ${q}`), tag: `Notes: ${q}` },
  ],
  computer_science: (q) => [
    { name: "Craig 'n' Dave", url: yt("@craigndave", q), tag: `OCR J277 videos: ${q}` },
    { name: "BBC Bitesize", url: bitesize(`GCSE Computer Science ${q}`), tag: `Notes: ${q}` },
    { name: "PMT", url: siteSearch("physicsandmathstutor.com", `GCSE computer science ${q}`), tag: `Questions: ${q}` },
  ],
  sociology: (q) => [
    { name: "The Sociology Guy", url: yt("@TheSociologyGuy", q), tag: `Topic videos: ${q}` },
    { name: "tutor2u", url: siteSearch("tutor2u.net", `GCSE sociology ${q}`), tag: `Notes: ${q}` },
    { name: "BBC Bitesize", url: bitesize(`GCSE Sociology ${q}`), tag: `Revision: ${q}` },
  ],
  religious_studies: (q) => [
    { name: "Mr McMillan", url: yt("@McMillanRevis", q), tag: `AQA RS videos: ${q}` },
    { name: "BBC Bitesize", url: bitesize(`GCSE Religious Studies ${q}`), tag: `Notes: ${q}` },
    { name: "YouTube", url: ytAll(`AQA GCSE RS ${q}`), tag: `More videos: ${q}` },
  ],
  french: (q) => [
    { name: "YouTube", url: ytAll(`AQA GCSE French ${q}`), tag: `Topic videos: ${q}` },
    { name: "Quizlet", url: quizlet(`GCSE French ${q}`), tag: `Flashcard sets: ${q}` },
    { name: "BBC Bitesize", url: bitesize(`GCSE French ${q}`), tag: `Notes & tests: ${q}` },
  ],
  spanish: (q) => [
    { name: "YouTube", url: ytAll(`AQA GCSE Spanish ${q}`), tag: `Topic videos: ${q}` },
    { name: "Quizlet", url: quizlet(`GCSE Spanish ${q}`), tag: `Flashcard sets: ${q}` },
    { name: "BBC Bitesize", url: bitesize(`GCSE Spanish ${q}`), tag: `Notes & tests: ${q}` },
  ],
  german: (q) => [
    { name: "YouTube", url: ytAll(`AQA GCSE German ${q}`), tag: `Topic videos: ${q}` },
    { name: "Quizlet", url: quizlet(`GCSE German ${q}`), tag: `Flashcard sets: ${q}` },
    { name: "BBC Bitesize", url: bitesize(`GCSE German ${q}`), tag: `Notes & tests: ${q}` },
  ],
  geography: (q) => [
    { name: "Internet Geography", url: wp("www.internetgeography.net", q), tag: `Case studies: ${q}` },
    { name: "Time for Geography", url: yt("@TimeforGeographyUK", q), tag: `Topic videos: ${q}` },
    { name: "BBC Bitesize", url: bitesize(`GCSE Geography ${q}`), tag: `Revision: ${q}` },
  ],
};

/**
 * Topic-exact resource links for a recorded task.
 * Falls back to Bitesize + YouTube scoped by subject for catalog extras.
 */
export function topicResources(subjectKey, subjectName, topicTitle) {
  const q = topicQuery(topicTitle);
  const build = TEMPLATES[subjectKey];
  if (build) return build(q);
  const scoped = `GCSE ${subjectName} ${q}`.trim();
  return [
    { name: "BBC Bitesize", url: bitesize(scoped), tag: `Notes: ${q}` },
    { name: "YouTube", url: ytAll(scoped), tag: `Videos: ${q}` },
  ];
}
