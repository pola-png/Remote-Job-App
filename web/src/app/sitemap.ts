import { MetadataRoute } from 'next';
import { supabase, buildSeoJobSlug, getShortJobHash, isAuthenticJobRow } from '@/lib/supabase';
import { CAREER_GUIDES } from '@/lib/careerGuides';

export const revalidate = 21600;

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

  const allJobs: DynamicJobRecord[] = [];

  try {
    const { data } = await supabase
      .from('job_postings')
      .select('id, title, company, location, job_type, salary_range, salary_min, salary_max, category, updated_at, created_at, posted_timestamp')
      .eq('status', 'active')
      .order('posted_timestamp', { ascending: false, nullsFirst: false })
      .range(0, 999);

    if (data && data.length > 0) {
      allJobs.push(...data.filter(isAuthenticJobRow));
    }
  } catch (err) {
    console.error('Dynamic sitemap job query error:', err);
  }

  const latestJobTimestamp =
    allJobs.length > 0 && (allJobs[0].updated_at || allJobs[0].created_at)
      ? new Date(allJobs[0].updated_at || allJobs[0].created_at!)
      : new Date();

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
      slug = `remote-role-${getShortJobHash(job.id)}`;
    }

    // Disambiguate using clean deterministic hash (never exposing source prefix)
    if (seenSlugs.has(slug)) {
      slug = `${slug}-${getShortJobHash(job.id)}`;
    }
    seenSlugs.add(slug);

    jobRoutes.push({
      url: `${baseUrl}/jobs/${slug}`,
      lastModified: date,
      changeFrequency: 'daily',
      priority: 0.9,
    });
  }

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
  ];

  const roleRoutes: MetadataRoute.Sitemap = roleSlugs.map((slug) => ({
    url: `${baseUrl}/role/${slug}`,
    lastModified: latestJobTimestamp,
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

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
    priority: 0.9,
  }));

  const guideRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/guides`,
      lastModified: new Date('2025-02-28'),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    ...CAREER_GUIDES.map((g) => ({
      url: `${baseUrl}/guides/${g.slug}`,
      lastModified: new Date(g.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 1.0,
    })),
  ];

  const mainRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: latestJobTimestamp,
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/all-jobs`,
      lastModified: latestJobTimestamp,
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/salary-guide`,
      lastModified: new Date('2025-02-28'),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date('2025-02-28'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date('2025-02-28'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/post-job`,
      lastModified: new Date('2025-02-28'),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date('2025-02-28'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date('2025-02-28'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  return [
    ...mainRoutes,
    ...guideRoutes,
    ...categoryRoutes,
    ...roleRoutes,
    ...locationRoutes,
    ...jobRoutes,
  ];
}
