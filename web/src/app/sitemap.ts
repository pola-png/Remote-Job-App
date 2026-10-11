import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // 100% Dynamic: Queries live database on every crawler request

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://remotejobshq.online';

  // 1. Primary Static Landing Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
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
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // 2. High-CTR Category Hubs for Google Indexing
  const categories = [
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

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}/?category=${cat}`,
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.85,
  }));

  // 3. Dynamic Individual Job URLs
  try {
    const { data: jobs } = await supabase
      .from('job_postings')
      .select('id, updated_at, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5000);

    const jobRoutes: MetadataRoute.Sitemap = (jobs || []).map((job) => ({
      url: `${baseUrl}/jobs/${encodeURIComponent(job.id)}`,
      lastModified: new Date(job.updated_at || job.created_at || Date.now()),
      changeFrequency: 'daily',
      priority: 0.9,
    }));

    return [...staticRoutes, ...categoryRoutes, ...jobRoutes];
  } catch (e) {
    return [...staticRoutes, ...categoryRoutes];
  }
}
