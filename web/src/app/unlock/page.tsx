import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { ShieldCheck, ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Verified Career Access | Remote Jobs HQ',
  robots: {
    index: false,
    follow: false,
  },
};

export default function UnlockPage() {
  return (
    <div className="container" style={{ padding: '4rem 1rem 5rem 1rem', maxWidth: '640px', margin: '0 auto' }}>
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
          <ArrowLeft size={16} /> Back to Remote Jobs HQ
        </Link>
      </div>

      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '1.5rem',
          padding: '2.5rem',
          textAlign: 'center',
        }}
      >
        <ShieldCheck size={48} color="#38BDF8" style={{ margin: '0 auto 1rem auto' }} />
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '0.75rem' }}>
          Full Access to All Verified Remote Jobs
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
          All remote career listings, salary calculators, and editorial guides on Remote Jobs HQ are 100% open and free to browse.
        </p>
        <Link href="/all-jobs" className="btn-primary" style={{ padding: '0.9rem 2rem', fontSize: '1rem' }}>
          Browse All Remote Jobs <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
