import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  supabase,
  RemoteJob,
  mapJobRow,
  slugify,
  buildSeoJobSlug,
  getBaseSalarySchema,
  getShortJobHash,
  isAuthenticJobRow,
  JOB_LIST_COLUMNS,
  JOB_DETAIL_COLUMNS,
} from '@/lib/supabase';
import {
  MapPin,
  Clock,
  Briefcase,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  DollarSign,
  Hash,
  Sparkles,
} from 'lucide-react';
import DirectApplyBox from '@/app/components/DirectApplyBox';

interface Props {
  params: { slug: string };
}

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

function extractCoreSlug(rawSlug: string): string {
  let s = rawSlug;
  s = s.replace(/-[a-z0-9]{6}$/i, '');
  s = s.replace(/-(?:\d+k(?:-\d+k)?|\d+(?:-\d+)?-hr)$/i, '');
  s = s.replace(/-(?:full-time|part-time|contract|freelance|internship)$/i, '');
  s = s.replace(
    /-(?:usa|uk|europe|canada|australia|germany|france|latam|apac|india|spain|brazil|netherlands|ireland|anywhere|worldwide)$/i,
    ''
  );
  s = s.replace(/-(?:remote|onsite|hybrid)$/i, '');
  return s;
}

async function getJobBySlug(rawSlug: string): Promise<RemoteJob | null> {
  try {
    const slug = decodeURIComponent(rawSlug).trim();

    // 1. Direct match by exact ID if someone visits legacy link
    const { data: directData } = await supabase
      .from('job_postings')
      .select('*')
      .eq('id', slug)
      .maybeSingle();

    if (directData) return mapJobRow(directData);

    // 2. Candidate Search via Title & Company Tokens
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
          const cHashSlug = `${cRichSlug}-${getShortJobHash(c.id)}`;
          const cTitleSlug = slugify(c.title);
          const cCompanySlug = slugify(c.company);

          if (cHashSlug === slug) score += 120;
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

async function getSimilarAndFallbackJobs(currentJob: RemoteJob, targetCount = 8): Promise<RemoteJob[]> {
  try {
    const results: RemoteJob[] = [];
    const seenIds = new Set<string>([currentJob.id]);
    const currentWords = currentJob.title
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 3);

    // 1. Fetch active jobs in the same category
    if (currentJob.category) {
      const { data: categoryData } = await supabase
        .from('job_postings')
        .select('*')
        .eq('status', 'active')
        .eq('category', currentJob.category)
        .neq('id', currentJob.id)
        .order('posted_timestamp', { ascending: false, nullsFirst: false })
        .limit(24);

      if (categoryData && categoryData.length > 0) {
        const validCategoryRows = categoryData.filter(isAuthenticJobRow);
        // Sort by title/tag relevance to currentJob
        validCategoryRows.sort((a, b) => {
          const aTitle = String(a.title || '').toLowerCase();
          const bTitle = String(b.title || '').toLowerCase();
          const aScore = currentWords.reduce((acc, w) => acc + (aTitle.includes(w) ? 10 : 0), 0);
          const bScore = currentWords.reduce((acc, w) => acc + (bTitle.includes(w) ? 10 : 0), 0);
          return bScore - aScore;
        });

        for (const row of validCategoryRows) {
          if (!seenIds.has(row.id)) {
            seenIds.add(row.id);
            results.push(mapJobRow(row));
          }
          if (results.length >= targetCount) break;
        }
      }
    }

    // 2. Backfill with latest active remote jobs if fewer than targetCount found
    if (results.length < targetCount) {
      const { data: fallbackData } = await supabase
        .from('job_postings')
        .select('*')
        .eq('status', 'active')
        .neq('id', currentJob.id)
        .order('posted_timestamp', { ascending: false, nullsFirst: false })
        .limit(20);

      if (fallbackData && fallbackData.length > 0) {
        for (const row of fallbackData) {
          if (isAuthenticJobRow(row) && !seenIds.has(row.id)) {
            seenIds.add(row.id);
            results.push(mapJobRow(row));
          }
          if (results.length >= targetCount) break;
        }
      }
    }

    return results;
  } catch (err) {
    console.error('Error fetching similar jobs:', err);
    return [];
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
  const description = `Apply for ${job.title} at ${job.company}. ${
    job.salary ? `Compensation: ${job.salary}.` : ''
  } Verified remote career opportunity (${job.location}). Review role responsibilities, salary benchmarks, and apply online.`;
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
          url: 'https://remotejobshq.online/og-image.png',
          width: 1200,
          height: 630,
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

  const similarJobs = await getSimilarAndFallbackJobs(job, 8);
  const targetSlug = buildSeoJobSlug(job);
  const canonicalUrl = `https://remotejobshq.online/jobs/${targetSlug}`;
  const categorySlug = (job.category || 'development').toLowerCase();

  const formattedDescription = job.description
    ? job.description.includes('<')
      ? job.description
      : job.description
          .split(/\n\n+/)
          .map((p) => `<p>${p.trim()}</p>`)
          .join('')
    : `<p>${job.title} position at ${job.company}. Full role responsibilities, qualifications, and application details on Remote Jobs HQ.</p>`;

  // Google for Jobs Schema.org JobPosting structured JSON-LD (uses clean public_ref, never raw source ID)
  const jobPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: formattedDescription,
    identifier: {
      '@type': 'PropertyValue',
      name: job.company,
      value: job.public_ref,
    },
    datePosted: job.created_at || new Date().toISOString(),
    validThrough: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    employmentType:
      job.job_type === 'Part-time'
        ? 'PART_TIME'
        : job.job_type === 'Contract'
        ? 'CONTRACTOR'
        : 'FULL_TIME',
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company,
      logo: 'https://remotejobshq.online/icon.png',
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
        name: 'All Remote Jobs',
        item: 'https://remotejobshq.online/all-jobs',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${job.title} at ${job.company}`,
        item: canonicalUrl,
      },
    ],
  };

  const requirementsList = job.requirements || [];
  const benefitsList = job.benefits || [];
  const responsibilitiesList = job.responsibilities || [];

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

      {/* Breadcrumb Navigation */}
      <div
        style={{
          margin: '2rem 0 1.5rem 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <Link
          href="/all-jobs"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
          }}
        >
          <ArrowLeft size={16} /> Back to Jobs Directory
        </Link>
        <span style={{ color: 'var(--text-subtle)', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
          <Hash size={14} /> Listing ID: <strong>{job.public_ref}</strong>
        </span>
      </div>

      {/* Job Header Card */}
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
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '2rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="company-logo" style={{ width: '72px', height: '72px', fontSize: '1.75rem' }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span style={{ color: '#38BDF8', fontWeight: 700, fontSize: '1.1rem' }}>{job.company}</span>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34D399',
                    fontSize: '0.72rem',
                    padding: '0.15rem 0.55rem',
                    borderRadius: '9999px',
                    fontWeight: 700,
                  }}
                >
                  ✓ VERIFIED EMPLOYER
                </span>
              </div>
              <h1 style={{ fontSize: '2.15rem', fontWeight: 800, margin: '0.3rem 0 0.75rem 0', lineHeight: '1.2' }}>
                {job.title}
              </h1>
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
              href="#apply-section"
              className="btn-primary"
              style={{ fontSize: '1.05rem', padding: '0.9rem 2.1rem' }}
            >
              Apply for this Position
            </a>
          </div>
        </div>

        {job.tags && job.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
            {job.tags.map((tag, idx) => (
              <span key={idx} className="tag" style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Job Body & Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        <div
          style={{
            gridColumn: 'span 2',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '1.25rem',
            padding: '2.25rem',
          }}
        >
          <h2
            style={{
              fontSize: '1.35rem',
              fontWeight: 700,
              marginBottom: '1.25rem',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '0.75rem',
            }}
          >
            Role Overview & Description
          </h2>
          <div style={{ color: 'var(--text-main)', lineHeight: '1.85', whiteSpace: 'pre-line', fontSize: '1.02rem' }}>
            {job.description ||
              `${job.company} is seeking an experienced ${job.title} to join its distributed team (${job.location}). In this ${job.job_type || 'Full-time'} role, you will collaborate asynchronously with cross-functional stakeholders to deliver high-impact outcomes.`}
          </div>

          {responsibilitiesList.length > 0 && (
            <div style={{ marginTop: '2.5rem' }}>
              <h2
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '0.75rem',
                }}
              >
                Core Responsibilities & Deliverables
              </h2>
              <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-main)', lineHeight: '1.8' }}>
                {responsibilitiesList.map((item, idx) => (
                  <li key={idx} style={{ marginBottom: '0.6rem' }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {requirementsList.length > 0 && (
            <div style={{ marginTop: '2.5rem' }}>
              <h2
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '0.75rem',
                }}
              >
                Qualifications & Candidate Requirements
              </h2>
              <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-main)', lineHeight: '1.8' }}>
                {requirementsList.map((req, idx) => (
                  <li key={idx} style={{ marginBottom: '0.6rem' }}>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {benefitsList.length > 0 && (
            <div style={{ marginTop: '2.5rem' }}>
              <h2
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '0.75rem',
                }}
              >
                Compensation, Perks & Remote Work Benefits
              </h2>
              <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-main)', lineHeight: '1.8' }}>
                {benefitsList.map((benefit, idx) => (
                  <li key={idx} style={{ marginBottom: '0.6rem' }}>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Distributed Hiring & Evaluation Process Guide */}
          <div style={{ marginTop: '2.5rem' }}>
            <h2
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                marginBottom: '1rem',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '0.75rem',
              }}
            >
              What to Expect in the Remote Hiring Process
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.7', marginBottom: '1rem' }}>
              Distributed employers hiring for <strong>{job.title}</strong> positions typically evaluate candidates across four structured stages designed to measure both domain mastery and asynchronous collaboration:
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '0.9rem',
              }}
            >
              {[
                {
                  step: 'Stage 1: Profile & Async Review',
                  detail: `Screening of your relevant ${job.category?.toLowerCase() || 'domain'} accomplishments, portfolio links, and timezone alignment (${job.location}).`,
                },
                {
                  step: 'Stage 2: Recruiter Alignment Call',
                  detail: `A 25–30 minute video conversation covering role scope at ${job.company}, compensation expectations (${job.salary}), and remote work workflows.`,
                },
                {
                  step: 'Stage 3: Practical Role Assessment',
                  detail: 'A scoped work-sample walkthrough, technical pairing session, or case study mirroring real-world deliverables.',
                },
                {
                  step: 'Stage 4: Team & Leadership Loop',
                  detail: 'Final cross-functional discussions with peers and hiring leadership, followed by written offer and onboarding.',
                },
              ].map((st, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(13, 22, 39, 0.65)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.85rem',
                    padding: '1.1rem',
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#38BDF8', fontSize: '0.88rem', marginBottom: '0.35rem' }}>
                    {st.step}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.83rem', lineHeight: '1.55' }}>{st.detail}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Editorial Candidate Preparation Guidance */}
          <div
            style={{
              marginTop: '2rem',
              padding: '1.5rem',
              background: 'rgba(13, 22, 39, 0.75)',
              border: '1px solid var(--border-color)',
              borderRadius: '1rem',
            }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.65rem', color: '#38BDF8' }}>
              💡 Remote Jobs HQ Editorial Tip for Applicants
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.65' }}>
              When applying for <strong>{job.title}</strong> at <strong>{job.company}</strong>, highlight specific examples of projects you have delivered autonomously in a distributed or cross-functional setting. Mention your primary working timezone ({job.location}) and link directly to relevant work samples, repositories, or case studies.
            </p>
          </div>

          {/* First-Party Direct Candidate Application Portal */}
          <DirectApplyBox
            jobTitle={job.title}
            companyName={job.company}
            publicRef={job.public_ref}
            location={job.location}
            directEmployerUrl={job.has_direct_employer_url ? job.direct_apply_url : undefined}
          />
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '1.25rem',
              padding: '1.75rem',
            }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Job Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
              <div>
                <div style={{ color: 'var(--text-subtle)' }}>Hiring Organization</div>
                <div style={{ fontWeight: 600 }}>{job.company}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-subtle)' }}>Reference ID</div>
                <div style={{ fontWeight: 600, color: '#38BDF8' }}>{job.public_ref}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-subtle)' }}>Remote Region</div>
                <div style={{ fontWeight: 600 }}>{job.location || '100% Remote'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-subtle)' }}>Employment Type</div>
                <div style={{ fontWeight: 600 }}>{job.job_type || 'Full-time'}</div>
              </div>
              {job.salary && (
                <div>
                  <div style={{ color: 'var(--text-subtle)' }}>Estimated / Disclosed Pay</div>
                  <div style={{ fontWeight: 700, color: '#34D399' }}>{job.salary}</div>
                </div>
              )}
              <div>
                <div style={{ color: 'var(--text-subtle)' }}>Date Verified</div>
                <div style={{ fontWeight: 600 }}>{new Date(job.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '1.25rem',
              padding: '1.75rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#38BDF8',
                fontWeight: 700,
                marginBottom: '0.5rem',
              }}
            >
              <ShieldCheck size={20} /> Candidate Safety Guarantee
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '0.85rem' }}>
              Verified employers on Remote Jobs HQ will never request payment for applications, equipment, or training.
            </p>
            <Link
              href="/guides/how-to-spot-and-avoid-remote-job-scams"
              style={{ color: '#38BDF8', fontSize: '0.83rem', fontWeight: 700 }}
            >
              Read our Remote Job Safety Guide →
            </Link>
          </div>

          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '1.25rem',
              padding: '1.75rem',
            }}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.85rem' }}>
              Helpful Career Resources
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.86rem' }}>
              <Link href={`/category/${categorySlug}`} style={{ color: '#38BDF8', fontWeight: 600 }}>
                📂 More {job.category} Remote Jobs →
              </Link>
              <Link href="/salary-guide" style={{ color: 'var(--text-muted)' }}>
                💰 Compare Global Salary Benchmarks →
              </Link>
              <Link href="/guides/how-to-land-a-high-paying-remote-job" style={{ color: 'var(--text-muted)' }}>
                📘 How to Land a Remote Job Playbook →
              </Link>
              <Link href="/guides/building-an-ats-optimized-remote-resume-and-portfolio" style={{ color: 'var(--text-muted)' }}>
                📄 ATS-Optimized Remote Resume Guide →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Similar & Recommended Remote Jobs Section (Always Populated for Deep Engagement & SEO) */}
      {similarJobs.length > 0 && (
        <section style={{ marginTop: '4rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginBottom: '1.5rem',
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
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  marginBottom: '0.35rem',
                }}
              >
                <Sparkles size={15} /> RELATED REMOTE OPPORTUNITIES
              </div>
              <h2 style={{ fontSize: '1.65rem', fontWeight: 800 }}>
                Similar & Recommended Remote Positions
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.25rem' }}>
                Explore more verified remote roles matching <strong>{job.category}</strong> and distributed career tracks.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link href={`/category/${categorySlug}`} className="btn-secondary" style={{ fontSize: '0.88rem' }}>
                More {job.category} Jobs <ArrowRight size={14} />
              </Link>
              <Link href="/all-jobs" className="btn-primary" style={{ fontSize: '0.88rem' }}>
                See All Remote Jobs <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div className="jobs-grid" style={{ marginBottom: '2rem' }}>
            {similarJobs.map((simJob) => (
              <Link
                key={simJob.id}
                href={`/jobs/${simJob.slug || encodeURIComponent(simJob.id)}`}
                className="job-card"
              >
                <div className="job-info-left">
                  <div className="company-logo">
                    {simJob.company_logo ? (
                      <img
                        src={simJob.company_logo}
                        alt={simJob.company}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      simJob.company.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
                        {simJob.company}
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
                    <div className="job-title">{simJob.title}</div>
                    <div className="job-meta">
                      <span className="job-meta-item">
                        <MapPin size={14} color="#38BDF8" /> {simJob.location || '100% Remote / Worldwide'}
                      </span>
                      {simJob.job_type && (
                        <span className="job-meta-item">
                          <Briefcase size={14} /> {simJob.job_type}
                        </span>
                      )}
                      {simJob.salary && <span className="tag salary-tag">💰 {simJob.salary}</span>}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                  <div className="tags-row">
                    {simJob.tags &&
                      simJob.tags.slice(0, 2).map((tag, idx) => (
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
        </section>
      )}
    </div>
  );
}
