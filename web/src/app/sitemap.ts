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
  const baseUrl = 'https://www.remotejobshq.online';

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
      priority: 0.9,
    };
  });

  // 4. Dynamic Category Hubs based on live jobs in database
  const detectedCategories = Array.from(
    new Set(allJobs.map((j) => (j.category || '').trim().toUpperCase()).filter(Boolean))
  );

  const fallbackCategories = [
    'DEVELOPMENT',
    'DESIGN',
    'MARKETING',
    'SALES',
    'SUPPORT',
    'WRITING',
    'DATA',
    'FINANCE',
    'ASSISTANT',
  ];

  const uniqueCategories = Array.from(new Set([...detectedCategories, ...fallbackCategories]));

  const categoryRoutes: MetadataRoute.Sitemap = uniqueCategories.map((cat) => {
    // Find latest job timestamp in this category
    const catJobs = allJobs.filter((j) => (j.category || '').trim().toUpperCase() === cat);
    const catLastMod = catJobs.length > 0 && (catJobs[0].updated_at || catJobs[0].created_at)
      ? new Date(catJobs[0].updated_at || catJobs[0].created_at!)
      : latestJobTimestamp;

    return {
      url: `${baseUrl}/?category=${encodeURIComponent(cat)}`,
      lastModified: catLastMod,
      changeFrequency: 'hourly',
      priority: 0.85,
    };
  });

  // 5. Main Site Routes with dynamic database-driven last modified dates
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
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date('2026-10-01'),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date('2026-10-01'),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  return [...mainRoutes, ...categoryRoutes, ...jobRoutes];
}
