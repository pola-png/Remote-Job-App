-- ============================================================================
-- Supabase Scheduled Remote Jobs Ingestion & Synchronization
-- Frequency: Once Daily (Midnight 00:00 UTC)
-- URL: https://tnjmwahnzosuhqpkvuwo.supabase.co/functions/v1/sync-remote-jobs
-- ============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Create helper function to trigger the Edge Function via HTTP POST
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

-- 3. Unschedule existing job if already registered
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync_remote_jobs_daily_midnight') THEN
    PERFORM cron.unschedule('sync_remote_jobs_daily_midnight');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync_remote_jobs_schedule') THEN
    PERFORM cron.unschedule('sync_remote_jobs_schedule');
  END IF;
END $$;

-- 4. Register the daily midnight UTC cron schedule ('0 0 * * *')
SELECT cron.schedule(
  'sync_remote_jobs_daily_midnight',
  '0 0 * * *',  -- Runs every day at 00:00 UTC (Midnight)
  'SELECT public.trigger_sync_remote_jobs_cron();'
);

-- 5. Trigger an initial run right now to populate database immediately
SELECT public.trigger_sync_remote_jobs_cron();

-- 6. Check registered cron jobs
SELECT jobid, jobname, schedule, active, command FROM cron.job;
