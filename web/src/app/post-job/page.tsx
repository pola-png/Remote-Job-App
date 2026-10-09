'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, CheckCircle2, Sparkles, Building, Briefcase, DollarSign, Globe, Mail } from 'lucide-react';

export default function PostJobPage() {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    company_logo: '',
    location: '100% Remote / Worldwide',
    job_type: 'Full-time',
    category: 'Engineering',
    salary: '$80k - $120k / yr',
    apply_url: '',
    description: '',
    requirements: '',
    employer_email: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const slug = `${formData.company.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;

      const { data, error } = await supabase.from('remote_jobs').insert([
        {
          title: formData.title,
          company: formData.company,
          company_logo: formData.company_logo || null,
          location: formData.location,
          job_type: formData.job_type,
          category: formData.category,
          salary: formData.salary,
          apply_url: formData.apply_url,
          description: formData.description,
          requirements: formData.requirements,
          slug: slug,
          is_active: true,
          is_featured: true,
        },
      ]);

      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit job. Please check fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px', paddingBottom: '6rem' }}>
      <div style={{ margin: '2rem 0 1.5rem 0' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back to job board
        </Link>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '1.5rem', padding: '2.5rem' }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div className="hero-badge">
            <Sparkles size={14} /> Reach 250,000+ Remote Job Seekers
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Post a Remote Job</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Your job listing will be distributed instantly across our web platform, Google for Jobs, and push-notified to our Android mobile app users.
          </p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <CheckCircle2 size={64} color="#34D399" style={{ margin: '0 auto 1.5rem auto' }} />
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>Job Successfully Published!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Your remote job is now live on Remote Jobs HQ and syncs across web and mobile.
            </p>
            <Link href="/" className="btn-primary">
              View on Live Job Feed
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {errorMsg && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', color: '#FCA5A5', padding: '1rem', borderRadius: '0.75rem', fontSize: '0.9rem' }}>
                {errorMsg}
              </div>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Job Title *</label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Senior Full Stack Engineer (React/Node)"
                style={{ width: '100%', padding: '0.85rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', color: '#fff' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Company Name *</label>
                <input
                  required
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="e.g. Acme Corp"
                  style={{ width: '100%', padding: '0.85rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', color: '#fff' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Company Logo URL</label>
                <input
                  type="url"
                  value={formData.company_logo}
                  onChange={(e) => setFormData({ ...formData, company_logo: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  style={{ width: '100%', padding: '0.85rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', color: '#fff' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Location / Timezone</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. 100% Remote (US/EU/Global)"
                  style={{ width: '100%', padding: '0.85rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', color: '#fff' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Salary / Compensation</label>
                <input
                  type="text"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="e.g. $100,000 - $140,000 USD / year"
                  style={{ width: '100%', padding: '0.85rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', color: '#fff' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Application URL or Email *</label>
              <input
                required
                type="text"
                value={formData.apply_url}
                onChange={(e) => setFormData({ ...formData, apply_url: e.target.value })}
                placeholder="https://company.greenhouse.io/... or mailto:jobs@company.com"
                style={{ width: '100%', padding: '0.85rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', color: '#fff' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Job Description *</label>
              <textarea
                required
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the role, responsibilities, culture, and benefits..."
                style={{ width: '100%', padding: '0.85rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', color: '#fff', fontFamily: 'inherit' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ padding: '1rem', justifyContent: 'center', fontSize: '1.05rem', marginTop: '1rem' }}
            >
              {loading ? 'Publishing Job Listing...' : 'Publish Job Listing Instantly 🚀'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
