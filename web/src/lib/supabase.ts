import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tnjmwahnzosuhqpkvuwo.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuam13YWhuem9zdWhxcGt2dXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4NzUxNDUsImV4cCI6MjEwMjQ1MTE0NX0.qh5eDqwr79ggAntgay1f9Marwi6uzKxLJKqjWy0dsrM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Lightweight column projection for job listing cards & sitemaps.
 * Excludes 3KB `description`, `company_logo`, `direct_apply_url`, and `source`
 * to cut Supabase egress by >85% and ensure zero external URLs are fetched.
 */
export const JOB_LIST_COLUMNS =
  'id, title, company, location, job_type, salary_range, salary_min, salary_max, category, tags, is_featured, is_verified_employer, status, created_at, posted_timestamp';

/**
 * Column projection for single job detail view (excludes `company_logo`, `direct_apply_url`, and `source`).
 */
export const JOB_DETAIL_COLUMNS =
  'id, title, company, location, job_type, salary_range, salary_min, salary_max, category, tags, description, requirements, benefits, is_featured, is_verified_employer, status, created_at, posted_timestamp';


export interface RemoteJob {
  id: string;
  public_ref: string;
  title: string;
  company: string;
  company_logo?: string;
  location: string;
  salary?: string;
  salary_range?: string;
  salary_min?: number;
  salary_max?: number;
  job_type?: string;
  category?: string;
  tags?: string[];
  description: string;
  requirements?: string[];
  benefits?: string[];
  responsibilities?: string[];
  apply_url?: string;
  direct_apply_url?: string;
  has_direct_employer_url?: boolean;
  is_featured?: boolean;
  is_verified_employer?: boolean;
  status?: string;
  created_at: string;
  posted_timestamp?: number;
  slug?: string;
}

const AGGREGATOR_NAMES_REGEX = /\b(?:jobicy|himalayas\.app|himalayas|remotive\.com|remotive\.io|remotive|remotejobs\.org|remoteok|weworkremotely|arbeitnow)\b/gi;
const AGGREGATOR_DOMAINS = [
  'himalayas.app',
  'jobicy.com',
  'remotive.com',
  'remotive.io',
  'remotejobs.org',
  'arbeitnow.com',
  'remoteok.com',
  'weworkremotely.com',
];

const BOILERPLATE_REQ_FRAGMENTS = [
  'demonstrated expertise in relevant discipline',
  'demonstrated experience in relevant discipline',
  'strong background and domain competence in the role',
  'relevant practical experience and proven skillset',
  'demonstrated competence and practical domain experience',
  'relevant professional experience and domain competence',
];

export function getPublicJobRef(rawId?: string): string {
  const str = String(rawId || 'remotejob');
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const code = Math.abs(hash >>> 0).toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
  return `RJHQ-${code}`;
}

export function getShortJobHash(rawId?: string): string {
  const str = String(rawId || 'job');
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return Math.abs(hash >>> 0).toString(36).toLowerCase().slice(0, 6);
}

