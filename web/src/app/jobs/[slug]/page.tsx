import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabase, RemoteJob } from '@/lib/supabase';
import { MapPin, DollarSign, Clock, Briefcase, ExternalLink, ArrowLeft, ShieldCheck, Share2 } from 'lucide-react';

interface Props {
  params: { slug: string };
}

export const revalidate = 60; // ISR: 1 minute

async function getJobBySlug(slug: string): Promise<RemoteJob | null> {
  try {
    // Check if slug starts with uuid or contains id
    const idMatch = slug.match(/^[0-9a-fA-F-]{36}/) || slug.split('-')[0];
    
    let query = supabase.from('remote_jobs').select('*');
    if (idMatch && idMatch.length > 5) {
      query = query.or(`id.eq.${idMatch},slug.eq.${slug}`);
    } else {
      query = query.eq('slug', slug);
    }

    const { data, error } = await query.single();
    if (error || !data) {
      // Fallback search by title
      const titleSearch = slug.replace(/-/g, ' ');
      const { data: fallbackData } = await supabase
        .from('remote_jobs')
        .select('*')
        .ilike('title', `%${titleSearch}%`)
        .limit(1)
        .single();
      return fallbackData || null;
    }
    return data;
  } catch (err) {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const job = await getJobBySlug(params.slug);
  if (!job) {
    return {
      title: 'Job Not Found | Remote Jobs HQ',
    };
  }

  const title = `${job.title} at ${job.company} (100% Remote)`;
  const description = `Apply for ${job.title} at ${job.company}. ${job.salary ? `Salary: ${job.salary}.` : ''} Remote work opportunity. Learn more and apply now on Remote Jobs HQ.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://remotejobshq.online/jobs/${params.slug}`,
      images: [
        {
          url: job.company_logo || 'https://remotejobshq.online/og-image.png',
          width: 800,
          height: 600,
          alt: `${job.company} is hiring`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function JobDetailPage({ params }: Props) {
  const job = await getJobBySlug(params.slug);

  if (!job) {
    notFound();
  }

  // Google for Jobs Schema.org JobPosting structured JSON-LD
  const jobPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description || `${job.title} role at ${job.company}. Full details and apply instructions on Remote Jobs HQ.`,
    identifier: {
      '@type': 'PropertyValue',
      name: job.company,
      value: job.id,
    },
    datePosted: job.created_at || new Date().toISOString(),
    validThrough: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    employmentType: job.job_type === 'Part-time' ? 'PART_TIME' : job.job_type === 'Contract' ? 'CONTRACTOR' : 'FULL_TIME',
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company,
      logo: job.company_logo || 'https://remotejobshq.online/icon.png',
    },
    jobLocationType: 'TELECOMMUTE',
    applicantLocationRequirements: {
      '@type': 'Country',
      name: 'Worldwide',
    },
    baseSalary: job.salary ? {
      '@type': 'MonetaryAmount',
      currency: 'USD',
      value: {
        '@type': 'QuantitativeValue',
        value: job.salary,
        unitText: 'YEAR',
      },
    } : undefined,
  };

  return (
    <div className="container" style={{ paddingBottom: '5rem' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingSchema) }}
      />

      {/* Back Button */}
      <div style={{ margin: '2rem 0 1.5rem 0' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back to all jobs
        </Link>
      </div>

      {/* Job Header Card */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', padding: '2.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div className="company-logo" style={{ width: '72px', height: '72px', fontSize: '1.75rem' }}>
              {job.company_logo ? (
                <img src={job.company_logo} alt={job.company} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                job.company.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <span style={{ color: '#38BDF8', fontWeight: 600, fontSize: '1.1rem' }}>{job.company}</span>
              <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0.25rem 0 0.75rem 0' }}>{job.title}</h1>
              <div className="job-meta" style={{ fontSize: '0.95rem' }}>
                <span className="job-meta-item">
                  <MapPin size={16} color="#38BDF8" /> {job.location || '100% Remote / Anywhere'}
                </span>
                {job.job_type && (
                  <span className="job-meta-item">
                    <Clock size={16} /> {job.job_type}
                  </span>
                )}
                {job.salary && (
                  <span className="tag salary-tag" style={{ fontSize: '0.9rem', padding: '0.35rem 0.8rem' }}>
                    💰 {job.salary}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <a
              href={job.apply_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ fontSize: '1.1rem', padding: '0.9rem 2.2rem' }}
            >
              Apply for this position <ExternalLink size={18} />
            </a>
          </div>
        </div>
      </div>

      {/* Job Body & Description */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            Job Description & Responsibilities
          </h2>
          <div style={{ color: 'var(--text-main)', lineHeight: '1.8', whiteSpace: 'pre-line', fontSize: '1.05rem' }}>
            {job.description}
          </div>

          {job.requirements && (
            <div style={{ marginTop: '2.5rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                Requirements & Qualifications
              </h2>
              <div style={{ color: 'var(--text-main)', lineHeight: '1.8', whiteSpace: 'pre-line', fontSize: '1.05rem' }}>
                {job.requirements}
              </div>
            </div>
          )}

          <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem' }}>Ready to apply?</h3>
            <a
              href={job.apply_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ fontSize: '1.1rem', padding: '0.9rem 2.5rem' }}
            >
              Apply on Company Website <ExternalLink size={18} />
            </a>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', padding: '1.75rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Job Overview</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
              <div>
                <div style={{ color: 'var(--text-subtle)' }}>Company</div>
                <div style={{ fontWeight: 600 }}>{job.company}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-subtle)' }}>Location</div>
                <div style={{ fontWeight: 600 }}>{job.location || 'Remote'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-subtle)' }}>Employment Type</div>
                <div style={{ fontWeight: 600 }}>{job.job_type || 'Full Time'}</div>
              </div>
              {job.salary && (
                <div>
                  <div style={{ color: 'var(--text-subtle)' }}>Salary Range</div>
                  <div style={{ fontWeight: 600, color: '#34D399' }}>{job.salary}</div>
                </div>
              )}
              <div>
                <div style={{ color: 'var(--text-subtle)' }}>Date Posted</div>
                <div style={{ fontWeight: 600 }}>{new Date(job.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '1.25rem', padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38BDF8', fontWeight: 700, marginBottom: '0.5rem' }}>
              <ShieldCheck size={20} /> Verified Listing
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              This job listing has been verified by Remote Jobs HQ. Never send money or sensitive financial information to employers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
