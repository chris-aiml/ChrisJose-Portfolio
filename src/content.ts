/**
 * Single source of truth for every word on the site.
 * Every line traces to: Tech resume, Management resume, the Design certificate,
 * the Lucen MVP file, the Figma Weave diagram, or to Chris's own brief/corrections.
 * Exclusions are enforced by scripts/audit.mjs (banned-term scan of the rendered page and CVs).
 */

export const BRAND = { mark: '[CJ]', name: 'CHRIS JOSE', tag: 'PRODUCT · SYSTEMS · DESIGN' }

export type ChapterId =
  | 'intro' | 'about' | 'leadership' | 'plix' | 'lucen' | 'hardware'
  | 'capabilities' | 'resume' | 'contact'

export interface Chapter {
  id: ChapterId
  n: string
  label: string
  /** progress (0..1) at which this chapter's act begins */
  p: number
  /** desktop track height */
  h: string
  pin: boolean
}

export const CHAPTERS: Chapter[] = [
  { id: 'intro',        n: '01', label: 'INTRO',        p: 0, h: '300svh', pin: true },
  { id: 'about',        n: '02', label: 'ABOUT',        p: 0, h: '300svh', pin: true },
  { id: 'leadership',   n: '03', label: 'LEADERSHIP',   p: 0, h: '340svh', pin: true },
  { id: 'plix',         n: '04', label: 'PLIX',         p: 0, h: '360svh', pin: true },
  { id: 'lucen',        n: '05', label: 'LUCEN',        p: 0, h: '360svh', pin: true },
  { id: 'hardware',     n: '06', label: 'DESIGN PATENT', p: 0, h: '520svh', pin: true },
  { id: 'capabilities', n: '07', label: 'CAPABILITIES', p: 0, h: '620svh', pin: true },
  { id: 'resume',       n: '08', label: 'RESUME',       p: 0, h: '260svh', pin: true },
  { id: 'contact',      n: '09', label: 'CONTACT',      p: 0, h: '240svh', pin: true },
]

export const INTRO = {
  index: '01 / INTRO',
  line1: 'Leader,',
  line2: 'Builder',
}

export const ABOUT = {
  index: '02 / ABOUT',
  headline: 'The short version',
  aside: '(literally)',
  paragraphs: [
    "I've led over 900 people, directly and through the teams under me. That includes the Student Council, 230+ student-led events, and a team of 200 for Infinity 2026, our flagship event with over 5,000 attendees.",
    'Leadership, for me, has always been about people just as much as getting things done. I try to understand where people are coming from, make space for different perspectives, and ensure that everyone feels heard and valued. I believe the best work happens when people feel comfortable contributing, taking ownership and growing together.',
    'At Plix I architected the generative-AI workflow that turns a product image and a reference into finished ads. It cut iteration from hours to minutes.',
    "Outside work I'm part of a design patent for an air-quality monitoring IoT device. I'm also prototyping Lucen, a smartwatch built to interrupt sleep paralysis. I'm finishing a B.Tech in CS (AI & ML).",
  ],
  bar: 'CGPA 8.7 · B.Tech CS (AI & ML), Woxsen University · Languages: English, Hindi, Malayalam, French (B2), Japanese (Learning)',
}

export const LEADERSHIP = {
  index: '03 / LEADERSHIP',
  role: 'Senior Vice President - Student Council',
  org: 'Woxsen University',
  period: 'Jan 2025 – Mar 2026',
  stats: [
    { v: 'Rs. 30 lakh', k: 'Self-raised', d: 'Infinity 2026 budget' },
    { v: '200', k: 'Infinity team', d: 'Led alongside the Student Council' },
    { v: '5,000+', k: 'Attendees', d: 'Infinity 2026' },
    { v: '230+', k: 'Events', d: 'Enabled through the clubs vertical' },
  ],
  highlights: [
    'Directed the clubs vertical across multiple student portfolios, working with faculty, founders and university leadership.',
    'Ran Infinity 2026 end to end: raised the budget and coordinated stakeholders, logistics and timelines.',
    'Mentored club leads and student volunteers.',
  ],
  also: [
    'Vice President, Women Empowerment, Street Cause · Aug 2023 – Aug 2024',
    'Campus Ambassador, Woxsen University · Jun 2024 – Present',
  ],
}

