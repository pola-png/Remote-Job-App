import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service & Editorial Guidelines | Remote Jobs HQ',
  description:
    'Terms of service, candidate usage guidelines, and employer posting rules for Remote Jobs HQ.',
  alternates: {
    canonical: 'https://remotejobshq.online/terms',
  },
};

export default function TermsPage() {
  return (
    <div className="container" style={{ maxWidth: '880px', padding: '3rem 1.5rem 6rem 1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
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
          <ArrowLeft size={16} /> Back to home
        </Link>
      </div>

      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '1.25rem',
          padding: '2.75rem',
          lineHeight: '1.8',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#38BDF8',
            fontSize: '0.82rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
          }}
        >
          <ShieldCheck size={16} /> Platform Terms & Candidate Protections
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Terms of Service</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Effective Date: January 15, 2025 • Last Reviewed: February 28, 2025
        </p>

        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '1.75rem 0 0.6rem 0', color: '#F8FAFC' }}>
          1. Acceptance of Terms
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
          By accessing or using Remote Jobs HQ at <code>https://remotejobshq.online</code> or via our mobile application, you agree to be bound by these Terms of Service and our Privacy Policy.
        </p>

        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '1.75rem 0 0.6rem 0', color: '#F8FAFC' }}>
          2. Nature of Our Career Platform & Editorial Content
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Remote Jobs HQ publishes curated remote career listings, salary research benchmarks, and original career guides. While our editorial team audits listings for authenticity, Remote Jobs HQ is not a staffing agency or direct party to employment contracts executed between candidates and hiring companies. Candidates should exercise standard professional due diligence during interviews.
        </p>

        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '1.75rem 0 0.6rem 0', color: '#F8FAFC' }}>
          3. Employer Posting Standards & Zero-Fee Candidate Rule
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Employers submitting roles to Remote Jobs HQ represent and warrant that the role is a genuine, currently funded remote position. We strictly forbid listings that charge candidates application fees, training fees, equipment deposits, or promote pyramid/multi-level marketing schemes. Any listing violating these standards is removed immediately without notice.
        </p>

        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '1.75rem 0 0.6rem 0', color: '#F8FAFC' }}>
          4. Intellectual Property
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
          All original career guides, salary calculator tools, compensation tables, and platform design elements on Remote Jobs HQ are the intellectual property of Remote Jobs HQ. Company names and logos displayed on job listings remain the trademarks of their respective owners and are used solely for editorial identification of the hiring organization.
        </p>

        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '1.75rem 0 0.6rem 0', color: '#F8FAFC' }}>
          5. Contact & Dispute Resolution
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Questions regarding these Terms should be directed to{' '}
          <a href="mailto:support@remotejobshq.online" style={{ color: '#38BDF8', fontWeight: 600 }}>
            support@remotejobshq.online
          </a>{' '}
          or submitted via our{' '}
          <Link href="/contact" style={{ color: '#38BDF8', fontWeight: 600 }}>
            Contact Desk
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
