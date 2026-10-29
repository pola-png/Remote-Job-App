-- ============================================================================
-- Supabase Scheduled Dynamic Push Notifications (Every 3 Hours)
-- Automatically fetches live micro-tasks, identifies the highest paying offer,
-- and sends high-converting alert messages to all users via FCM topic.
-- ============================================================================

-- 1. Enable required PostgreSQL extensions for background scheduling & HTTP dispatch
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Create helper function to trigger the send-push-notification edge function
CREATE OR REPLACE FUNCTION send_scheduled_task_push_notification()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_url text := 'https://tnjmwahnzosuhqpkvuwo.supabase.co';
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuam13YWhuem9zdWhxcGt2dXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4NzUxNDUsImV4cCI6MjEwMjQ1MTE0NX0.qh5eDqwr79ggAntgay1f9Marwi6uzKxLJKqjWy0dsrM';
BEGIN
  -- Calls the edge function with fetchHighestTask: true
  -- The edge function dynamically queries live tasks, finds the highest payout,
  -- and crafts an engaging time-of-day alert sent to the 'all-users' topic.
  PERFORM net.http_post(
    url := project_url || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object(
      'topic', 'all-users',
      'fetchHighestTask', true
    )
  );
END;
$$;

-- 3. Schedule the function to run every 3 hours 
-- (Minute 0 past every 3rd hour: 00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00 UTC)
SELECT cron.unschedule('xapzap_3hour_task_notification')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'xapzap_3hour_task_notification'
);

-- Register cron job
SELECT cron.schedule(
  'xapzap_3hour_task_notification',
  '0 */3 * * *',
  'SELECT send_scheduled_task_push_notification();'
);

-- 4. View active scheduled cron jobs to verify
SELECT * FROM cron.job;
