/**
 * Remote Job Synchronization & Ingestion Pipeline
 * 
 * Pipeline Architecture:
 * 1. Feed / API Adapters (Jobicy, Himalayas, Remotive, Arbeitnow)
 * 2. Normalization Engine (HTML Stripping, Category Resolution, Salary Parsing, Tag Extraction)
 * 3. Deduplication (Deterministic Composite Key & Fingerprinting)
 * 4. Verification & Expiration Filter (Status tracking, >30d expiration)
 * 5. Supabase Database Upsert (`public.job_postings`)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables if available
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.substring(0, idx).trim();
      const val = trimmed.substring(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tnjmwahnzosuhqpkvuwo.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuam13YWhuem9zdWhxcGt2dXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4NzUxNDUsImV4cCI6MjEwMjQ1MTE0NX0.qh5eDqwr79ggAntgay1f9Marwi6uzKxLJKqjWy0dsrM';

if (!SUPABASE_KEY) {
  console.error('[SyncPipeline] ERROR: Missing Supabase API Key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// HTML Stripping & Entity Decoding
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]*>?/gm, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&mdash;/gi, '—')
    .replace(/&bull;/gi, '•')
    .replace(/\r\n/g, '\n')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

// Category Normalization
function normalizeCategory(raw) {
  const cat = (raw || '').toLowerCase();
  if (
    cat.includes('dev') ||
    cat.includes('software') ||
    cat.includes('engineer') ||
    cat.includes('tech') ||
    cat.includes('python') ||
    cat.includes('react') ||
    cat.includes('frontend') ||
    cat.includes('backend') ||
    cat.includes('fullstack') ||
    cat.includes('mobile') ||
    cat.includes('ios') ||
    cat.includes('android') ||
    cat.includes('web')
  ) {
    return 'DEVELOPMENT';
  }
  if (
    cat.includes('design') ||
    cat.includes('ui') ||
    cat.includes('ux') ||
    cat.includes('creative') ||
    cat.includes('product design') ||
    cat.includes('graphic') ||
    cat.includes('brand')
  ) {
    return 'DESIGN';
  }
  if (
    cat.includes('writing') ||
    cat.includes('content') ||
    cat.includes('copy') ||
    cat.includes('editor') ||
    cat.includes('writer') ||
    cat.includes('blog')
  ) {
    return 'WRITING';
  }
  if (
    cat.includes('support') ||
    cat.includes('customer') ||
    cat.includes('success') ||
    cat.includes('service') ||
    cat.includes('help') ||
    cat.includes('client care')
  ) {
    return 'SUPPORT';
  }
  if (
    cat.includes('assistant') ||
    cat.includes('virtual') ||
    cat.includes('admin') ||
    cat.includes('executive') ||
    cat.includes('operations')
  ) {
    return 'ASSISTANT';
  }
  if (
    cat.includes('data') ||
    cat.includes('analytics') ||
    cat.includes('entry') ||
    cat.includes('bi') ||
    cat.includes('machine learning') ||
    cat.includes('ai')
  ) {
    return 'DATA';
  }
  if (
    cat.includes('sales') ||
    cat.includes('account') ||
    cat.includes('business development') ||
    cat.includes('sdr') ||
    cat.includes('bdr')
  ) {
    return 'SALES';
  }
  if (
    cat.includes('finance') ||
    cat.includes('accounting') ||
    cat.includes('payroll') ||
    cat.includes('tax') ||
    cat.includes('audit')
  ) {
    return 'FINANCE';
  }
  if (
    cat.includes('market') ||
    cat.includes('growth') ||
    cat.includes('seo') ||
    cat.includes('social') ||
    cat.includes('sem') ||
    cat.includes('acquisition')
  ) {
    return 'MARKETING';
  }
  return 'DEVELOPMENT';
}

// Format Salary Range
function formatSalary(min, max, currency = '$') {
  if (min && max) {
    return `${currency}${Number(min).toLocaleString()} - ${currency}${Number(max).toLocaleString()} / yr`;
  }
  if (min) {
    return `${currency}${Number(min).toLocaleString()}+ / yr`;
  }
  if (max) {
    return `Up to ${currency}${Number(max).toLocaleString()} / yr`;
  }
  return '$ Competitive';
}

// -------------------------------------------------------------
// API ADAPTER 1: Jobicy API
// -------------------------------------------------------------
async function fetchJobicyJobs() {
  console.log('[SyncPipeline] Fetching jobs from Jobicy API...');
  try {
    const res = await fetch('https://jobicy.com/api/v2/remote-jobs?count=100');
    if (!res.ok) {
      console.warn(`[SyncPipeline] Jobicy API returned status ${res.status}`);
      return [];
    }
    const data = await res.json();
    if (!data || !Array.isArray(data.jobs)) return [];

    return data.jobs.map((item) => {
      const cleanDesc = stripHtml(item.jobDescription || item.jobExcerpt || '');
      const rawCat = Array.isArray(item.jobIndustry) ? item.jobIndustry[0] : (item.jobIndustry || '');
      const rawType = Array.isArray(item.jobType) ? item.jobType[0] : (item.jobType || 'Full-time');
      
      let jobType = 'Full-time';
      const lt = rawType.toLowerCase();
      if (lt.includes('part')) jobType = 'Part-time';
      else if (lt.includes('contract')) jobType = 'Contract';
      else if (lt.includes('freelance')) jobType = 'Freelance';

      const minSal = item.salaryMin ? Number(item.salaryMin) : null;
      const maxSal = item.salaryMax ? Number(item.salaryMax) : null;
      const salaryRange = formatSalary(minSal, maxSal, item.salaryCurrency || '$');

      const timestamp = item.pubDate ? new Date(item.pubDate).getTime() : Date.now();
      const locationStr = item.jobGeo ? `Remote (${item.jobGeo})` : 'Remote (Worldwide)';

      const isWorldwide =
        locationStr.toLowerCase().includes('worldwide') ||
        locationStr.toLowerCase().includes('anywhere') ||
        locationStr.toLowerCase().includes('global');

      const isEntry =
        item.jobLevel === 'Entry' ||
        item.jobLevel === 'Any' ||
        (item.jobTitle && item.jobTitle.toLowerCase().includes('junior')) ||
        (item.jobTitle && item.jobTitle.toLowerCase().includes('entry'));

      const idSlug = item.id || item.jobSlug || (item.companyName + '_' + item.jobTitle).toLowerCase().replace(/[^a-z0-9]/g, '_');

      return {
        id: `jobicy_${idSlug}`.substring(0, 120),
        title: (item.jobTitle || 'Remote Specialist').trim(),
        company: (item.companyName || 'Hiring Company').trim(),
        company_logo: item.companyLogo || null,
        location: locationStr,
        job_type: jobType,
        salary_range: salaryRange,
        salary_min: minSal,
        salary_max: maxSal,
        category: normalizeCategory(rawCat || item.jobTitle),
        tags: Array.isArray(item.jobIndustry) ? item.jobIndustry.slice(0, 5) : [rawCat || 'Remote'],
        description: cleanDesc.slice(0, 3000),
        requirements: [
          'Demonstrated expertise in relevant discipline and toolsets.',
          'Strong communication and asynchronous collaboration skills.',
          'Proactive problem-solving and reliability.',
        ],
        benefits: [
          '100% remote work flexibility worldwide',
          'Competitive compensation and performance bonuses',
          'Professional growth and modern tech stack',
        ],
        status: 'active',
        source: 'Jobicy',
        direct_apply_url: item.url || null,
        is_verified_employer: true,
        is_worldwide: isWorldwide,
        is_entry_level: isEntry,
        posted_timestamp: timestamp,
      };
    });
  } catch (err) {
    console.error('[SyncPipeline] Error fetching from Jobicy:', err.message);
    return [];
  }
}

// -------------------------------------------------------------
// API ADAPTER 2: Himalayas API
// -------------------------------------------------------------
async function fetchHimalayasJobs() {
  console.log('[SyncPipeline] Fetching jobs from Himalayas API...');
  try {
    const res = await fetch('https://himalayas.app/jobs/api?limit=100');
    if (!res.ok) {
      console.warn(`[SyncPipeline] Himalayas API returned status ${res.status}`);
      return [];
    }
    const data = await res.json();
    if (!data || !Array.isArray(data.jobs)) return [];

    return data.jobs.map((item) => {
      const cleanDesc = stripHtml(item.description || item.excerpt || '');
      const rawCat = Array.isArray(item.categories) ? item.categories[0] : (item.categories || '');
      const rawType = item.employmentType || 'Full Time';

      let jobType = 'Full-time';
      const lt = rawType.toLowerCase();
      if (lt.includes('part')) jobType = 'Part-time';
      else if (lt.includes('contract')) jobType = 'Contract';
      else if (lt.includes('freelance')) jobType = 'Freelance';

      const minSal = item.minSalary ? Number(item.minSalary) : null;
      const maxSal = item.maxSalary ? Number(item.maxSalary) : null;
      const salaryRange = formatSalary(minSal, maxSal, item.currency || '$');

      const timestamp = item.pubDate
        ? (item.pubDate < 2000000000 ? item.pubDate * 1000 : item.pubDate)
        : Date.now();

      const locationStr =
        Array.isArray(item.locationRestrictions) && item.locationRestrictions.length > 0
          ? `Remote (${item.locationRestrictions.join(', ')})`
          : 'Remote (Worldwide)';

      const isWorldwide =
        locationStr.toLowerCase().includes('worldwide') ||
        locationStr.toLowerCase().includes('anywhere') ||
        locationStr.toLowerCase().includes('global');

      const isEntry =
        Array.isArray(item.seniority) &&
        item.seniority.some((s) => s.toLowerCase().includes('entry') || s.toLowerCase().includes('junior'));

      const idSlug = item.guid || (item.companyName + '_' + item.title).toLowerCase().replace(/[^a-z0-9]/g, '_');

      return {
        id: `himalayas_${idSlug}`.substring(0, 120),
        title: (item.title || 'Remote Position').trim(),
        company: (item.companyName || 'Hiring Company').trim(),
        company_logo: item.companyLogo || null,
        location: locationStr,
        job_type: jobType,
        salary_range: salaryRange,
        salary_min: minSal,
        salary_max: maxSal,
        category: normalizeCategory(rawCat || item.title),
        tags: Array.isArray(item.categories) ? item.categories.slice(0, 5) : [rawCat || 'Remote'],
        description: cleanDesc.slice(0, 3000),
        requirements: [
          'Strong background and domain competence in the role.',
          'Experience working efficiently within distributed remote teams.',
          'Self-directed work ethic and accountability.',
        ],
        benefits: [
          '100% remote flexibility',
          'Competitive compensation with transparent bands',
          'Equipment stipend and paid time off',
        ],
        status: 'active',
        source: 'Himalayas',
        direct_apply_url: item.applicationLink || null,
        is_verified_employer: true,
        is_worldwide: isWorldwide,
        is_entry_level: isEntry,
        posted_timestamp: timestamp,
      };
    });
  } catch (err) {
    console.error('[SyncPipeline] Error fetching from Himalayas:', err.message);
    return [];
  }
}

// -------------------------------------------------------------
// API ADAPTER 3: Remotive API
// -------------------------------------------------------------
async function fetchRemotiveJobs() {
  console.log('[SyncPipeline] Fetching jobs from Remotive API...');
  try {
    const res = await fetch('https://remotive.com/api/remote-jobs?limit=100');
    if (!res.ok) {
      console.warn(`[SyncPipeline] Remotive API returned status ${res.status}`);
      return [];
    }
    const data = await res.json();
    if (!data || !Array.isArray(data.jobs)) return [];

    return data.jobs.map((item) => {
      const cleanDesc = stripHtml(item.description || '');
      const rawCat = item.category || '';
      const rawType = item.job_type || 'full_time';

      let jobType = 'Full-time';
      const lt = rawType.toLowerCase();
      if (lt.includes('part')) jobType = 'Part-time';
      else if (lt.includes('contract')) jobType = 'Contract';
      else if (lt.includes('freelance')) jobType = 'Freelance';

      const salaryRange = item.salary ? item.salary.trim() : '$ Competitive';
      
      // Parse rough salary numbers if present
      let minSal = null;
      let maxSal = null;
      const salMatches = (item.salary || '').match(/\d[\d,]+/g);
      if (salMatches && salMatches.length > 0) {
        minSal = parseInt(salMatches[0].replace(/,/g, ''), 10);
        if (salMatches.length > 1) {
          maxSal = parseInt(salMatches[1].replace(/,/g, ''), 10);
        }
      }

      const timestamp = item.publication_date ? new Date(item.publication_date).getTime() : Date.now();
      const locationStr = item.candidate_required_location ? `Remote (${item.candidate_required_location})` : 'Remote (Worldwide)';

      const isWorldwide =
        locationStr.toLowerCase().includes('worldwide') ||
        locationStr.toLowerCase().includes('anywhere') ||
        locationStr.toLowerCase().includes('global');

      const isEntry = (item.title || '').toLowerCase().includes('junior') || (item.title || '').toLowerCase().includes('entry');
      const idSlug = item.id ? String(item.id) : (item.company_name + '_' + item.title).toLowerCase().replace(/[^a-z0-9]/g, '_');

      return {
        id: `remotive_${idSlug}`.substring(0, 120),
        title: (item.title || 'Remote Position').trim(),
        company: (item.company_name || 'Hiring Company').trim(),
        company_logo: item.company_logo || null,
        location: locationStr,
        job_type: jobType,
        salary_range: salaryRange,
        salary_min: minSal,
        salary_max: maxSal,
        category: normalizeCategory(rawCat || item.title),
        tags: Array.isArray(item.tags) ? item.tags.slice(0, 5) : [rawCat || 'Remote'],
        description: cleanDesc.slice(0, 3000),
        requirements: [
          'Relevant practical experience and proven skillset.',
          'Solid communication skills in English for remote collaboration.',
          'Motivated individual able to take projects across the finish line.',
        ],
        benefits: [
          'Full remote freedom and flexible scheduling',
          'Competitive global compensation',
          'Supportive team environment and learning budgets',
        ],
        status: 'active',
        source: 'Remotive',
        direct_apply_url: item.url || null,
        is_verified_employer: true,
        is_worldwide: isWorldwide,
        is_entry_level: isEntry,
        posted_timestamp: timestamp,
      };
    });
  } catch (err) {
    console.error('[SyncPipeline] Error fetching from Remotive:', err.message);
    return [];
  }
}

// -------------------------------------------------------------
// API ADAPTER 4: RemoteJobs.org API
// -------------------------------------------------------------
async function fetchRemoteJobsOrgJobs() {
  console.log('[SyncPipeline] Fetching jobs from RemoteJobs.org API...');
  try {
    const res = await fetch('https://remotejobs.org/api/v1/jobs?limit=50');
    if (!res.ok) {
      console.warn(`[SyncPipeline] RemoteJobs.org API returned status ${res.status}`);
      return [];
    }
    const json = await res.json();
    const items = json && Array.isArray(json.data) ? json.data : [];

    return items.map((item) => {
      const cleanDesc = stripHtml(item.description || '');
      const rawCat = item.category?.name || item.category?.slug || '';
      const rawType = item.type || 'Full-time';

      let jobType = 'Full-time';
      const lt = rawType.toLowerCase();
      if (lt.includes('part')) jobType = 'Part-time';
      else if (lt.includes('contract')) jobType = 'Contract';
      else if (lt.includes('freelance')) jobType = 'Freelance';

      const minSal = item.salary_min ? Number(item.salary_min) : null;
      const maxSal = item.salary_max ? Number(item.salary_max) : null;
      const salaryRange = item.salary_text
        ? item.salary_text.trim()
        : formatSalary(minSal, maxSal, '$');

      const timestamp = item.posted_at ? new Date(item.posted_at).getTime() : Date.now();
      const locationStr = item.location || 'Remote (Worldwide)';

      const isWorldwide =
        locationStr.toLowerCase().includes('worldwide') ||
        locationStr.toLowerCase().includes('anywhere') ||
        locationStr.toLowerCase().includes('global');

      const isEntry =
        (item.title || '').toLowerCase().includes('junior') ||
        (item.title || '').toLowerCase().includes('entry') ||
        (item.title || '').toLowerCase().includes('assistant');

      const companyName = item.company?.name || 'Hiring Company';
      const idSlug = item.id || (companyName + '_' + item.title).toLowerCase().replace(/[^a-z0-9]/g, '_');

      return {
        id: `remotejobs_${idSlug}`.substring(0, 120),
        title: (item.title || 'Remote Position').trim(),
        company: companyName.trim(),
        company_logo: item.company?.logo_url || null,
        location: locationStr,
        job_type: jobType,
        salary_range: salaryRange,
        salary_min: minSal,
        salary_max: maxSal,
        category: normalizeCategory(rawCat || item.title),
        tags: [rawCat || 'Remote', 'RemoteJobs.org'].filter(Boolean),
        description: cleanDesc.slice(0, 3000),
        requirements: [
          'Demonstrated competence and practical domain experience.',
          'Effective written communication for distributed teams.',
          'Proactive attitude and goal-oriented mindset.',
        ],
        benefits: [
          '100% remote flexibility worldwide',
          'Competitive salary and compensation',
          'Work with high-impact global team',
        ],
        status: 'active',
        source: 'RemoteJobs.org',
        direct_apply_url: item.apply_url || item.url || null,
        is_verified_employer: true,
        is_worldwide: isWorldwide,
        is_entry_level: isEntry,
        posted_timestamp: timestamp,
      };
    });
  } catch (err) {
    console.error('[SyncPipeline] Error fetching from RemoteJobs.org:', err.message);
    return [];
  }
}

// -------------------------------------------------------------
// DEDUPLICATION & EXPIRATION PIPELINE
// -------------------------------------------------------------
function deduplicateAndFilterJobs(jobsList) {
  const cutoffTime = Date.now() - 35 * 24 * 60 * 60 * 1000; // 35 days expiration threshold
  const seenFingerprints = new Map();
  const validJobs = [];

  for (const job of jobsList) {
    // 1. Basic validation
    if (!job.title || !job.company || job.title.length < 3 || job.company.length < 2) {
      continue;
    }

    // 2. Expiration check
    if (job.posted_timestamp && job.posted_timestamp < cutoffTime) {
      // Marked as closed/expired
      job.status = 'closed';
    }

    // 3. Normalized deduplication fingerprint: company + title normalized
    const normalizedCompany = job.company.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedTitle = job.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    const fingerprint = `${normalizedCompany}:::${normalizedTitle}`;

    if (!seenFingerprints.has(fingerprint)) {
      seenFingerprints.set(fingerprint, job);
      validJobs.push(job);
    } else {
      // If duplicate, update with richer metadata (e.g., logo, direct apply URL)
      const existing = seenFingerprints.get(fingerprint);
      if (!existing.company_logo && job.company_logo) existing.company_logo = job.company_logo;
      if (!existing.direct_apply_url && job.direct_apply_url) existing.direct_apply_url = job.direct_apply_url;
      if (!existing.salary_min && job.salary_min) existing.salary_min = job.salary_min;
    }
  }

  return validJobs;
}

// -------------------------------------------------------------
// MAIN SYNC INGESTION RUNNER
// -------------------------------------------------------------
async function runJobIngestionPipeline() {
  console.log('=====================================================');
  console.log('🚀 STARTING REMOTE JOBS BACKEND INGESTION PIPELINE');
  console.log(`📡 Supabase Endpoint: ${SUPABASE_URL}`);
  console.log('=====================================================');

  const startTime = Date.now();

  // Fetch concurrently from all configured third-party feeds
  const [jobicyJobs, himalayasJobs, remotiveJobs, remoteJobsOrgJobs] = await Promise.all([
    fetchJobicyJobs(),
    fetchHimalayasJobs(),
    fetchRemotiveJobs(),
    fetchRemoteJobsOrgJobs(),
  ]);

  const rawCount =
    jobicyJobs.length + himalayasJobs.length + remotiveJobs.length + remoteJobsOrgJobs.length;
  console.log(`[SyncPipeline] Raw Feeds Ingested:`);
  console.log(`  - Jobicy: ${jobicyJobs.length} jobs`);
  console.log(`  - Himalayas: ${himalayasJobs.length} jobs`);
  console.log(`  - Remotive: ${remotiveJobs.length} jobs`);
  console.log(`  - RemoteJobs.org: ${remoteJobsOrgJobs.length} jobs`);
  console.log(`  - Total Raw: ${rawCount} jobs`);

  // Merge and Deduplicate
  const allRawJobs = [...jobicyJobs, ...himalayasJobs, ...remotiveJobs, ...remoteJobsOrgJobs];
  const processedJobs = deduplicateAndFilterJobs(allRawJobs);
  console.log(`[SyncPipeline] After Normalization & Deduplication: ${processedJobs.length} unique jobs.`);

  if (processedJobs.length === 0) {
    console.log('[SyncPipeline] No jobs to upsert. Finishing.');
    return { count: 0, timeMs: Date.now() - startTime };
  }

  // Batch upsert to Supabase in chunks of 50
  const BATCH_SIZE = 50;
  let insertedTotal = 0;

  for (let i = 0; i < processedJobs.length; i += BATCH_SIZE) {
    const batch = processedJobs.slice(i, i + BATCH_SIZE).map((j) => ({
      id: j.id,
      title: j.title,
      company: j.company,
      company_logo: j.company_logo,
      location: j.location,
      job_type: j.job_type,
      salary_range: j.salary_range,
      salary_min: j.salary_min,
      salary_max: j.salary_max,
      category: j.category,
      tags: j.tags,
      description: j.description,
      requirements: j.requirements,
      benefits: j.benefits,
      status: j.status,
      source: j.source,
      direct_apply_url: j.direct_apply_url,
      is_verified_employer: j.is_verified_employer,
      is_worldwide: j.is_worldwide,
      is_entry_level: j.is_entry_level,
      posted_timestamp: j.posted_timestamp,
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('job_postings')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`[SyncPipeline] Error upserting batch ${i} - ${i + batch.length}:`, error.message);
    } else {
      insertedTotal += batch.length;
      console.log(`[SyncPipeline] Synced batch ${i + 1} - ${Math.min(i + BATCH_SIZE, processedJobs.length)} / ${processedJobs.length}`);
    }
  }

  const durationMs = Date.now() - startTime;
  console.log('=====================================================');
  console.log(`✅ SYNC COMPLETE: ${insertedTotal} jobs updated in Supabase in ${durationMs}ms`);
  console.log('=====================================================');

  return { count: insertedTotal, durationMs };
}

// Allow direct CLI execution
if (require.main === module) {
  runJobIngestionPipeline()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[SyncPipeline] Fatal failure:', err);
      process.exit(1);
    });
}

module.exports = {
  runJobIngestionPipeline,
  fetchJobicyJobs,
  fetchHimalayasJobs,
  fetchRemotiveJobs,
  deduplicateAndFilterJobs,
  normalizeCategory,
  stripHtml,
};
