import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabase, RemoteJob, mapJobRow, slugify, buildSeoJobSlug, getBaseSalarySchema } from '@/lib/supabase';
import { MapPin, DollarSign, Clock, Briefcase, ExternalLink, ArrowLeft, ShieldCheck, Share2 } from 'lucide-react';

interface Props {
  params: { slug: string };
}

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

function extractCoreSlug(rawSlug: string): string {
  let s = rawSlug;
  // Strip trailing salary: e.g. -120k-150k, -205k, -30-70-hr, -120-hr
  s = s.replace(/-(?:\d+k(?:-\d+k)?|\d+(?:-\d+)?-hr)$/i, '');
  // Strip trailing job type: -full-time, -part-time, -contract, -freelance, -internship
  s = s.replace(/-(?:full-time|part-time|contract|freelance|internship)$/i, '');
  // Strip trailing country / anywhere / worldwide
  s = s.replace(/-(?:usa|uk|europe|canada|australia|germany|france|latam|apac|india|spain|brazil|netherlands|ireland|anywhere|worldwide)$/i, '');
  // Strip trailing workplace: -remote, -onsite, -hybrid
  s = s.replace(/-(?:remote|onsite|hybrid)$/i, '');
  return s;
}

async function getJobBySlug(rawSlug: string): Promise<RemoteJob | null> {
  try {
    const slug = decodeURIComponent(rawSlug).trim();

    // 1. Direct match by exact ID (e.g. legacy "jobicy_154667", himalayas URL ID, or UUID)
    const { data: directData } = await supabase
      .from('job_postings')
      .select('*')
      .eq('id', slug)
      .maybeSingle();

    if (directData) return mapJobRow(directData);

    // 2. Extract potential ID prefix or suffix if slug format is "jobicy_154667-title" or "title-jobicy_154667"
    const prefixMatch = slug.match(/^([a-zA-Z0-9_]+)-/);
    if (prefixMatch && prefixMatch[1]) {
      const { data: prefixData } = await supabase
        .from('job_postings')
        .select('*')
        .eq('id', prefixMatch[1])
        .maybeSingle();

      if (prefixData) return mapJobRow(prefixData);
    }

    const suffixMatch = slug.match(/-(jobicy_\d+|[0-9a-fA-F-]{36})$/);
    if (suffixMatch && suffixMatch[1]) {
      const { data: suffixData } = await supabase
        .from('job_postings')
        .select('*')
        .eq('id', suffixMatch[1])
        .maybeSingle();

      if (suffixData) return mapJobRow(suffixData);
    }

    // 3. Extract standard UUID if present
    const uuidMatch = slug.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
    if (uuidMatch) {
      const { data: uuidData } = await supabase
        .from('job_postings')
        .select('*')
        .eq('id', uuidMatch[0])
        .maybeSingle();

      if (uuidData) return mapJobRow(uuidData);
    }

    // 4. Candidate Search via Title & Company Tokens
    const core = extractCoreSlug(slug);
    const words = core.split('-').filter((w) => w.length >= 2);
    if (words.length > 0) {
      const firstWord = words[0];
      const lastWord = words[words.length - 1];

      let query = supabase.from('job_postings').select('*');
      if (words.length >= 3) {
        query = query.ilike('title', `%${words[0]}%${words[1]}%`);
      } else {
        query = query.or(`title.ilike.%${firstWord}%,company.ilike.%${lastWord}%`);
      }

      const { data: candidates } = await query.order('created_at', { ascending: false }).limit(50);

      let candidateList = candidates && candidates.length > 0 ? candidates : [];
      if (candidateList.length === 0) {
        const { data: fallbackList } = await supabase
          .from('job_postings')
          .select('*')
          .ilike('title', `%${firstWord}%`)
          .limit(50);
        if (fallbackList) candidateList = fallbackList;
      }

      if (candidateList.length > 0) {
        let bestCandidate = null;
        let bestScore = -1;

        for (const c of candidateList) {
          let score = 0;
          const cRichSlug = buildSeoJobSlug(c);
          const cTitleSlug = slugify(c.title);
          const cCompanySlug = slugify(c.company);

          if (cRichSlug === slug) score += 100;
          if (cTitleSlug === slug) score += 80;
          if (slug.startsWith(cTitleSlug)) score += 40;
          if (cCompanySlug && slug.includes(cCompanySlug)) score += 30;

          if (score > bestScore) {
            bestScore = score;
            bestCandidate = c;
          }
        }

        if (bestCandidate) return mapJobRow(bestCandidate);
      }
    }

    return null;
  } catch (err) {
    console.error('Job detail fetch error:', err);
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

  const targetSlug = buildSeoJobSlug(job);
  const title = `${job.title} at ${job.company} (100% Remote)`;
  const description = `Apply for ${job.title} at ${job.company}. ${job.salary && !job.salary.toLowerCase().includes('competitive') ? `Salary: ${job.salary}.` : ''} Remote work opportunity. Learn more and apply now on Remote Jobs HQ.`;
  const canonicalUrl = `https://remotejobshq.online/jobs/${targetSlug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonicalUrl,
      images: [
        {
          url: job.company_logo || 'https://remotejobshq.online/og-image.png',
          width: 800,
          height: 600,
          alt: `${job.company} is hiring for ${job.title}`,
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
    return null;
  }

  const targetSlug = buildSeoJobSlug(job);
  const applyUrl = job.apply_url || job.direct_apply_url || '#';
  const canonicalUrl = `https://remotejobshq.online/jobs/${targetSlug}`;

  // Format description for Google for Jobs rich rendering
  const formattedDescription = job.description
    ? (job.description.includes('<') ? job.description : job.description.split(/\n\n+/).map((p) => `<p>${p.trim()}</p>`).join(''))
    : `<p>${job.title} role at ${job.company}. Full details and apply instructions on Remote Jobs HQ.</p>`;

  // Google for Jobs Schema.org JobPosting structured JSON-LD
  const jobPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: formattedDescription,
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
    directApply: true,
    url: canonicalUrl,
    baseSalary: getBaseSalarySchema(job),
  };

  // Google Breadcrumbs Schema
  const breadcrumbsSchema = {
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
        name: 'Jobs',
        item: 'https://remotejobshq.online',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${job.title} at ${job.company}`,
        item: canonicalUrl,
      },
    ],
  };

  const requirementsList = Array.isArray(job.requirements)
    ? job.requirements
    : typeof job.requirements === 'string'
    ? [job.requirements]
    : [];

  const benefitsList = Array.isArray(job.benefits)
    ? job.benefits
    : typeof job.benefits === 'string'
    ? [job.benefits]
    : [];

  return (
    <div className="container" style={{ paddingBottom: '5rem' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }}
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
                <img src={job.company_logo} alt={job.company} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
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
                {job.salary && !job.salary.toLowerCase().includes('competitive') && (
                  <span className="tag salary-tag" style={{ fontSize: '0.9rem', padding: '0.35rem 0.8rem' }}>
                    💰 {job.salary}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <a
              href={applyUrl}
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

          {requirementsList.length > 0 && (
            <div style={{ marginTop: '2.5rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                Requirements & Qualifications
              </h2>
              <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-main)', lineHeight: '1.8' }}>
                {requirementsList.map((req, idx) => (
                  <li key={idx} style={{ marginBottom: '0.5rem' }}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          {benefitsList.length > 0 && (
            <div style={{ marginTop: '2.5rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                Perks & Benefits
              </h2>
              <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-main)', lineHeight: '1.8' }}>
                {benefitsList.map((benefit, idx) => (
                  <li key={idx} style={{ marginBottom: '0.5rem' }}>{benefit}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem' }}>Ready to apply?</h3>
            <a
              href={applyUrl}
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