export const PLIX = {
  index: '04 / PLIX',
  role: 'Automation Engineering & Generative AI Intern',
  period: 'Apr – Jun 2026',
  status: 'Internship completed',
  stat: '40% of ads generated at Plix run through the workflow I architected',
  statTag: 'As of Sept 2026',
  points: [
    'Figma Weave workflow: a product image and a reference input in, finished ads out. Creative iteration went from hours to minutes.',
    'LLM tool-calling pipelines handled prompt construction, image-context injection and output formatting as composable tool calls.',
    'Scoped an agentic ad-copy and hook system with the marketing team: goals, tool sets and self-correction loops.',
  ],
  caption: 'Simplified from the production workflow.',
}

export const LUCEN = {
  index: '05 / LUCEN',
  title: 'Lucen',
  sub: 'Smartwatch sleep-paralysis venture',
  body: "Sleep paralysis has an unusual signature: the body is still while the heart and breathing race. Lucen scores that pattern every second from the watch's heart rate, breathing and motion, then escalates through three haptic stages.",
  disclaimer: 'Not validated on real sleepers and not a medical device.',
  stages: [
    { n: 1, name: 'Soft double tap', when: 'First alarm' },
    { n: 2, name: 'Firm pulses', when: 'After 6 s' },
    { n: 3, name: 'Strong pulses', when: 'After 12 s' },
  ],
  facts: [
    ['Detector', 'Threshold 0.90, held 4 s'],
    ['Runs on', 'The watch itself'],
    ['Simulated nights', '95% of episodes caught, median 10 s after onset'],
  ] as [string, string][],
  strip: [
    { to: 95, suffix: '%', dec: 0, k: 'Caught (simulated)', d: 'Episodes in simulated nights' },
    { to: 10, suffix: ' s', dec: 0, k: 'Median delay', d: 'After onset' },
    { to: 0.9, suffix: '', dec: 2, k: 'Threshold', d: 'Held for 4 s' },
  ] as { to: number; suffix: string; dec: number; k: string; d: string }[],
  tabs: [
    {
      id: 'how', label: 'How it works',
      lead: 'The signature is a body that is still while the heart and breathing race. Lucen scores it every second.',
      rows: [
        ['Sense', 'Heart rate, a breathing estimate and motion from the watch, once a second.'],
        ['Compare', "The last 10 to 20 seconds, against the wearer's own baseline."],
        ['Score', 'A small model rates onset from 0 to 1. It runs on the watch, so raw biometrics stay off servers.'],
        ['Act', 'Held above the threshold for a few seconds, it escalates through three haptic stages, then locks out for 2 minutes.'],
      ],
      note: 'Known weak spot: nightmares. Roughly 1 in 20 simulated nightmares still trigger a buzz.',
    },
    {
      id: 'fit', label: 'Where it sits',
      lead: 'For people who wake up unable to move: an interrupter that runs on the watch they already own.',
      rows: [
        ['The gap', 'Most sleep products report on the night afterwards or sell calm beforehand. The one that acts during the night is a prescription device for a different condition.'],
        ['The moat', 'A growing set of consented, labelled sleep-paralysis nights, a model that personalises per wearer, and months of personal history that stay behind if they leave.'],
      ],
    },
    {
      id: 'plans', label: 'Plans',
      lead: 'Each tier unlocks one more thing, so the gap between tiers is the upgrade path.',
      rows: [
        ['Free', 'Tracks and logs episodes. Cannot intervene.'],
        ['Core · $9.99/mo', 'Real-time detection and haptic wake-up. The core promise.'],
        ['Pro · $16.99/mo', 'Adds smart lights and a partner alert.'],
      ],
      note: 'Pricing is the venture model from the course assignment.',
    },
    {
      id: 'next', label: 'Next 90 days',
      lead: 'The detector has only seen simulated nights. The plan is to replace that with evidence.',
      rows: [
        ['Weeks 1 to 3', 'Recruit 30 people who report sleep paralysis. Ethics review and consent.'],
        ['Weeks 3 to 8', 'Collect real nights on loaner watches, alongside a sleep diary.'],
        ['Weeks 6 to 10', 'A technician labels the nights. Real labels replace simulation.'],
        ['Weeks 10 to 13', 'Measure the real detection delay and false-alarm rate.'],
      ],
    },
  ] as { id: string; label: string; lead: string; rows: [string, string][]; note?: string }[],
  href: './lucen/index.html',
}