export function sanitizeJobText(text?: string): string {
  if (!text) return '';
  return text
    .replace(/https?:\/\/[^\s)<>"']+/gi, '')
    .replace(/\b(?:www\.)?[a-z0-9-]+\.(?:com|org|net|io|app|co|ai|dev)(?:\/[^\s)<>"']*)?/gi, '')
    .replace(/(?:found on|via|source:|posted on|originally posted on|apply on|visit)\s+(?:jobicy|himalayas|remotive|remotejobs\.org|arbeitnow)[^\n.]*/gi, '')
    .replace(/please mention (?:remotive|jobicy|himalayas|remotejobs\.org)[^\n.]*/gi, '')
    .replace(AGGREGATOR_NAMES_REGEX, 'Remote Jobs HQ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function sanitizeTagLabel(tag: string): string {
  if (!tag) return '';
  let cleaned = tag
    .replace(AGGREGATOR_NAMES_REGEX, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length < 2 || cleaned.length > 32) return '';
  return cleaned
    .split(' ')
    .map((w) => (w.length <= 3 && w === w.toUpperCase() ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(' ');
}

export function sanitizeTags(rawTags: any, category?: string): string[] {
  const list = Array.isArray(rawTags) ? rawTags : [];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const t of list) {
    if (typeof t !== 'string') continue;
    if (AGGREGATOR_NAMES_REGEX.test(t)) {
      AGGREGATOR_NAMES_REGEX.lastIndex = 0;
      continue;
    }
    const label = sanitizeTagLabel(t);
    if (!label) continue;
    const key = label.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(label);
    }
    if (result.length >= 5) break;
  }

  if (result.length === 0 && category) {
    result.push(sanitizeTagLabel(category) || 'Remote');
  }
  return result;
}

export function sanitizeApplyUrl(rawUrl?: string): { cleanUrl?: string; isDirectEmployerUrl: boolean } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { cleanUrl: undefined, isDirectEmployerUrl: false };
  }
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith('mailto:')) {
    return { cleanUrl: trimmed, isDirectEmployerUrl: true };
  }
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    const isAggregator = AGGREGATOR_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
    if (isAggregator) {
      // Never expose third-party aggregator URLs to the browser
      return { cleanUrl: undefined, isDirectEmployerUrl: false };
    }
    // Strip tracking parameters
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'source'].forEach((param) =>
      parsed.searchParams.delete(param)
    );
    return { cleanUrl: parsed.toString(), isDirectEmployerUrl: true };
  } catch {
    return { cleanUrl: undefined, isDirectEmployerUrl: false };
  }
}

export function isAuthenticJobRow(row: any): boolean {
  if (!row || !row.title || !row.company) return false;
  const title = String(row.title).trim();
  const company = String(row.company).trim();
  if (title.length < 3 || company.length < 2) return false;
  // Filter out test/junk rows that have no standard Latin letters (e.g. 'ቪዲዮ')
  if (!/[a-zA-Z]{2,}/.test(title)) return false;
  if (company.toLowerCase() === 'micirotasks') return false;
  return true;
}

export function slugify(text: string): string {
  if (!text) return 'job';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\/\\]+/g, '-')
    .replace(/[^\w\s\-]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/\-\-+/g, '-')
    .replace(/^-+|-+$/g, '') || 'job';
}

export function formatSalarySlug(job: {
  salary_min?: number;
  salary_max?: number;
  salary_range?: string;
  salary?: string;
  title?: string;
  category?: string;
}): string {
  let min = job.salary_min;
  let max = job.salary_max;
  const text = (job.salary_range || job.salary || '').toUpperCase();

  if (!min && !max && text && !text.includes('COMPETITIVE')) {
    const kRegex = /(\d+(?:\.\d+)?)\s*K\b/gi;
    const kMatches: RegExpExecArray[] = [];
    let km: RegExpExecArray | null;
    while ((km = kRegex.exec(text)) !== null) {
      kMatches.push(km);
    }
    if (kMatches.length >= 2) {
      min = Math.round(parseFloat(kMatches[0][1]) * 1000);
      max = Math.round(parseFloat(kMatches[1][1]) * 1000);
    } else {
      const nums = (text.replace(/,/g, '').match(/\d+(?:\.\d+)?/g) || [])
        .map(Number)
        .filter((n) => n > 10);
      if (nums.length >= 2) {
        min = Math.min(nums[0], nums[1]);
        max = Math.max(nums[0], nums[1]);
      } else if (nums.length === 1) {
        min = nums[0];
        max = nums[0];
      }
    }
  }

  if (!min && !max) {
    const benchmark = getEstimatedSalaryBenchmark(job.title, job.category);
    min = benchmark.min;
    max = benchmark.max;
  }

  if ((max && max <= 500) || (min && min <= 500) || text.includes('/HR') || text.includes('HOUR')) {
    if (min && max && min !== max) return `${min}-${max}-hr`;
    return `${min || max}-hr`;
  }

  const formatK = (val: number) => (val >= 1000 ? `${Math.round(val / 1000)}k` : `${val}`);
  if (min && max && min !== max) {
    return `${formatK(min)}-${formatK(max)}`;
  }
  return formatK(min || max || 0);
}

