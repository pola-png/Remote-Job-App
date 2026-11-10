import { Metadata } from 'next';
import Link from 'next/link';
import { supabase, RemoteJob, mapJobRow, isAuthenticJobRow, JOB_LIST_COLUMNS } from '@/lib/supabase';
import { Briefcase, MapPin, ArrowRight, ArrowLeft, ShieldCheck, BookOpen } from 'lucide-react';

interface Props {
  params: { category: string };
}

export const revalidate = 3600;

const CATEGORY_MAP: Record<
  string,
  {
    name: string;
    title: string;
    desc: string;
    icon: string;
    salaryBand: string;
    topSkills: string[];
    editorialSummary: string;
  }
> = {
  development: {
    name: 'DEVELOPMENT',
    title: 'Remote Software Engineering & Tech Jobs',
    desc: 'Browse verified remote software engineering, frontend, backend, full-stack, mobile, cloud, and DevOps positions at top global companies.',
    icon: '💻',
    salaryBand: '$95,000 – $195,000 / yr',
    topSkills: ['TypeScript / React', 'Python & Go', 'Node.js', 'AWS / Kubernetes', 'System Architecture'],
    editorialSummary:
      'Software engineering remains the largest location-independent discipline worldwide. Distributed engineering organizations prioritize candidates who write self-documented code, participate actively in asynchronous pull-request reviews, and design resilient cloud architectures.',
  },
  design: {
    name: 'DESIGN',
    title: 'Remote UI/UX & Product Design Jobs',
    desc: 'Find verified remote product design, UI/UX, design systems, user research, and brand design roles at leading technology companies.',
    icon: '🎨',
    salaryBand: '$80,000 – $160,000 / yr',
    topSkills: ['Figma & Prototyping', 'Design Systems', 'User Research', 'Interaction Design', 'Accessibility (WCAG)'],
    editorialSummary:
      'Remote design teams rely heavily on collaborative canvases like Figma, FigJam, and asynchronous video critiques. Strong portfolios that walk through problem framing, usability trade-offs, and measurable conversion improvements stand out immediately.',
  },
  marketing: {
    name: 'MARKETING',
    title: 'Remote Marketing, SEO & Growth Jobs',
    desc: 'Explore high-paying remote digital marketing, product marketing, SEO, lifecycle, performance acquisition, and demand generation jobs.',
    icon: '📈',
    salaryBand: '$70,000 – $150,000 / yr',
    topSkills: ['Demand Generation', 'Technical SEO', 'Product Marketing', 'Lifecycle & CRM', 'Paid Acquisition'],
    editorialSummary:
      'Remote growth and marketing roles blend creative positioning with rigorous funnel analytics. Employers look for marketers who can own full-funnel experiments, attribute revenue impact, and align closely with product and sales teams.',
  },
  sales: {
    name: 'SALES',
    title: 'Remote Sales, AE & Business Development Jobs',
    desc: 'Apply for verified remote Account Executive, SDR, BDR, Solutions Engineering, and Enterprise Sales Leadership roles.',
    icon: '💼',
    salaryBand: '$75,000 – $185,000 OTE',
    topSkills: ['Consultative Selling', 'Enterprise Discovery', 'CRM & Pipeline Management', 'Contract Negotiation', 'SaaS GTM'],
    editorialSummary:
      'Distributed B2B sales teams evaluate candidates on pipeline discipline, virtual executive presence, and consultative discovery. Top remote revenue organizations offer competitive base salaries paired with uncapped commission structures.',
  },
  support: {
    name: 'SUPPORT',
    title: 'Remote Customer Support & Customer Success Jobs',
    desc: 'Work from anywhere in customer success, technical support, client onboarding, and account management roles.',
    icon: '🎧',
    salaryBand: '$52,000 – $115,000 / yr',
    topSkills: ['Customer Success (CSM)', 'Technical Troubleshooting', 'Zendesk / Intercom', 'Knowledge Base Authoring', 'Client Onboarding'],
    editorialSummary:
      'Remote customer success and technical support specialists form the backbone of global SaaS retention. High-performing candidates demonstrate empathy, crisp written communication, and the ability to turn recurring questions into clear documentation.',
  },
  writing: {
    name: 'WRITING',
    title: 'Remote Content Writing, Editorial & Copywriting Jobs',
    desc: 'Curated remote technical writing, editorial strategy, copywriting, documentation, and content operations opportunities.',
    icon: '✍️',
    salaryBand: '$58,000 – $120,000 / yr',
    topSkills: ['Technical Documentation', 'Editorial Strategy', 'B2B Copywriting', 'Content Operations', 'SEO Research'],
    editorialSummary:
      'In asynchronous organizations, clear writing is a core competitive advantage. Companies hiring remote writers and editors look for published clips that simplify complex technical or industry topics for specialized audiences.',
  },
  data: {
    name: 'DATA',
    title: 'Remote Data Science, AI & Analytics Jobs',
    desc: 'Top remote roles in Data Science, Machine Learning, AI Engineering, Analytics Engineering, and Business Intelligence.',
    icon: '📊',
    salaryBand: '$105,000 – $210,000 / yr',
    topSkills: ['Python & SQL', 'LLM & ML Engineering', 'dbt & Snowflake', 'Statistical Modeling', 'BI & Data Storytelling'],
    editorialSummary:
      'Demand for remote AI engineers, analytics engineers, and data scientists has surged as organizations build production machine learning pipelines and self-serve data warehouses.',
  },
  finance: {
    name: 'FINANCE',
    title: 'Remote Finance, Accounting & Payroll Jobs',
    desc: 'Vetted remote financial analyst (FP&A), corporate accounting, controller, compliance, and global payroll roles.',
    icon: '💰',
    salaryBand: '$75,000 – $155,000 / yr',
    topSkills: ['FP&A & Forecasting', 'GAAP / IFRS Accounting', 'Multi-Currency Payroll', 'SaaS Metrics', 'ERP & NetSuite'],
    editorialSummary:
      'Distributed finance teams manage multi-jurisdiction compliance, SaaS revenue recognition, and strategic cash-flow modeling. Experience with cloud ERP platforms and cross-border operations is highly valued.',
  },
  assistant: {
    name: 'ASSISTANT',
    title: 'Remote Executive Assistant & Operations Jobs',
    desc: 'High-paying remote executive assistant, business operations, project coordination, and chief-of-staff support positions.',
    icon: '🤝',
    salaryBand: '$55,000 – $110,000 / yr',
    topSkills: ['Executive Operations', 'Cross-Timezone Scheduling', 'Project Coordination', 'Notion & Linear Ops', 'Vendor Management'],
    editorialSummary:
      'Remote operations professionals and executive partners act as force multipliers for distributed leadership teams—orchestrating quarterly planning, board preparation, and asynchronous workflows.',
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = params.category.toLowerCase();
  const cat = CATEGORY_MAP[slug] || {
    name: slug.toUpperCase(),
    title: `Remote ${slug.charAt(0).toUpperCase() + slug.slice(1)} Jobs`,
    desc: `Browse verified remote ${slug} jobs from vetted companies worldwide. Apply online today.`,
    icon: '💼',
  };

  const canonicalUrl = `https://remotejobshq.online/category/${encodeURIComponent(slug)}`;

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
    desc: `Browse verified remote ${slug} jobs from vetted companies worldwide.`,
    icon: '💼',
    salaryBand: '$70,000 – $150,000 / yr',
    topSkills: ['Asynchronous Communication', 'Domain Expertise', 'Project Ownership'],
    editorialSummary: `Explore curated remote opportunities in ${slug} with verified employers offering flexible distributed work.`,
  };

  const { data: rawJobs, count } = await supabase
    .from('job_postings')
    .select(JOB_LIST_COLUMNS, { count: 'exact' })
    .eq('status', 'active')
    .eq('category', cat.name)
    .order('posted_timestamp', { ascending: false, nullsFirst: false })
    .limit(50);

  const jobs: RemoteJob[] = (rawJobs || []).filter(isAuthenticJobRow).map(mapJobRow);
  const totalCategoryCount = typeof count === 'number' && count > 0 ? count : jobs.length;
  const canonicalUrl = `https://remotejobshq.online/category/${encodeURIComponent(slug)}`;

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
        name: 'Categories',
        item: 'https://remotejobshq.online/#categories',
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
          marginBottom: '2.5rem',
        }}
      >
        <span style={{ fontSize: '2.5rem', display: 'inline-block', marginBottom: '0.75rem' }}>{cat.icon}</span>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.75rem' }}>{cat.title}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.08rem', maxWidth: '750px', lineHeight: '1.6' }}>
          {cat.desc}
        </p>
        <p
          style={{
            color: 'var(--text-subtle)',
            fontSize: '0.95rem',
            maxWidth: '780px',
            lineHeight: '1.65',
            marginTop: '0.85rem',
          }}
        >
          {cat.editorialSummary}
        </p>

        <div
          style={{
            marginTop: '1.5rem',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38BDF8',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            {totalCategoryCount.toLocaleString()} Total Verified Positions
          </span>
          <span
            style={{
              background: 'rgba(16, 185, 129, 0.14)',
              color: '#34D399',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            💰 Typical Band: {cat.salaryBand}
          </span>
        </div>

        <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: 600 }}>In-Demand Skills:</span>
          {cat.topSkills.map((skill, idx) => (
            <span key={idx} className="tag" style={{ fontSize: '0.78rem' }}>
              {skill}
            </span>
          ))}
        </div>
      </div>

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
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Latest {cat.name} Opportunities</h2>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Showing {jobs.length} of <strong>{totalCategoryCount.toLocaleString()}</strong> active positions
        </span>
      </div>

      <div className="jobs-grid">
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
            <h3>No jobs found in this category right now</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Check back soon or browse our complete directory of verified remote openings.
            </p>
            <Link href="/all-jobs" className="btn-secondary" style={{ marginTop: '1.5rem' }}>
              Browse All Jobs
            </Link>
          </div>
        ) : (
          jobs.map((job) => (
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
                    {job.salary && <span className="tag salary-tag">💰 {job.salary}</span>}
                  </div>
                </div>
              </div>
              <span className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                View Role <ArrowRight size={14} />
              </span>
            </Link>
          ))
        )}
      </div>

      {totalCategoryCount > jobs.length && (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link
            href={`/all-jobs?category=${encodeURIComponent(cat.name)}`}
            className="btn-primary"
            style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}
          >
            See All {totalCategoryCount.toLocaleString()} {cat.name} Jobs in Directory <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Cross-linking other categories */}
      <div
        style={{
          marginTop: '4rem',
          padding: '2rem',
          background: 'var(--bg-card)',
          borderRadius: '1rem',
          border: '1px solid var(--border-color)',
        }}
      >
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
          Explore Other Remote Career Tracks
        </h3>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {Object.entries(CATEGORY_MAP)
            .filter(([k]) => k !== slug)
            .map(([key, data]) => (
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
