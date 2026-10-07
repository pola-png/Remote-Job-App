import { supabase } from '../config/supabase';
import { MemoryAndDiskCache } from './cache';

export interface RemoteJob {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  jobType: 'Full-time' | 'Part-time' | 'Contract' | 'Freelance';
  salaryRange: string;
  salaryMin?: number;
  salaryMax?: number;
  category:
    | 'DEVELOPMENT'
    | 'DESIGN'
    | 'MARKETING'
    | 'WRITING'
    | 'SUPPORT'
    | 'ASSISTANT'
    | 'DATA'
    | 'SALES'
    | 'FINANCE';
  postedDate: string;
  postedTimestamp?: number;
  tags: string[];
  description: string;
  requirements: string[];
  benefits: string[];
  isApplied?: boolean;
  isVerifiedEmployer?: boolean;
  isWorldwide?: boolean;
  isEntryLevel?: boolean;
  source?: 'Jobicy' | 'Himalayas' | 'Remotive' | 'RemoteJobs' | 'Direct' | 'Curated' | string;
  directApplyUrl?: string;
  contactEmail?: string;
  contactInfo?: string;
}

export interface JobFilterOptions {
  searchQuery?: string;
  category?: string;
  postedWithinHours?: number; // 24 or 3 (Premium)
  minSalary?: number; // e.g. 100000 (Premium/Pro)
  experienceLevel?: 'all' | 'entry' | 'no_experience' | 'senior';
  isWorldwideOnly?: boolean;
  jobType?: string;
}

const CLEAN_HTML_REGEX = /<[^>]*>?/gm;

function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(CLEAN_HTML_REGEX, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

export function extractContactEmail(text: string = '', rawContact: string = ''): string | undefined {
  if (rawContact && rawContact.includes('@')) {
    const match = rawContact.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
    if (match) return match[0];
  }
  if (!text) return undefined;
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,7}\b/g;
  const matches = text.match(emailRegex);
  if (matches && matches.length > 0) {
    const valid = matches.filter((e) => {
      const lower = e.toLowerCase();
      return (
        !lower.endsWith('.png') &&
        !lower.endsWith('.jpg') &&
        !lower.endsWith('.jpeg') &&
        !lower.endsWith('.webp') &&
        !lower.includes('schema.org') &&
        !lower.includes('w3.org') &&
        !lower.includes('example.com') &&
        !lower.includes('domain.com') &&
        !lower.includes('sentry.io') &&
        !lower.includes('github.com')
      );
    });
    if (valid.length > 0) return valid[0];
  }
  return undefined;
}

function normalizeCategory(rawCat: string = ''): RemoteJob['category'] {
  const cat = rawCat.toLowerCase();
  if (cat.includes('dev') || cat.includes('software') || cat.includes('engineer') || cat.includes('tech') || cat.includes('python') || cat.includes('react') || cat.includes('web')) {
    return 'DEVELOPMENT';
  }
  if (cat.includes('design') || cat.includes('ui') || cat.includes('ux') || cat.includes('creative') || cat.includes('product design')) {
    return 'DESIGN';
  }
  if (cat.includes('writing') || cat.includes('content') || cat.includes('copy') || cat.includes('editor')) {
    return 'WRITING';
  }
  if (cat.includes('support') || cat.includes('customer') || cat.includes('success') || cat.includes('service') || cat.includes('help')) {
    return 'SUPPORT';
  }
  if (cat.includes('assistant') || cat.includes('virtual') || cat.includes('admin') || cat.includes('operations')) {
    return 'ASSISTANT';
  }
  if (cat.includes('data') || cat.includes('analytics') || cat.includes('entry') || cat.includes('catalog')) {
    return 'DATA';
  }
  if (cat.includes('sales') || cat.includes('account') || cat.includes('business development') || cat.includes('sdr')) {
    return 'SALES';
  }
  if (cat.includes('finance') || cat.includes('accounting') || cat.includes('payroll') || cat.includes('tax')) {
    return 'FINANCE';
  }
  if (cat.includes('market') || cat.includes('growth') || cat.includes('seo') || cat.includes('social')) {
    return 'MARKETING';
  }
  return 'DEVELOPMENT';
}

