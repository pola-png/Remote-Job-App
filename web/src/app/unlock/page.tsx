import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Award, Zap, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface Props {
  searchParams?: { subid?: string };
}

export const dynamic = 'force-dynamic';

export default function UnlockPage({ searchParams }: Props) {
  const subid = searchParams?.subid || 'guest_user';

  return (
    <div className="container" style={{ padding: '3rem 1rem 5rem 1rem', maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back to Remote Jobs HQ
        </Link>
      </div>

      <div style={{
        background: 'linear-gradient(145deg, #131B2E 0%, #0B1120 100%)',
        border: '1.5px solid #F59E0B',
        borderRadius: '1.5rem',
        padding: '2.5rem',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(245, 158, 11, 0.15)',
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'rgba(245, 158, 11, 0.15)',
          border: '1px solid #F59E0B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem auto',
        }}>
          <Award size={34} color="#FBBF24" />
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          backgroundColor: 'rgba(245, 158, 11, 0.15)',
          padding: '0.35rem 0.9rem',
          borderRadius: '999px',
          marginBottom: '1rem',
          border: '1px solid rgba(245, 158, 11, 0.4)',
        }}>
          <Zap size={14} color="#FBBF24" />
          <span style={{ color: '#FDE68A', fontSize: '0.85rem', fontWeight: 800 }}>VIP HIGHEST PAYING OFFER</span>
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '0.75rem', lineHeight: '1.25' }}>
          Unlock Maximum Payout Bonus
        </h1>

        <p style={{ color: '#94A3B8', fontSize: '1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
          Complete one quick verified sponsor offer from our partners to instantly unlock your maximum reward bonus of <strong style={{ color: '#34D399' }}>$2.50 (250 Points)</strong>.
        </p>

        {/* Locked Action Link */}
        <div style={{ marginBottom: '2rem' }}>
          <a
            href="https://remotejobshq.online/?unlocked=true"
            data-interact-trigger
            data-tool-id="67493"
            data-tool-slug="suMfPdJ"
            data-title-mode="dynamic"
            data-subid={subid}
            className="btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              width: '100%',
              maxWidth: '380px',
              padding: '1.1rem 2rem',
              fontSize: '1.15rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: '#0F172A',
              border: 'none',
              borderRadius: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 10px 25px rgba(245, 158, 11, 0.35)',
            }}
          >
            🔥 Tap to Complete & Unlock ($2.50)
          </a>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', borderTop: '1px solid #1E293B', paddingTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94A3B8', fontSize: '0.85rem' }}>
            <CheckCircle2 size={16} color="#34D399" /> Instant Point Credit
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94A3B8', fontSize: '0.85rem' }}>
            <ShieldCheck size={16} color="#38BDF8" /> 100% Free Verification
          </div>
        </div>
      </div>
    </div>
  );
}
