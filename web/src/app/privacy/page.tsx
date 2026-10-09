import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | Remote Jobs HQ',
  description: 'Privacy policy and data protection terms for Remote Jobs HQ.',
};

export default function PrivacyPage() {
  return (
    <div className="container" style={{ maxWidth: '800px', padding: '3rem 1.5rem 6rem 1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back to home
        </Link>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', padding: '2.5rem', lineHeight: '1.8' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Privacy Policy</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Last updated: October 2026</p>

        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '1.5rem 0 0.5rem 0' }}>1. Overview</h2>
        <p>Remote Jobs HQ (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates remotejobshq.online and the Remote Jobs mobile application. We are committed to protecting your privacy and ensuring transparency regarding any data collected.</p>

        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '1.5rem 0 0.5rem 0' }}>2. Information We Collect</h2>
        <p>We do not require job seekers to create an account or provide sensitive personal data to search and view remote job listings. When employers submit job postings, we collect business contact information solely for verification and job administration.</p>

        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '1.5rem 0 0.5rem 0' }}>3. Analytics & Cookies</h2>
        <p>We use standard performance and anonymous usage metrics to improve search performance and site speed. We do not sell user data to third parties.</p>

        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '1.5rem 0 0.5rem 0' }}>4. Contact Us</h2>
        <p>If you have any questions regarding this Privacy Policy, contact support at: <a href="mailto:support@remotejobshq.online" style={{ color: '#38BDF8' }}>support@remotejobshq.online</a></p>
      </div>
    </div>
  );
}
