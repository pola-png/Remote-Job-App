import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export const revalidate = 3600; // Update sitemap hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://remotejobshq.online';

  // Base static routes
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

  try {
    const { data: jobs } = await supabase
      .from('job_postings')
      .select('id, title, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1000);

    const jobRoutes: MetadataRoute.Sitemap = (jobs || []).map((job) => {
      const slug = job.id;
      return {
        url: `${baseUrl}/jobs/${slug}`,
        lastModified: new Date(job.created_at || Date.now()),
        changeFrequency: 'daily',
        priority: 0.9,
      };
    });

    return [...staticRoutes, ...jobRoutes];
  } catch (e) {
    return staticRoutes;
  }
}
