-- ==============================================================================
-- Schema & Automation Migration:
-- 1. Add `is_ai_rewritten` and `ai_rewritten_at` tracking columns
-- 2. Index for high-speed queue processing with zero egress overhead
-- 3. Automatic 30-minute post-sync cron schedule
-- ==============================================================================

-- 1. Add tracking columns to public.job_postings
ALTER TABLE public.job_postings 
ADD COLUMN IF NOT EXISTS is_ai_rewritten boolean DEFAULT false;

ALTER TABLE public.job_postings 
ADD COLUMN IF NOT EXISTS ai_rewritten_at timestamptz DEFAULT NULL;

-- 2. Mark existing jobs that already have the enhanced format as true
UPDATE public.job_postings
SET is_ai_rewritten = true,
    ai_rewritten_at = now()
WHERE (is_ai_rewritten IS NULL OR is_ai_rewritten = false)
  AND description LIKE '%### Role Overview%'
  AND description LIKE '%### Key Responsibilities%';

-- 3. Partial index: lets Supabase instantly query ONLY the pending jobs with zero table scans
CREATE INDEX IF NOT EXISTS idx_job_postings_ai_rewrite_queue 
ON public.job_postings (posted_timestamp DESC) 
WHERE status = 'active' AND is_ai_rewritten = false;

-- 4. Enable required extensions for HTTP cron triggers
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 5. Helper function for triggering the Gemini Rewrite Edge Function
CREATE OR REPLACE FUNCTION public.trigger_rewrite_jobs_gemini_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_url text := 'https://tnjmwahnzosuhqpkvuwo.supabase.co';
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuam13YWhuem9zdWhxcGt2dXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4NzUxNDUsImV4cCI6MjEwMjQ1MTE0NX0.qh5eDqwr79ggAntgay1f9Marwi6uzKxLJKqjWy0dsrM';
BEGIN
  PERFORM net.http_post(
    url := project_url || '/functions/v1/rewrite-jobs-gemini',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object('source', 'pg_cron_200_daily', 'limit', 25)
  );
END;
$$;

-- 6. Schedule: Runs every 3 hours at :30 (8 runs per day)
-- 25 jobs x 8 runs = Exactly 200 jobs per day!
-- 25 jobs takes ~55 seconds (well under the 150s timeout limit so no 504 errors!)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'rewrite_jobs_gemini_post_sync') THEN
    PERFORM cron.unschedule('rewrite_jobs_gemini_post_sync');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'rewrite_jobs_gemini_every_3h') THEN
    PERFORM cron.unschedule('rewrite_jobs_gemini_every_3h');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'rewrite_jobs_gemini_200_daily') THEN
    PERFORM cron.unschedule('rewrite_jobs_gemini_200_daily');
  END IF;
END $$;

SELECT cron.schedule(
  'rewrite_jobs_gemini_200_daily',
  '30 */3 * * *',
  'SELECT public.trigger_rewrite_jobs_gemini_cron();'
);