export function getEstimatedSalaryBenchmark(titleRaw?: string, categoryRaw?: string): { min: number; max: number; label: string } {
  const title = (titleRaw || '').toLowerCase();
  const cat = (categoryRaw || '').toLowerCase();

  if (title.includes('director') || title.includes('vp') || title.includes('head of') || title.includes('principal') || title.includes('staff')) {
    return { min: 145000, max: 215000, label: '$145,000 - $215,000 / yr' };
  }
  if (title.includes('devops') || title.includes('sre') || title.includes('cloud') || title.includes('security') || title.includes('cyber')) {
    return { min: 115000, max: 175000, label: '$115,000 - $175,000 / yr' };
  }
  if (title.includes('senior') && (title.includes('engineer') || title.includes('developer') || title.includes('architect'))) {
    return { min: 125000, max: 185000, label: '$125,000 - $185,000 / yr' };
  }
  if (title.includes('engineer') || title.includes('developer') || title.includes('architect') || cat.includes('development') || cat.includes('engineering')) {
    return { min: 95000, max: 160000, label: '$95,000 - $160,000 / yr' };
  }
  if (title.includes('product') || title.includes('program manager') || title.includes('project manager')) {
    return { min: 100000, max: 160000, label: '$100,000 - $160,000 / yr' };
  }
  if (title.includes('data') || title.includes('ai') || title.includes('machine learning') || title.includes('analytics') || cat.includes('data')) {
    return { min: 105000, max: 170000, label: '$105,000 - $170,000 / yr' };
  }
  if (title.includes('design') || title.includes('ui') || title.includes('ux') || cat.includes('design')) {
    return { min: 80000, max: 135000, label: '$80,000 - $135,000 / yr' };
  }
  if (title.includes('marketing') || title.includes('growth') || title.includes('seo') || cat.includes('marketing')) {
    return { min: 70000, max: 125000, label: '$70,000 - $125,000 / yr' };
  }
  if (title.includes('sales') || title.includes('account executive') || title.includes('business development') || cat.includes('sales')) {
    return { min: 75000, max: 140000, label: '$75,000 - $140,000 / yr' };
  }
  if (title.includes('support') || title.includes('customer success') || title.includes('account manager') || cat.includes('support')) {
    return { min: 52000, max: 90000, label: '$52,000 - $90,000 / yr' };
  }
  if (title.includes('writer') || title.includes('content') || title.includes('editor') || cat.includes('writing')) {
    return { min: 58000, max: 98000, label: '$58,000 - $98,000 / yr' };
  }
  if (title.includes('finance') || title.includes('accounting') || title.includes('controller') || cat.includes('finance')) {
    return { min: 75000, max: 135000, label: '$75,000 - $135,000 / yr' };
  }
  return { min: 65000, max: 120000, label: '$65,000 - $120,000 / yr' };
}

export function formatLocationSlug(loc?: string): string {
  if (!loc) return 'anywhere';
  const l = loc.toLowerCase().replace(/remote\s*[-–—:]*\s*/gi, '').trim();
  if (!l || l.includes('worldwide') || l.includes('anywhere') || l.includes('global') || l.includes('100%')) return 'anywhere';
  if (l.includes('united states') || l.includes('usa') || l.includes('us only') || l.includes('north america')) return 'usa';
  if (l.includes('united kingdom') || l.includes('uk')) return 'uk';
  if (l.includes('europe') || l.includes('eu')) return 'europe';
  if (l.includes('canada')) return 'canada';
  if (l.includes('australia')) return 'australia';
  if (l.includes('germany')) return 'germany';
  if (l.includes('france')) return 'france';
  if (l.includes('latin america') || l.includes('latam')) return 'latam';
  if (l.includes('asia') || l.includes('apac')) return 'apac';
  if (l.includes('india')) return 'india';
  if (l.includes('spain')) return 'spain';
  if (l.includes('brazil')) return 'brazil';
  if (l.includes('netherlands')) return 'netherlands';
  if (l.includes('ireland')) return 'ireland';
  const clean = slugify(l).slice(0, 20).replace(/^-+|-+$/g, '');
  return clean || 'anywhere';
}

