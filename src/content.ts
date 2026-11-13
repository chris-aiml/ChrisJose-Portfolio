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
  { id: 'intro',        n: '01', label: 'INTRO',        p: 0.0,   h: '200svh', pin: true },
  { id: 'about',        n: '02', label: 'ABOUT',        p: 0.14,  h: '200svh', pin: true },
  { id: 'leadership',   n: '03', label: 'LEADERSHIP',   p: 0.28,  h: '220svh', pin: true },
  { id: 'plix',         n: '04', label: 'PLIX',         p: 0.44,  h: '200svh', pin: true },
  { id: 'lucen',        n: '05', label: 'LUCEN',        p: 0.58,  h: '170svh', pin: true },
  { id: 'hardware',     n: '06', label: 'HARDWARE',     p: 0.70,  h: '220svh', pin: true },
  { id: 'capabilities', n: '07', label: 'CAPABILITIES', p: 0.84,  h: '120svh', pin: false },
  { id: 'resume',       n: '08', label: 'RESUME',       p: 0.893, h: '110svh', pin: false },
  { id: 'contact',      n: '09', label: 'CONTACT',      p: 0.947, h: '100svh', pin: false },
]

export const INTRO = {
  index: '01 / INTRO',
  line1: 'Leads teams.',
  line2: 'Builds systems.',
}

export const ABOUT = {
  index: '02 / ABOUT',
  headline: 'Turns ambiguous goals into owned plans.',
  paragraphs: [
    "I've led 900+ people, directly and through the leads beneath me: a 200-person council team, 230+ student-led events, and one flagship, Infinity 2026, for 5,000+ attendees. The pattern is the same each time. Take an ambiguous goal, turn it into a structured plan, and give every piece an owner.",
    'At Plix I applied that to creative production. I architected the generative-AI workflow that turns a product image and a reference into finished ads, and it cut iteration from hours to minutes.',
    "Outside work I'm the third registrant on a registered industrial design for an air-quality monitoring device. I'm also prototyping Lucen, a smartwatch built to interrupt sleep paralysis. I'm finishing a B.Tech in CS (AI & ML) and based in Mumbai.",
  ],
  cert: { label: 'Design certificate', sub: 'Registered Industrial Design', href: './assets/design-certificate.pdf' },
  bar: 'CGPA 8.7 · B.Tech CS (AI & ML), Woxsen University · Languages: English, Hindi, Malayalam, French (B2), Japanese (Learning)',
  music: 'Also: ABRSM choral singing certificate (Merit, 2015), and I play piano.',
}

export const LEADERSHIP = {
  index: '03 / LEADERSHIP',
  role: 'Senior Vice President - Student Council',
  org: 'Woxsen University',
  period: 'Jan 2025 – Mar 2026',
  stats: [
    { v: '900+', k: 'People led', d: 'Direct and indirect' },
    { v: '200', k: 'Core team', d: 'A 200-person team' },
    { v: '230+', k: 'Student-led events', d: 'Enabled through the clubs vertical' },
    { v: '5,000+', k: 'Attendees', d: 'Infinity 2026' },
    { v: 'Rs. 30 lakh', k: 'Self-raised budget', d: 'Flagship event' },
  ],
  highlights: [
    'Directed the clubs vertical across multiple student portfolios, working with faculty, founders and university leadership.',
    'Led cross-functional teams through a self-raised flagship event: stakeholders, logistics and timelines.',
    'Resolved competing priorities in real time and built alignment across diverse stakeholders.',
    'Mentored club leads and student volunteers, turning ambiguous goals into structured, executable plans.',
  ],
  also: [
    'Vice President, Women Empowerment, Street Cause · Aug 2023 – Aug 2024',
    'Campus Ambassador, Woxsen University · Jun 2024 – Present',
    'Senior Executive, Distortion (the music club) · Aug 2023 – Present',
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
  href: './lucen/index.html',
}

export const HARDWARE = {
  index: '06 / HARDWARE',
  title: 'Registered Industrial Design — Air Quality Monitoring IoT Device',
  meta: [
    ['Design No.', '452276-001'],
    ['Registered', '20 Mar 2025'],
    ['Class', '10-05'],
    ['Certificate', '1 Jul 2025'],
    ['Position', '3rd Registrant'],
  ] as [string, string][],
  caption: 'Illustrative studio concept. Not the registered drawings.',
  parts: ['Outer shell and handle', 'Sensor core and fan', 'Display glass'],
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
      'ASL Hand Sign Detection: real-time webcam classifier in Python, OpenCV, cvzone and TensorFlow/Keras.',
      'QuickVal: regression-based real-estate price model with modular, API-ready inference.',
      'DeepLearning.AI: Neural Networks and Deep Learning.',
    ],
    surface: 'carbon',
  },
  {
    n: '04', title: 'Design & 3D Systems',
    line: 'Generative design workflows, a registered design, and this site.',
    chips: ['Figma Weave', 'Registered industrial design', 'Three.js · React Three Fiber', 'Theatre.js', 'GLSL'],
    evidence: [
      'Third registrant on Registered Industrial Design 452276-001, Air Quality Monitoring IoT Device.',
      'Generative design workflow in Figma Weave.',
      'This site: React Three Fiber, Theatre.js and custom GLSL.',
    ],
    surface: 'bone',
  },
  {
    n: '05', title: 'Organizational Leadership',
    line: 'Large teams, many stakeholders, one plan.',
    chips: ['Senior Vice President, Student Council', 'Street Cause VP', 'Campus Ambassador', 'Class Representative', 'Distortion music club'],
    evidence: [
      '900+ people led, directly and indirectly.',
      '230+ student-led events enabled.',
      'Infinity 2026: 5,000+ attendees, Rs. 30 lakh self-raised.',
    ],
    surface: 'carbon',
  },
] as const

export const CONTACT = {
  index: '09 / CONTACT',
  roles: ['APM', 'Product Analyst', 'Business Analyst'],
  location: 'Mumbai-based',
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
        'Registered Industrial Design: Air Quality Monitoring IoT Device, Design No. 452276-001 (3rd Registrant).',
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
        'Registered Industrial Design: Air Quality Monitoring IoT Device, Design No. 452276-001 (3rd Registrant).',
        'Senior Executive, Distortion (The Music Club), Woxsen University · Aug 2023 – Present.',
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
