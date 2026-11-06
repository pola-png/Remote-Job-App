import { Metadata } from 'next';
import Link from 'next/link';
import { CAREER_GUIDES } from '@/lib/careerGuides';
import { BookOpen, Clock, ArrowRight, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Remote Career Guides, Playbooks & Research | Remote Jobs HQ',
  description:
    'In-depth editorial guides on landing high-paying remote jobs, negotiating global compensation, passing distributed interviews, and working asynchronously.',
  alternates: {
    canonical: 'https://remotejobshq.online/guides',
  },
};

export default function GuidesIndexPage() {
  return (
    <div className="container" style={{ paddingBottom: '5rem' }}>
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
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(56, 189, 248, 0.14)',
            color: '#38BDF8',
            padding: '0.3rem 0.85rem',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '0.85rem',
          }}
        >
          <BookOpen size={15} /> Remote Jobs HQ Editorial Library
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Remote Career Guides & Distributed Work Playbooks
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.08rem', maxWidth: '780px', lineHeight: '1.65' }}>
          Original, research-backed guides written by our distributed talent and compensation analysts. Whether you are transitioning to your first remote role or negotiating a senior global package, these playbooks cover every stage of your remote career.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.75rem',
        }}
      >
        {CAREER_GUIDES.map((guide) => (
          <Link
            key={guide.slug}
            href={`/guides/${guide.slug}`}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '1.25rem',
              padding: '2rem',
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
                  marginBottom: '1rem',
                  fontSize: '0.8rem',
                }}
              >
                <span
                  style={{
                    background: 'rgba(56, 189, 248, 0.14)',
                    color: '#38BDF8',
                    padding: '0.25rem 0.7rem',
                    borderRadius: '9999px',
                    fontWeight: 700,
                  }}
                >
                  {guide.category}
                </span>
                <span style={{ color: 'var(--text-subtle)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={14} /> {guide.readTime}
                </span>
              </div>

              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, lineHeight: '1.35', marginBottom: '0.75rem', color: '#F8FAFC' }}>
                {guide.title}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', lineHeight: '1.65', marginBottom: '1.25rem' }}>
                {guide.excerpt}
              </p>

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#34D399', marginBottom: '0.45rem' }}>
                  KEY TAKEAWAYS:
                </div>
                <ul style={{ paddingLeft: '1.1rem', color: 'var(--text-subtle)', fontSize: '0.84rem', lineHeight: '1.55' }}>
                  {guide.keyTakeaways.slice(0, 2).map((item, idx) => (
                    <li key={idx} style={{ marginBottom: '0.3rem' }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div
              style={{
                borderTop: '1px solid var(--border-color)',
                paddingTop: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.85rem',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: '#E2E8F0' }}>{guide.author.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{guide.author.role}</div>
              </div>
              <span style={{ color: '#38BDF8', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                Read Article <ArrowRight size={15} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
