-- =====================================================================
-- MANDATORY YOUTUBE CHANNEL SUBSCRIBE TASK ($2.00 REWARD + ADMIN APPROVAL)
-- Channel: https://www.youtube.com/channel/UC3BjjkuvOg0mwdq6NAY1pZw
-- Run this script in the Supabase Dashboard -> SQL Editor
-- =====================================================================

-- 1. Create YouTube Subscription Screenshot Proofs Table
CREATE TABLE IF NOT EXISTS public.youtube_subscription_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email varchar,
  youtube_handle varchar,
  channel_id varchar NOT NULL DEFAULT 'UC3BjjkuvOg0mwdq6NAY1pZw',
  screenshot_data_url text NOT NULL,
  screenshot_file_name varchar,
  reward_usd numeric(10, 2) NOT NULL DEFAULT 2.00,
  status varchar NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  reward_credited boolean NOT NULL DEFAULT false,
  admin_note text,
  submitted_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_youtube_proofs_status ON public.youtube_subscription_proofs(status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_youtube_proofs_user_id ON public.youtube_subscription_proofs(user_id);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.youtube_subscription_proofs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current authenticated user is an Admin/Staff
CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND (
        profiles.username ILIKE '%admin%'
        OR profiles.username ILIKE '%staff%'
      )
  )
  OR (coalesce(auth.jwt() ->> 'email', '') ILIKE '%admin%');
$$;

-- Policy: Users can view their own submission
DROP POLICY IF EXISTS "Users can view their own youtube proof" ON public.youtube_subscription_proofs;
CREATE POLICY "Users can view their own youtube proof"
  ON public.youtube_subscription_proofs
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_app_admin());

-- Policy: Users can submit their own proof (status must be 'pending' and reward_credited false)
DROP POLICY IF EXISTS "Users can insert their own youtube proof" ON public.youtube_subscription_proofs;
CREATE POLICY "Users can insert their own youtube proof"
  ON public.youtube_subscription_proofs
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND reward_credited = false
  );

-- Policy: Users can resubmit if rejected or pending (cannot self-approve)
DROP POLICY IF EXISTS "Users can update their own pending or rejected youtube proof" ON public.youtube_subscription_proofs;
CREATE POLICY "Users can update their own pending or rejected youtube proof"
  ON public.youtube_subscription_proofs
  FOR UPDATE
  USING (auth.uid() = user_id AND reward_credited = false)
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND reward_credited = false
  );

-- Policy: Admins can view and approve/reject all proofs
DROP POLICY IF EXISTS "Admins can manage all youtube proofs" ON public.youtube_subscription_proofs;
CREATE POLICY "Admins can manage all youtube proofs"
  ON public.youtube_subscription_proofs
  FOR ALL
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

-- 3. Automatic Trigger: Credit +$2.00 to creator_balances ONLY when Admin sets status = 'approved'
CREATE OR REPLACE FUNCTION public.handle_youtube_proof_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reward numeric(10, 4);
BEGIN
  NEW.updated_at := timezone('utc'::text, now());

  -- Only credit once when transitioning to 'approved' and not yet credited
  IF NEW.status = 'approved' AND COALESCE(OLD.reward_credited, false) = false THEN
    v_reward := COALESCE(NEW.reward_usd, 2.00);

    INSERT INTO public.creator_balances (
      creator_id,
      balance_usd,
      available_balance_usd,
      created_at,
      updated_at
    )
    VALUES (
      NEW.user_id,
      v_reward,
      v_reward,
      timezone('utc'::text, now()),
      timezone('utc'::text, now())
    )
    ON CONFLICT (creator_id) DO UPDATE
    SET
      balance_usd = COALESCE(public.creator_balances.balance_usd, 0) + v_reward,
      available_balance_usd = COALESCE(public.creator_balances.available_balance_usd, 0) + v_reward,
      updated_at = timezone('utc'::text, now());

    NEW.reward_credited := true;
    NEW.reviewed_at := COALESCE(NEW.reviewed_at, timezone('utc'::text, now()));
    IF auth.uid() IS NOT NULL THEN
      NEW.reviewed_by := COALESCE(NEW.reviewed_by, auth.uid());
    END IF;
  ELSIF NEW.status = 'rejected' AND OLD.status IS DISTINCT FROM 'rejected' THEN
    NEW.reviewed_at := timezone('utc'::text, now());
    IF auth.uid() IS NOT NULL THEN
      NEW.reviewed_by := COALESCE(NEW.reviewed_by, auth.uid());
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_youtube_proof_approval ON public.youtube_subscription_proofs;
CREATE TRIGGER trg_youtube_proof_approval
  BEFORE UPDATE ON public.youtube_subscription_proofs
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_youtube_proof_approval();
