import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Globe, BookOpen, Award, CheckCircle2, Users, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us, Editorial Standards & Employer Verification | Remote Jobs HQ',
  description:
    'Learn how Remote Jobs HQ curates, verifies, and benchmarks remote career opportunities worldwide, and meet our editorial and talent research team.',
  alternates: {
    canonical: 'https://remotejobshq.online/about',
  },
};

export default function AboutPage() {
  return (
    <div className="container" style={{ maxWidth: '940px', paddingBottom: '5rem' }}>
      <div style={{ margin: '2rem 0 1.25rem 0' }}>
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
          borderRadius: '1.5rem',
          padding: '2.75rem',
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
          <ShieldCheck size={15} /> Our Mission, Curation Process & Editorial Standards
        </div>

        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '1rem', lineHeight: '1.2' }}>
          Building the Most Trusted Resource for Location-Independent Careers
        </h1>

        <p style={{ color: 'var(--text-main)', fontSize: '1.08rem', lineHeight: '1.8', marginBottom: '1.25rem' }}>
          <strong>Remote Jobs HQ</strong> (<code>remotejobshq.online</code>) is an independent remote career publication, compensation research hub, and curated job platform dedicated to connecting talented professionals with verified distributed employers worldwide.
        </p>

        <p style={{ color: 'var(--text-muted)', fontSize: '1.02rem', lineHeight: '1.8', marginBottom: '2rem' }}>
          We founded Remote Jobs HQ to solve three persistent challenges in the remote job market: opaque compensation bands, misleading &ldquo;remote&rdquo; listings that secretly require office attendance, and a lack of practical guidance on how distributed hiring actually works. Every day, our platform combines structured job verification with original compensation research and career playbooks.
        </p>

        <h2 style={{ fontSize: '1.55rem', fontWeight: 800, marginBottom: '1rem', color: '#F8FAFC' }}>
          Our 4-Stage Curation & Employer Verification Standard
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2.5rem',
          }}
        >
          {[
            {
              title: '1. Corporate & Domain Verification',
              text: 'Every hiring company is checked for an active corporate presence, verifiable product or service offering, and legitimate recruiting workflow.',
            },
            {
              title: '2. True Remote Eligibility Audit',
              text: 'We classify roles by exact workplace flexibility—distinguishing 100% Worldwide Anywhere positions from timezone-aligned regional remote roles.',
            },
            {
              title: '3. Salary & Market Benchmarking',
              text: 'When an employer does not publicly disclose a pay range, our compensation engine attaches a transparent market benchmark based on role, category, and seniority.',
            },
            {
              title: '4. Continuous Expiration & Quality Hygiene',
              text: 'Listings are monitored daily and automatically retired once filled or past our freshness window so job seekers never waste time on stale openings.',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(13, 22, 39, 0.8)',
                border: '1px solid var(--border-color)',
                borderRadius: '1rem',
                padding: '1.5rem',
              }}
            >
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#38BDF8', marginBottom: '0.5rem' }}>
                {item.title}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.65' }}>{item.text}</p>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: '1.55rem', fontWeight: 800, marginBottom: '1rem', color: '#F8FAFC' }}>
          Our Editorial & Research Team
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem', lineHeight: '1.75', marginBottom: '1.5rem' }}>
          Our career guides, salary calculators, and role briefings are written and reviewed by practitioners with firsthand experience scaling remote engineering, product, and people-operations teams across North America, Europe, and emerging markets.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2.5rem',
          }}
        >
          {[
            {
              name: 'Elena Rostova',
              role: 'Head of Talent & Editorial',
              bio: 'Former distributed Talent Lead with 9+ years designing asynchronous hiring loops and remote onboarding frameworks for global SaaS teams.',
            },
            {
              name: 'Marcus Vance',
              role: 'Senior Compensation Analyst',
              bio: 'Specializes in cross-border payroll benchmarking, Employer of Record (EOR) compliance, and international contractor compensation structures.',
            },
            {
              name: 'David Chen',
              role: 'Distributed Engineering Advisor',
              bio: 'Staff software architect focused on remote system design assessments, engineering velocity, and asynchronous RFC culture.',
            },
          ].map((member, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '1rem',
                padding: '1.4rem',
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#F8FAFC' }}>{member.name}</div>
              <div style={{ color: '#34D399', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.6rem' }}>
                {member.role}
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: '1.6' }}>{member.bio}</p>
            </div>
          ))}
        </div>

        <div
          style={{
            paddingTop: '1.75rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Have questions or want to partner with us?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Reach out to our editorial, support, or employer relations teams any time.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href="/contact" className="btn-primary">
              Contact Our Team <ArrowRight size={15} />
            </Link>
            <Link href="/guides" className="btn-secondary">
              Read Career Guides
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