export const HARDWARE = {
  index: '06 / DESIGN PATENT',
  title: 'Design Patent: Air Quality Monitoring IoT Device',
  meta: [
    ['Design No.', '452276-001'],
    ['Registered', '20 Mar 2025'],
    ['Class', '10-05'],
    ['Certificate', '1 Jul 2025'],
  ] as [string, string][],
  cert: { label: 'Design certificate', sub: 'Design Patent', href: './assets/design-certificate.pdf' },
  rev: 'REV. 13.07',
}

export const PILLARS = [
  {
    n: '01', title: 'Product & Strategy',
    line: 'Scopes goals, owners and success criteria before anything is built.',
    chips: ['Stakeholder management', 'Cross-functional collaboration', 'Data-driven decision making', 'Business thinking', 'Jira'],
    evidence: [
      'Scoped the ad-copy automation system with the Plix marketing team: goals, ownership, success criteria.',
      'Translated business requirements into structured, tool-based execution.',
      'Resolved competing priorities across faculty, founders and student teams.',
    ],
    surface: 'bone',
  },
  {
    n: '02', title: 'AI & Workflow Automation',
    line: 'Workflows where the model is one step among several.',
    chips: ['Agentic workflows', 'Tool-calling', 'ReAct patterns', 'RAG', 'Prompt engineering', 'LLM orchestration', 'Embeddings', 'FAISS · Chroma', 'Figma Weave'],
    evidence: [
      'Figma Weave workflow: product image and reference in, finished ads out.',
      '40% of ads generated at Plix run through it (as of Sept 2026).',
      'Tool-calling pipelines for prompt construction, image-context injection and output formatting.',
    ],
    surface: 'carbon',
  },
  {
    n: '03', title: 'Engineering & Code',
    line: 'Python first, with the backend and ML tooling around it.',
    chips: ['Python', 'FastAPI', 'REST APIs', 'SQL', 'JavaScript', 'TensorFlow · Keras', 'Scikit-learn', 'MySQL', 'MongoDB', 'Docker', 'Git', 'GitHub Actions'],
    progress: ['Ruby', 'Java'],
    evidence: [
      'AgentAudit: capstone project on runtime reliability auditing for tool-using LLM agents, with a TraceWatch dashboard.',
      'QuickVal: regression-based real-estate price model with modular, API-ready inference.',
      'DeepLearning.AI: Neural Networks and Deep Learning.',
    ],
    surface: 'carbon',
  },
  {
    n: '04', title: 'Organizational Leadership',
    line: 'Large teams, many stakeholders, one plan.',
    chips: ['Senior Vice President, Student Council', 'Street Cause VP', 'Campus Ambassador', 'Class Representative'],
    evidence: [
      '900+ people led, directly and indirectly.',
      '230+ student-led events enabled.',
      'Infinity 2026: 5,000+ attendees, Rs. 30 lakh self-raised.',
    ],
    surface: 'carbon',
  },
  {
    n: '05', title: 'NGO',
    line: 'Community work through Street Cause, with a government school we adopted.',
    chips: ['Street Cause', 'VP, Women Empowerment', 'Project Legacy 2.0', 'Cyber security awareness', 'Donation drives', 'Teaching'],
    evidence: [
      'Project Legacy 2.0: educated young girls and children about their rights, and about digital safety, privacy and cyber security.',
      'Collected clothes and other necessities, gifted the children things to play with, and handed out stationery and books to read and study.',
      'Most of the donation money went into an overhead water tank for the government school we worked in.',
    ],
    surface: 'bone',
  },
  {
    n: '06', title: 'Design & 3D Systems',
    line: 'Generative design workflows, a design patent, and this site.',
    chips: ['Figma Weave', 'Design patent', 'Three.js · React Three Fiber', 'Canvas scroll scenes'],
    evidence: [
      'Design patent 452276-001: Air Quality Monitoring IoT Device.',
      'Generative design workflow in Figma Weave.',
      'This site: React, Three.js and hand-built canvas scenes driven by scroll.',
    ],
    surface: 'bone',
  },
] as const

