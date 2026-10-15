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
