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

export function getJobSlug(job: { title?: string; id?: string; slug?: string }): string {
  if (job.slug) return job.slug;
  if (job.title) {
    const s = slugify(job.title);
    if (s && s !== 'job') return s;
  }
  if (job.id) {
    return slugify(job.id);
  }
  return 'remote-job';
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
    slug: row.slug || slugify(title),
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

