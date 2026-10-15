import { Metadata } from 'next';
import Link from 'next/link';
import { supabase, RemoteJob, mapJobRow } from '@/lib/supabase';
import { Briefcase, MapPin, ArrowRight, ArrowLeft, ShieldCheck, CheckCircle2, HelpCircle } from 'lucide-react';

interface Props {
  params: { role: string };
}

export const dynamic = 'force-dynamic';
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
  'product-manager': { terms: ['product manager', 'technical product manager', 'product lead'], defaultCategory: 'MANAGEMENT' },
  'project-manager': { terms: ['project manager', 'scrum master', 'program manager'], defaultCategory: 'MANAGEMENT' },
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
  'recruiter': { terms: ['recruiter', 'talent acquisition', 'people operations'], defaultCategory: 'HR' },
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
  const formattedTitle = rawRole.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const canonicalUrl = `https://remotejobshq.online/role/${encodeURIComponent(roleSlug)}`;

  return {
    title: `Remote ${formattedTitle} Jobs (100% Work From Anywhere) | Remote Jobs HQ`,
    description: `Find top verified remote ${formattedTitle} positions with competitive salaries, flexible hours, and global teams. Browse active listings and apply directly online.`,
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
  const formattedRole = rawRole.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const canonicalUrl = `https://remotejobshq.online/role/${encodeURIComponent(roleSlug)}`;

  // 1. Search jobs matching this role using synonyms or word patterns
  let jobs: RemoteJob[] = [];
  const synonymConfig = ROLE_SYNONYMS[roleSlug];

  try {
    if (synonymConfig && synonymConfig.terms.length > 0) {
      const orFilter = synonymConfig.terms.map(t => `title.ilike.%${t}%`).join(',');
      const { data } = await supabase
        .from('job_postings')
        .select('*')
        .eq('status', 'active')
        .or(orFilter)
        .order('posted_timestamp', { ascending: false, nullsFirst: false })
        .limit(60);

      if (data && data.length > 0) {
        jobs = data.map(mapJobRow);
      }
    } else {
      // General title keyword search
      const words = rawRole.split(' ').filter(w => w.length > 2);
      const pattern = words.length > 0 ? '%' + words.join('%') + '%' : `%${rawRole}%`;
      const { data } = await supabase
        .from('job_postings')
        .select('*')
        .eq('status', 'active')
        .ilike('title', pattern)
        .order('posted_timestamp', { ascending: false, nullsFirst: false })
        .limit(60);

      if (data && data.length > 0) {
        jobs = data.map(mapJobRow);
      }
    }

    // 2. Fallback: If matching jobs are fewer than 8, backfill with related active remote jobs
    // This ensures Google NEVER encounters an empty page or Soft 404!
    if (jobs.length < 8) {
      const existingIds = new Set(jobs.map(j => j.id));
      let fallbackQuery = supabase
        .from('job_postings')
        .select('*')
        .eq('status', 'active')
        .order('posted_timestamp', { ascending: false, nullsFirst: false })
        .limit(20);

      if (synonymConfig?.defaultCategory) {
        fallbackQuery = fallbackQuery.eq('category', synonymConfig.defaultCategory);
      }

      const { data: fallbackData } = await fallbackQuery;
      if (fallbackData) {
        for (const item of fallbackData) {
          if (!existingIds.has(item.id)) {
            jobs.push(mapJobRow(item));
          }
        }
      }
    }
  } catch (err) {
    console.error('Role page fetch error:', err);
  }

  // Schema.org CollectionPage structured data
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

  // Google Breadcrumbs Schema
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

  // Google FAQ Schema for Rich Snippets
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
          text: `Click on any position to view full job requirements and perks, then click "Apply for this position" to submit your application directly to the hiring employer.`,
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

      {/* Breadcrumb Navigation */}
      <div style={{ margin: '2rem 0 1rem 0' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back to all remote jobs
        </Link>
      </div>

      {/* Hero Header */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', padding: '2.5rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.85rem' }}>
          <ShieldCheck size={16} /> Verified Remote Career Hub
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
          Remote {formattedRole} Jobs
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', maxWidth: '800px', lineHeight: '1.6' }}>
          Browse hand-picked, 100% remote {formattedRole} job openings at top global companies and high-growth startups. Apply directly with zero friction.
        </p>
        <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--text-subtle)' }}>
          <span style={{ color: '#38BDF8', fontWeight: 700 }}>● {jobs.length} Active Positions Open</span>
          <span>● 100% Work From Anywhere</span>
          <span>● Updated Daily</span>
        </div>
      </div>

      {/* Job Listings Grid */}
      <div className="jobs-grid">
        {jobs.map((job) => (
          <Link key={job.id} href={`/jobs/${job.slug || encodeURIComponent(job.id)}`} className="job-card">
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
                  {job.salary && !job.salary.toLowerCase().includes('competitive') && (
                    <span className="tag salary-tag">💰 {job.salary}</span>
                  )}
                </div>
              </div>
            </div>
            <button className="btn-secondary" style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem' }}>
              View Details <ArrowRight size={14} />
            </button>
          </Link>
        ))}
      </div>

      {/* Google FAQ Accordion Section (Boosts SEO & Dwell Time) */}
      <div style={{ marginTop: '4rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', padding: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38BDF8', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem' }}>
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
              Yes, all {formattedRole} positions listed on Remote Jobs HQ are 100% telecommute friendly. Many employers hire globally with flexible working hours, while others might align with specific core collaboration timezones.
            </p>
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
              What is the compensation like for a remote {formattedRole}?
            </h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem' }}>
              Salaries depend on expertise level, specialty tools, and employer size. Many venture-backed startups and multinational corporations offer US-competitive compensation packages, home office stipends, and wellness allowances.
            </p>
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
              How do I get hired as a remote {formattedRole}?
            </h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem' }}>
              Highlight your asynchronous communication skills, past project accomplishments, and ability to work autonomously. Applying early to verified listings on Remote Jobs HQ gives your application prime visibility.
            </p>
          </div>
        </div>
      </div>

      {/* Internal Linking: Related Remote Roles (Boosts PageRank & Crawlability) */}
      <div style={{ marginTop: '3rem', padding: '2rem', background: 'rgba(56, 189, 248, 0.04)', border: '1px solid var(--border-color)', borderRadius: '1.25rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#F8FAFC' }}>
          Explore Other High-Paying Remote Roles
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
          {POPULAR_ROLES.filter(r => r.slug !== roleSlug).map((r) => (
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
