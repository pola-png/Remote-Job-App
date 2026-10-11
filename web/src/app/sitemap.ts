import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

// Force dynamic ISR execution - regenerates every hour in background and serves instantly from Edge CDN
export const revalidate = 3600;

interface DynamicJobRecord {
  id: string;
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
        .select('id, category, updated_at, created_at, posted_timestamp')
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

  // 3. Dynamic Job Posting Routes
  const jobRoutes: MetadataRoute.Sitemap = allJobs.map((job) => {
    let date = new Date();
    if (job.updated_at) {
      date = new Date(job.updated_at);
    } else if (job.created_at) {
      date = new Date(job.created_at);
    } else if (job.posted_timestamp) {
      date = new Date(Number(job.posted_timestamp));
    }

    return {
      url: `${baseUrl}/jobs/${encodeURIComponent(job.id)}`,
      lastModified: date,
      changeFrequency: 'daily',
      priority: 1.0,
    };
  });

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
    'react',
    'python',
    'javascript',
    'typescript',
    'nodejs',
    'frontend',
    'backend',
    'fullstack',
    'devops',
    'aws',
    'product-manager',
    'ui-ux',
    'copywriter',
    'content-writer',
    'seo',
    'data-analyst',
    'data-engineer',
    'machine-learning',
    'ai',
    'customer-service',
    'customer-support',
    'account-executive',
    'sales-development',
    'recruiter',
    'financial-analyst',
    'bookkeeper',
    'virtual-assistant',
    'qa-engineer',
    'mobile-developer',
    'flutter',
    'solidity',
    'cybersecurity',
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

  // 7. Crawlable Directory Pages for Complete Job Spidering
  const directoryRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/all-jobs`,
      lastModified: latestJobTimestamp,
      changeFrequency: 'always' as const,
      priority: 1.0,
    },
    ...Array.from({ length: 15 }, (_, i) => ({
      url: `${baseUrl}/all-jobs?page=${i + 1}`,
      lastModified: latestJobTimestamp,
      changeFrequency: 'daily' as const,
      priority: 1.0,
    })),
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
