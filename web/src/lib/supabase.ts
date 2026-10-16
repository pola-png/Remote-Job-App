import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tnjmwahnzosuhqpkvuwo.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuam13YWhuem9zdWhxcGt2dXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4NzUxNDUsImV4cCI6MjEwMjQ1MTE0NX0.qh5eDqwr79ggAntgay1f9Marwi6uzKxLJKqjWy0dsrM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface RemoteJob {
  id: string;
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
  requirements?: string[] | string;
  benefits?: string[] | string;
  apply_url?: string;
  direct_apply_url?: string;
  is_featured?: boolean;
  is_verified_employer?: boolean;
  status?: string;
  created_at: string;
  posted_timestamp?: number;
  slug?: string;
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

  // Provide realistic market benchmark for role if not specified so every URL has a high-intent salary keyword
  if (!min && !max) {
    const title = (job.title || '').toLowerCase();
    const cat = (job.category || '').toLowerCase();
    if (title.includes('devops') || title.includes('sre') || title.includes('cloud') || title.includes('security')) {
      min = 110000;
      max = 175000;
    } else if (title.includes('engineer') || title.includes('developer') || title.includes('architect') || cat.includes('development') || cat.includes('engineering')) {
      min = 95000;
      max = 165000;
    } else if (title.includes('product') || title.includes('program manager')) {
      min = 100000;
      max = 160000;
    } else if (title.includes('data') || title.includes('ai') || title.includes('machine learning')) {
      min = 105000;
      max = 175000;
    } else if (title.includes('design') || title.includes('ui') || title.includes('ux') || cat.includes('design')) {
      min = 75000;
      max = 135000;
    } else if (title.includes('marketing') || title.includes('growth') || title.includes('seo') || cat.includes('marketing')) {
      min = 65000;
      max = 120000;
    } else if (title.includes('sales') || title.includes('account executive') || cat.includes('sales')) {
      min = 70000;
      max = 130000;
    } else if (title.includes('support') || title.includes('customer success') || cat.includes('support')) {
      min = 45000;
      max = 85000;
    } else if (title.includes('writer') || title.includes('content') || cat.includes('writing')) {
      min = 50000;
      max = 95000;
    } else if (title.includes('finance') || title.includes('accounting') || cat.includes('finance')) {
      min = 70000;
      max = 130000;
    } else {
      min = 60000;
      max = 120000;
    }
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

  // 1. Job Title
  const titleSlug = slugify(job.title || 'remote-job');
  parts.push(titleSlug);

  // 2. Company Name
  if (job.company && job.company !== 'Hiring Company') {
    const compSlug = slugify(job.company);
    if (compSlug && !titleSlug.includes(compSlug)) {
      parts.push(compSlug);
    }
  }

  // 3. Workplace Type ('remote', 'onsite', 'hybrid')
  const wp = getWorkplaceSlug(job);
  if (!titleSlug.includes(wp)) {
    parts.push(wp);
  }

  // 4. Country / Anywhere
  const locSlug = formatLocationSlug(job.location);
  if (locSlug && !titleSlug.includes(locSlug) && !parts.includes(locSlug)) {
    parts.push(locSlug);
  }

  // 5. Job Type (full-time, contract, part-time, internship)
  const type = (job.job_type || '').toLowerCase();
  if (type.includes('part')) parts.push('part-time');
  else if (type.includes('contract') || type.includes('freelance')) parts.push('contract');
  else if (type.includes('intern')) parts.push('internship');
  else if (!titleSlug.includes('full-time')) parts.push('full-time');

  // 6. Salary if available
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

export function mapJobRow(row: any): RemoteJob {
  const title = row.title || 'Remote Position';
  return {
    id: row.id,
    title,
    company: row.company || 'Hiring Company',
    company_logo: row.company_logo || undefined,
    location: row.location || '100% Remote / Worldwide',
    salary: row.salary_range || row.salary || undefined,
    salary_range: row.salary_range || row.salary || undefined,
    salary_min: typeof row.salary_min === 'number' ? row.salary_min : (row.salary_min ? Number(row.salary_min) : undefined),
    salary_max: typeof row.salary_max === 'number' ? row.salary_max : (row.salary_max ? Number(row.salary_max) : undefined),
    job_type: row.job_type || 'Full-time',
    category: row.category || 'Engineering',
    tags: Array.isArray(row.tags) ? row.tags : [],
    description: row.description || '',
    requirements: row.requirements || undefined,
    benefits: row.benefits || undefined,
    apply_url: row.direct_apply_url || row.apply_url || undefined,
    direct_apply_url: row.direct_apply_url || row.apply_url || undefined,
    is_featured: row.is_featured || row.is_verified_employer || false,
    is_verified_employer: row.is_verified_employer ?? true,
    status: row.status || 'active',
    created_at: row.created_at || new Date().toISOString(),
    posted_timestamp: row.posted_timestamp || undefined,
    slug: buildSeoJobSlug(row),
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

  // Extract from string if numeric values are not in DB
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

  // Provide realistic market benchmark for remote role if not specified
  if (!min && !max) {
    const title = (job.title || '').toLowerCase();
    const cat = (job.category || '').toLowerCase();
    if (title.includes('devops') || title.includes('sre') || title.includes('cloud') || title.includes('security')) {
      min = 110000;
      max = 175000;
    } else if (title.includes('engineer') || title.includes('developer') || title.includes('architect') || cat.includes('development') || cat.includes('engineering')) {
      min = 95000;
      max = 165000;
    } else if (title.includes('product') || title.includes('program manager')) {
      min = 100000;
      max = 160000;
    } else if (title.includes('data') || title.includes('ai') || title.includes('machine learning')) {
      min = 105000;
      max = 175000;
    } else if (title.includes('design') || title.includes('ui') || title.includes('ux') || cat.includes('design')) {
      min = 75000;
      max = 135000;
    } else if (title.includes('marketing') || title.includes('growth') || title.includes('seo') || cat.includes('marketing')) {
      min = 65000;
      max = 120000;
    } else if (title.includes('sales') || title.includes('account executive') || cat.includes('sales')) {
      min = 70000;
      max = 130000;
    } else if (title.includes('support') || title.includes('customer success') || cat.includes('support')) {
      min = 45000;
      max = 85000;
    } else if (title.includes('writer') || title.includes('content') || cat.includes('writing')) {
      min = 50000;
      max = 95000;
    } else if (title.includes('finance') || title.includes('accounting') || cat.includes('finance')) {
      min = 70000;
      max = 130000;
    } else {
      min = 60000;
      max = 120000;
    }
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

