// ===========================================================================
// Free & elite-quality resource directory, mapped to the student's real boards.
// These power the "Resources" page and the clickable links inside daily tasks.
// ===========================================================================

export const RESOURCES = {
  maths: {
    subject: "Mathematics",
    board: "Edexcel",
    note: "Push for HIGHER tier — Foundation caps the grade at 5. Grades 8-9 require Higher.",
    resources: [
      { name: "Maths Genie", type: "Website + Videos", url: "https://www.mathsgenie.co.uk/", tag: "Graded past-paper questions by topic" },
      { name: "Corbettmaths", type: "Videos + Worksheets", url: "https://corbettmaths.com/", tag: "5-a-day + exam questions" },
      { name: "The GCSE Maths Tutor", type: "YouTube", url: "https://www.youtube.com/@TheGCSEMathsTutor", tag: "Full walk-throughs" },
      { name: "Physics & Maths Tutor (Maths)", type: "Past papers", url: "https://www.physicsandmathstutor.com/maths-revision/gcse-edexcel/", tag: "Edexcel papers + solutions" },
      { name: "Dr Frost Maths", type: "Free practice platform", url: "https://www.drfrost.org/", tag: "Auto-marked practice + tracking" },
    ],
  },
  combined_science: {
    subject: "Combined Science",
    board: "AQA (Higher)",
    resources: [
      { name: "Cognito", type: "YouTube", url: "https://www.youtube.com/@cognitoedu", tag: "Concise AQA-aligned videos + quizzes" },
      { name: "Freesciencelessons", type: "YouTube", url: "https://www.youtube.com/@Freesciencelessons", tag: "Every AQA topic, exam-focused" },
      { name: "Physics & Maths Tutor (Science)", type: "Past papers + notes", url: "https://www.physicsandmathstutor.com/", tag: "Topic questions + mark schemes" },
      { name: "Primrose Kitten", type: "YouTube", url: "https://www.youtube.com/@PrimroseKitten", tag: "Required practicals + predictions" },
      { name: "Save My Exams (AQA Science)", type: "Notes + questions", url: "https://www.savemyexams.com/gcse/", tag: "Revision notes (some free)" },
    ],
  },
  english_lit: {
    subject: "English Literature",
    board: "Edexcel",
    note: "Set texts: Macbeth · A Christmas Carol · Power & Conflict poetry · An Inspector Calls.",
    resources: [
      { name: "Mr Bruff", type: "YouTube", url: "https://www.youtube.com/@mrbruff", tag: "Text-by-text analysis + essay technique" },
      { name: "First Rate Tutors", type: "YouTube", url: "https://www.youtube.com/@FirstRateTutors", tag: "Grade 9 model paragraphs" },
      { name: "Mr Salles Teaches English", type: "YouTube", url: "https://www.youtube.com/@MrSallesTeachesEnglish", tag: "How to hit top bands" },
      { name: "SparkNotes / Genius (quotes)", type: "Reference", url: "https://www.sparknotes.com/", tag: "Plot, themes, quote hunting" },
      { name: "Seneca Learning", type: "Free courses", url: "https://senecalearning.com/", tag: "Free active-recall for set texts" },
    ],
  },
  english_lang: {
    subject: "English Language",
    board: "AQA",
    resources: [
      { name: "Mr Bruff (Language)", type: "YouTube", url: "https://www.youtube.com/@mrbruff", tag: "Paper 1 & 2 question walkthroughs" },
      { name: "First Rate Tutors (Language)", type: "YouTube", url: "https://www.youtube.com/@FirstRateTutors", tag: "Q5 writing structures" },
      { name: "AQA GCSE English Language", type: "Past papers", url: "https://www.aqa.org.uk/subjects/english/gcse/english-language-8700/assessment-resources", tag: "Official papers + mark schemes" },
      { name: "Save My Exams (Eng Lang)", type: "Notes", url: "https://www.savemyexams.com/gcse/english-language/aqa/", tag: "Technique guides" },
    ],
  },
  computer_science: {
    subject: "Computer Science",
    board: "OCR J277",
    resources: [
      { name: "Craig 'n' Dave", type: "YouTube + Site", url: "https://www.youtube.com/@craigndave", tag: "THE J277-specific channel" },
      { name: "Isaac Computer Science", type: "Free platform", url: "https://isaaccs.org/", tag: "Free questions + topic mastery" },
      { name: "OCR J277 Specification", type: "Official", url: "https://www.ocr.org.uk/qualifications/gcse/computer-science-j277-from-2020/", tag: "Spec + past papers" },
      { name: "Physics & Maths Tutor (CS)", type: "Past papers", url: "https://www.physicsandmathstutor.com/computer-science-revision/gcse-ocr/", tag: "OCR papers + notes" },
    ],
  },
  sociology: {
    subject: "Sociology",
    board: "AQA",
    resources: [
      { name: "The Sociology Guy", type: "YouTube", url: "https://www.youtube.com/@TheSociologyGuy", tag: "AQA-specific topic videos" },
      { name: "tutor2u Sociology", type: "Notes + Q&A", url: "https://www.tutor2u.net/sociology", tag: "Study notes + exam technique" },
      { name: "AQA GCSE Sociology", type: "Past papers", url: "https://www.aqa.org.uk/subjects/sociology/gcse/sociology-8192/assessment-resources", tag: "Official papers" },
      { name: "Seneca (Sociology)", type: "Free courses", url: "https://senecalearning.com/", tag: "Free active recall" },
    ],
  },
  religious_studies: {
    subject: "Religious Studies",
    board: "AQA",
    resources: [
      { name: "Ben Wardle (RS)", type: "YouTube", url: "https://www.youtube.com/results?search_query=ben+wardle+RS", tag: "AQA RS topic + exam answers" },
      { name: "Mr McMillanREvis", type: "YouTube", url: "https://www.youtube.com/@McMillanRevis", tag: "Full AQA RS coverage" },
      { name: "AQA GCSE RS A", type: "Past papers", url: "https://www.aqa.org.uk/subjects/religious-studies/gcse/religious-studies-a-8062/assessment-resources", tag: "Official papers + mark schemes" },
      { name: "Seneca (RS)", type: "Free courses", url: "https://senecalearning.com/", tag: "Free recall practice" },
    ],
  },
  french: {
    subject: "French",
    board: "AQA",
    note: "Push for HIGHER tier — Foundation caps the grade at 5.",
    resources: [
      { name: "Mr Salles / Senor / French YT", type: "YouTube", url: "https://www.youtube.com/results?search_query=AQA+GCSE+French+revision", tag: "Speaking + writing models" },
      { name: "Quizlet (French vocab)", type: "Flashcards", url: "https://quizlet.com/en-gb", tag: "Spaced-repetition vocab" },
      { name: "Language Gym", type: "Practice", url: "https://www.language-gym.com/", tag: "Verb + vocab drills" },
      { name: "AQA GCSE French", type: "Past papers", url: "https://www.aqa.org.uk/subjects/languages/gcse/french-8658/assessment-resources", tag: "Official papers" },
      { name: "Kerboodle / Duolingo (support)", type: "App", url: "https://www.duolingo.com/", tag: "Daily habit builder" },
    ],
  },
  geography: {
    subject: "Geography",
    board: "AQA",
    resources: [
      { name: "Internet Geography", type: "Website", url: "https://www.internetgeography.net/", tag: "AQA case studies + revision" },
      { name: "Mr Kelly Geography / Time for Geography", type: "YouTube", url: "https://www.youtube.com/@TimeforGeographyUK", tag: "Fieldwork + physical geog" },
      { name: "AQA GCSE Geography", type: "Past papers", url: "https://www.aqa.org.uk/subjects/geography/gcse/geography-8035/assessment-resources", tag: "Official papers + mark schemes" },
      { name: "Seneca (Geography)", type: "Free courses", url: "https://senecalearning.com/", tag: "Free active recall" },
    ],
  },
};

// Cross-subject essentials.
export const GENERAL_RESOURCES = [
  { name: "Revision World (Past Papers)", type: "All subjects", url: "https://revisionworld.com/gcse-revision/gcse-exam-past-papers", tag: "Free past papers, all boards" },
  { name: "Physics & Maths Tutor", type: "All subjects", url: "https://www.physicsandmathstutor.com/", tag: "Notes, topic questions, mark schemes" },
  { name: "Seneca Learning", type: "All subjects", url: "https://senecalearning.com/", tag: "100% free, active recall, parent tracking" },
  { name: "Anki / Quizlet", type: "Flashcards", url: "https://apps.ankiweb.net/", tag: "Spaced repetition for quotes/formulae/vocab" },
  { name: "BBC Bitesize", type: "All subjects", url: "https://www.bbc.co.uk/bitesize/levels/z98jmp3", tag: "Bite-size revision + tests" },
];
