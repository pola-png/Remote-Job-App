'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, ShieldCheck, MessageSquare, CheckCircle2, Send, Building } from 'lucide-react';

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    topic: 'Candidate Support',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="container" style={{ maxWidth: '900px', paddingBottom: '5rem' }}>
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
          <MessageSquare size={15} /> Candidate & Employer Support Desk
        </div>

        <h1 style={{ fontSize: '2.35rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Contact Remote Jobs HQ
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.65', marginBottom: '2rem' }}>
          Have a question about a job listing, need assistance posting an opening for your company, or want to report a trust & safety concern? Our team responds to all inquiries within 1 business day.
        </p>

        {/* Direct Department Emails */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2.5rem',
          }}
        >
          <div
            style={{
              background: 'rgba(13, 22, 39, 0.8)',
              border: '1px solid var(--border-color)',
              borderRadius: '1rem',
              padding: '1.35rem',
            }}
          >
            <div style={{ fontWeight: 700, color: '#F8FAFC', marginBottom: '0.3rem' }}>Candidate Support</div>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-subtle)', marginBottom: '0.6rem' }}>
              Questions about listings, career guides, or our mobile app.
            </p>
            <a href="mailto:support@remotejobshq.online" style={{ color: '#38BDF8', fontSize: '0.88rem', fontWeight: 700 }}>
              support@remotejobshq.online
            </a>
          </div>

          <div
            style={{
              background: 'rgba(13, 22, 39, 0.8)',
              border: '1px solid var(--border-color)',
              borderRadius: '1rem',
              padding: '1.35rem',
            }}
          >
            <div style={{ fontWeight: 700, color: '#F8FAFC', marginBottom: '0.3rem' }}>Employers & Hiring</div>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-subtle)', marginBottom: '0.6rem' }}>
              Direct job postings, featured employer slots, and billing.
            </p>
            <a href="mailto:employers@remotejobshq.online" style={{ color: '#34D399', fontSize: '0.88rem', fontWeight: 700 }}>
              employers@remotejobshq.online
            </a>
          </div>

          <div
            style={{
              background: 'rgba(13, 22, 39, 0.8)',
              border: '1px solid var(--border-color)',
              borderRadius: '1rem',
              padding: '1.35rem',
            }}
          >
            <div style={{ fontWeight: 700, color: '#F8FAFC', marginBottom: '0.3rem' }}>Editorial & Privacy</div>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-subtle)', marginBottom: '0.6rem' }}>
              Press inquiries, salary research, and data privacy requests.
            </p>
            <a href="mailto:editorial@remotejobshq.online" style={{ color: '#A855F7', fontSize: '0.88rem', fontWeight: 700 }}>
              editorial@remotejobshq.online
            </a>
          </div>
        </div>

        {/* Interactive Message Form */}
        {sent ? (
          <div
            style={{
              padding: '2.5rem',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(52, 211, 153, 0.35)',
              borderRadius: '1.25rem',
              textAlign: 'center',
            }}
          >
            <CheckCircle2 size={48} color="#34D399" style={{ margin: '0 auto 1rem auto' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Message Received</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto' }}>
              Thank you for contacting Remote Jobs HQ, <strong>{form.name}</strong>. Our support team will reply to{' '}
              <strong>{form.email}</strong> shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Send Us a Direct Message</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Your Name *
                </label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Alex Morgan"
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    borderRadius: '0.75rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Email Address *
                </label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="alex@example.com"
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    borderRadius: '0.75rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Inquiry Topic
              </label>
              <select
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  borderRadius: '0.75rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                }}
              >
                <option value="Candidate Support">Candidate Support / Listing Inquiry</option>
                <option value="Employer Posting">Employer Job Posting / Featured Partnership</option>
                <option value="Report Listing">Trust & Safety: Report a Job Listing</option>
                <option value="Editorial / Press">Editorial, Salary Research & Press</option>
                <option value="Privacy Request">Privacy & Data Request</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Message *
              </label>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Please include any relevant job reference ID (e.g. RJHQ-XXXXXX) or details..."
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  borderRadius: '0.75rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', padding: '0.85rem 2rem' }}>
              <Send size={16} /> Send Message
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
