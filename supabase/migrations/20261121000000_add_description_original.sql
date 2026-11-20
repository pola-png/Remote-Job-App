-- ==============================================================================
-- Schema Enhancement:
-- Preserve original API job descriptions for full data auditing & fidelity
-- ==============================================================================

-- 1. Add description_original column to public.job_postings if not present
ALTER TABLE public.job_postings 
ADD COLUMN IF NOT EXISTS description_original text DEFAULT NULL;

-- 2. Backfill existing rows so raw description is permanently preserved
UPDATE public.job_postings
SET description_original = description
WHERE description_original IS NULL AND description IS NOT NULL;
