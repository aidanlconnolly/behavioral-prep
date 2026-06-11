/**
 * Seeded question bank for MBA internship recruiting — PE operations + tech.
 * Stable ids (q-<category>-<n>) so reseeds never break user links/answers.
 * importance: 3 = must-have, 2 = common, 1 = occasional.
 */
export type SeedQuestion = {
  id: string;
  categoryId: string;
  text: string;
  importance: 1 | 2 | 3;
  notes: string;
};

export const SEED_QUESTIONS: SeedQuestion[] = [
  /* ── Who you are ─────────────────────────────────────────────────────── */
  {
    id: "q-intro-1",
    categoryId: "cat-intro",
    text: "Tell me about yourself.",
    importance: 3,
    notes:
      "90 seconds, max. Past → present → why this seat. End on why you're in the room, not on a trailing detail.",
  },
  {
    id: "q-intro-2",
    categoryId: "cat-intro",
    text: "Walk me through your resume.",
    importance: 3,
    notes:
      "Same spine as 'about yourself' but anchored to the choices: why each move, what you delivered, what it set up.",
  },
  {
    id: "q-intro-3",
    categoryId: "cat-intro",
    text: "What do you do outside of work?",
    importance: 1,
    notes: "Have one real interest with a specific detail — generic answers read as evasive.",
  },
  {
    id: "q-intro-4",
    categoryId: "cat-intro",
    text: "How would a close friend describe you?",
    importance: 1,
    notes: "Pick two traits you can back with stories already in your bank.",
  },

  /* ── Why MBA ─────────────────────────────────────────────────────────── */
  {
    id: "q-whymba-1",
    categoryId: "cat-why-mba",
    text: "Why did you decide to get an MBA, and why now?",
    importance: 3,
    notes: "Tie to a concrete capability gap, not 'broadening my network'.",
  },
  {
    id: "q-whymba-2",
    categoryId: "cat-why-mba",
    text: "Why did you choose your school?",
    importance: 2,
    notes: "Name specific programs, professors, or clubs you actually use.",
  },
  {
    id: "q-whymba-3",
    categoryId: "cat-why-mba",
    text: "What do you want to get out of the next two years?",
    importance: 1,
    notes: "",
  },
  {
    id: "q-whymba-4",
    categoryId: "cat-why-mba",
    text: "How has business school changed how you think so far?",
    importance: 1,
    notes: "",
  },

  /* ── Why this industry ───────────────────────────────────────────────── */
  {
    id: "q-whyind-1",
    categoryId: "cat-why-industry",
    text: "Why private equity?",
    importance: 3,
    notes: "Ownership + speed + consequence. Ground it in something you've done, not something you've read.",
  },
  {
    id: "q-whyind-2",
    categoryId: "cat-why-industry",
    text: "Why portfolio operations rather than a deal-side seat?",
    importance: 3,
    notes:
      "The classic filter question. Show you understand the trade (no carry-economics fantasy) and genuinely prefer building over buying.",
  },
  {
    id: "q-whyind-3",
    categoryId: "cat-why-industry",
    text: "Why tech?",
    importance: 2,
    notes: "For tech-track interviews. Connect product/scale dynamics to your own experience.",
  },
  {
    id: "q-whyind-4",
    categoryId: "cat-why-industry",
    text: "Why this function, specifically?",
    importance: 2,
    notes: "Product vs. ops vs. strategy — know why this one and not the adjacent ones.",
  },
  {
    id: "q-whyind-5",
    categoryId: "cat-why-industry",
    text: "Why not go back to consulting?",
    importance: 3,
    notes:
      "Respect the old seat, then name what it couldn't give you: ownership of outcomes past the recommendation.",
  },
  {
    id: "q-whyind-6",
    categoryId: "cat-why-industry",
    text: "Where do you think this industry is heading over the next five years?",
    importance: 1,
    notes: "Have one defensible point of view with a number or example in it.",
  },

  /* ── Why this company (generic templates — answer per Target) ────────── */
  {
    id: "q-whyco-1",
    categoryId: "cat-why-company",
    text: "Why us specifically?",
    importance: 3,
    notes:
      "Answer this per firm on its Target page. Model + people + mandate — one specific deal, product, or conversation.",
  },
  {
    id: "q-whyco-2",
    categoryId: "cat-why-company",
    text: "What do you know about how we work?",
    importance: 2,
    notes: "Operating model, team size, how they engage portfolio companies / ship product.",
  },
  {
    id: "q-whyco-3",
    categoryId: "cat-why-company",
    text: "Who else are you recruiting with, and how do we compare?",
    importance: 2,
    notes: "Be honest, stay positive, and have a real reason they're top of list.",
  },
  {
    id: "q-whyco-4",
    categoryId: "cat-why-company",
    text: "If you had offers from us and your top alternative, how would you decide?",
    importance: 2,
    notes: "",
  },
  {
    id: "q-whyco-5",
    categoryId: "cat-why-company",
    text: "What would make you turn us down?",
    importance: 1,
    notes: "A thoughtful, honest answer here builds more credibility than a dodge.",
  },

  /* ── Career goals ────────────────────────────────────────────────────── */
  {
    id: "q-goals-1",
    categoryId: "cat-career-goals",
    text: "Where do you see yourself in five years?",
    importance: 3,
    notes: "A coherent arc this internship obviously advances. Specific > grandiose.",
  },
  {
    id: "q-goals-2",
    categoryId: "cat-career-goals",
    text: "What are your short-term and long-term career goals?",
    importance: 2,
    notes: "",
  },
  {
    id: "q-goals-3",
    categoryId: "cat-career-goals",
    text: "How does this internship fit into your plan?",
    importance: 2,
    notes: "Signal return-offer intent — internships are auditions, not experiments.",
  },
  {
    id: "q-goals-4",
    categoryId: "cat-career-goals",
    text: "What will you do if this path doesn't work out?",
    importance: 1,
    notes: "",
  },
  {
    id: "q-goals-5",
    categoryId: "cat-career-goals",
    text: "What roles did you decide NOT to pursue, and why?",
    importance: 1,
    notes: "Shows the choice was deliberate, not default.",
  },

  /* ── Leadership ──────────────────────────────────────────────────────── */
  {
    id: "q-lead-1",
    categoryId: "cat-leadership",
    text: "Tell me about a time you led a team.",
    importance: 3,
    notes: "The anchor leadership story: clear stakes, your decisions, a quantified result.",
  },
  {
    id: "q-lead-2",
    categoryId: "cat-leadership",
    text: "Tell me about a time you led a team through an ambiguous, high-pressure situation.",
    importance: 3,
    notes: "",
  },
  {
    id: "q-lead-3",
    categoryId: "cat-leadership",
    text: "Describe a time you led people more senior than you, or who didn't report to you.",
    importance: 3,
    notes: "Doubles as an influence story — central to PE ops, where you never own the org chart.",
  },
  {
    id: "q-lead-4",
    categoryId: "cat-leadership",
    text: "Tell me about a time you had to motivate an underperforming team or person.",
    importance: 2,
    notes: "",
  },
  {
    id: "q-lead-5",
    categoryId: "cat-leadership",
    text: "Tell me about a time you delegated something important.",
    importance: 1,
    notes: "",
  },
  {
    id: "q-lead-6",
    categoryId: "cat-leadership",
    text: "What's the hardest people decision you've made?",
    importance: 2,
    notes: "",
  },
  {
    id: "q-lead-7",
    categoryId: "cat-leadership",
    text: "How would your team describe your leadership style? Give me an example.",
    importance: 2,
    notes: "Name the style in one phrase, then prove it with a story beat.",
  },

  /* ── Teamwork ────────────────────────────────────────────────────────── */
  {
    id: "q-team-1",
    categoryId: "cat-teamwork",
    text: "Tell me about a time you worked on a team that was struggling.",
    importance: 2,
    notes: "What you did to change the trajectory — not just what was wrong.",
  },
  {
    id: "q-team-2",
    categoryId: "cat-teamwork",
    text: "What role do you typically play on a team? Give me an example.",
    importance: 2,
    notes: "",
  },
  {
    id: "q-team-3",
    categoryId: "cat-teamwork",
    text: "Tell me about working closely with someone very different from you.",
    importance: 2,
    notes: "",
  },
  {
    id: "q-team-4",
    categoryId: "cat-teamwork",
    text: "Tell me about a time you helped a teammate at a cost to yourself.",
    importance: 1,
    notes: "",
  },
  {
    id: "q-team-5",
    categoryId: "cat-teamwork",
    text: "Tell me about a time a teammate's idea was better than yours.",
    importance: 1,
    notes: "Tests ego. Show you recognized it fast and amplified it.",
  },
  {
    id: "q-team-6",
    categoryId: "cat-teamwork",
    text: "How do you build trust quickly with a new team or client?",
    importance: 2,
    notes: "Have a repeatable mechanism plus one example — useful for the PortCo context.",
  },

  /* ── Conflict ────────────────────────────────────────────────────────── */
  {
    id: "q-conf-1",
    categoryId: "cat-conflict",
    text: "Tell me about a disagreement with your manager or a senior stakeholder. How did you handle it?",
    importance: 3,
    notes: "Disagree on substance, stay loyal to the relationship. End with the outcome.",
  },
  {
    id: "q-conf-2",
    categoryId: "cat-conflict",
    text: "Describe a difficult client or stakeholder. What did you do?",
    importance: 3,
    notes: "In PE ops this is the resistant PortCo CEO question in disguise.",
  },
  {
    id: "q-conf-3",
    categoryId: "cat-conflict",
    text: "Tell me about a time you got serious pushback on a recommendation.",
    importance: 3,
    notes: "",
  },
  {
    id: "q-conf-4",
    categoryId: "cat-conflict",
    text: "Tell me about a conflict within your team that you had to resolve.",
    importance: 2,
    notes: "",
  },
  {
    id: "q-conf-5",
    categoryId: "cat-conflict",
    text: "Tell me about a time you were wrong in a disagreement.",
    importance: 2,
    notes: "How fast did you update, and what did you do about it publicly?",
  },
  {
    id: "q-conf-6",
    categoryId: "cat-conflict",
    text: "Tell me about delivering an unpopular or uncomfortable message.",
    importance: 2,
    notes: "Data-backed candor, delivered with respect — a core operator skill.",
  },

  /* ── Influence ───────────────────────────────────────────────────────── */
  {
    id: "q-infl-1",
    categoryId: "cat-influence",
    text: "Tell me about a time you influenced an outcome without formal authority.",
    importance: 3,
    notes: "THE PE-ops question. Coalition, credibility, data — pick your lever and show it working.",
  },
  {
    id: "q-infl-2",
    categoryId: "cat-influence",
    text: "Tell me about changing the mind of a skeptic.",
    importance: 3,
    notes: "",
  },
  {
    id: "q-infl-3",
    categoryId: "cat-influence",
    text: "How have you sold an idea up the chain?",
    importance: 2,
    notes: "",
  },
  {
    id: "q-infl-4",
    categoryId: "cat-influence",
    text: "Tell me about getting buy-in across functions or organizations.",
    importance: 2,
    notes: "",
  },
  {
    id: "q-infl-5",
    categoryId: "cat-influence",
    text: "Tell me about a recommendation that was initially rejected. How did you get it adopted?",
    importance: 2,
    notes: "Persistence with a changed approach — not just repetition at higher volume.",
  },
  {
    id: "q-infl-6",
    categoryId: "cat-influence",
    text: "Tell me about negotiating a compromise between parties who wanted different things.",
    importance: 1,
    notes: "",
  },

  /* ── Failure & feedback ──────────────────────────────────────────────── */
  {
    id: "q-fail-1",
    categoryId: "cat-failure",
    text: "Tell me about a time you failed.",
    importance: 3,
    notes:
      "A real failure with real stakes — then the specific behavior you changed. No humblebrags.",
  },
  {
    id: "q-fail-2",
    categoryId: "cat-failure",
    text: "Tell me about a mistake you made at work and how you handled it.",
    importance: 3,
    notes: "Own it fast, fix it, install the guardrail.",
  },
  {
    id: "q-fail-3",
    categoryId: "cat-failure",
    text: "What's the toughest feedback you've ever received?",
    importance: 2,
    notes: "Quote it almost verbatim — vague feedback stories sound invented.",
  },
  {
    id: "q-fail-4",
    categoryId: "cat-failure",
    text: "Tell me about a goal you didn't meet.",
    importance: 2,
    notes: "",
  },
  {
    id: "q-fail-5",
    categoryId: "cat-failure",
    text: "Tell me about a time you took on too much.",
    importance: 1,
    notes: "",
  },
  {
    id: "q-fail-6",
    categoryId: "cat-failure",
    text: "Looking back, what would you do differently in your career so far?",
    importance: 1,
    notes: "",
  },

  /* ── Ambiguity & pressure ────────────────────────────────────────────── */
  {
    id: "q-ambig-1",
    categoryId: "cat-ambiguity",
    text: "Tell me about making a decision with incomplete information.",
    importance: 3,
    notes: "Show the 80/20: what you knew, what you bounded, when you decided to move.",
  },
  {
    id: "q-ambig-2",
    categoryId: "cat-ambiguity",
    text: "Tell me about a time priorities shifted dramatically mid-project.",
    importance: 2,
    notes: "",
  },
  {
    id: "q-ambig-3",
    categoryId: "cat-ambiguity",
    text: "Tell me about having to learn something quickly to deliver.",
    importance: 2,
    notes: "Useful for the 'you've never worked in our sector' objection.",
  },
  {
    id: "q-ambig-4",
    categoryId: "cat-ambiguity",
    text: "Describe a project where there was no playbook.",
    importance: 2,
    notes: "",
  },
  {
    id: "q-ambig-5",
    categoryId: "cat-ambiguity",
    text: "How do you handle competing deadlines? Give me a real example.",
    importance: 2,
    notes: "",
  },

  /* ── Analytical & judgment ───────────────────────────────────────────── */
  {
    id: "q-anal-1",
    categoryId: "cat-analytical",
    text: "Walk me through the most complex problem you've solved.",
    importance: 3,
    notes: "Structure first (how you decomposed it), then insight, then impact.",
  },
  {
    id: "q-anal-2",
    categoryId: "cat-analytical",
    text: "Tell me about a data-driven recommendation that changed a decision.",
    importance: 3,
    notes: "",
  },
  {
    id: "q-anal-3",
    categoryId: "cat-analytical",
    text: "Tell me about simplifying a messy analysis for senior executives.",
    importance: 2,
    notes: "The so-what in one sentence, the backup in your pocket.",
  },
  {
    id: "q-anal-4",
    categoryId: "cat-analytical",
    text: "Tell me about a judgment call where the data was ambiguous or conflicting.",
    importance: 2,
    notes: "",
  },
  {
    id: "q-anal-5",
    categoryId: "cat-analytical",
    text: "Tell me about catching an error everyone else missed.",
    importance: 1,
    notes: "",
  },

  /* ── Initiative & ownership ──────────────────────────────────────────── */
  {
    id: "q-init-1",
    categoryId: "cat-initiative",
    text: "Tell me about going beyond your job description.",
    importance: 3,
    notes: "",
  },
  {
    id: "q-init-2",
    categoryId: "cat-initiative",
    text: "Tell me about spotting an opportunity others missed and acting on it.",
    importance: 2,
    notes: "",
  },
  {
    id: "q-init-3",
    categoryId: "cat-initiative",
    text: "Tell me about building something from scratch.",
    importance: 2,
    notes: "Process, product, team, or tool — emphasize the zero-to-one decisions.",
  },
  {
    id: "q-init-4",
    categoryId: "cat-initiative",
    text: "Tell me about improving a process nobody asked you to improve.",
    importance: 2,
    notes: "",
  },
  {
    id: "q-init-5",
    categoryId: "cat-initiative",
    text: "What have you taught yourself recently, and how did you apply it?",
    importance: 1,
    notes: "",
  },

  /* ── Ethics & integrity ──────────────────────────────────────────────── */
  {
    id: "q-eth-1",
    categoryId: "cat-ethics",
    text: "Tell me about an ethical dilemma you faced at work.",
    importance: 2,
    notes: "Name the competing pressures honestly; show the line you wouldn't cross.",
  },
  {
    id: "q-eth-2",
    categoryId: "cat-ethics",
    text: "Tell me about a time you were pressured to cut corners.",
    importance: 2,
    notes: "",
  },
  {
    id: "q-eth-3",
    categoryId: "cat-ethics",
    text: "Tell me about speaking up about something you thought was wrong.",
    importance: 2,
    notes: "",
  },
  {
    id: "q-eth-4",
    categoryId: "cat-ethics",
    text: "Describe balancing loyalty to a colleague against honesty to the organization.",
    importance: 1,
    notes: "",
  },

  /* ── Strengths & weaknesses ──────────────────────────────────────────── */
  {
    id: "q-sw-1",
    categoryId: "cat-strengths",
    text: "What are your greatest strengths?",
    importance: 3,
    notes: "Two or three, each instantly backed by a story already in your bank.",
  },
  {
    id: "q-sw-2",
    categoryId: "cat-strengths",
    text: "What's a real weakness, and what are you doing about it?",
    importance: 3,
    notes:
      "A genuine weakness with a visible mitigation system. Not 'I work too hard.'",
  },
  {
    id: "q-sw-3",
    categoryId: "cat-strengths",
    text: "What would your last manager say about you?",
    importance: 2,
    notes: "Borrow language from a real review — it sounds different and better.",
  },
  {
    id: "q-sw-4",
    categoryId: "cat-strengths",
    text: "What feedback do you hear repeatedly?",
    importance: 2,
    notes: "",
  },
  {
    id: "q-sw-5",
    categoryId: "cat-strengths",
    text: "What will you struggle with most in this role?",
    importance: 2,
    notes: "Shows you actually understand the seat. Pair it with how you'd manage it.",
  },

  /* ── Questions for them ──────────────────────────────────────────────── */
  {
    id: "q-rev-1",
    categoryId: "cat-reverse",
    text: "Ask: What separates the interns who get return offers from the ones who don't?",
    importance: 3,
    notes: "Signals return-offer intent and invites them to coach you.",
  },
  {
    id: "q-rev-2",
    categoryId: "cat-reverse",
    text: "Ask: How does the team split time across portfolio companies / products right now?",
    importance: 2,
    notes: "Shows you understand the operating model. Adapt per firm.",
  },
  {
    id: "q-rev-3",
    categoryId: "cat-reverse",
    text: "Ask: What would my first 90 days actually look like?",
    importance: 2,
    notes: "",
  },
  {
    id: "q-rev-4",
    categoryId: "cat-reverse",
    text: "Ask: How has the team's mandate changed over the past year?",
    importance: 2,
    notes: "Gets them talking about strategy — listen for what they're proud of.",
  },
  {
    id: "q-rev-5",
    categoryId: "cat-reverse",
    text: "Ask: What's the biggest challenge across the portfolio (or product) right now?",
    importance: 2,
    notes: "Then connect their answer back to something in your background.",
  },
];
