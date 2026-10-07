-- =====================================================================
-- REMOTE JOBS & MICRO-TASKS COMPLETE SUPABASE DATABASE SETUP
-- Run this in your Supabase Dashboard -> SQL Editor
-- URL: https://supabase.com/dashboard/project/tnjmwahnzosuhqpkvuwo/sql
-- =====================================================================

-- -------------------------------------------------------------
-- 1. Profiles Table Extensions
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  handle text,
  display_name text,
  is_verified boolean DEFAULT false,
  verification_status text DEFAULT 'unverified',
  is_banned boolean DEFAULT false,
  push_token text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS handle text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'unverified';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS push_token text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'FREE'; -- FREE, PREMIUM, PRO
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_period text DEFAULT 'monthly'; -- monthly, yearly
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_open_to_work boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_skills text[] DEFAULT ARRAY['React', 'TypeScript', 'Node.js', 'Remote Work', 'Communication']::text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT timezone('utc'::text, now());
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc'::text, now());

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
CREATE POLICY "Users can view profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- -------------------------------------------------------------
-- 2. Creator Balances Table (Wallet & Available Balance)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.creator_balances (
  creator_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_usd numeric(10, 4) NOT NULL DEFAULT 0.0,
  available_balance_usd numeric(10, 4) NOT NULL DEFAULT 0.0,
  created_at timestamptz DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.creator_balances ADD COLUMN IF NOT EXISTS balance_usd numeric(10, 4) NOT NULL DEFAULT 0.0;
ALTER TABLE public.creator_balances ADD COLUMN IF NOT EXISTS available_balance_usd numeric(10, 4) NOT NULL DEFAULT 0.0;
ALTER TABLE public.creator_balances ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT timezone('utc'::text, now());
ALTER TABLE public.creator_balances ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc'::text, now());

ALTER TABLE public.creator_balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own creator balance" ON public.creator_balances;
CREATE POLICY "Users can view their own creator balance" ON public.creator_balances FOR SELECT USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can manage their creator balance" ON public.creator_balances;
CREATE POLICY "Users can manage their creator balance" ON public.creator_balances FOR ALL USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);

-- Backfill creator_balances for any existing users
INSERT INTO public.creator_balances (creator_id, balance_usd, available_balance_usd, created_at, updated_at)
SELECT id, 0.0, 0.0, timezone('utc'::text, now()), timezone('utc'::text, now())
FROM auth.users
ON CONFLICT (creator_id) DO NOTHING;

-- Trigger: Automatically create balance row on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user_creator_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.creator_balances (creator_id, balance_usd, available_balance_usd, created_at, updated_at)
  VALUES (NEW.id, 0.0, 0.0, timezone('utc'::text, now()), timezone('utc'::text, now()))
  ON CONFLICT (creator_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_creator_balance ON auth.users;
CREATE TRIGGER on_auth_user_created_creator_balance
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_creator_balance();

-- -------------------------------------------------------------
-- 3. Monetization Events Table (Task Completion & Ledger)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.monetization_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  format text,
  creator_earnings_micros bigint NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.monetization_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own monetization events" ON public.monetization_events;
CREATE POLICY "Users can view their own monetization events" ON public.monetization_events FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own monetization events" ON public.monetization_events;
CREATE POLICY "Users can insert their own monetization events" ON public.monetization_events FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_monetization_events_user ON public.monetization_events(user_id, created_at DESC);

-- -------------------------------------------------------------
-- 4. Payout Requests Table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_usd numeric(10, 2) NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, approved, processing, paid, rejected
  payout_method text NOT NULL,
  admin_notes text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own payout requests" ON public.payout_requests;
CREATE POLICY "Users can view their own payout requests" ON public.payout_requests FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can submit payout requests" ON public.payout_requests;
CREATE POLICY "Users can submit payout requests" ON public.payout_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_payout_requests_user ON public.payout_requests(user_id, created_at DESC);

-- -------------------------------------------------------------
-- 5. Job Applications Table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id text NOT NULL,
  job_title text NOT NULL,
  company text NOT NULL,
  applicant_name text NOT NULL,
  applicant_email text NOT NULL,
  resume_url text NOT NULL,
  cover_note text,
  status text NOT NULL DEFAULT 'submitted', -- submitted, in_review, shortlisted, rejected
  created_at timestamptz DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own job applications" ON public.job_applications;
CREATE POLICY "Users can view their own job applications" ON public.job_applications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own job applications" ON public.job_applications;
CREATE POLICY "Users can insert their own job applications" ON public.job_applications FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_job_applications_user ON public.job_applications(user_id, created_at DESC);

-- -------------------------------------------------------------
-- 6. Job Postings Table (Employer Posted Remote Jobs)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_postings (
  id text PRIMARY KEY,
  employer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  company text NOT NULL,
  company_logo text,
  location text NOT NULL DEFAULT 'Remote (Worldwide)',
  job_type text NOT NULL DEFAULT 'Full-time',
  salary_range text NOT NULL DEFAULT '$ Competitive',
  salary_min numeric,
  salary_max numeric,
  category text NOT NULL DEFAULT 'DEVELOPMENT',
  tags text[] DEFAULT ARRAY[]::text[],
  description text NOT NULL,
  requirements text[] DEFAULT ARRAY[]::text[],
  benefits text[] DEFAULT ARRAY[]::text[],
  status text NOT NULL DEFAULT 'active', -- active, closed, paused
  source text DEFAULT 'Direct', -- Jobicy, Himalayas, Remotive, Direct, Curated
  direct_apply_url text,
  is_verified_employer boolean DEFAULT true,
  is_worldwide boolean DEFAULT true,
  is_entry_level boolean DEFAULT false,
  posted_timestamp bigint,
  created_at timestamptz DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.job_postings ADD COLUMN IF NOT EXISTS company_logo text;
ALTER TABLE public.job_postings ADD COLUMN IF NOT EXISTS salary_min numeric;
ALTER TABLE public.job_postings ADD COLUMN IF NOT EXISTS salary_max numeric;
ALTER TABLE public.job_postings ADD COLUMN IF NOT EXISTS source text DEFAULT 'Direct';
ALTER TABLE public.job_postings ADD COLUMN IF NOT EXISTS direct_apply_url text;
ALTER TABLE public.job_postings ADD COLUMN IF NOT EXISTS is_verified_employer boolean DEFAULT true;
ALTER TABLE public.job_postings ADD COLUMN IF NOT EXISTS is_worldwide boolean DEFAULT true;
ALTER TABLE public.job_postings ADD COLUMN IF NOT EXISTS is_entry_level boolean DEFAULT false;
ALTER TABLE public.job_postings ADD COLUMN IF NOT EXISTS posted_timestamp bigint;

ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active job postings" ON public.job_postings;
CREATE POLICY "Anyone can view active job postings" ON public.job_postings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can post jobs" ON public.job_postings;
CREATE POLICY "Authenticated users can post jobs" ON public.job_postings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Employers can update their own job postings" ON public.job_postings;
CREATE POLICY "Employers can update their own job postings" ON public.job_postings FOR UPDATE USING (auth.uid() = employer_id OR employer_id IS NULL);

DROP POLICY IF EXISTS "Allow job ingestion upsert" ON public.job_postings;
CREATE POLICY "Allow job ingestion upsert" ON public.job_postings FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_job_postings_category ON public.job_postings(category, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_postings_timestamp ON public.job_postings(posted_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON public.job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_salary_min ON public.job_postings(salary_min);

-- -------------------------------------------------------------
-- 7. Realtime Publication Enablement
-- -------------------------------------------------------------
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.creator_balances;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payout_requests;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
