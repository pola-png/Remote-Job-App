import Link from 'next/link';
import { supabase, RemoteJob } from '@/lib/supabase';
import { Briefcase, MapPin, DollarSign, Clock, Search, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export const revalidate = 60; // ISR: Revalidate every 60 seconds

async function getJobs(): Promise<RemoteJob[]> {
  try {
    const { data, error } = await supabase
      .from('remote_jobs')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching jobs:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Supabase query error:', err);
    return [];
  }
}

export default async function HomePage() {
  const jobs = await getJobs();

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
          <Zap size={14} /> 10,000+ Verified Remote Opportunities
        </div>
        <h1 className="hero-title">
          Land Your Dream <span>Remote Job</span> Anywhere In The World
        </h1>
        <p className="hero-subtitle">
          Hand-curated, high-paying remote roles in engineering, product, design, marketing, and sales from top global startups & Fortune 500s.
        </p>

        {/* Quick Search */}
        <div className="search-wrapper">
          <form action="/" method="GET" className="search-box">
            <Search size={20} color="var(--text-subtle)" />
            <input
              type="text"
              name="q"
              placeholder="Search by job title, skill (e.g. React, Python), or company..."
              className="search-input"
            />
            <button type="submit" className="btn-primary">
              Find Jobs
            </button>
          </form>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>🔥 Featured & Latest Remote Positions</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Updated live from vetted remote employers</p>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Showing {jobs.length} jobs</span>
        </div>

        <div className="jobs-grid">
          {jobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--bg-card)', borderRadius: '1rem' }}>
              <Briefcase size={48} color="var(--text-subtle)" style={{ marginBottom: '1rem' }} />
              <h3>Connecting to Live Jobs Feed...</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>New remote opportunities will appear here momentarily.</p>
            </div>
          ) : (
            jobs.map((job) => {
              const jobSlug = job.slug || `${job.id}-${job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
              return (
                <Link key={job.id} href={`/jobs/${jobSlug}`} className={`job-card ${job.is_featured ? 'job-card-featured' : ''}`}>
                  <div className="job-info-left">
                    <div className="company-logo">
                      {job.company_logo ? (
                        <img src={job.company_logo} alt={job.company} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                      <h3 className="job-title">{job.title}</h3>
                      <div className="job-meta">
                        <span className="job-meta-item">
                          <MapPin size={14} color="#38BDF8" /> {job.location || 'Worldwide (100% Remote)'}
                        </span>
                        {job.job_type && (
                          <span className="job-meta-item">
                            <Clock size={14} /> {job.job_type}
                          </span>
                        )}
                        {job.salary && (
                          <span className="tag salary-tag">
                            💰 {job.salary}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
