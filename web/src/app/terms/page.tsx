import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | Remote Jobs HQ',
  description: 'Terms of service and usage guidelines for Remote Jobs HQ.',
};

export default function TermsPage() {
  return (
    <div className="container" style={{ maxWidth: '800px', padding: '3rem 1.5rem 6rem 1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back to home
        </Link>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', padding: '2.5rem', lineHeight: '1.8' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Terms of Service</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Last updated: October 2026</p>

        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '1.5rem 0 0.5rem 0' }}>1. Agreement to Terms</h2>
        <p>By accessing or using Remote Jobs HQ at remotejobshq.online or via our mobile application, you agree to comply with and be bound by these Terms.</p>

        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '1.5rem 0 0.5rem 0' }}>2. Job Listings & Applications</h2>
        <p>Remote Jobs HQ provides an aggregate platform connecting job seekers with remote employers. We are not an employer, recruiter, or party to any employment contract executed between users and companies.</p>

        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '1.5rem 0 0.5rem 0' }}>3. Prohibited Conduct</h2>
        <p>Users and employers may not post fraudulent listings, solicit upfront payments from applicants, scrape content without authorization, or violate any applicable laws.</p>
      </div>
    </div>
  );
}
