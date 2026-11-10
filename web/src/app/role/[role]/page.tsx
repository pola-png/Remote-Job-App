import { Metadata } from 'next';
import Link from 'next/link';
import { supabase, RemoteJob, mapJobRow, isAuthenticJobRow, JOB_LIST_COLUMNS } from '@/lib/supabase';
import { Briefcase, MapPin, ArrowRight, ArrowLeft, ShieldCheck, HelpCircle } from 'lucide-react';

interface Props {
  params: { role: string };
}

export const revalidate = 3600;

const ROLE_SYNONYMS: Record<string, { terms: string[]; defaultCategory?: string }> = {
  'frontend': { terms: ['frontend', 'front end', 'front-end'], defaultCategory: 'DEVELOPMENT' },
  'backend': { terms: ['backend', 'back end', 'back-end'], defaultCategory: 'DEVELOPMENT' },
  'fullstack': { terms: ['fullstack', 'full stack', 'full-stack'], defaultCategory: 'DEVELOPMENT' },
  'software-engineer': { terms: ['software engineer', 'software developer', 'software architect'], defaultCategory: 'DEVELOPMENT' },
  'mobile-developer': { terms: ['mobile', 'ios', 'android', 'react native', 'flutter'], defaultCategory: 'DEVELOPMENT' },
  'devops': { terms: ['devops', 'site reliability', 'sre', 'infrastructure'], defaultCategory: 'DEVELOPMENT' },
  'qa-engineer': { terms: ['qa', 'quality assurance', 'test engineer'], defaultCategory: 'DEVELOPMENT' },
  'react': { terms: ['react', 'next.js', 'react native'], defaultCategory: 'DEVELOPMENT' },
  'python': { terms: ['python', 'django', 'fastapi'], defaultCategory: 'DEVELOPMENT' },
  'product-manager': { terms: ['product manager', 'technical product manager', 'product lead'], defaultCategory: 'DEVELOPMENT' },
  'project-manager': { terms: ['project manager', 'scrum master', 'program manager'], defaultCategory: 'ASSISTANT' },
  'operations-manager': { terms: ['operations manager', 'operations lead', 'director of operations'], defaultCategory: 'ASSISTANT' },
  'ui-ux': { terms: ['designer', 'ui', 'ux'], defaultCategory: 'DESIGN' },
  'product-designer': { terms: ['product designer', 'ux', 'ui', 'designer'], defaultCategory: 'DESIGN' },
  'graphic-designer': { terms: ['graphic', 'visual designer', 'brand designer'], defaultCategory: 'DESIGN' },
  'video-editor': { terms: ['video', 'motion', 'editor', 'animator'], defaultCategory: 'DESIGN' },
  'customer-support': { terms: ['customer support', 'customer success', 'support specialist', 'customer care'], defaultCategory: 'SUPPORT' },
  'customer-service': { terms: ['customer service', 'customer care', 'support agent'], defaultCategory: 'SUPPORT' },
  'customer-success': { terms: ['customer success', 'client success', 'account manager'], defaultCategory: 'SUPPORT' },
  'account-executive': { terms: ['account executive', 'enterprise sales', 'account manager'], defaultCategory: 'SALES' },
  'sales-development': { terms: ['sales development', 'sdr', 'bdr'], defaultCategory: 'SALES' },
  'sales-manager': { terms: ['sales manager', 'sales director', 'head of sales'], defaultCategory: 'SALES' },
  'marketing-manager': { terms: ['marketing manager', 'growth marketing', 'marketing lead'], defaultCategory: 'MARKETING' },
  'copywriter': { terms: ['copywriter', 'content writer', 'technical writer'], defaultCategory: 'WRITING' },
  'content-writer': { terms: ['content writer', 'copywriter', 'writer', 'editor'], defaultCategory: 'WRITING' },
  'seo': { terms: ['seo', 'search engine', 'organic growth'], defaultCategory: 'MARKETING' },
  'data-analyst': { terms: ['data analyst', 'business intelligence', 'bi analyst', 'analytics'], defaultCategory: 'DATA' },
  'data-engineer': { terms: ['data engineer', 'big data', 'etl'], defaultCategory: 'DATA' },
  'machine-learning': { terms: ['machine learning', 'ml', 'deep learning'], defaultCategory: 'DATA' },
  'ai': { terms: ['ai', 'artificial intelligence', 'machine learning', 'llm'], defaultCategory: 'DATA' },
  'cybersecurity': { terms: ['cyber', 'security', 'infosec'], defaultCategory: 'DEVELOPMENT' },
  'security': { terms: ['security', 'cyber', 'infosec'], defaultCategory: 'DEVELOPMENT' },
  'virtual-assistant': { terms: ['virtual assistant', 'administrative', 'executive assistant', 'admin'], defaultCategory: 'ASSISTANT' },
  'executive-assistant': { terms: ['executive assistant', 'virtual assistant', 'executive coordinator'], defaultCategory: 'ASSISTANT' },
  'accountant': { terms: ['accountant', 'accounting', 'bookkeeper'], defaultCategory: 'FINANCE' },
  'bookkeeper': { terms: ['bookkeeper', 'accounting clerk', 'accountant'], defaultCategory: 'FINANCE' },
  'financial-analyst': { terms: ['financial analyst', 'finance analyst', 'fp&a'], defaultCategory: 'FINANCE' },
  'recruiter': { terms: ['recruiter', 'talent acquisition', 'people operations'], defaultCategory: 'ASSISTANT' },
};

