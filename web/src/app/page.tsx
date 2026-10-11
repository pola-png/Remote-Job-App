import Link from 'next/link';
import { supabase, RemoteJob, mapJobRow } from '@/lib/supabase';
import { Briefcase, MapPin, Search, ArrowRight, Zap, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getJobs(searchQuery?: string, category?: string): Promise<RemoteJob[]> {
  try {
    let query = supabase
      .from('job_postings')
      .select('*')
      .eq('status', 'active')
      .order('posted_timestamp', { ascending: false, nullsFirst: false })
      .limit(80);

    if (category && category !== 'ALL') {
      query = query.eq('category', category);
    }

    if (searchQuery && searchQuery.trim().length > 0) {
      query = query.ilike('title', `%${searchQuery.trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching jobs:', error);
      const { data: fallbackData } = await supabase
        .from('job_postings')
        .select('*')
        .limit(80);
      return (fallbackData || []).map(mapJobRow);
    }

    return (data || []).map(mapJobRow);
  } catch (err) {
    console.error('Supabase query error:', err);
    return [];
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: { q?: string; category?: string };
}) {
  const searchQuery = searchParams?.q || '';
  const currentCategory = searchParams?.category || 'ALL';
  const jobs = await getJobs(searchQuery, currentCategory);

  // WebSite Schema for Google Search
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Remote Jobs HQ',
    url: 'https://remotejobshq.online',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://remotejobshq.online/?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <div className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-badge">
          <Zap size={14} /> 1,200+ Live Verified Remote Opportunities
        </div>
        <h1 className="hero-title">
          Land Your Dream <span>Remote Job</span> Anywhere In The World
        </h1>
        <p className="hero-subtitle">
          Land your dream remote job anywhere in the world. Browse 10,000+ verified high-paying remote roles in engineering, product, design, marketing, and sales from top global startups & Fortune 500s.
        </p>

        {/* Quick Search */}
        <div className="search-wrapper">
          <form action="/" method="GET" className="search-box">
            <Search size={20} color="var(--text-subtle)" />
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="Search by job title, skill (e.g. React, Python), or company..."
              className="search-input"
            />
            <button type="submit" className="btn-primary">
              Find Jobs
            </button>
          </form>

          {/* Category Filter Chips for SEO & UX - Clean Static URLs */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1.25rem' }}>
            {[
              { label: '🔥 All Remote', href: '/' },
              { label: '💻 Software & Tech', href: '/category/development' },
              { label: '🎨 Design & Creative', href: '/category/design' },
              { label: '📈 Marketing & Growth', href: '/category/marketing' },
              { label: '💼 Sales & BD', href: '/category/sales' },
              { label: '🎧 Customer Support', href: '/category/support' },
              { label: '✍️ Content & Writing', href: '/category/writing' },
              { label: '📊 Data & AI', href: '/category/data' },
              { label: '💰 Finance & Payroll', href: '/category/finance' },
            ].map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '9999px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-color)',
                  transition: 'all 0.2s ease',
                }}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* App Install Feature Card */}
      <section className="app-banner">
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            Get Real-Time Instant Job Alerts on Mobile
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '550px' }}>
            Download our official Android App to earn rewards, get push notifications the moment new jobs drop, and apply with 1 tap.
          </p>
        </div>
        <a
          href="https://play.google.com/store/apps/details?id=com.xapzap.app"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
          style={{ whiteSpace: 'nowrap', padding: '0.9rem 1.8rem' }}
        >
          📱 Download Android App
        </a>
      </section>

      {/* Job Feed List */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              {searchQuery ? `🔍 Results for "${searchQuery}"` : '🔥 Featured & Latest Remote Positions'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Updated live from vetted remote employers</p>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Showing {jobs.length} remote positions</span>
        </div>

        <div className="jobs-grid">
          {jobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--bg-card)', borderRadius: '1rem' }}>
              <Briefcase size={48} color="var(--text-subtle)" style={{ marginBottom: '1rem' }} />
              <h3>No jobs found matching your criteria</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Try searching for something else or browse all positions.
              </p>
              <Link href="/" className="btn-secondary" style={{ marginTop: '1.5rem' }}>
                View All Jobs
              </Link>
            </div>
          ) : (
            jobs.map((job) => {
              const salaryDisplay = job.salary && !job.salary.toLowerCase().includes('competitive') ? job.salary : null;

              return (
                <Link key={job.id} href={`/jobs/${encodeURIComponent(job.id)}`} className={`job-card ${job.is_featured ? 'job-card-featured' : ''}`}>
                  <div className="job-info-left">
                    <div className="company-logo">
                      {job.company_logo ? (
                        <img src={job.company_logo} alt={job.company} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        job.company.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>{job.company}</span>
                        {job.is_featured && (
                          <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', fontSize: '0.7rem', padding: '0.1rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                            FEATURED
                          </span>
                        )}
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
                        {salaryDisplay && (
                          <span className="tag salary-tag">
                            💰 {salaryDisplay}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div className="tags-row">
                      {job.tags && job.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="tag">{tag}</span>
                      ))}
                    </div>
                    <button className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                      Apply <ArrowRight size={14} />
                    </button>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
