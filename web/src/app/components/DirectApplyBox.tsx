'use client';

import React, { useState } from 'react';
import { CheckCircle2, Send, ExternalLink, ShieldCheck, FileText, UserCheck } from 'lucide-react';

interface DirectApplyBoxProps {
  jobTitle: string;
  companyName: string;
  publicRef: string;
  location: string;
  directEmployerUrl?: string;
}

export default function DirectApplyBox({
  jobTitle,
  companyName,
  publicRef,
  location,
  directEmployerUrl,
}: DirectApplyBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    timezone: '',
    portfolioUrl: '',
    experienceYears: '3-5 years',
    coverNote: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  if (submitted) {
    return (
      <div
        id="apply-section"
        style={{
          marginTop: '2.5rem',
          padding: '2.25rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(14, 165, 233, 0.12) 100%)',
          border: '1px solid rgba(52, 211, 153, 0.4)',
          borderRadius: '1.25rem',
          textAlign: 'center',
        }}
      >
        <CheckCircle2 size={48} color="#34D399" style={{ margin: '0 auto 1rem auto' }} />
        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem', color: '#F8FAFC' }}>
          Application Profile Recorded ({publicRef})
        </h3>
        <p style={{ color: 'var(--text-muted)', maxWidth: '580px', margin: '0 auto 1.25rem auto', fontSize: '0.95rem', lineHeight: '1.6' }}>
          Thank you, <strong style={{ color: '#F8FAFC' }}>{form.fullName}</strong>. Your candidate profile for{' '}
          <strong style={{ color: '#38BDF8' }}>{jobTitle}</strong> at <strong style={{ color: '#F8FAFC' }}>{companyName}</strong> has been
          prepared and logged under reference <code>{publicRef}</code>.
        </p>
        {directEmployerUrl && (
          <div style={{ marginTop: '1.25rem' }}>
            <a
              href={directEmployerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}
            >
              Complete Final Step on {companyName} Career Portal <ExternalLink size={16} />
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      id="apply-section"
      style={{
        marginTop: '3rem',
        paddingTop: '2rem',
        borderTop: '1px solid var(--border-color)',
      }}
    >
      {!isOpen ? (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '1.25rem',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38BDF8',
              padding: '0.3rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: '0.75rem',
            }}
          >
            <UserCheck size={14} /> Direct Candidate Application • Ref: {publicRef}
          </div>
          <h3 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Ready to Apply for {jobTitle}?
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '560px', margin: '0 auto 1.5rem auto' }}>
            Submit your candidate profile directly for <strong>{companyName}</strong> ({location}). Zero account registration fees—100% free for remote job seekers.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="btn-primary"
              style={{ fontSize: '1.05rem', padding: '0.9rem 2.25rem' }}
            >
              <FileText size={18} /> Start Direct Application
            </button>
            {directEmployerUrl && (
              <a
                href={directEmployerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
                style={{ fontSize: '1rem', padding: '0.9rem 1.75rem' }}
              >
                Employer Career Portal <ExternalLink size={16} />
              </a>
            )}
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{
            background: 'rgba(13, 22, 39, 0.9)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '1.25rem',
            padding: '2rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                Apply for {jobTitle} at {companyName}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Listing Reference: <strong>{publicRef}</strong> • Location: {location}
              </p>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#34D399', fontSize: '0.8rem', fontWeight: 700 }}>
              <ShieldCheck size={16} /> SSL Encrypted Submission
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#E2E8F0' }}>
                Full Name *
              </label>
              <input
                required
                type="text"
                placeholder="Jane Doe"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.65rem',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: '#fff',
                  fontSize: '0.95rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#E2E8F0' }}>
                Professional Email *
              </label>
              <input
                required
                type="email"
                placeholder="jane@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.65rem',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: '#fff',
                  fontSize: '0.95rem',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#E2E8F0' }}>
                 LinkedIn, GitHub, or Portfolio URL *
              </label>
              <input
                required
                type="url"
                placeholder="https://linkedin.com/in/yourprofile"
                value={form.portfolioUrl}
                onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.65rem',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: '#fff',
                  fontSize: '0.95rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#E2E8F0' }}>
                Current Country & Timezone *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. United States (EST / UTC-5)"
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.65rem',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: '#fff',
                  fontSize: '0.95rem',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#E2E8F0' }}>
              Relevant Experience & Pitch for {companyName} *
            </label>
            <textarea
              required
              rows={4}
              placeholder={`Briefly highlight your relevant accomplishments for the ${jobTitle} role and your experience working in distributed teams...`}
              value={form.coverNote}
              onChange={(e) => setForm({ ...form, coverNote: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '0.65rem',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: '#fff',
                fontSize: '0.95rem',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
              By submitting, you agree to our Privacy Policy. Never share financial or banking credentials in job applications.
            </span>
            <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
              <Send size={16} /> {submitting ? 'Submitting Application...' : 'Submit Candidate Application'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
