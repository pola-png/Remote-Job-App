import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy & Cookie Disclosures | Remote Jobs HQ',
  description:
    'Comprehensive privacy policy, cookie disclosures, Google AdSense advertising terms, and GDPR/CCPA user rights for Remote Jobs HQ.',
  alternates: {
    canonical: 'https://remotejobshq.online/privacy',
  },
};

export default function PrivacyPage() {
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
          <ShieldCheck size={16} /> Data Protection & Advertising Compliance
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Privacy & Cookie Policy</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Effective Date: January 15, 2025 • Last Reviewed: February 28, 2025
        </p>

        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '1.75rem 0 0.6rem 0', color: '#F8FAFC' }}>
          1. Overview & Scope
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Remote Jobs HQ (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) operates the website{' '}
          <code>https://remotejobshq.online</code> and the official Remote Jobs HQ mobile application. We respect your privacy and are committed to transparent data practices in compliance with the General Data Protection Regulation (GDPR), the California Consumer Privacy Act (CCPA), and global privacy standards.
        </p>

        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '1.75rem 0 0.6rem 0', color: '#F8FAFC' }}>
          2. Information We Collect
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          Job seekers can browse job listings, read our career guides, and use our salary calculator without creating a mandatory user account. We collect information only in the following contexts:
        </p>
        <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          <li>
            <strong>Voluntary Candidate Submissions:</strong> When you submit a candidate application profile or contact form on our platform, we process the name, email address, portfolio links, and professional notes you provide solely to facilitate your request.
          </li>
          <li>
            <strong>Employer Job Postings:</strong> When employers submit job openings, we collect corporate details, billing/verification contacts, and role descriptions.
          </li>
          <li>
            <strong>Log Data & Device Diagnostics:</strong> Standard non-identifying HTTP request metadata (browser type, referring page, operating system, and anonymized IP region) used to maintain platform security and prevent automated abuse.
          </li>
        </ul>

        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '1.75rem 0 0.6rem 0', color: '#F8FAFC' }}>
          3. Google AdSense & Third-Party Advertising Cookies
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          We partner with Google AdSense to display relevant advertisements that support our free editorial research and career tools. In accordance with Google Publisher Policies, please note:
        </p>
        <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          <li>
            Third-party vendors, including Google, use cookies (such as the DoubleClick DART cookie) to serve ads based on a user&apos;s prior visits to <code>remotejobshq.online</code> or other websites on the internet.
          </li>
          <li>
            Google&apos;s use of advertising cookies enables it and its partners to serve advertisements to our visitors based on their visit to our site and/or other sites on the Internet.
          </li>
          <li>
            Users may opt out of personalized advertising at any time by visiting{' '}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#38BDF8', textDecoration: 'underline' }}
            >
              Google Ads Settings
            </a>
            . Alternatively, you can opt out of a third-party vendor&apos;s use of cookies for personalized advertising by visiting{' '}
            <a
              href="https://www.aboutads.info/choices/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#38BDF8', textDecoration: 'underline' }}
            >
              www.aboutads.info
            </a>
            .
          </li>
        </ul>

        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '1.75rem 0 0.6rem 0', color: '#F8FAFC' }}>
          4. Cookie Management & Consent
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
          When you first visit Remote Jobs HQ, our cookie consent banner allows you to accept or decline non-essential cookies. You can also configure your web browser to block or delete cookies at any time through your browser settings.
        </p>

        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '1.75rem 0 0.6rem 0', color: '#F8FAFC' }}>
          5. Your GDPR & CCPA Privacy Rights
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Depending on your jurisdiction, you have the right to request access to personal data we hold about you, request correction or erasure of your data, object to processing, and opt out of the sale or sharing of personal information. Remote Jobs HQ does not sell personal contact lists to third-party data brokers.
        </p>

        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '1.75rem 0 0.6rem 0', color: '#F8FAFC' }}>
          6. Contact Our Privacy Officer
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          For any privacy-related questions or data deletion requests, please contact our team at{' '}
          <a href="mailto:support@remotejobshq.online" style={{ color: '#38BDF8', fontWeight: 600 }}>
            support@remotejobshq.online
          </a>{' '}
          or via our{' '}
          <Link href="/contact" style={{ color: '#38BDF8', fontWeight: 600 }}>
            Contact Page
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
