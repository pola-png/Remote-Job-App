-- ==============================================================================
-- RemoteJobsHQ Web Backend - Dedicated Database Schema & Automated Pipelines
-- Project: https://gflwvtxpziasbdraugwj.supabase.co
-- ==============================================================================

-- 1. Create job_postings table
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
  description_original text DEFAULT NULL,
  requirements text[] DEFAULT ARRAY[]::text[],
  benefits text[] DEFAULT ARRAY[]::text[],
  status text NOT NULL DEFAULT 'active',
  source text DEFAULT 'Direct',
  direct_apply_url text,
  is_verified_employer boolean DEFAULT true,
  is_worldwide boolean DEFAULT true,
  is_entry_level boolean DEFAULT false,
  posted_timestamp bigint,
  is_ai_rewritten boolean DEFAULT false,
  ai_rewritten_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz DEFAULT timezone('utc'::text, now())
);

-- 2. Row Level Security (RLS)
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

-- 3. High-Performance Partial & Composite Indexes
CREATE INDEX IF NOT EXISTS idx_job_postings_category ON public.job_postings(category, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_postings_timestamp ON public.job_postings(posted_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_job_postings_ai_rewrite_queue 
ON public.job_postings (posted_timestamp DESC) 
WHERE status = 'active' AND is_ai_rewritten = false;

-- 4. Enable Required Supabase Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 5. Helper Function: Trigger Job Sync Edge Function (Midnight Daily)
CREATE OR REPLACE FUNCTION public.trigger_sync_remote_jobs_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_url text := 'https://gflwvtxpziasbdraugwj.supabase.co';
  anon_key text := 'sb_publishable_OMEzotvFLKVTYF4lmQV1eg_7hgg_-3k';
BEGIN
  PERFORM net.http_post(
    url := project_url || '/functions/v1/sync-remote-jobs',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key,
      'apikey', anon_key
    ),
    body := jsonb_build_object('source', 'pg_cron_daily_midnight_utc')
  );
END;
$$;

-- 6. Helper Function: Trigger Gemini Content Assistant Edge Function (Every 3 Hours)
CREATE OR REPLACE FUNCTION public.trigger_rewrite_jobs_gemini_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_url text := 'https://gflwvtxpziasbdraugwj.supabase.co';
  anon_key text := 'sb_publishable_OMEzotvFLKVTYF4lmQV1eg_7hgg_-3k';
BEGIN
  PERFORM net.http_post(
    url := project_url || '/functions/v1/rewrite-jobs-gemini',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key,
      'apikey', anon_key
    ),
    body := jsonb_build_object('source', 'pg_cron_200_daily', 'limit', 25)
  );
END;
$$;

-- 7. Schedule Cron Jobs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync_remote_jobs_daily_midnight') THEN
    PERFORM cron.unschedule('sync_remote_jobs_daily_midnight');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'rewrite_jobs_gemini_200_daily') THEN
    PERFORM cron.unschedule('rewrite_jobs_gemini_200_daily');
  END IF;
END $$;

-- Run Sync at Midnight UTC
SELECT cron.schedule(
  'sync_remote_jobs_daily_midnight',
  '0 0 * * *',
  'SELECT public.trigger_sync_remote_jobs_cron();'
);

-- Run AI Enhancement every 3 hours at :30 (8 runs x 25 = 200 jobs/day)
SELECT cron.schedule(
  'rewrite_jobs_gemini_200_daily',
  '30 */3 * * *',
  'SELECT public.trigger_rewrite_jobs_gemini_cron();'
);
