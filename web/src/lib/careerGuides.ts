export interface CareerGuideSection {
  heading: string;
  body: string[];
  bullets?: string[];
  callout?: {
    title: string;
    text: string;
  };
}

export interface CareerGuide {
  slug: string;
  title: string;
  category: string;
  readTime: string;
  publishedAt: string;
  updatedAt: string;
  author: {
    name: string;
    role: string;
  };
  excerpt: string;
  keyTakeaways: string[];
  sections: CareerGuideSection[];
}

export const CAREER_GUIDES: CareerGuide[] = [
  {
    slug: 'how-to-land-a-high-paying-remote-job',
    title: 'How to Land a High-Paying Remote Job: The Complete Playbook',
    category: 'Career Strategy',
    readTime: '9 min read',
    publishedAt: '2025-01-15',
    updatedAt: '2025-02-20',
    author: {
      name: 'Elena Rostova',
      role: 'Head of Talent & Editorial at Remote Jobs HQ',
    },
    excerpt:
      'A step-by-step tactical guide to positioning your resume for asynchronous teams, passing distributed technical and behavioral interviews, and negotiating global compensation.',
    keyTakeaways: [
      'Quantify asynchronous impact on your resume: highlight written documentation, self-directed delivery, and cross-timezone collaboration.',
      'Target remote-first companies that benchmark compensation to role impact rather than local cost of living.',
      'Build a public proof-of-work portfolio (GitHub, case studies, technical RFCs, or live demos) to bypass standard ATS filters.',
      'Treat the written application and screening prompt as your first asynchronous communication evaluation.',
    ],
    sections: [
      {
        heading: '1. Why Remote Hiring Works Differently Than Office Hiring',
        body: [
          'When a distributed company hires across multiple time zones, the primary risk a hiring manager evaluates is not just technical competence—it is autonomous execution and written clarity. In a traditional co-located office, managers rely on visual presence and ad-hoc shoulder taps to unblock projects. In a 100% remote organization, every project moves forward through written specifications, pull requests, design docs, and asynchronous status updates.',
          'Candidates who treat remote job applications the same way they treat local applications often stall at the initial screening stage. To stand out among global applicants, every touchpoint—from your resume summary to your cover note—must prove that you already operate like a seasoned distributed professional.',
        ],
        bullets: [
          'Replace vague duty descriptions ("Responsible for frontend features") with measurable autonomous outcomes ("Architected and shipped a multi-region checkout flow across 4 time zones, increasing conversion by 14%").',
          'Explicitly list your remote collaboration stack: Linear, Jira, Notion, Loom, Slack, GitHub Actions, Figma, and asynchronous RFC workflows.',
          'Indicate your primary working timezone and your typical overlap hours with US Eastern/Pacific or European CET teams.',
        ],
      },
      {
        heading: '2. Structuring an ATS-Proof Remote Resume',
        body: [
          'Modern remote employers receive hundreds of applications per role and use structured Applicant Tracking Systems (ATS) combined with human recruiter scorecards. Your resume needs clean semantic hierarchy, keyword alignment with the specific job description, and immediate evidence of remote readiness.',
          'Include a dedicated "Distributed Work & Collaboration" line in your skills or experience section. Hiring teams look for signals that you have either worked remotely before, contributed to open-source projects, or managed complex cross-office deliverables without micromanagement.',
        ],
        callout: {
          title: 'Pro Tip: The 60-Second Proof-of-Work Link',
          text: 'Include a short 90-second Loom video walkthrough or a 1-page Notion case study linked at the top of your resume. Candidates who attach a concise work sample see up to 3.4x higher interview callback rates on Remote Jobs HQ.',
        },
      },
      {
        heading: '3. Mastering the Asynchronous & Live Remote Interview Loop',
        body: [
          'Most vetted remote companies follow a 4-stage hiring pipeline: (1) Recruiter alignment screen, (2) Take-home practical assessment or live technical/domain pairing, (3) Cross-functional systems or portfolio deep dive, and (4) Executive/culture alignment.',
          'During live video interviews, treat your audio, lighting, and screen-sharing setup as a professional studio. When answering behavioral questions, emphasize how you surface blockers early, document edge cases for teammates who are asleep in other time zones, and maintain predictable delivery cadences.',
        ],
        bullets: [
          'Always ask thoughtful questions about the company’s documentation culture: "How are product decisions recorded when team members are offline?"',
          'When completing a take-home project, include a crisp README.md explaining your architectural trade-offs, setup instructions, and what you would build next with more time.',
          'Send structured follow-up notes within 12 hours summarizing key takeaways from each conversation.',
        ],
      },
      {
        heading: '4. Evaluating & Negotiating Global Remote Compensation',
        body: [
          'Remote compensation typically falls into two models: Location-Agnostic (everyone in the same role tier earns the same US/global benchmark band) and Tiered Regional Benchmarking. Before quoting a salary number, check the role’s benchmark band on our Salary Guide and ask whether the role is structured as direct W-2/local payroll (via an Employer of Record like Deel, Remote.com, or Oyster) or as an independent international contractor.',
          'If hired as an independent contractor, remember to factor in self-employment taxes, private healthcare, paid time off, and equipment depreciation—typically adding 20% to 30% over an equivalent salaried base.',
        ],
      },
    ],
  },
  {
    slug: 'remote-salary-negotiation-and-global-compensation-guide',
    title: 'Global Remote Salary Negotiation & Contractor vs. EOR Guide',
    category: 'Compensation & Legal',
    readTime: '8 min read',
    publishedAt: '2025-01-22',
    updatedAt: '2025-02-24',
    author: {
      name: 'Marcus Vance',
      role: 'Senior Compensation Analyst at Remote Jobs HQ',
    },
    excerpt:
      'Understand how global startups and Fortune 500s calculate remote pay bands, the difference between Employer of Record (EOR) and contractor agreements, and how to negotiate top-of-band offers.',
    keyTakeaways: [
      'Understand the three compensation philosophies: Global Flat Rate, Regional Tiered Bands, and Local Market Indexing.',
      'Know the legal and financial differences between Employer of Record (EOR) full-time employment and B2B contractor invoicing.',
      'Negotiate the total compensation package: base salary, equity/RSUs, home-office stipends, wellness budgets, and guaranteed PTO.',
    ],
    sections: [
      {
        heading: '1. How Remote Companies Set Salary Bands',
        body: [
          'Over the past five years, distributed compensation has matured significantly. High-growth technology companies generally adopt one of three models when hiring across borders. Understanding which model your prospective employer uses is essential before entering final offer discussions.',
          'In a Global Benchmark Model, a Senior Backend Engineer earns $140,000–$175,000 USD regardless of whether they live in Austin, Lisbon, or São Paulo. In a Regional Hub Model, companies group countries into 2 or 3 macro-tiers (e.g., North America, Western Europe/UK, and Global Emerging Markets).',
        ],
        bullets: [
          'Always ask in the first recruiter call: "Does your team use location-agnostic bands or regional tiers for this role?"',
          'Anchor your expectations to the value and revenue impact of the role rather than your personal living expenses.',
          'Use verified role benchmarks ($95k–$165k for Engineering, $100k–$160k for Product, $75k–$135k for Design) to back up your counter-offer.',
        ],
      },
      {
        heading: '2. Employer of Record (EOR) vs. Independent Contractor',
        body: [
          'When a company does not have a legal entity in your country, they hire you either through an Employer of Record (such as Deel, Remote, Multiplier, or Oyster) or as an independent B2B contractor.',
          'With an EOR, you are a full-time local employee on paper: taxes, social security, statutory holidays, and local healthcare contributions are automatically deducted. As an independent contractor, you receive the gross payout in USD/EUR and handle your own local tax filings, pension, and insurance.',
        ],
        callout: {
          title: 'Contractor Markup Formula',
          text: 'When comparing a gross contractor offer to a local salaried role, multiply the local net-equivalent salary by 1.25x to account for self-funded healthcare, unpaid vacation days, and accounting fees.',
        },
      },
      {
        heading: '3. High-Leverage Perks to Negotiate When Base Salary Is Capped',
        body: [
          'If an employer has strict level bands and cannot move higher on base pay, shift the conversation to high-value remote components that carry lower recurring payroll overhead for the company.',
        ],
        bullets: [
          'Sign-on bonus or first-year workspace setup grant ($1,500–$3,500 for ergonomic chair, 4K monitor, and fiber internet).',
          'Guaranteed minimum annual paid time off (25–30 days plus national holidays) written directly into contractor agreements.',
          'Accelerated 6-month compensation and performance review cycle with pre-defined promotion criteria.',
          'Annual co-working space membership and $2,000+ professional learning & conference stipend.',
        ],
      },
    ],
  },
  {
    slug: 'how-to-spot-and-avoid-remote-job-scams',
    title: 'Remote Job Safety Guide: How to Spot & Avoid Online Hiring Scams',
    category: 'Trust & Safety',
    readTime: '7 min read',
    publishedAt: '2025-01-28',
    updatedAt: '2025-02-26',
    author: {
      name: 'Elena Rostova',
      role: 'Head of Talent & Editorial at Remote Jobs HQ',
    },
    excerpt:
      'Protect your identity and finances during your remote job search. Learn the red flags of fraudulent job offers, fake check equipment schemes, and impersonation tactics.',
    keyTakeaways: [
      'Legitimate employers will NEVER ask you to pay for equipment, training, background checks, or software licenses.',
      'Verify that recruiter emails originate from the company’s official primary domain—not free webmail or lookalike domains.',
      'Never accept an offer conducted entirely over text-only chat apps (Telegram, WhatsApp, Signal) without live video interviews.',
    ],
    sections: [
      {
        heading: '1. The Golden Rule of Remote Job Safety',
        body: [
          'At Remote Jobs HQ, our moderation system filters and verifies listings daily, but bad actors across the internet frequently impersonate real companies on social media and messaging apps. The single most important rule for every job seeker is simple: legitimate employers pay you; you never pay them.',
          'If any recruiter or hiring coordinator asks you to purchase a laptop from a specific vendor using a mailed check, pay a "security deposit" for company hardware, or pay a fee for mandatory certification before starting, cease communication immediately.',
        ],
      },
      {
        heading: '2. Common Red Flags to Watch Out For',
        body: [
          'Fraudulent actors rely on urgency and unusually high pay for low-skill tasks to cloud judgment. Review every opportunity against these verification checks:',
        ],
        bullets: [
          'Text-Only Instant Job Offers: Real companies do not hire full-time employees solely via Telegram, WhatsApp, or SMS chat interviews.',
          'Domain Spoofing: Check the exact sender address. If the company is "AcmeCorp.com", watch out for lookalikes like "careers-acmecorp.net" or "@gmail.com" addresses.',
          'Fake Check / Overpayment Schemes: Sending you a check to deposit into your personal bank account to "buy home office equipment" is a classic banking fraud.',
          'Premature Sensitive Data Requests: Do not share your passport, Social Security Number, national ID, or bank routing numbers before signing a verified employment contract after live video interviews.',
        ],
        callout: {
          title: 'Report Suspicious Activity Instantly',
          text: 'If you ever encounter a suspicious communication claiming to represent an employer on our platform, contact our Trust & Safety team at support@remotejobshq.online so we can investigate and block the actor.',
        },
      },
      {
        heading: '3. How to Independently Verify Any Remote Employer',
        body: [
          'Before signing an offer letter, cross-reference the hiring manager on LinkedIn, verify the company’s official domain and corporate registration, and confirm on a live video call with your future manager or HR partner. Authentic distributed teams welcome transparency and will gladly connect you with future peers during the interview loop.',
        ],
      },
    ],
  },
  {
    slug: 'asynchronous-communication-playbook-for-distributed-teams',
    title: 'The Asynchronous Communication Playbook for Distributed Teams',
    category: 'Remote Productivity',
    readTime: '8 min read',
    publishedAt: '2025-02-02',
    updatedAt: '2025-02-25',
    author: {
      name: 'David Chen',
      role: 'Distributed Engineering Advisor at Remote Jobs HQ',
    },
    excerpt:
      'How top engineers, product managers, and designers write crisp RFCs, reduce meeting fatigue, and collaborate seamlessly across 12+ time zones.',
    keyTakeaways: [
      'Default to public channels and written specs over private direct messages so knowledge remains searchable.',
      'Write messages with full context, proposed solutions, and deadlines so teammates can unblock you in a single reply.',
      'Reserve synchronous video meetings for high-bandwidth brainstorming, complex architecture debates, and 1-on-1 rapport.',
    ],
    sections: [
      {
        heading: '1. Why "Async-First" Is the Superpower of Remote Companies',
        body: [
          'Simply moving office habits onto Zoom creates exhaustion and bottlenecks. True remote-first organizations operate asynchronously by default: work does not wait for everyone to be online at the same minute. Instead, teams rely on clear written handoffs, self-contained pull requests, and documented decision logs.',
          'Mastering asynchronous communication not only makes you a top 5% performer once hired—it is also the exact skill hiring managers test for during remote interviews.',
        ],
      },
      {
        heading: '2. The "No-Hello" Rule & High-Context Messaging',
        body: [
          'In a distributed workplace where a colleague might be 6 hours ahead of you, sending a message that only says "Hi, are you around?" wastes an entire 24-hour cycle. Instead, practice high-context communication that enables single-turn resolution.',
        ],
        bullets: [
          'State the context and problem clearly in the first sentence.',
          'Share what you have already investigated or tried, including relevant links, logs, or screenshots.',
          'Propose your recommended path forward ("Unless I hear objections by 14:00 UTC tomorrow, I will proceed with Option A").',
          'Record a 2-minute Loom video when explaining visual UI behavior or multi-file code changes.',
        ],
      },
      {
        heading: '3. Writing Effective RFCs and Decision Documents',
        body: [
          'Before starting any multi-week project, elite remote professionals write a 1-to-2 page Request for Comments (RFC) or Product Spec. A strong spec includes: Problem Statement, Goals & Non-Goals, Proposed Architecture/Workflow, Alternatives Considered, and Rollout Plan.',
          'Sharing written specs allows teammates in Americas, EMEA, and APAC to review and comment thoughtfully on their own schedule, resulting in higher-quality engineering and product outcomes than rushed 30-minute meetings.',
        ],
      },
    ],
  },
  {
    slug: 'remote-technical-interview-preparation-guide',
    title: 'Ultimate Remote Technical & Product Interview Preparation Guide',
    category: 'Interview Prep',
    readTime: '10 min read',
    publishedAt: '2025-02-08',
    updatedAt: '2025-02-27',
    author: {
      name: 'David Chen',
      role: 'Distributed Engineering Advisor at Remote Jobs HQ',
    },
    excerpt:
      'What to expect in modern remote coding assessments, system design whiteboarding, and product case studies—and how to outperform the competition.',
    keyTakeaways: [
      'Remote technical interviews emphasize practical pair programming, code review simulations, and collaborative system design over rote algorithm puzzles.',
      'Narrate your thought process clearly while screen-sharing or working in collaborative editors like CoderPad, Excalidraw, or FigJam.',
      'Treat your take-home assignment like a production pull request with tests, clean commit history, and architectural notes.',
    ],
    sections: [
      {
        heading: '1. The Shift From LeetCode to Real-World Pairing',
        body: [
          'While foundational data structures and algorithmic complexity remain useful, most remote-first companies prefer practical assessments that mirror daily distributed work. You are far more likely to encounter a 60-minute live debugging session, an API integration build, a pull-request code review exercise, or a scoped take-home module.',
          'Evaluators score how you read unfamiliar code, how you verify assumptions, how you write maintainable tests, and how constructively you communicate trade-offs.',
        ],
      },
      {
        heading: '2. Excelling at Virtual System Design (Excalidraw / Miro)',
        body: [
          'In a remote system design interview, you will use a digital canvas such as Excalidraw, Whimsical, or Miro. Practice keyboard shortcuts for drawing boxes, arrows, and text labels beforehand so you never struggle with the tool during the interview.',
        ],
        bullets: [
          'Spend the first 5 minutes clarifying functional requirements, scale (requests per second, data volume), and latency SLAs.',
          'Sketch the high-level data flow and API contracts before diving into database sharding or caching layers.',
          'Explicitly discuss observability, failure modes, idempotency, and security boundaries.',
        ],
      },
      {
        heading: '3. Delivering a Standout Take-Home Project',
        body: [
          'When given a 3-to-4 hour take-home challenge, the code itself is only 60% of the grade. The remaining 40% is your engineering communication. Include a structured README covering how to run the project in one command, why you chose your libraries, what edge cases you handled, and how you would scale the solution for production.',
        ],
      },
    ],
  },
  {
    slug: 'building-an-ats-optimized-remote-resume-and-portfolio',
    title: 'Building an ATS-Optimized Remote Resume & Proof-of-Work Portfolio',
    category: 'Resume & Portfolio',
    readTime: '7 min read',
    publishedAt: '2025-02-12',
    updatedAt: '2025-02-28',
    author: {
      name: 'Elena Rostova',
      role: 'Head of Talent & Editorial at Remote Jobs HQ',
    },
    excerpt:
      'Turn your resume from a passive job history into a high-conversion document tailored for global distributed hiring managers.',
    keyTakeaways: [
      'Use clean single-column formatting with standard section headers so ATS parsers extract 100% of your experience accurately.',
      'Structure every bullet point using the Impact-First formula: Accomplished [X] as measured by [Y], by executing [Z].',
      'Include direct clickable links to live work, case studies, or technical writing.',
    ],
    sections: [
      {
        heading: '1. Why Clean Formatting Beats Complex Graphic Resumes',
        body: [
          'Multi-column PDFs with skill progress bars, floating text boxes, or embedded tables frequently scramble when parsed by Greenhouse, Lever, Ashby, and Workday. Stick to a clean, high-contrast single-column layout in standard PDF format.',
          'Place your core target title, location/timezone availability, and portfolio links right below your name.',
        ],
      },
      {
        heading: '2. The Impact-First Bullet Formula',
        body: [
          'Recruiters spend an average of 7 to 10 seconds on an initial resume scan. Make your strongest numbers jump off the page immediately:',
        ],
        bullets: [
          'Engineering: "Reduced API p95 latency by 42% (from 480ms to 275ms) by redesigning PostgreSQL indexing and Redis caching layers for 1.2M daily active users."',
          'Product & Design: "Led end-to-end redesign of self-serve onboarding flow, lifting 14-day trial-to-paid conversion from 8.4% to 13.1%."',
          'Marketing & Sales: "Generated $1.8M in qualified enterprise pipeline across North America and EMEA via targeted outbound and SEO content clusters."',
          'Customer Support & Operations: "Maintained 98.4% CSAT across 1,400+ monthly tickets while authoring 45 self-service knowledge base articles that deflected 28% of repetitive inquiries."',
        ],
      },
    ],
  },
];

export function getGuideBySlug(slug: string): CareerGuide | undefined {
  return CAREER_GUIDES.find((g) => g.slug === slug);
}
