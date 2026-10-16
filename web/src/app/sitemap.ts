import { MetadataRoute } from 'next';
import { supabase, slugify, buildSeoJobSlug } from '@/lib/supabase';

// Force dynamic ISR execution - regenerates every hour in background and serves instantly from Edge CDN
export const revalidate = 3600;

interface DynamicJobRecord {
  id: string;
  title?: string | null;
  company?: string | null;
  location?: string | null;
  job_type?: string | null;
  salary_range?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  category?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  posted_timestamp?: number | null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://remotejobshq.online';

  // 1. Fetch 100% of live active jobs from Supabase using pagination (bypassing PostgREST 1000 row cap)
  const allJobs: DynamicJobRecord[] = [];
  const pageSize = 1000;
  let from = 0;

  try {
    while (true) {
      const { data, error } = await supabase
        .from('job_postings')
        .select('id, title, company, location, job_type, salary_range, salary_min, salary_max, category, updated_at, created_at, posted_timestamp')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1);

      if (error || !data || data.length === 0) break;
      allJobs.push(...data);
      if (data.length < pageSize) break;
      from += pageSize;
    }
  } catch (err) {
    console.error('Dynamic sitemap job query error:', err);
  }

  // 2. Compute latest database modification timestamp
  const latestJobTimestamp = allJobs.length > 0 && (allJobs[0].updated_at || allJobs[0].created_at)
    ? new Date(allJobs[0].updated_at || allJobs[0].created_at!)
    : new Date();

  // 3. Dynamic Job Posting Routes (Rich High-Intent SEO Slugs for Google)
  const seenSlugs = new Set<string>();
  const jobRoutes: MetadataRoute.Sitemap = [];

  for (const job of allJobs) {
    let date = new Date();
    if (job.updated_at) {
      date = new Date(job.updated_at);
    } else if (job.created_at) {
      date = new Date(job.created_at);
    } else if (job.posted_timestamp) {
      date = new Date(Number(job.posted_timestamp));
    }

    let slug = buildSeoJobSlug({
      title: job.title || undefined,
      company: job.company || undefined,
      location: job.location || undefined,
      job_type: job.job_type || undefined,
      salary_range: job.salary_range || undefined,
      salary_min: typeof job.salary_min === 'number' ? job.salary_min : undefined,
      salary_max: typeof job.salary_max === 'number' ? job.salary_max : undefined,
      category: job.category || undefined,
      id: job.id,
    });

    if (!slug || slug === 'job' || slug === 'remote-job') {
      slug = `job-${job.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}`;
    }

    // Disambiguate if exact duplicate slug occurs so all jobs have distinct sitemap URLs
    if (seenSlugs.has(slug)) {
      const cleanId = job.id.replace(/^jobicy_/, '').replace(/^himalayas_/, '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
      slug = `${slug}-${cleanId}`;
    }
    seenSlugs.add(slug);

    jobRoutes.push({
      url: `${baseUrl}/jobs/${slug}`,
      lastModified: date,
      changeFrequency: 'daily',
      priority: 1.0,
    });
  }

  // 4. Dedicated Programmatic Category Hubs (Clean URLs)
  const categorySlugs = [
    'development',
    'design',
    'marketing',
    'sales',
    'support',
    'writing',
    'data',
    'finance',
    'assistant',
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categorySlugs.map((slug) => ({
    url: `${baseUrl}/category/${slug}`,
    lastModified: latestJobTimestamp,
    changeFrequency: 'hourly' as const,
    priority: 1.0,
  }));

  // 5. High-Demand Role & Skill Programmatic Landing Pages (Ultra SEO)
  const roleSlugs = [
    'software-engineer',
    'product-manager',
    'project-manager',
    'account-executive',
    'customer-support',
    'customer-success',
    'customer-service',
    'sales-development',
    'sales-manager',
    'marketing-manager',
    'operations-manager',
    'frontend',
    'backend',
    'fullstack',
    'devops',
    'data-analyst',
    'data-engineer',
    'machine-learning',
    'ai',
    'cybersecurity',
    'security',
    'product-designer',
    'ui-ux',
    'graphic-designer',
    'video-editor',
    'virtual-assistant',
    'executive-assistant',
    'accountant',
    'bookkeeper',
    'financial-analyst',
    'recruiter',
    'copywriter',
    'content-writer',
    'seo',
    'qa-engineer',
    'mobile-developer',
    'react',
    'python',
    'javascript',
    'typescript',
    'nodejs',
    'aws',
    'flutter',
    'solidity',
  ];

  const roleRoutes: MetadataRoute.Sitemap = roleSlugs.map((slug) => ({
    url: `${baseUrl}/role/${slug}`,
    lastModified: latestJobTimestamp,
    changeFrequency: 'daily' as const,
    priority: 1.0,
  }));

  // 6. High-CTR Location Hub Programmatic Pages
  const locationSlugs = [
    'worldwide',
    'united-states',
    'europe',
    'united-kingdom',
    'canada',
    'germany',
    'netherlands',
    'australia',
    'asia',
    'latin-america',
    'remote-anywhere',
  ];

  const locationRoutes: MetadataRoute.Sitemap = locationSlugs.map((slug) => ({
    url: `${baseUrl}/location/${slug}`,
    lastModified: latestJobTimestamp,
    changeFrequency: 'daily' as const,
    priority: 1.0,
  }));

  // 7. Crawlable Directory Pages for Complete Job Spidering (Only Canonical Root)
  const directoryRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/all-jobs`,
      lastModified: latestJobTimestamp,
      changeFrequency: 'always' as const,
      priority: 1.0,
    },
  ];

  // 8. Main Site Core Routes (100% Priority for all pages)
  const mainRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: latestJobTimestamp,
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/post-job`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date('2026-10-01'),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date('2026-10-01'),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
  ];

  return [
    ...mainRoutes,
    ...categoryRoutes,
    ...roleRoutes,
    ...locationRoutes,
    ...directoryRoutes,
    ...jobRoutes,
  ];
}