export const CONTACT = {
  index: '09 / CONTACT',
  roles: ['APM', 'Product Analyst', 'Business Analyst', 'Software Engineer'],
  relocation: 'Open to global relocation, including Japan, the Netherlands, Germany, and across Europe and APAC.',
  links: [
    { label: 'Email', text: 'chrisjose1307@gmail.com', href: 'mailto:chrisjose1307@gmail.com' },
    { label: 'LinkedIn', text: 'linkedin.com/in/chris-jose13', href: 'https://linkedin.com/in/chris-jose13' },
    { label: 'GitHub', text: 'github.com/chris-aiml', href: 'https://github.com/chris-aiml' },
  ],
  footer: 'CJ-1307',
}

/* ---------------------------------------------------------------- CV */

export interface CVBlock { head: string; sub?: string; date?: string; bullets?: string[]; text?: string }
export interface CV {
  id: 'tech' | 'mgmt'
  tab: string
  name: string
  contact: string
  sections: { title: string; blocks?: CVBlock[]; text?: string; rows?: [string, string][] }[]
}

const CONTACT_LINE = 'Mumbai, India · chrisjose1307@gmail.com · linkedin.com/in/chris-jose13'

export const CV_TECH: CV = {
  id: 'tech', tab: 'Tech', name: 'CHRIS JOSE',
  contact: CONTACT_LINE + ' · github.com/chris-aiml',
  sections: [
    { title: 'SUMMARY', text: 'AI/ML student specialising in production-grade agentic systems, LLM-powered automation and retrieval-augmented generation. Built generative-AI workflows in a live product environment at Plix. Experienced with tool-calling, prompt engineering, vector databases and REST API backends, on a foundation of Python, machine learning and cloud deployment.' },
    { title: 'EXPERIENCE', blocks: [
      { head: 'Automation Engineering & Generative AI Intern', sub: 'Plix, Mumbai, India', date: 'Apr – Jun 2026', bullets: [
        'Designed and deployed a generative-AI workflow in Figma Weave that lets the design team produce product ads from a single image and reference input, cutting creative iteration from hours to minutes.',
        '40% of ads generated at Plix run through this workflow (as of Sept 2026).',
        'Implemented LLM tool-calling pipelines for multi-step creative generation: prompt construction, image-context injection and output formatting as composable tool calls.',
        'Scoped and architected an agentic system for the marketing team to automate hook and ad-copy generation, defining agent goals, tool sets and self-correction loops with ReAct-style reasoning.',
      ] },
      { head: 'Senior Vice President, Student Council', sub: 'Woxsen University, Hyderabad, India', date: 'Jan 2025 – Mar 2026', bullets: [
        'Led cross-functional student teams and managed a self-raised Rs. 30 lakh flagship event end to end.',
      ] },
    ] },
    { title: 'PROJECTS', blocks: [
      { head: 'ASL Hand Sign Detection & Classification System', sub: 'Python · OpenCV · cvzone · TensorFlow/Keras', date: '2025', bullets: [
        'Real-time American Sign Language pipeline: hand detection and cropping feeding an aspect-ratio-aware preprocessing step that normalises each frame for the model.',
        'Built a labelled data-collection tool (A–Z), trained a Keras/TensorFlow classifier, and deployed live inference on webcam frames with the predicted letter overlaid.',
      ] },
      { head: 'QuickVal: Real Estate Price Evaluation System', sub: 'Python · Scikit-learn · Pandas · NumPy', date: 'Jul 2025', bullets: [
        'Regression model for property price prediction with feature engineering, cross-validation and performance tuning; modular backend integration for ML inference via API.',
      ] },
    ] },
    { title: 'TECHNICAL SKILLS', rows: [
      ['AI & Agentic Systems', 'Agentic Workflows, Multi-Agent Systems, Tool-Calling, ReAct Patterns, RAG, Prompt Engineering, LLM Orchestration, Embeddings, Vector Databases (FAISS, Chroma)'],
      ['ML & Deep Learning', 'Scikit-learn, TensorFlow, Keras, Feature Engineering, Model Evaluation'],
      ['Programming & Backend', 'Python, FastAPI, REST APIs, SQL, JavaScript · In progress: Ruby, Java'],
      ['DevOps & Cloud', 'Docker, Git, CI/CD (GitHub Actions), Jira'],
      ['Databases', 'MySQL, MongoDB'],
      ['Design & Automation', 'Figma Weave, Generative AI Workflows'],
    ] },
    { title: 'EDUCATION', blocks: [
      { head: 'B.Tech, Computer Science · Specialisation: AI & ML', sub: 'Woxsen University, India · CGPA 8.7 / 10', date: '2023 – Expected 2027' },
    ] },
    { title: 'CERTIFICATIONS & ACHIEVEMENTS', blocks: [
      { head: '', bullets: [
        'Neural Networks and Deep Learning, DeepLearning.AI (Andrew Ng).',
        'Design Patent: Air Quality Monitoring IoT Device, Design No. 452276-001.',
        'Elected Senior Vice President, Student Council · Student Ambassador, Woxsen University · Class Representative, B.Tech CSE AI/ML 2023–24.',
        'Languages: English, Hindi, Malayalam, French (B2), Japanese (learning).',
        'Tools: Jira, Figma Weave, GitHub.',
      ] },
    ] },
  ],
}

