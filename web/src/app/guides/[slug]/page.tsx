import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CAREER_GUIDES, getGuideBySlug } from '@/lib/careerGuides';
import { ArrowLeft, Clock, BookOpen, CheckCircle2, ArrowRight, UserCheck } from 'lucide-react';

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return CAREER_GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = getGuideBySlug(params.slug);
  if (!guide) {
    return { title: 'Guide Not Found | Remote Jobs HQ' };
  }
  const canonicalUrl = `https://remotejobshq.online/guides/${guide.slug}`;
  return {
    title: `${guide.title} | Remote Jobs HQ`,
    description: guide.excerpt,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: guide.title,
      description: guide.excerpt,
      url: canonicalUrl,
      type: 'article',
    },
  };
}

export default function GuideDetailPage({ params }: Props) {
  const guide = getGuideBySlug(params.slug);
  if (!guide) {
    notFound();
    return null;
  }

  const canonicalUrl = `https://remotejobshq.online/guides/${guide.slug}`;
  const relatedGuides = CAREER_GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 3);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.excerpt,
    datePublished: guide.publishedAt,
    dateModified: guide.updatedAt,
    author: {
      '@type': 'Person',
      name: guide.author.name,
      jobTitle: guide.author.role,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Remote Jobs HQ',
      logo: {
        '@type': 'ImageObject',
        url: 'https://remotejobshq.online/icon.png',
      },
    },
    mainEntityOfPage: canonicalUrl,
  };

  return (
    <div className="container" style={{ maxWidth: '920px', paddingBottom: '5rem' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <div style={{ margin: '2rem 0 1.25rem 0' }}>
        <Link
          href="/guides"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
          }}
        >
          <ArrowLeft size={16} /> Back to Career Guides
        </Link>
      </div>

      <article
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '1.5rem',
          padding: '2.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <span
            style={{
              background: 'rgba(56, 189, 248, 0.14)',
              color: '#38BDF8',
              padding: '0.3rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.82rem',
              fontWeight: 700,
            }}
          >
            {guide.category}
          </span>
          <span style={{ color: 'var(--text-subtle)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <Clock size={14} /> {guide.readTime}
          </span>
          <span style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>
            • Updated {new Date(guide.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        <h1 style={{ fontSize: '2.35rem', fontWeight: 800, lineHeight: '1.2', marginBottom: '1rem' }}>
          {guide.title}
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: '1.12rem', lineHeight: '1.65', marginBottom: '1.75rem' }}>
          {guide.excerpt}
        </p>

        {/* Author Byline */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            padding: '1rem 1.25rem',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.9rem',
            marginBottom: '2rem',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            {guide.author.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#F8FAFC' }}>{guide.author.name}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-subtle)' }}>{guide.author.role}</div>
          </div>
        </div>

        {/* Executive Summary / Key Takeaways Box */}
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            borderRadius: '1.15rem',
            padding: '1.5rem 1.75rem',
            marginBottom: '2.5rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#34D399',
              fontWeight: 800,
              fontSize: '0.95rem',
              marginBottom: '0.75rem',
            }}
          >
            <CheckCircle2 size={18} /> Executive Summary & Key Takeaways
          </div>
          <ul style={{ paddingLeft: '1.35rem', color: '#E2E8F0', lineHeight: '1.7', fontSize: '0.95rem' }}>
            {guide.keyTakeaways.map((point, idx) => (
              <li key={idx} style={{ marginBottom: '0.45rem' }}>
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Article Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.25rem' }}>
          {guide.sections.map((section, idx) => (
            <section key={idx}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.85rem', color: '#F8FAFC' }}>
                {section.heading}
              </h2>
              {section.body.map((paragraph, pIdx) => (
                <p
                  key={pIdx}
                  style={{
                    color: 'var(--text-main)',
                    fontSize: '1.03rem',
                    lineHeight: '1.8',
                    marginBottom: '1rem',
                  }}
                >
                  {paragraph}
                </p>
              ))}
              {section.bullets && section.bullets.length > 0 && (
                <ul
                  style={{
                    paddingLeft: '1.5rem',
                    color: 'var(--text-muted)',
                    lineHeight: '1.75',
                    fontSize: '0.98rem',
                    marginTop: '0.5rem',
                  }}
                >
                  {section.bullets.map((bullet, bIdx) => (
                    <li key={bIdx} style={{ marginBottom: '0.5rem' }}>
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
              {section.callout && (
                <div
                  style={{
                    marginTop: '1.25rem',
                    padding: '1.35rem 1.5rem',
                    background: 'rgba(56, 189, 248, 0.08)',
                    borderLeft: '4px solid #38BDF8',
                    borderRadius: '0.75rem',
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#38BDF8', marginBottom: '0.35rem', fontSize: '0.95rem' }}>
                    {section.callout.title}
                  </div>
                  <p style={{ color: 'var(--text-main)', fontSize: '0.93rem', lineHeight: '1.65' }}>
                    {section.callout.text}
                  </p>
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Bottom CTA */}
        <div
          style={{
            marginTop: '3rem',
            paddingTop: '2rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Ready to put this guide into action?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Browse thousands of verified remote positions or benchmark your target salary.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href="/all-jobs" className="btn-primary">
              Browse Verified Jobs <ArrowRight size={15} />
            </Link>
            <Link href="/salary-guide" className="btn-secondary">
              Salary Calculator
            </Link>
          </div>
        </div>
      </article>

      {/* Related Guides */}
      <div style={{ marginTop: '3.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.25rem' }}>
          Continue Reading: Related Career Playbooks
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {relatedGuides.map((rel) => (
            <Link
              key={rel.slug}
              href={`/guides/${rel.slug}`}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '1rem',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ color: '#38BDF8', fontSize: '0.75rem', fontWeight: 700 }}>{rel.category}</span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0.4rem 0 0.6rem 0', lineHeight: '1.35' }}>
                  {rel.title}
                </h3>
              </div>
              <span style={{ color: '#38BDF8', fontSize: '0.82rem', fontWeight: 700 }}>Read Guide →</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
