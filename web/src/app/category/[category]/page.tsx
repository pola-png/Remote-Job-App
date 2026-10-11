import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase, RemoteJob, mapJobRow } from '@/lib/supabase';
import { Briefcase, MapPin, ArrowRight, ArrowLeft, Zap, Sparkles } from 'lucide-react';

interface Props {
  params: { category: string };
}

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

const CATEGORY_MAP: Record<string, { name: string; title: string; desc: string; icon: string }> = {
  development: {
    name: 'DEVELOPMENT',
    title: 'Remote Software Engineering & Tech Jobs',
    desc: 'Browse verified remote software engineering, web development, frontend, backend, and DevOps positions.',
    icon: '💻',
  },
  design: {
    name: 'DESIGN',
    title: 'Remote UI/UX & Product Design Jobs',
    desc: 'Find remote product design, UI/UX, graphic design, and brand design roles at top global companies.',
    icon: '🎨',
  },
  marketing: {
    name: 'MARKETING',
    title: 'Remote Marketing & Growth Jobs',
    desc: 'Explore high-paying remote digital marketing, SEO, content, performance marketing, and social media jobs.',
    icon: '📈',
  },
  sales: {
    name: 'SALES',
    title: 'Remote Sales & Business Development Jobs',
    desc: 'Apply for remote SDR, BDR, Account Executive, and sales management jobs with uncapped commissions.',
    icon: '💼',
  },
  support: {
    name: 'SUPPORT',
    title: 'Remote Customer Support & Success Jobs',
    desc: 'Work from anywhere in customer support, customer success, client onboarding, and technical help desk.',
    icon: '🎧',
  },
  writing: {
    name: 'WRITING',
    title: 'Remote Content Writing & Copywriting Jobs',
    desc: 'Curated remote writing jobs, technical writing, copywriting, journalism, and content strategy opportunities.',
    icon: '✍️',
  },
  data: {
    name: 'DATA',
    title: 'Remote Data Science, AI & Analytics Jobs',
    desc: 'Top remote roles in Data Science, Machine Learning, AI engineering, data analytics, and business intelligence.',
    icon: '📊',
  },
  finance: {
    name: 'FINANCE',
    title: 'Remote Finance, Accounting & Payroll Jobs',
    desc: 'Vetted remote accounting, financial analyst, bookkeeping, and CFO roles across global startups.',
    icon: '💰',
  },
  assistant: {
    name: 'ASSISTANT',
    title: 'Remote Virtual Assistant & Operations Jobs',
    desc: 'High-paying remote virtual assistant, executive assistant, and operations coordinator positions.',
    icon: '🤝',
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = params.category.toLowerCase();
  const cat = CATEGORY_MAP[slug] || {
    name: slug.toUpperCase(),
    title: `Remote ${slug.charAt(0).toUpperCase() + slug.slice(1)} Jobs`,
    desc: `Browse the best verified remote ${slug} jobs from vetted companies worldwide. Apply online today.`,
    icon: '💼',
  };

  const canonicalUrl = `https://www.remotejobshq.online/category/${encodeURIComponent(slug)}`;

  return {
    title: `${cat.title} (Work From Anywhere) | Remote Jobs HQ`,
    description: cat.desc,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${cat.title} - Remote Jobs HQ`,
      description: cat.desc,
      url: canonicalUrl,
      type: 'website',
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const slug = params.category.toLowerCase();
  const cat = CATEGORY_MAP[slug] || {
    name: slug.toUpperCase(),
    title: `Remote ${slug.charAt(0).toUpperCase() + slug.slice(1)} Jobs`,
    desc: `Browse the best verified remote ${slug} jobs from vetted companies worldwide.`,
    icon: '💼',
  };

  const { data: rawJobs } = await supabase
    .from('job_postings')
    .select('*')
    .eq('status', 'active')
    .eq('category', cat.name)
    .order('posted_timestamp', { ascending: false, nullsFirst: false })
    .limit(100);

  const jobs: RemoteJob[] = (rawJobs || []).map(mapJobRow);
  const canonicalUrl = `https://www.remotejobshq.online/category/${encodeURIComponent(slug)}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: cat.title,
    description: cat.desc,
    url: canonicalUrl,
    itemListElement: jobs.slice(0, 30).map((job, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: `${job.title} at ${job.company}`,
      url: `https://www.remotejobshq.online/jobs/${encodeURIComponent(job.id)}`,
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
        item: 'https://www.remotejobshq.online',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Categories',
        item: 'https://www.remotejobshq.online/#categories',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: cat.title,
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
        <span style={{ fontSize: '2.5rem', display: 'inline-block', marginBottom: '0.75rem' }}>{cat.icon}</span>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.75rem' }}>{cat.title}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '700px', lineHeight: '1.6' }}>{cat.desc}</p>
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 700 }}>
            {jobs.length} Active Positions
          </span>
          <span style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>• Updated hourly</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Latest {cat.name} Opportunities</h2>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Showing {jobs.length} jobs</span>
      </div>

      <div className="jobs-grid">
        {jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--bg-card)', borderRadius: '1rem' }}>
            <Briefcase size={48} color="var(--text-subtle)" style={{ marginBottom: '1rem' }} />
            <h3>No jobs found in this category right now</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Check back soon as new positions are synced hourly.</p>
            <Link href="/" className="btn-secondary" style={{ marginTop: '1.5rem' }}>Browse All Jobs</Link>
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
                      <MapPin size={14} color="#38BDF8" /> {job.location || '100% Remote / Worldwide'}
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

      {/* Cross-linking other categories for Google Crawl Spider */}
      <div style={{ marginTop: '4rem', padding: '2rem', background: 'var(--bg-card)', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Explore Other Remote Categories</h3>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {Object.entries(CATEGORY_MAP).filter(([k]) => k !== slug).map(([key, data]) => (
            <Link
              key={key}
              href={`/category/${key}`}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
                textDecoration: 'none',
              }}
            >
              {data.icon} {data.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
