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
  job_type?: string;
  category?: string;
  tags?: string[];
  description: string;
  requirements?: string;
  apply_url?: string;
  is_featured?: boolean;
  is_active?: boolean;
  created_at: string;
  slug?: string;
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}
