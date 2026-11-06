import { Metadata } from 'next';
import Link from 'next/link';
import { supabase, RemoteJob, mapJobRow, isAuthenticJobRow } from '@/lib/supabase';
import { Briefcase, MapPin, ArrowRight, ArrowLeft, Search, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: { page?: string; q?: string; category?: string };
}): Promise<Metadata> {
  const pageNum = Math.max(1, parseInt(searchParams?.page || '1', 10) || 1);
  const canonicalUrl = `https://remotejobshq.online/all-jobs${pageNum > 1 ? `?page=${pageNum}` : ''}`;

  return {
    title: `Complete Remote Jobs Directory (Page ${pageNum}) | Remote Jobs HQ`,
    description: `Browse our complete verified index of active remote jobs across Software Engineering, Product, Design, Data Science, Marketing, Sales, and Support.`,
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function AllJobsDirectoryPage({
  searchParams,
}: {
  searchParams?: { page?: string; q?: string; category?: string };
}) {
  const pageNum = Math.max(1, parseInt(searchParams?.page || '1', 10) || 1);
  const searchQuery = (searchParams?.q || '').trim();
  const categoryFilter = (searchParams?.category || '').trim().toUpperCase();
  const pageSize = 50;
  const from = (pageNum - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('job_postings')
    .select('*', { count: 'exact' })
    .eq('status', 'active')
    .order('posted_timestamp', { ascending: false, nullsFirst: false });

  if (categoryFilter && categoryFilter !== 'ALL') {
    query = query.eq('category', categoryFilter);
  }
  if (searchQuery.length > 0) {
    query = query.or(`title.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%`);
  }

  const { data: rawJobs, count } = await query.range(from, to);

  const jobs: RemoteJob[] = (rawJobs || []).filter(isAuthenticJobRow).map(mapJobRow);
  const totalCount = typeof count === 'number' && count > 0 ? count : jobs.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Build smart sliding window of page numbers so all pages are reachable
  const windowSize = 7;
  let startPage = Math.max(1, pageNum - Math.floor(windowSize / 2));
  let endPage = Math.min(totalPages, startPage + windowSize - 1);
  if (endPage - startPage + 1 < windowSize) {
    startPage = Math.max(1, endPage - windowSize + 1);
  }
  const pageNumbers: number[] = [];
  for (let p = startPage; p <= endPage; p++) {
    pageNumbers.push(p);
  }

  const buildPageHref = (p: number) => {
    const params = new URLSearchParams();
    if (p > 1) params.set('page', String(p));
    if (searchQuery) params.set('q', searchQuery);
    if (categoryFilter) params.set('category', categoryFilter);
    const qs = params.toString();
    return `/all-jobs${qs ? `?${qs}` : ''}`;
  };

  return (
    <div className="container" style={{ paddingBottom: '5rem' }}>
      <div style={{ margin: '2rem 0 1rem 0' }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
          }}
        >
          <ArrowLeft size={16} /> Back to homepage
        </Link>
      </div>

      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '1.25rem',
          padding: '2.5rem',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(56, 189, 248, 0.14)',
            color: '#38BDF8',
            padding: '0.3rem 0.85rem',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '0.85rem',
          }}
        >
          <ShieldCheck size={15} /> {totalCount.toLocaleString()} Total Verified Remote Positions
        </div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Complete Remote Jobs Directory
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '750px', lineHeight: '1.6' }}>
          Browse every active, quality-checked remote career opportunity across Engineering, Product, Design, Data Science, Marketing, Sales, Finance, and Customer Support.
        </p>

        {/* Search & Filter inside All Jobs Directory */}
        <form
          action="/all-jobs"
          method="GET"
          className="search-box"
          style={{ marginTop: '1.5rem', maxWidth: '680px', background: 'var(--bg-secondary)' }}
        >
          <Search size={18} color="var(--text-subtle)" />
          <input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder="Filter all jobs by title or company..."
            className="search-input"
            aria-label="Filter jobs in directory"
          />
          {categoryFilter && <input type="hidden" name="category" value={categoryFilter} />}
          <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1.15rem', fontSize: '0.88rem' }}>
            Filter
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', color: '#38BDF8', fontWeight: 700, fontSize: '0.95rem' }}>
          Page {pageNum} of {totalPages.toLocaleString()} • Showing {jobs.length} of{' '}
          {totalCount.toLocaleString()} total verified positions
        </div>
      </div>

      <div className="jobs-grid">
        {jobs.map((job) => (
          <Link key={job.id} href={`/jobs/${job.slug || encodeURIComponent(job.id)}`} className="job-card">
            <div className="job-info-left">
              <div className="company-logo">
                {job.company_logo ? (
                  <img
                    src={job.company_logo}
                    alt={job.company}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  job.company.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
                    {job.company}
                  </span>
                  <span
                    style={{
                      background: 'rgba(16, 185, 129, 0.14)',
                      color: '#34D399',
                      fontSize: '0.68rem',
                      padding: '0.1rem 0.45rem',
                      borderRadius: '4px',
                      fontWeight: 700,
                    }}
                  >
                    VERIFIED
                  </span>
                </div>
                <div className="job-title">{job.title}</div>
                <div className="job-meta">
                  <span className="job-meta-item">
                    <MapPin size={14} color="#38BDF8" /> {job.location || 'Worldwide (100% Remote)'}
                  </span>
                  {job.job_type && (
                    <span className="job-meta-item">
                      <Briefcase size={14} /> {job.job_type}
                    </span>
                  )}
                  {job.salary && <span className="tag salary-tag">💰 {job.salary}</span>}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
              <div className="tags-row">
                {job.tags &&
                  job.tags.slice(0, 2).map((tag, idx) => (
                    <span key={idx} className="tag">
                      {tag}
                    </span>
                  ))}
              </div>
              <span className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                View Role <ArrowRight size={14} />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Crawlable Full Pagination */}
      <nav
        aria-label="Jobs Directory Pagination"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: '3rem',
          flexWrap: 'wrap',
        }}
      >
        {pageNum > 1 && (
          <Link href={buildPageHref(pageNum - 1)} className="btn-secondary" style={{ padding: '0.6rem 1.2rem' }}>
            ← Previous
          </Link>
        )}

        {startPage > 1 && (
          <>
            <Link
              href={buildPageHref(1)}
              style={{
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 700,
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-color)',
              }}
            >
              1
            </Link>
            {startPage > 2 && <span style={{ color: 'var(--text-subtle)', padding: '0 0.25rem' }}>…</span>}
          </>
        )}

        {pageNumbers.map((p) => (
          <Link
            key={p}
            href={buildPageHref(p)}
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

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span style={{ color: 'var(--text-subtle)', padding: '0 0.25rem' }}>…</span>
            )}
            <Link
              href={buildPageHref(totalPages)}
              style={{
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 700,
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-color)',
              }}
            >
              {totalPages}
            </Link>
          </>
        )}

        {pageNum < totalPages && (
          <Link href={buildPageHref(pageNum + 1)} className="btn-secondary" style={{ padding: '0.6rem 1.2rem' }}>
            Next →
          </Link>
        )}
      </nav>
    </div>
  );
}
