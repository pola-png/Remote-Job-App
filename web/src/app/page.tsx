import React from 'react';
import Link from 'next/link';
import { supabase, RemoteJob, mapJobRow, isAuthenticJobRow, JOB_LIST_COLUMNS } from '@/lib/supabase';
import { CAREER_GUIDES } from '@/lib/careerGuides';
import {
  Briefcase,
  MapPin,
  Search,
  ArrowRight,
  Zap,
  ShieldCheck,
  BookOpen,
  DollarSign,
  CheckCircle2,
  Globe,
  Clock,
  Award,
} from 'lucide-react';
import AdSenseSlot from '@/app/components/AdSenseSlot';

export const dynamic = 'force-dynamic';

const HOMEPAGE_JOBS_LIMIT = 15;

async function getHomepageJobsAndCount(
  searchQuery?: string,
  category?: string
): Promise<{ jobs: RemoteJob[]; totalCount: number }> {
  try {
    let query = supabase
      .from('job_postings')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
      .order('posted_timestamp', { ascending: false, nullsFirst: false })
      .range(0, 24);

    if (category && category !== 'ALL') {
      query = query.eq('category', category);
    }

    if (searchQuery && searchQuery.trim().length > 0) {
      query = query.ilike('title', `%${searchQuery.trim()}%`);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('Error fetching homepage jobs:', error);
      const { data: fallbackData, count: fallbackCount } = await supabase
        .from('job_postings')
        .select('*', { count: 'exact' })
        .range(0, 24);
      const valid = (fallbackData || []).filter(isAuthenticJobRow).slice(0, HOMEPAGE_JOBS_LIMIT).map(mapJobRow);
      return { jobs: valid, totalCount: fallbackCount || valid.length };
    }

    const validJobs = (data || [])
      .filter(isAuthenticJobRow)
      .slice(0, HOMEPAGE_JOBS_LIMIT)
      .map(mapJobRow);

    return {
      jobs: validJobs,
      totalCount: typeof count === 'number' && count > 0 ? count : validJobs.length,
    };
  } catch (err) {
    console.error('Supabase query error:', err);
    return { jobs: [], totalCount: 0 };
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: { q?: string; category?: string };
}) {
  const searchQuery = searchParams?.q || '';
  const currentCategory = searchParams?.category || 'ALL';
  const { jobs, totalCount } = await getHomepageJobsAndCount(searchQuery, currentCategory);
  const formattedTotal = totalCount.toLocaleString();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Remote Jobs HQ',
    url: 'https://remotejobshq.online',
    description:
      'Independent remote career publication, global compensation research hub, and curated remote job platform.',
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
          <Zap size={14} /> {formattedTotal} Live Verified Remote Opportunities
        </div>
        <h1 className="hero-title">
          Land Your Dream <span>Remote Career</span> Anywhere In The World
        </h1>
        <p className="hero-subtitle">
          Explore <strong>{formattedTotal}</strong> verified remote positions in software engineering, product, design, AI, data, marketing, and operations—complete with transparent salary benchmarks and in-depth distributed career guides.
        </p>

        {/* Quick Search */}
        <div className="search-wrapper">
          <form action="/" method="GET" className="search-box">
            <Search size={20} color="var(--text-subtle)" />
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="Search by job title, skill (e.g. React, Python, Product), or company..."
              className="search-input"
              aria-label="Search remote jobs"
            />
            <button type="submit" className="btn-primary">
              Find Jobs
            </button>
          </form>

          {/* Category Filter Chips for SEO & UX - Clean Static URLs */}
          <div
            id="categories"
            style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginTop: '1.25rem',
            }}
          >
            {[
              { label: `🔥 All Remote (${formattedTotal})`, href: '/all-jobs' },
              { label: '💻 Software & Engineering', href: '/category/development' },
              { label: '🎨 Design & Creative', href: '/category/design' },
              { label: '📈 Marketing & Growth', href: '/category/marketing' },
              { label: '💼 Sales & Partnerships', href: '/category/sales' },
              { label: '🎧 Customer Support', href: '/category/support' },
              { label: '✍️ Editorial & Writing', href: '/category/writing' },
              { label: '📊 Data Science & AI', href: '/category/data' },
              { label: '💰 Finance & Operations', href: '/category/finance' },
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

        {/* Live Platform Metrics Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: '1rem',
            maxWidth: '960px',
            margin: '0 auto',
            padding: '1.25rem',
            background: 'rgba(18, 31, 54, 0.7)',
            border: '1px solid var(--border-color)',
            borderRadius: '1rem',
          }}
        >
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38BDF8' }}>{formattedTotal}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Active Remote Jobs</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34D399' }}>100% Remote</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Location-Independent & Hybrid-Free</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#A855F7' }}>$65k – $215k</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Verified Annual Salary Benchmarks</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FBBF24' }}>Daily Curation</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Quality-Checked Employer Listings</div>
          </div>
        </div>
      </section>

      {/* Curated Job Feed (15 Featured & Latest Positions + See All Button) */}
      <section style={{ marginTop: '2rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
              {searchQuery
                ? `🔍 Search Results for "${searchQuery}"`
                : '🔥 Featured & Latest Verified Remote Positions'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
              Showing {jobs.length} curated openings out of <strong>{formattedTotal}</strong> total active remote jobs
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link href="/all-jobs" className="btn-secondary" style={{ padding: '0.55rem 1.15rem', fontSize: '0.9rem' }}>
              See All {formattedTotal} Jobs <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        <div className="jobs-grid" style={{ marginBottom: '2rem' }}>
          {jobs.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '4rem 1rem',
                background: 'var(--bg-card)',
                borderRadius: '1rem',
              }}
            >
              <Briefcase size={48} color="var(--text-subtle)" style={{ marginBottom: '1rem' }} />
              <h3>No jobs found matching your criteria</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Try searching for a broader skill or browse our complete directory of {formattedTotal} remote positions.
              </p>
              <Link href="/all-jobs" className="btn-primary" style={{ marginTop: '1.5rem' }}>
                See All {formattedTotal} Remote Jobs
              </Link>
            </div>
          ) : (
            jobs.map((job, index) => (
              <React.Fragment key={job.id}>
                <Link
                  href={`/jobs/${job.slug || encodeURIComponent(job.id)}`}
                  className={`job-card ${job.is_featured ? 'job-card-featured' : ''}`}
                >
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
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
                        {job.salary && (
                          <span className="tag salary-tag">💰 {job.salary}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div className="tags-row">
                      {job.tags &&
                        job.tags.slice(0, 3).map((tag, idx) => (
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

                {index === 6 && <AdSenseSlot className="landing-feed-adsense" />}
              </React.Fragment>
            ))
          )}
        </div>

        {/* Prominent "See All Jobs" CTA Banner Below the 15 Homepage Jobs */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(99, 102, 241, 0.12) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '1.25rem',
            padding: '2.25rem',
            textAlign: 'center',
            marginBottom: '4rem',
          }}
        >
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Explore All {formattedTotal} Verified Remote Opportunities
          </h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '620px', margin: '0 auto 1.5rem auto', fontSize: '0.95rem' }}>
            You are viewing the 15 latest openings on the homepage. Browse our complete, paginated directory to filter across all {formattedTotal} active remote roles worldwide.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/all-jobs" className="btn-primary" style={{ padding: '0.9rem 2.25rem', fontSize: '1.05rem' }}>
              See All {formattedTotal} Remote Jobs <ArrowRight size={18} />
            </Link>
            <Link href="/salary-guide" className="btn-secondary" style={{ padding: '0.9rem 1.75rem', fontSize: '1rem' }}>
              <DollarSign size={16} /> Explore Salary Benchmarks
            </Link>
          </div>
        </div>
      </section>

      {/* Editorial Section 1: In-Depth Remote Career Guides (High-Value Original Content for Users & AdSense) */}
      <section style={{ marginBottom: '4.5rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '1.75rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: '#38BDF8',
                fontSize: '0.85rem',
                fontWeight: 700,
                marginBottom: '0.4rem',
              }}
            >
              <BookOpen size={16} /> EDITORIAL RESEARCH & PLAYBOOKS
            </div>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800 }}>
              Remote Career Guides & Distributed Work Playbooks
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '680px', marginTop: '0.25rem' }}>
              Original, actionable handbooks authored by our distributed hiring and compensation analysts to help you land, negotiate, and thrive in remote roles.
            </p>
          </div>
          <Link href="/guides" className="btn-secondary" style={{ fontSize: '0.9rem' }}>
            Read All Career Guides <ArrowRight size={15} />
          </Link>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {CAREER_GUIDES.slice(0, 6).map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '1.25rem',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.85rem',
                    fontSize: '0.78rem',
                  }}
                >
                  <span
                    style={{
                      background: 'rgba(56, 189, 248, 0.14)',
                      color: '#38BDF8',
                      padding: '0.2rem 0.65rem',
                      borderRadius: '9999px',
                      fontWeight: 700,
                    }}
                  >
                    {guide.category}
                  </span>
                  <span style={{ color: 'var(--text-subtle)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={13} /> {guide.readTime}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, lineHeight: '1.35', marginBottom: '0.65rem', color: '#F8FAFC' }}>
                  {guide.title}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>
                  {guide.excerpt}
                </p>
              </div>
              <div
                style={{
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '0.9rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.82rem',
                }}
              >
                <span style={{ color: 'var(--text-subtle)' }}>By {guide.author.name}</span>
                <span style={{ color: '#38BDF8', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  Read Guide <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Editorial Section 2: Global Remote Salary & Compensation Benchmarks */}
      <section
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '1.5rem',
          padding: '2.5rem',
          marginBottom: '4.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.75rem',
          }}
        >
          <div>
            <div style={{ color: '#34D399', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              💰 COMPENSATION BENCHMARK INDEX
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              Global Remote Salary Ranges by Discipline
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '720px', marginTop: '0.35rem' }}>
              Compiled from verified remote job postings across our database of {formattedTotal} active roles. Use these bands when evaluating offers or negotiating location-agnostic pay.
            </p>
          </div>
          <Link href="/salary-guide" className="btn-primary" style={{ fontSize: '0.9rem' }}>
            Open Interactive Salary Calculator <ArrowRight size={15} />
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.92rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-subtle)' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Career Track</th>
                <th style={{ padding: '0.85rem 1rem' }}>Mid-Level Base (USD)</th>
                <th style={{ padding: '0.85rem 1rem' }}>Senior / Lead Base (USD)</th>
                <th style={{ padding: '0.85rem 1rem' }}>Hourly Contractor Rate</th>
                <th style={{ padding: '0.85rem 1rem' }}>Explore Track</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  track: 'Software Engineering & DevOps',
                  mid: '$95,000 – $135,000',
                  senior: '$140,000 – $195,000',
                  hourly: '$60 – $115 / hr',
                  href: '/category/development',
                },
                {
                  track: 'Data Science, AI & Machine Learning',
                  mid: '$105,000 – $145,000',
                  senior: '$150,000 – $210,000',
                  hourly: '$65 – $125 / hr',
                  href: '/category/data',
                },
                {
                  track: 'Product Design & UI/UX',
                  mid: '$80,000 – $115,000',
                  senior: '$120,000 – $160,000',
                  hourly: '$50 – $90 / hr',
                  href: '/category/design',
                },
                {
                  track: 'Digital Marketing, SEO & Growth',
                  mid: '$70,000 – $105,000',
                  senior: '$110,000 – $150,000',
                  hourly: '$45 – $85 / hr',
                  href: '/category/marketing',
                },
                {
                  track: 'Enterprise Sales & Account Executive',
                  mid: '$75,000 – $115,000 OTE',
                  senior: '$125,000 – $185,000 OTE',
                  hourly: '$45 – $95 / hr',
                  href: '/category/sales',
                },
                {
                  track: 'Customer Success & Technical Support',
                  mid: '$52,000 – $78,000',
                  senior: '$80,000 – $115,000',
                  hourly: '$28 – $55 / hr',
                  href: '/category/support',
                },
              ].map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.95rem 1rem', fontWeight: 700, color: '#F8FAFC' }}>{row.track}</td>
                  <td style={{ padding: '0.95rem 1rem', color: 'var(--text-muted)' }}>{row.mid}</td>
                  <td style={{ padding: '0.95rem 1rem', color: '#34D399', fontWeight: 600 }}>{row.senior}</td>
                  <td style={{ padding: '0.95rem 1rem', color: 'var(--text-muted)' }}>{row.hourly}</td>
                  <td style={{ padding: '0.95rem 1rem' }}>
                    <Link href={row.href} style={{ color: '#38BDF8', fontWeight: 600, fontSize: '0.85rem' }}>
                      Browse Jobs →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Editorial Section 3: How We Vet & Curate Remote Jobs */}
      <section style={{ marginBottom: '4.5rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 2.5rem auto' }}>
          <div style={{ color: '#38BDF8', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            🛡️ EDITORIAL & QUALITY STANDARDS
          </div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.6rem' }}>
            How Remote Jobs HQ Verifies Every Opportunity
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Unlike unmoderated classified boards, every position in our {formattedTotal}-job index passes automated and editorial quality checks before appearing on our platform.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {[
            {
              icon: <ShieldCheck size={24} color="#38BDF8" />,
              title: '1. Employer Identity & Domain Audit',
              text: 'We verify that every hiring organization has an active corporate presence, legitimate product or service, and verifiable HR or recruiting leadership.',
            },
            {
              icon: <Globe size={24} color="#34D399" />,
              title: '2. True Remote & Timezone Clarity',
              text: 'We filter out bait-and-switch office roles. Listings clearly indicate whether they support Worldwide 100% Anywhere work or regional timezone overlap.',
            },
            {
              icon: <DollarSign size={24} color="#A855F7" />,
              title: '3. Compensation Benchmarking',
              text: 'Roles without disclosed pay are paired with our role-and-seniority compensation benchmarks so candidates never apply in the dark.',
            },
            {
              icon: <Award size={24} color="#FBBF24" />,
              title: '4. Zero Upfront-Fee Guarantee',
              text: 'We strictly prohibit multi-level marketing, pay-to-apply schemes, or unpaid speculative work. Every listing is 100% free for job seekers.',
            },
          ].map((step, i) => (
            <div
              key={i}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '1.25rem',
                padding: '1.75rem',
              }}
            >
              <div style={{ marginBottom: '1rem' }}>{step.icon}</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{step.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.6' }}>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Employer & Candidate CTA Banner (100% Internal Links) */}
      <section className="app-banner">
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            Hiring for a Distributed Team or Looking for Your Next Role?
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '580px' }}>
            Browse our complete verified index of {formattedTotal} remote positions or publish your company&apos;s open role directly to our global talent community.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
          <Link
            href="/all-jobs"
            className="btn-primary"
            style={{ whiteSpace: 'nowrap', padding: '0.9rem 1.8rem' }}
          >
            Browse All {formattedTotal} Jobs
          </Link>
          <Link
            href="/post-job"
            className="btn-secondary"
            style={{ whiteSpace: 'nowrap', padding: '0.9rem 1.6rem' }}
          >
            Post a Remote Job
          </Link>
        </div>
      </section>
    </div>
  );
}