export const CV_MGMT: CV = {
  id: 'mgmt', tab: 'Management', name: 'CHRIS JOSE',
  contact: CONTACT_LINE,
  sections: [
    { title: 'SUMMARY', text: 'Business-minded student leader who directs large, cross-functional teams and executes high-stakes initiatives. Directed the clubs vertical behind 230+ student-led events, managed a self-raised Rs. 30 lakh flagship event, and ran community-development programmes reaching underserved schools. Combines structured execution, stakeholder management and data-driven decision-making with hands-on experience coordinating automation and product workflows in a live startup.' },
    { title: 'CORE COMPETENCIES', text: 'Leadership · Initiative · Ownership · Problem Solving · Communication · Business Thinking · Teamwork · Data-Driven Decision Making · Stakeholder Management · Cross-Functional Collaboration' },
    { title: 'LEADERSHIP EXPERIENCE', blocks: [
      { head: 'Senior Vice President, Student Council', sub: 'Woxsen University, Hyderabad, India', date: 'Jan 2025 – Mar 2026', bullets: [
        'Led 900+ people directly and indirectly, including a 200-person team for Infinity 2026 (5,000+ attendees).',
        'Directed the clubs vertical across multiple student portfolios, coordinating with faculty, founders and university leadership to enable 230+ student-led events.',
        'Led cross-functional teams through a self-raised Rs. 30 lakh flagship event, managing stakeholders, logistics and timelines under pressure.',
        'Resolved competing priorities in real time, building trust and alignment among diverse stakeholders.',
        'Mentored club leads and student volunteers, turning ambiguous goals into structured, executable plans.',
      ] },
      { head: 'Vice President, Women Empowerment · Street Cause', sub: 'Woxsen University, Hyderabad, India', date: 'Aug 2023 – Aug 2024', bullets: [
        'Directed community-development initiatives with NGOs, student volunteers and local communities, including donation drives and outreach programmes.',
        'Worked with local government primary schools to identify facility gaps and mobilise resources for underserved students.',
        "Organised awareness campaigns on women's empowerment and equal opportunity across the university community.",
      ] },
      { head: 'Campus Ambassador · Woxsen University', sub: 'Hyderabad, India (Hybrid)', date: 'Jun 2024 – Present', bullets: [
        'Represented the university to prospective students, explaining programmes and campus culture.',
        'Coordinated outreach and led orientation sessions across multiple schools as Class Representative.',
      ] },
    ] },
    { title: 'PROFESSIONAL EXPERIENCE', blocks: [
      { head: 'Automation Engineering & Generative AI Intern · Plix', sub: 'Mumbai, India', date: 'Apr – Jun 2026', bullets: [
        'Coordinated with design and marketing teams to deploy a generative-AI workflow, cutting creative iteration from hours to minutes. 40% of ads generated at Plix run through it (as of Sept 2026).',
        'Managed multi-step automation pipelines, translating business requirements into structured, tool-based execution.',
        'Partnered with marketing to scope and architect an ad-copy automation system, defining goals, ownership and success criteria.',
      ] },
    ] },
    { title: 'EDUCATION', blocks: [
      { head: 'B.Tech, Computer Science · Specialisation: AI & ML', sub: 'Woxsen University, India · CGPA 8.7 / 10', date: '2023 – Expected 2027' },
    ] },
    { title: 'ADDITIONAL INVOLVEMENT', blocks: [
      { head: '', bullets: [
        'Design Patent: Air Quality Monitoring IoT Device, Design No. 452276-001.',
        'Languages: English, Hindi, Malayalam, French (B2), Japanese (learning).',
      ] },
    ] },
  ],
}