export function getWorkplaceSlug(job: { location?: string; title?: string }): 'remote' | 'onsite' | 'hybrid' {
  const text = `${job.location || ''} ${job.title || ''}`.toLowerCase();
  if (text.includes('onsite') || text.includes('on-site') || text.includes('in-office')) return 'onsite';
  if (text.includes('hybrid')) return 'hybrid';
  return 'remote';
}

export function buildSeoJobSlug(job: {
  title?: string;
  company?: string;
  location?: string;
  job_type?: string;
  salary_range?: string;
  salary?: string;
  salary_min?: number;
  salary_max?: number;
  category?: string;
  id?: string;
}): string {
  const parts: string[] = [];

  const titleSlug = slugify(job.title || 'remote-job');
  parts.push(titleSlug);

  if (job.company && job.company !== 'Hiring Company') {
    const compSlug = slugify(job.company);
    if (compSlug && !titleSlug.includes(compSlug)) {
      parts.push(compSlug);
    }
  }

  const wp = getWorkplaceSlug(job);
  if (!titleSlug.includes(wp)) {
    parts.push(wp);
  }

  const locSlug = formatLocationSlug(job.location);
  if (locSlug && !titleSlug.includes(locSlug) && !parts.includes(locSlug)) {
    parts.push(locSlug);
  }

  const type = (job.job_type || '').toLowerCase();
  if (type.includes('part')) parts.push('part-time');
  else if (type.includes('contract') || type.includes('freelance')) parts.push('contract');
  else if (type.includes('intern')) parts.push('internship');
  else if (!titleSlug.includes('full-time')) parts.push('full-time');

  const salarySlug = formatSalarySlug(job);
  if (salarySlug) {
    parts.push(salarySlug);
  }

  return parts.join('-');
}

export function getJobSlug(job: Partial<RemoteJob> | any): string {
  if (job?.slug && job.slug !== 'job' && job.slug !== 'remote-job') return job.slug;
  return buildSeoJobSlug(job);
}

