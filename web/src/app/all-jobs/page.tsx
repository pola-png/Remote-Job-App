import { Metadata } from 'next';
import Link from 'next/link';
import { supabase, RemoteJob, mapJobRow } from '@/lib/supabase';
import { Briefcase, MapPin, ArrowRight, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: { page?: string };
}): Promise<Metadata> {
  const pageNum = parseInt(searchParams?.page || '1', 10) || 1;
  const canonicalUrl = `https://remotejobshq.online/all-jobs${pageNum > 1 ? `?page=${pageNum}` : ''}`;

  return {
    title: `All Remote Jobs Directory (Page ${pageNum}) | Remote Jobs HQ`,
    description: `Complete crawlable index and directory of all 1,200+ verified remote jobs available worldwide. Work from anywhere with top global tech companies.`,
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function AllJobsDirectoryPage({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  const pageNum = Math.max(1, parseInt(searchParams?.page || '1', 10) || 1);
  const pageSize = 50;
  const from = (pageNum - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: rawJobs, count } = await supabase
    .from('job_postings')
    .select('*', { count: 'exact' })
    .eq('status', 'active')
    .order('posted_timestamp', { ascending: false, nullsFirst: false })
    .range(from, to);

  const totalCount = count || 1237;
  const totalPages = Math.ceil(totalCount / pageSize);
  const jobs: RemoteJob[] = (rawJobs || []).map(mapJobRow);

  return (
    <div className="container" style={{ paddingBottom: '5rem' }}>
      <div style={{ margin: '2rem 0 1rem 0' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back to homepage
        </Link>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', padding: '2.5rem', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Complete Remote Jobs Directory
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '750px', lineHeight: '1.6' }}>
          Browse every verified remote career opportunity across Engineering, Design, Marketing, Sales, and Support.
        </p>
        <div style={{ marginTop: '1rem', color: '#38BDF8', fontWeight: 700 }}>
          Page {pageNum} of {totalPages} • Showing {jobs.length} of {totalCount} total positions
        </div>
      </div>

      <div className="jobs-grid">
        {jobs.map((job) => (
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
                  {job.job_type && (
                    <span className="job-meta-item">
                      <Briefcase size={14} /> {job.job_type}
                    </span>
                  )}
                  {job.salary && !job.salary.toLowerCase().includes('competitive') && (
                    <span className="tag salary-tag">💰 {job.salary}</span>
                  )}
                </div>
              </div>
            </div>
            <button className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              Apply <ArrowRight size={14} />
            </button>
          </Link>
        ))}
      </div>

      {/* Crawlable Pagination for Googlebot */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '3rem', flexWrap: 'wrap' }}>
        {pageNum > 1 && (
          <Link href={`/all-jobs?page=${pageNum - 1}`} className="btn-secondary" style={{ padding: '0.6rem 1.2rem' }}>
            ← Previous
          </Link>
        )}
        {Array.from({ length: Math.min(10, totalPages) }, (_, i) => i + 1).map((p) => (
          <Link
            key={p}
            href={`/all-jobs?page=${p}`}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 700,
              background: p === pageNum ? '#0284C7' : 'rgba(255, 255, 255, 0.05)',
              color: p === pageNum ? '#ffffff' : 'var(--text-muted)',
              border: p === pageNum ? '1px solid #38BDF8' : '1px solid var(--border-color)',
            }}
          >
            {p}
          </Link>
        ))}
        {pageNum < totalPages && (
          <Link href={`/all-jobs?page=${pageNum + 1}`} className="btn-secondary" style={{ padding: '0.6rem 1.2rem' }}>
            Next →
          </Link>
        )}
      </div>
    </div>
  );
}