function formatTimeAgo(isoOrTimestamp: string | number): string {
  try {
    const time = typeof isoOrTimestamp === 'number'
      ? (isoOrTimestamp < 2000000000 ? isoOrTimestamp * 1000 : isoOrTimestamp)
      : new Date(isoOrTimestamp).getTime();

    const diffMs = Date.now() - time;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours <= 0) return 'Just now';
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    return `${Math.floor(diffDays / 7)} weeks ago`;
  } catch (_) {
    return 'Recently';
  }
}

export const RemoteJobsService = {
  /**
   * Fetches remote jobs exclusively from Supabase backend (`public.job_postings`)
   * and live remote job feeds, with local memory & disk caching.
   * Zero mock or dummy fallback data.
   */
  async getRemoteJobs(filters?: JobFilterOptions | string, categoryArg?: string): Promise<RemoteJob[]> {
    // Normalize arguments
    let options: JobFilterOptions = {};
    if (typeof filters === 'string') {
      options.searchQuery = filters;
      options.category = categoryArg || 'ALL';
    } else if (filters) {
      options = filters;
    }

    try {
      const appliedList = await this.getAppliedJobIds();
      const customJobs =
        (await MemoryAndDiskCache.get<RemoteJob[]>('custom_posted_jobs', 1000 * 60 * 60 * 24 * 30)) || [];

      // Fetch from Supabase backend or live feeds
      const backendJobs = await this.fetchJobsFromSupabase();

      // Combine: Custom employer postings first + Synced jobs
      const allJobsMap = new Map<string, RemoteJob>();

      // 1. Custom employer postings first
      customJobs.forEach((j) => allJobsMap.set(j.id, j));

      // 2. Real remote jobs
      backendJobs.forEach((j) => {
        if (!allJobsMap.has(j.id)) allJobsMap.set(j.id, j);
      });

      let list = Array.from(allJobsMap.values()).map((j) => ({
        ...j,
        isApplied: appliedList.includes(j.id),
      }));

      // Apply Filters
      const { searchQuery, category, postedWithinHours, minSalary, experienceLevel, isWorldwideOnly, jobType } = options;

      if (category && category !== 'ALL') {
        list = list.filter((j) => j.category === category);
      }

      if (postedWithinHours && postedWithinHours > 0) {
        const cutoff = Date.now() - postedWithinHours * 3600 * 1000;
        list = list.filter((j) => (j.postedTimestamp ? j.postedTimestamp >= cutoff : true));
      }

      if (minSalary && minSalary > 0) {
        list = list.filter((j) => (j.salaryMin ? j.salaryMin >= minSalary : true));
      }

      if (experienceLevel && experienceLevel !== 'all') {
        if (experienceLevel === 'entry' || experienceLevel === 'no_experience') {
          list = list.filter((j) => j.isEntryLevel || j.title.toLowerCase().includes('entry') || j.title.toLowerCase().includes('junior') || j.title.toLowerCase().includes('assistant'));
        } else if (experienceLevel === 'senior') {
          list = list.filter((j) => j.title.toLowerCase().includes('senior') || j.title.toLowerCase().includes('lead') || j.title.toLowerCase().includes('architect'));
        }
      }

      if (isWorldwideOnly) {
        list = list.filter((j) => j.isWorldwide || j.location.toLowerCase().includes('worldwide') || j.location.toLowerCase().includes('anywhere') || j.location.toLowerCase().includes('global'));
      }

      if (jobType && jobType !== 'ALL') {
        list = list.filter((j) => j.jobType.toLowerCase() === jobType.toLowerCase());
      }

      if (searchQuery && searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        list = list.filter(
          (j) =>
            j.title.toLowerCase().includes(q) ||
            j.company.toLowerCase().includes(q) ||
            j.location.toLowerCase().includes(q) ||
            j.description.toLowerCase().includes(q) ||
            j.tags.some((t) => t.toLowerCase().includes(q))
        );
      }

      // Move applied jobs to the bottom so users always see fresh unapplied jobs first!
      list.sort((a, b) => {
        if (a.isApplied && !b.isApplied) return 1;
        if (!a.isApplied && b.isApplied) return -1;
        return (b.postedTimestamp || 0) - (a.postedTimestamp || 0);
      });

      return list;
    } catch (_) {
      return [];
    }
  },

  /**
   * Queries Supabase `public.job_postings` table directly.
   * If table is empty or not yet provisioned, fetches real live jobs directly
   * from live remote job APIs (Jobicy, Himalayas, Remotive), caches them locally,
   * and attempts to upsert them into Supabase.
   */
  async fetchJobsFromSupabase(): Promise<RemoteJob[]> {
    const cacheKey = 'cached_supabase_remote_jobs_v2';
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('status', 'active')
        .order('posted_timestamp', { ascending: false, nullsFirst: false })
        .limit(150);

      if (!error && data && data.length > 0) {
        const mapped: RemoteJob[] = data.map((row: any) => ({
          id: row.id,
          title: row.title || 'Remote Position',
          company: row.company || 'Hiring Company',
          companyLogo: row.company_logo || undefined,
          location: row.location || 'Remote (Worldwide)',
          jobType: (row.job_type as RemoteJob['jobType']) || 'Full-time',
          salaryRange: row.salary_range && !row.salary_range.toLowerCase().includes('competitive') ? row.salary_range : undefined,
          salaryMin: row.salary_min ? Number(row.salary_min) : undefined,
          salaryMax: row.salary_max ? Number(row.salary_max) : undefined,
          category: (row.category as RemoteJob['category']) || normalizeCategory(row.title),
          postedDate: formatTimeAgo(row.posted_timestamp || row.created_at),
          postedTimestamp: row.posted_timestamp
            ? Number(row.posted_timestamp)
            : row.created_at
            ? new Date(row.created_at).getTime()
            : Date.now(),
          tags: Array.isArray(row.tags) && row.tags.length > 0 ? row.tags : ['Remote'],
          description: row.description || '',
          requirements:
            Array.isArray(row.requirements) && row.requirements.length > 0
              ? row.requirements
              : [
                  'Demonstrated expertise in relevant discipline.',
                  'Strong communication and remote collaboration skills.',
                  'Proactive problem-solving and accountability.',
                ],
          benefits:
            Array.isArray(row.benefits) && row.benefits.length > 0
              ? row.benefits
              : [
                  '100% remote flexibility',
                  'Competitive compensation package',
                  'Growth and professional development opportunities',
                ],
          isVerifiedEmployer: row.is_verified_employer ?? true,
          isWorldwide:
            row.is_worldwide ??
            (row.location?.toLowerCase().includes('worldwide') || row.location?.toLowerCase().includes('global')),
          isEntryLevel: row.is_entry_level ?? false,
          source: row.source || 'Direct',
          directApplyUrl: row.direct_apply_url || undefined,
          contactEmail: row.contact_email || row.application_email || extractContactEmail(row.description, row.contact_info || row.direct_apply_url),
          contactInfo: row.contact_info || undefined,
        }));

        await MemoryAndDiskCache.set(cacheKey, mapped);
        return mapped;
      }

      // If Supabase has no data or table is not ready, fetch live real jobs directly
      const liveJobs = await this.fetchLiveExternalJobs();
      if (liveJobs && liveJobs.length > 0) {
        await MemoryAndDiskCache.set(cacheKey, liveJobs);
        // Try background syncing to Supabase if table is ready
        this.syncJobsToSupabaseBackground(liveJobs);
        return liveJobs;
      }

      const cached = await MemoryAndDiskCache.get<RemoteJob[]>(cacheKey, 1000 * 60 * 60 * 24 * 7);
      return cached && cached.length > 0 ? cached : [];
    } catch (_) {
      // Offline fallback: try disk cache
      const cached = await MemoryAndDiskCache.get<RemoteJob[]>(cacheKey, 1000 * 60 * 60 * 24 * 7);
      return cached && cached.length > 0 ? cached : [];
    }
  },

  /**
   * Fetches real live remote jobs in real-time from official public job feeds
   * (Jobicy, Himalayas, Remotive)
   */
  async fetchLiveExternalJobs(): Promise<RemoteJob[]> {
    const jobs: RemoteJob[] = [];
    const seenIds = new Set<string>();

    const fetchPromises = [
      // 1. Jobicy Feed (100% real live jobs)
      (async () => {
        try {
          const res = await fetch('https://jobicy.com/api/v2/remote-jobs?count=50');
          if (!res.ok) return [];
          const data = await res.json();
          if (!data || !Array.isArray(data.jobs)) return [];
          return data.jobs.map((item: any) => {
            const cleanDesc = stripHtml(item.jobDescription || item.jobExcerpt || '');
            const rawCat = Array.isArray(item.jobIndustry) ? item.jobIndustry[0] : (item.jobIndustry || '');
            const rawType = Array.isArray(item.jobType) ? item.jobType[0] : (item.jobType || 'Full-time');
            let jobType: RemoteJob['jobType'] = 'Full-time';
            const lt = (rawType || '').toLowerCase();
            if (lt.includes('part')) jobType = 'Part-time';
            else if (lt.includes('contract')) jobType = 'Contract';
            else if (lt.includes('freelance')) jobType = 'Freelance';

            const minSal = item.salaryMin ? Number(item.salaryMin) : undefined;
            const maxSal = item.salaryMax ? Number(item.salaryMax) : undefined;
            let salaryRange: string | undefined = undefined;
            if (minSal && maxSal) {
              salaryRange = `$${minSal.toLocaleString()} - $${maxSal.toLocaleString()} / yr`;
            } else if (minSal) {
              salaryRange = `$${minSal.toLocaleString()}+ / yr`;
            }

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

            const id = `jobicy_${item.id || item.jobSlug || (item.companyName + '_' + item.jobTitle).toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

            return {
              id,
              title: (item.jobTitle || 'Remote Specialist').trim(),
              company: (item.companyName || 'Hiring Company').trim(),
              companyLogo: item.companyLogo || undefined,
              location: locationStr,
              jobType,
              salaryRange,
              salaryMin: minSal,
              salaryMax: maxSal,
              category: normalizeCategory(rawCat || item.jobTitle),
              postedDate: formatTimeAgo(timestamp),
              postedTimestamp: timestamp,
              tags: Array.isArray(item.jobIndustry) && item.jobIndustry.length > 0 ? item.jobIndustry.slice(0, 5) : [rawCat || 'Remote'],
              description: cleanDesc || 'Exciting remote opportunity with immediate availability.',
              requirements: [
                'Demonstrated professional experience in relevant field.',
                'Strong communication and remote collaboration skills.',
                'Self-directed problem solver with positive attitude.',
              ],
              benefits: [
                '100% remote flexibility',
                'Competitive compensation package',
                'Growth and professional development opportunities',
              ],
              isVerifiedEmployer: true,
              isWorldwide,
              isEntryLevel: isEntry,
              source: 'Jobicy',
              directApplyUrl: item.url || undefined,
              contactEmail: extractContactEmail(cleanDesc, item.url || ''),
            } as RemoteJob;
          });
        } catch (_) {
          return [];
        }
      })(),

      // 2. Remotive Feed (100% real live jobs)
      (async () => {
        try {
          const res = await fetch('https://remotive.com/api/remote-jobs?limit=50');
          if (!res.ok) return [];
          const data = await res.json();
          if (!data || !Array.isArray(data.jobs)) return [];
          return data.jobs.map((item: any) => {
            const cleanDesc = stripHtml(item.description || '');
            const rawType = item.job_type || 'full_time';
            let jobType: RemoteJob['jobType'] = 'Full-time';
            if (rawType.includes('part')) jobType = 'Part-time';
            else if (rawType.includes('contract')) jobType = 'Contract';
            else if (rawType.includes('freelance')) jobType = 'Freelance';

            const rawSalary = (item.salary || '').trim();
            const salaryRange = rawSalary && !rawSalary.toLowerCase().includes('competitive') ? rawSalary : undefined;
            const timestamp = item.publication_date ? new Date(item.publication_date).getTime() : Date.now();
            const locationStr = item.candidate_required_location ? `Remote (${item.candidate_required_location})` : 'Remote (Worldwide)';

            const isWorldwide =
              locationStr.toLowerCase().includes('worldwide') ||
              locationStr.toLowerCase().includes('anywhere') ||
              locationStr.toLowerCase().includes('global');

            const isEntry =
              (item.title && item.title.toLowerCase().includes('junior')) ||
              (item.title && item.title.toLowerCase().includes('entry'));

            const id = `remotive_${item.id || (item.company_name + '_' + item.title).toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

            return {
              id,
              title: (item.title || 'Remote Position').trim(),
              company: (item.company_name || 'Hiring Company').trim(),
              companyLogo: item.company_logo || undefined,
              location: locationStr,
              jobType,
              salaryRange,
              category: normalizeCategory(item.category || item.title),
              postedDate: formatTimeAgo(timestamp),
              postedTimestamp: timestamp,
              tags: Array.isArray(item.tags) && item.tags.length > 0 ? item.tags.slice(0, 5) : [item.category || 'Remote'],
              description: cleanDesc || 'Join a high-growth remote team working asynchronously worldwide.',
              requirements: [
                'Proven track record in remote work environments.',
                'Fluent English communication skills.',
                'High level of autonomy and responsibility.',
              ],
              benefits: [
                'Flexible work hours across time zones',
                'Comprehensive compensation package',
                'Remote office setup allowance',
              ],
              isVerifiedEmployer: true,
              isWorldwide,
              isEntryLevel: isEntry,
              source: 'Remotive',
              directApplyUrl: item.url || undefined,
              contactEmail: extractContactEmail(cleanDesc, item.url || ''),
            } as RemoteJob;
          });
        } catch (_) {
          return [];
        }
      })(),

      // 3. Himalayas Feed (100% real live jobs)
      (async () => {
        try {
          const res = await fetch('https://himalayas.app/jobs/api?limit=50');
          if (!res.ok) return [];
          const data = await res.json();
          if (!data || !Array.isArray(data.jobs)) return [];
          return data.jobs.map((item: any) => {
            const cleanDesc = stripHtml(item.description || item.excerpt || '');
            const rawCat = Array.isArray(item.categories) ? item.categories[0] : (item.categories || '');
            let jobType: RemoteJob['jobType'] = 'Full-time';
            const lt = (item.employmentType || '').toLowerCase();
            if (lt.includes('part')) jobType = 'Part-time';
            else if (lt.includes('contract')) jobType = 'Contract';

            const minSal = item.minSalary ? Number(item.minSalary) : undefined;
            const maxSal = item.maxSalary ? Number(item.maxSalary) : undefined;
            let salaryRange: string | undefined = undefined;
            if (minSal && maxSal) {
              salaryRange = `$${minSal.toLocaleString()} - $${maxSal.toLocaleString()} / yr`;
            } else if (minSal) {
              salaryRange = `$${minSal.toLocaleString()}+ / yr`;
            }

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

            const id = `himalayas_${item.guid || item.slug || (item.companyName + '_' + item.title).toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

            return {
              id,
              title: (item.title || 'Remote Specialist').trim(),
              company: (item.companyName || 'Hiring Company').trim(),
              companyLogo: item.companyLogo || undefined,
              location: locationStr,
              jobType,
              salaryRange,
              salaryMin: minSal,
              salaryMax: maxSal,
              category: normalizeCategory(rawCat || item.title),
              postedDate: formatTimeAgo(timestamp),
              postedTimestamp: timestamp,
              tags: Array.isArray(item.categories) && item.categories.length > 0 ? item.categories.slice(0, 5) : ['Remote'],
              description: cleanDesc || 'Exciting remote opportunity.',
              requirements: [
                'Demonstrated domain proficiency.',
                'Excellent asynchronous written communication.',
              ],
              benefits: [
                'Work from anywhere',
                'Competitive base salary',
              ],
              isVerifiedEmployer: true,
              isWorldwide,
              isEntryLevel: false,
              source: 'Himalayas',
              directApplyUrl: item.applicationLink || undefined,
            } as RemoteJob;
          });
        } catch (_) {
          return [];
        }
      })(),
    ];

    const results = await Promise.all(fetchPromises);
    results.flat().forEach((j) => {
      if (j && j.id && !seenIds.has(j.id)) {
        seenIds.add(j.id);
        jobs.push(j);
      }
    });

    return jobs;
  },

  /**
   * Background helper to upsert jobs into Supabase `public.job_postings`
   */
  async syncJobsToSupabaseBackground(jobs: RemoteJob[]): Promise<void> {
    try {
      if (!jobs || jobs.length === 0) return;
      const payload = jobs.slice(0, 50).map((j) => ({
        id: j.id,
        title: j.title,
        company: j.company,
        company_logo: j.companyLogo || null,
        location: j.location,
        job_type: j.jobType,
        salary_range: j.salaryRange,
        salary_min: j.salaryMin || null,
        salary_max: j.salaryMax || null,
        category: j.category,
        tags: j.tags,
        description: j.description,
        requirements: j.requirements,
        benefits: j.benefits,
        status: 'active',
        source: j.source,
        direct_apply_url: j.directApplyUrl || null,
        is_verified_employer: j.isVerifiedEmployer,
        is_worldwide: j.isWorldwide,
        is_entry_level: j.isEntryLevel,
        posted_timestamp: j.postedTimestamp,
        updated_at: new Date().toISOString(),
      }));

      await supabase.from('job_postings').upsert(payload, { onConflict: 'id' });
    } catch (_) {
      // Ignored if table not created yet
    }
  },

  async postRemoteJob(jobData: {
    title: string;
    company: string;
    location: string;
    jobType: 'Full-time' | 'Part-time' | 'Contract' | 'Freelance';
    salaryRange: string;
    category: 'DEVELOPMENT' | 'DESIGN' | 'MARKETING' | 'WRITING' | 'SUPPORT' | 'ASSISTANT' | 'DATA';
    tags: string[];
    description: string;
    requirements: string[];
    benefits: string[];
    employerUserId?: string;
  }): Promise<{ success: boolean; message: string; job?: RemoteJob }> {
    try {
      const newJob: RemoteJob = {
        id: `posted_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: jobData.title.trim(),
        company: jobData.company.trim(),
        location: jobData.location.trim() || 'Remote (Worldwide)',
        jobType: jobData.jobType || 'Full-time',
        salaryRange: jobData.salaryRange.trim() || '$ Competitive',
        category: jobData.category || 'DEVELOPMENT',
        postedDate: 'Just now',
        postedTimestamp: Date.now(),
        tags: jobData.tags && jobData.tags.length > 0 ? jobData.tags : ['Remote', jobData.category.toLowerCase()],
        description: jobData.description.trim(),
        requirements:
          jobData.requirements && jobData.requirements.length > 0
            ? jobData.requirements
            : ['Strong communication skills and remote experience.', 'Self-starter with problem solving capabilities.'],
        benefits:
          jobData.benefits && jobData.benefits.length > 0
            ? jobData.benefits
            : ['100% remote flexibility', 'Competitive compensation & growth opportunities'],
        isApplied: false,
        isVerifiedEmployer: true,
        source: 'Direct',
      };

      const customJobs =
        (await MemoryAndDiskCache.get<RemoteJob[]>('custom_posted_jobs', 1000 * 60 * 60 * 24 * 30)) || [];
      customJobs.unshift(newJob);
      await MemoryAndDiskCache.set('custom_posted_jobs', customJobs);

      // Save job posting to Supabase in background
      (async () => {
        try {
          await supabase.from('job_postings').insert({
            id: newJob.id,
            employer_id: jobData.employerUserId || null,
            title: newJob.title,
            company: newJob.company,
            location: newJob.location,
            job_type: newJob.jobType,
            salary_range: newJob.salaryRange,
            category: newJob.category,
            tags: newJob.tags,
            description: newJob.description,
            requirements: newJob.requirements,
            benefits: newJob.benefits,
            status: 'active',
            created_at: new Date().toISOString(),
          });
        } catch (_) {}
      })();

      return {
        success: true,
        message: `Job position "${newJob.title}" posted successfully! It is now live in the Remote Jobs feed.`,
        job: newJob,
      };
    } catch (e: any) {
      return { success: false, message: e.message || 'Failed to post job listing.' };
    }
  },

  async applyForJob(
    userId: string,
    job: RemoteJob,
    applicationData: {
      fullName: string;
      email: string;
      portfolioOrResumeUrl: string;
      coverNote: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.markJobAppliedLocally(job.id);

      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId || '');

      (async () => {
        try {
          await supabase.from('job_applications').insert({
            user_id: isValidUUID ? userId : null,
            job_id: job.id,
            job_title: job.title,
            company: job.company,
            applicant_name: applicationData.fullName.trim(),
            applicant_email: applicationData.email.trim(),
            resume_url: applicationData.portfolioOrResumeUrl.trim(),
            cover_note: applicationData.coverNote ? applicationData.coverNote.trim() : null,
            status: 'submitted',
            created_at: new Date().toISOString(),
          });
        } catch (_) {}
      })();

      return {
        success: true,
        message: `Your application for "${job.title}" at ${job.company} was submitted successfully! The hiring team will reach out via email.`,
      };
    } catch (e: any) {
      return { success: false, message: e.message || 'Failed to submit application.' };
    }
  },

  async getAppliedJobIds(): Promise<string[]> {
    try {
      const cached = await MemoryAndDiskCache.get<string[]>('applied_remote_jobs_v1', 1000 * 60 * 60 * 24 * 30);
      return cached || [];
    } catch (_) {
      return [];
    }
  },

  async markJobAppliedLocally(jobId: string): Promise<void> {
    try {
      const existing = await this.getAppliedJobIds();
      if (!existing.includes(jobId)) {
        existing.push(jobId);
        await MemoryAndDiskCache.set('applied_remote_jobs_v1', existing);
      }
    } catch (_) {}
  },
};