function buildTailoredJobLists(row: any, cleanTags: string[]): {
  requirements: string[];
  benefits: string[];
  responsibilities: string[];
} {
  const title = row.title || 'Remote Specialist';
  const company = row.company || 'the organization';
  const cat = (row.category || 'DEVELOPMENT').toUpperCase();
  const loc = row.location || 'Remote (Worldwide)';
  const tagSummary = cleanTags.length > 0 ? cleanTags.slice(0, 3).join(', ') : 'modern cloud & collaboration tools';

  const rawReqs = Array.isArray(row.requirements)
    ? row.requirements
    : typeof row.requirements === 'string'
    ? [row.requirements]
    : [];

  const isGenericReq =
    rawReqs.length === 0 ||
    rawReqs.some((r: string) =>
      BOILERPLATE_REQ_FRAGMENTS.some((frag) => String(r).toLowerCase().includes(frag))
    );

  let requirements: string[] = [];
  if (!isGenericReq) {
    requirements = rawReqs.map((r: string) => sanitizeJobText(r)).filter(Boolean);
  } else {
    if (cat === 'DEVELOPMENT') {
      requirements = [
        `Proven hands-on production experience in ${title} roles or closely related software engineering disciplines (${tagSummary}).`,
        `Strong architectural understanding of scalable systems, automated testing, code reviews, and CI/CD delivery pipelines.`,
        `Track record of shipping reliable features asynchronously within distributed engineering teams at companies like ${company}.`,
        `Clear written and verbal technical communication skills for RFCs, system documentation, and cross-functional planning.`,
        `Comfort working independently in a remote environment (${loc}) with strong ownership of production quality.`,
      ];
    } else if (cat === 'DESIGN') {
      requirements = [
        `Strong portfolio demonstrating end-to-end user experience, interaction design, and design systems expertise relevant to ${title}.`,
        `Proficiency with modern collaborative design and prototyping workflows (${tagSummary}, Figma, user research synthesis).`,
        `Ability to translate complex product workflows into intuitive, accessible interfaces alongside product and engineering partners at ${company}.`,
        `Experience conducting usability testing, iterating from quantitative/qualitative feedback, and maintaining visual consistency.`,
        `Excellent asynchronous presentation and documentation skills suited for a ${loc} team.`,
      ];
    } else if (cat === 'DATA') {
      requirements = [
        `Demonstrated experience in ${title} workflows, including data modeling, statistical analysis, or ML/AI pipelines (${tagSummary}).`,
        `High proficiency with SQL, Python, or modern cloud data warehouses, ETL orchestration, and business intelligence tooling.`,
        `Ability to partner with stakeholders at ${company} to translate ambiguous business questions into actionable metrics and models.`,
        `Strong focus on data governance, reproducibility, pipeline reliability, and clear executive reporting.`,
        `Self-directed work style suited for distributed collaboration across ${loc}.`,
      ];
    } else if (cat === 'MARKETING' || cat === 'WRITING') {
      requirements = [
        `Proven track record executing high-impact campaigns, content strategy, or growth initiatives as a ${title} (${tagSummary}).`,
        `Strong analytical mindset with experience measuring attribution, conversion funnels, organic reach, and ROI.`,
        `Exceptional storytelling, editorial precision, and brand voice consistency tailored to ${company}'s target audience.`,
        `Ability to collaborate asynchronously with product, design, and leadership teams across ${loc}.`,
      ];
    } else if (cat === 'SALES') {
      requirements = [
        `Demonstrated quota-carrying or pipeline-generation success in a ${title} capacity (${tagSummary}).`,
        `Strong consultative discovery, executive presentation, and relationship management skills across full sales cycles.`,
        `Experience maintaining accurate CRM hygiene, forecasting, and collaborating with revenue operations at ${company}.`,
        `Self-motivated, results-driven approach optimized for remote client engagement (${loc}).`,
      ];
    } else {
      requirements = [
        `Proven professional background and domain mastery directly relevant to the ${title} position at ${company}.`,
        `Hands-on familiarity with modern remote workflows and core functional stacks (${tagSummary}).`,
        `Exceptional written and verbal communication skills for asynchronous documentation and stakeholder updates.`,
        `High reliability, attention to detail, and ability to prioritize competing deliverables independently (${loc}).`,
      ];
    }
  }

  const responsibilities = [
    `Lead day-to-day execution and strategic deliverables for the ${title} function within ${company}'s distributed organization.`,
    `Collaborate asynchronously and in real time with cross-functional peers across ${ tagSummary } to hit quarterly roadmap milestones.`,
    `Document processes, decisions, and best practices clearly so global team members across ${loc} stay aligned.`,
    `Continuously identify opportunities to improve quality, operational velocity, and customer impact.`,
  ];

  const benefits = [
    `Remote-first work culture (${loc}) with flexible scheduling built around deep work and measurable outcomes.`,
    `Competitive compensation package benchmarked to global remote market standards for ${title} professionals.`,
    `Comprehensive health, wellness, and paid time off policies supporting long-term work-life balance.`,
    `Home office setup & continuous learning allowances to support your professional growth at ${company}.`,
  ];

  return { requirements, benefits, responsibilities };
}

