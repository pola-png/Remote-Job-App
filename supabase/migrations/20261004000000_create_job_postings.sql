-- Create job_postings table and daily cron
CREATE TABLE IF NOT EXISTS public.job_postings (
  id text PRIMARY KEY,
  employer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  company text NOT NULL,
  company_logo text,
  location text NOT NULL DEFAULT 'Remote (Worldwide)',
  job_type text NOT NULL DEFAULT 'Full-time',
  salary_range text,
  salary_min numeric,
  salary_max numeric,
  category text NOT NULL DEFAULT 'DEVELOPMENT',
  tags text[] DEFAULT ARRAY[]::text[],
  description text NOT NULL,
  requirements text[] DEFAULT ARRAY[]::text[],
  benefits text[] DEFAULT ARRAY[]::text[],
  status text NOT NULL DEFAULT 'active',
  source text DEFAULT 'Direct',
  direct_apply_url text,
  is_verified_employer boolean DEFAULT true,
  is_worldwide boolean DEFAULT true,
  is_entry_level boolean DEFAULT false,
  posted_timestamp bigint,
  created_at timestamptz DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active job postings" ON public.job_postings;
CREATE POLICY "Anyone can view active job postings" 
ON public.job_postings 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow job ingestion upsert" ON public.job_postings;
CREATE POLICY "Allow job ingestion upsert" 
ON public.job_postings 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_job_postings_category ON public.job_postings(category, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_postings_timestamp ON public.job_postings(posted_timestamp DESC);

-- Enable cron & net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Helper function for cron trigger
CREATE OR REPLACE FUNCTION public.trigger_sync_remote_jobs_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_url text := 'https://tnjmwahnzosuhqpkvuwo.supabase.co';
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuam13YWhuem9zdWhxcGt2dXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4NzUxNDUsImV4cCI6MjEwMjQ1MTE0NX0.qh5eDqwr79ggAntgay1f9Marwi6uzKxLJKqjWy0dsrM';
BEGIN
  PERFORM net.http_post(
    url := project_url || '/functions/v1/sync-remote-jobs',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object('source', 'pg_cron_daily_midnight_utc')
  );
END;
$$;

-- Register daily midnight cron schedule
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync_remote_jobs_daily_midnight') THEN
    PERFORM cron.unschedule('sync_remote_jobs_daily_midnight');
  END IF;
END $$;

SELECT cron.schedule(
  'sync_remote_jobs_daily_midnight',
  '0 0 * * *',
  'SELECT public.trigger_sync_remote_jobs_cron();'
);