const POPULAR_ROLES = [
  { slug: 'software-engineer', name: 'Software Engineer' },
  { slug: 'product-manager', name: 'Product Manager' },
  { slug: 'account-executive', name: 'Account Executive' },
  { slug: 'customer-support', name: 'Customer Support' },
  { slug: 'data-analyst', name: 'Data Analyst' },
  { slug: 'virtual-assistant', name: 'Virtual Assistant' },
  { slug: 'product-designer', name: 'Product Designer' },
  { slug: 'devops', name: 'DevOps Engineer' },
  { slug: 'marketing-manager', name: 'Marketing Manager' },
  { slug: 'executive-assistant', name: 'Executive Assistant' },
  { slug: 'cybersecurity', name: 'Cybersecurity' },
  { slug: 'accountant', name: 'Accountant' },
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const roleSlug = params.role.toLowerCase();
  const rawRole = decodeURIComponent(params.role).replace(/-/g, ' ');
  const formattedTitle = rawRole
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  const canonicalUrl = `https://remotejobshq.online/role/${encodeURIComponent(roleSlug)}`;

  return {
    title: `Remote ${formattedTitle} Jobs (100% Work From Anywhere) | Remote Jobs HQ`,
    description: `Find verified remote ${formattedTitle} positions with transparent salaries, flexible hours, and distributed teams. Browse active listings and apply online.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `Remote ${formattedTitle} Jobs - Apply Online | Remote Jobs HQ`,
      description: `Explore curated, verified remote ${formattedTitle} opportunities from top global employers.`,
      url: canonicalUrl,
      type: 'website',
    },
  };
}

export default async function RolePage({ params }: Props) {
  const roleSlug = params.role.toLowerCase();
  const rawRole = decodeURIComponent(params.role).replace(/-/g, ' ');
  const formattedRole = rawRole
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  const canonicalUrl = `https://remotejobshq.online/role/${encodeURIComponent(roleSlug)}`;

  let jobs: RemoteJob[] = [];
  let totalRoleCount = 0;
  const synonymConfig = ROLE_SYNONYMS[roleSlug];

  try {
    if (synonymConfig && synonymConfig.terms.length > 0) {
      const orFilter = synonymConfig.terms.map((t) => `title.ilike.%${t}%`).join(',');
      const { data, count } = await supabase
        .from('job_postings')
        .select(JOB_LIST_COLUMNS, { count: 'exact' })
        .eq('status', 'active')
        .or(orFilter)
        .order('posted_timestamp', { ascending: false, nullsFirst: false })
        .limit(50);

      if (data && data.length > 0) {
        jobs = data.filter(isAuthenticJobRow).map(mapJobRow);
        totalRoleCount = typeof count === 'number' && count > 0 ? count : jobs.length;
      }
    } else {
      const words = rawRole.split(' ').filter((w) => w.length > 2);
      const pattern = words.length > 0 ? '%' + words.join('%') + '%' : `%${rawRole}%`;
      const { data, count } = await supabase
        .from('job_postings')
        .select(JOB_LIST_COLUMNS, { count: 'exact' })
        .eq('status', 'active')
        .ilike('title', pattern)
        .order('posted_timestamp', { ascending: false, nullsFirst: false })
        .limit(50);

      if (data && data.length > 0) {
        jobs = data.filter(isAuthenticJobRow).map(mapJobRow);
        totalRoleCount = typeof count === 'number' && count > 0 ? count : jobs.length;
      }
    }

    if (jobs.length < 8) {
      const existingIds = new Set(jobs.map((j) => j.id));
      let fallbackQuery = supabase
        .from('job_postings')
        .select(JOB_LIST_COLUMNS, { count: 'exact' })
        .eq('status', 'active')
        .order('posted_timestamp', { ascending: false, nullsFirst: false })
        .limit(20);

      if (synonymConfig?.defaultCategory) {
        fallbackQuery = fallbackQuery.eq('category', synonymConfig.defaultCategory);
      }

      const { data: fallbackData, count: fallbackCount } = await fallbackQuery;
      if (fallbackData) {
        for (const item of fallbackData) {
          if (isAuthenticJobRow(item) && !existingIds.has(item.id)) {
            jobs.push(mapJobRow(item));
          }
        }
        if (totalRoleCount < jobs.length) {
          totalRoleCount = fallbackCount || jobs.length;
        }
      }
    }
  } catch (err) {
    console.error('Role page fetch error:', err);
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Remote ${formattedRole} Jobs`,
    description: `Browse verified remote ${formattedRole} jobs hiring now.`,
    url: canonicalUrl,
    itemListElement: jobs.slice(0, 30).map((job, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: `${job.title} at ${job.company}`,
      url: `https://remotejobshq.online/jobs/${job.slug || encodeURIComponent(job.id)}`,
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
        name: 'Roles',
        item: 'https://remotejobshq.online/all-jobs',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${formattedRole} Jobs`,
        item: canonicalUrl,
      },
    ],
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Can I work remotely as a ${formattedRole} from anywhere?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Yes, all ${formattedRole} positions listed on Remote Jobs HQ are 100% remote. Many roles support worldwide telecommuting, while some specify regional timezones (e.g. US, Europe, or APAC).`,
        },
      },
      {
        '@type': 'Question',
        name: `What is the average salary for a remote ${formattedRole}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Salaries for remote ${formattedRole} roles vary based on experience, company stage, and location. Typical compensation ranges from competitive market rates to top-tier global benchmark packages with equity and full health benefits.`,
        },
      },
      {
        '@type': 'Question',
        name: `How do I apply for remote ${formattedRole} jobs on Remote Jobs HQ?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Click on any position to review full role responsibilities and compensation benchmarks, then submit your candidate application directly on the listing page.`,
        },
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

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
          <ArrowLeft size={16} /> Back to all remote jobs
        </Link>
      </div>

      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '1.25rem',
          padding: '2.5rem',
          marginBottom: '2.5rem',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(56, 189, 248, 0.15)',
            color: '#38BDF8',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '0.85rem',
          }}
        >
          <ShieldCheck size={16} /> Verified Remote Career Hub
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
          Remote {formattedRole} Jobs
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.12rem', maxWidth: '800px', lineHeight: '1.6' }}>
          Browse verified, 100% remote {formattedRole} openings at distributed technology companies and global enterprises. Review transparent pay bands and apply directly online.
        </p>
        <div
          style={{
            marginTop: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap',
            fontSize: '0.9rem',
            color: 'var(--text-subtle)',
          }}
        >
          <span style={{ color: '#38BDF8', fontWeight: 700 }}>
            ● {totalRoleCount.toLocaleString()} Total Verified Positions
          </span>
          <span>● Showing {jobs.length} of {totalRoleCount.toLocaleString()} Roles</span>
          <span>● 100% Work From Anywhere</span>
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
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
                  {job.company}
                </span>
                <div className="job-title">{job.title}</div>
                <div className="job-meta">
                  <span className="job-meta-item">
                    <MapPin size={14} color="#38BDF8" /> {job.location || '100% Remote / Worldwide'}
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
            <span className="btn-secondary" style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem' }}>
              View Role <ArrowRight size={14} />
            </span>
          </Link>
        ))}
      </div>

      {totalRoleCount > jobs.length && (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link
            href={`/all-jobs?q=${encodeURIComponent(rawRole)}`}
            className="btn-primary"
            style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}
          >
            See All {totalRoleCount.toLocaleString()} {formattedRole} Jobs <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* FAQ Section */}
      <div
        style={{
          marginTop: '4rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '1.25rem',
          padding: '2.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#38BDF8',
            fontWeight: 700,
            fontSize: '0.95rem',
            marginBottom: '0.5rem',
          }}
        >
          <HelpCircle size={18} /> Frequently Asked Questions
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1.5rem' }}>
          Remote {formattedRole} Careers & Hiring FAQ
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
              Can I work remotely as a {formattedRole} from anywhere?
            </h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem' }}>
              Yes, all {formattedRole} positions listed on Remote Jobs HQ are 100% telecommute friendly. Many employers hire globally with flexible working hours, while others align with core regional collaboration timezones.
            </p>
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
              What is the compensation like for a remote {formattedRole}?
            </h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem' }}>
              Compensation depends on seniority, domain specialization, and company stage. Distributed startups and global enterprises offer competitive USD-benchmarked packages, home office stipends, and comprehensive benefits.
            </p>
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
              How do I stand out when applying for a remote {formattedRole} role?
            </h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem' }}>
              Emphasize your written communication skills, measurable past deliverables, and experience working autonomously with distributed teams. Review our{' '}
              <Link href="/guides/how-to-land-a-high-paying-remote-job" style={{ color: '#38BDF8', fontWeight: 600 }}>
                Remote Career Playbook
              </Link>{' '}
              for step-by-step resume and interview strategies.
            </p>
          </div>
        </div>
      </div>

      {/* Internal Linking: Related Remote Roles */}
      <div
        style={{
          marginTop: '3rem',
          padding: '2rem',
          background: 'rgba(56, 189, 248, 0.04)',
          border: '1px solid var(--border-color)',
          borderRadius: '1.25rem',
        }}
      >
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#F8FAFC' }}>
          Explore Other High-Paying Remote Roles
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
          {POPULAR_ROLES.filter((r) => r.slug !== roleSlug).map((r) => (
            <Link
              key={r.slug}
              href={`/role/${r.slug}`}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                color: 'var(--text-main)',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              Remote {r.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