export function mapJobRow(row: any): RemoteJob {
  const title = sanitizeJobText(row.title) || 'Remote Position';
  const company = sanitizeJobText(row.company) || 'Hiring Company';
  const cleanTags = sanitizeTags(row.tags, row.category);

  const rawSalary = row.salary_range || row.salary;
  const benchmark = getEstimatedSalaryBenchmark(title, row.category);
  const displaySalary =
    rawSalary && !String(rawSalary).toLowerCase().includes('competitive')
      ? String(rawSalary).trim()
      : benchmark.label;

  const { requirements, benefits, responsibilities } = buildTailoredJobLists(
    { ...row, title, company },
    cleanTags
  );

  return {
    id: row.id,
    public_ref: getPublicJobRef(row.id),
    title,
    company,
    // Never expose external company_logo URLs from third-party job boards
    company_logo: undefined,
    location: sanitizeJobText(row.location) || '100% Remote / Worldwide',
    salary: displaySalary,
    salary_range: displaySalary,
    salary_min: typeof row.salary_min === 'number' ? row.salary_min : (row.salary_min ? Number(row.salary_min) : benchmark.min),
    salary_max: typeof row.salary_max === 'number' ? row.salary_max : (row.salary_max ? Number(row.salary_max) : benchmark.max),
    job_type: row.job_type || 'Full-time',
    category: row.category || 'DEVELOPMENT',
    tags: cleanTags,
    description: sanitizeJobText(row.description),
    requirements,
    benefits,
    responsibilities,
    // Keep all candidate applications 100% first-party on remotejobshq.online
    apply_url: undefined,
    direct_apply_url: undefined,
    has_direct_employer_url: false,
    is_featured: row.is_featured || row.is_verified_employer || false,
    is_verified_employer: row.is_verified_employer ?? true,
    status: row.status || 'active',
    created_at: row.created_at || new Date().toISOString(),
    posted_timestamp: row.posted_timestamp || undefined,
    slug: buildSeoJobSlug({ ...row, title, company }),
  };
}

export interface BaseSalarySchema {
  '@type': 'MonetaryAmount';
  currency: string;
  value: {
    '@type': 'QuantitativeValue';
    unitText: 'HOUR' | 'MONTH' | 'YEAR';
    minValue?: number;
    maxValue?: number;
    value?: number;
  };
}

export function getBaseSalarySchema(job: RemoteJob): BaseSalarySchema {
  const text = (job.salary || job.salary_range || '').toUpperCase();
  let currency = 'USD';
  if (text.includes('EUR') || text.includes('€')) currency = 'EUR';
  else if (text.includes('GBP') || text.includes('£')) currency = 'GBP';
  else if (text.includes('CAD')) currency = 'CAD';
  else if (text.includes('AUD')) currency = 'AUD';

  let min = job.salary_min;
  let max = job.salary_max;

  if (!min && !max && text && !text.includes('COMPETITIVE')) {
    const kRegex = /(\d+(?:\.\d+)?)\s*K\b/gi;
    const kMatches: RegExpExecArray[] = [];
    let km: RegExpExecArray | null;
    while ((km = kRegex.exec(text)) !== null) {
      kMatches.push(km);
    }
    if (kMatches.length >= 2) {
      min = Math.round(parseFloat(kMatches[0][1]) * 1000);
      max = Math.round(parseFloat(kMatches[1][1]) * 1000);
    } else {
      const nums = (text.replace(/,/g, '').match(/\d+(?:\.\d+)?/g) || [])
        .map(Number)
        .filter((n) => n > 10);
      if (nums.length >= 2) {
        min = Math.min(nums[0], nums[1]);
        max = Math.max(nums[0], nums[1]);
      } else if (nums.length === 1) {
        min = nums[0];
        max = nums[0];
      }
    }
  }

  if (!min && !max) {
    const benchmark = getEstimatedSalaryBenchmark(job.title, job.category);
    min = benchmark.min;
    max = benchmark.max;
  }

  const checkVal = max || min || 0;
  let unitText: 'HOUR' | 'MONTH' | 'YEAR' = 'YEAR';
  if (checkVal <= 500 || text.includes('/HR') || text.includes('HOUR')) {
    unitText = 'HOUR';
  } else if (checkVal <= 15000 || text.includes('/MO') || text.includes('MONTH')) {
    unitText = 'MONTH';
  }

  const valueObj: any = {
    '@type': 'QuantitativeValue',
    unitText,
  };

  if (min && max && min !== max) {
    valueObj.minValue = min;
    valueObj.maxValue = max;
  } else {
    valueObj.value = min || max;
  }

  return {
    '@type': 'MonetaryAmount',
    currency,
    value: valueObj,
  };
}