/* ----------------------------------------------------- Plix diagram */

export interface PlixNode {
  id: string; label: string; sub?: string
  x: number; y: number; w: number; h: number
  slots?: { cols: number; rows: number; count: number }
  kind: 'inputs' | 'process' | 'locked' | 'output'
}
export const PLIX_NODES: PlixNode[] = [
  { id: 'mood',      label: 'Mood Board',      sub: '10 image inputs', x: 30,  y: 60,  w: 220, h: 200, kind: 'inputs',  slots: { cols: 5, rows: 2, count: 10 } },
  { id: 'product',   label: 'Product Input',   sub: '6 inputs',        x: 30,  y: 340, w: 200, h: 200, kind: 'inputs',  slots: { cols: 2, rows: 3, count: 6 } },
  { id: 'reference', label: 'Reference',       sub: '3 inputs',        x: 290, y: 340, w: 150, h: 200, kind: 'inputs',  slots: { cols: 1, rows: 3, count: 3 } },
  { id: 'moodtext',  label: 'Mood Board Text', sub: 'Text from the board', x: 330, y: 80, w: 190, h: 120, kind: 'process' },
  { id: 'direction', label: 'Creative Direction', sub: 'Prompt', x: 590, y: 190, w: 210, h: 140, kind: 'process' },
  { id: 'lock',      label: 'Do Not Touch',    sub: 'Prompts withheld', x: 590, y: 400, w: 210, h: 140, kind: 'locked' },
  { id: 'generate',  label: 'Generate',        sub: 'Image generation', x: 870, y: 250, w: 170, h: 130, kind: 'process' },
  { id: 'final',     label: 'Final Output',    sub: 'Finished ads',   x: 1080, y: 130, w: 110, h: 200, kind: 'output', slots: { cols: 2, rows: 4, count: 8 } },
]
export const PLIX_EDGES: [string, string, boolean?][] = [
  ['mood', 'moodtext'],
  ['moodtext', 'direction'],
  ['reference', 'direction'],
  ['product', 'direction'],
  ['product', 'generate'],
  ['direction', 'generate'],
  ['lock', 'moodtext', true],
  ['lock', 'direction', true],
  ['generate', 'final'],
]
