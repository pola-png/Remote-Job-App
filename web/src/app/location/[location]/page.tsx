import { Metadata } from 'next';
import Link from 'next/link';
import { supabase, RemoteJob, mapJobRow } from '@/lib/supabase';
import { Briefcase, MapPin, ArrowRight, ArrowLeft } from 'lucide-react';

interface Props {
  params: { location: string };
}

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locName = decodeURIComponent(params.location).replace(/-/g, ' ');
  const formattedLoc = locName.charAt(0).toUpperCase() + locName.slice(1);
  const canonicalUrl = `https://remotejobshq.online/location/${encodeURIComponent(params.location.toLowerCase())}`;

  return {
    title: `Remote Jobs in ${formattedLoc} (Work From Anywhere) | Remote Jobs HQ`,
    description: `Discover top high-paying remote jobs hiring in ${formattedLoc}. 100% remote work opportunities with leading international employers.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `Remote Jobs in ${formattedLoc} - Remote Jobs HQ`,
      description: `Browse verified remote jobs available for candidates in ${formattedLoc}.`,
      url: canonicalUrl,
      type: 'website',
    },
  };
}

export default async function LocationPage({ params }: Props) {
  const rawLoc = decodeURIComponent(params.location).replace(/-/g, ' ');
  const formattedLoc = rawLoc.charAt(0).toUpperCase() + rawLoc.slice(1);

  // Search jobs matching location
  let query = supabase
    .from('job_postings')
    .select('*')
    .eq('status', 'active');

  if (rawLoc.toLowerCase() === 'worldwide' || rawLoc.toLowerCase() === 'anywhere') {
    query = query.or('location.ilike.%worldwide%,location.ilike.%anywhere%,location.is.null');
  } else {
    query = query.ilike('location', `%${rawLoc}%`);
  }

  const { data: rawJobs } = await query
    .order('posted_timestamp', { ascending: false, nullsFirst: false })
    .limit(80);

  const jobs: RemoteJob[] = (rawJobs || []).map(mapJobRow);
  const canonicalUrl = `https://remotejobshq.online/location/${encodeURIComponent(params.location.toLowerCase())}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Remote Jobs in ${formattedLoc}`,
    description: `Browse verified remote work opportunities hiring in ${formattedLoc}.`,
    url: canonicalUrl,
    itemListElement: jobs.slice(0, 30).map((job, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: `${job.title} at ${job.company}`,
      url: `https://remotejobshq.online/jobs/${encodeURIComponent(job.id)}`,
    })),
  };

  const breadcrumbsJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://remotejobshq.online',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Locations',
        item: 'https://remotejobshq.online',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${formattedLoc} Remote Jobs`,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <div className="container" style={{ paddingBottom: '5rem' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />

      <div style={{ margin: '2rem 0 1rem 0' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back to all jobs
        </Link>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', padding: '2.5rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', padding: '0.3rem 0.8rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          <MapPin size={14} /> Global Remote Region
        </div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Remote Jobs in {formattedLoc}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '750px', lineHeight: '1.6' }}>
          Find companies hiring remote professionals in {formattedLoc}. Enjoy true location independence with top salaries in USD and competitive benefits.
        </p>
        <div style={{ marginTop: '1.5rem', color: 'var(--text-subtle)', fontSize: '0.85rem' }}>
          Showing {jobs.length} open positions • Live verified
        </div>
      </div>

      <div className="jobs-grid">
        {jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--bg-card)', borderRadius: '1rem' }}>
            <Briefcase size={48} color="var(--text-subtle)" style={{ marginBottom: '1rem' }} />
            <h3>No jobs exclusively tagged with &quot;{formattedLoc}&quot; right now</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Most positions are Worldwide / 100% Anywhere.</p>
            <Link href="/" className="btn-secondary" style={{ marginTop: '1.5rem' }}>Browse All Remote Jobs</Link>
          </div>
        ) : (
          jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${encodeURIComponent(job.id)}`} className="job-card">
              <div className="job-info-left">
                <div className="company-logo">
                  {job.company_logo ? (
                    <img src={job.company_logo} alt={job.company} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    job.company.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>{job.company}</span>
                  <h3 className="job-title">{job.title}</h3>
                  <div className="job-meta">
                    <span className="job-meta-item">
                      <MapPin size={14} color="#38BDF8" /> {job.location || 'Worldwide (100% Remote)'}
                    </span>
                    {job.salary && !job.salary.toLowerCase().includes('competitive') && (
                      <span className="tag salary-tag">💰 {job.salary}</span>
                    )}
                  </div>
                </div>
              </div>
              <button className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                View Job <ArrowRight size={14} />
              </button>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
