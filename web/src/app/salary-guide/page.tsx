'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, DollarSign, Calculator, Globe, Briefcase, ArrowRight, CheckCircle2 } from 'lucide-react';

interface RoleBenchmark {
  id: string;
  label: string;
  categorySlug: string;
  baseMid: number;
  baseMax: number;
}

const ROLES: RoleBenchmark[] = [
  { id: 'swe', label: 'Software Engineer (Full Stack / Backend / Frontend)', categorySlug: 'development', baseMid: 115000, baseMax: 165000 },
  { id: 'devops', label: 'DevOps / Cloud / Site Reliability Engineer', categorySlug: 'development', baseMid: 125000, baseMax: 180000 },
  { id: 'ai', label: 'Data Scientist / AI & Machine Learning Engineer', categorySlug: 'data', baseMid: 130000, baseMax: 190000 },
  { id: 'data-analyst', label: 'Data Analyst / Business Intelligence Analyst', categorySlug: 'data', baseMid: 90000, baseMax: 135000 },
  { id: 'pm', label: 'Product Manager / Technical Program Manager', categorySlug: 'development', baseMid: 115000, baseMax: 165000 },
  { id: 'design', label: 'Product Designer / Senior UI/UX Designer', categorySlug: 'design', baseMid: 95000, baseMax: 145000 },
  { id: 'marketing', label: 'Growth & Digital Marketing Manager', categorySlug: 'marketing', baseMid: 82000, baseMax: 130000 },
  { id: 'sales', label: 'Account Executive / Enterprise Sales (OTE)', categorySlug: 'sales', baseMid: 95000, baseMax: 160000 },
  { id: 'support', label: 'Customer Success Manager / Technical Support', categorySlug: 'support', baseMid: 62000, baseMax: 98000 },
  { id: 'writing', label: 'Technical Writer / Content & Editorial Strategist', categorySlug: 'writing', baseMid: 68000, baseMax: 110000 },
  { id: 'finance', label: 'Financial Analyst (FP&A) / Remote Accountant', categorySlug: 'finance', baseMid: 82000, baseMax: 135000 },
  { id: 'ops', label: 'Executive Assistant / Business Operations Lead', categorySlug: 'assistant', baseMid: 64000, baseMax: 105000 },
];

const SENIORITY_MULTIPLIERS: Record<string, { label: string; factor: number }> = {
  junior: { label: 'Entry / Junior (0–2 yrs)', factor: 0.75 },
  mid: { label: 'Mid-Level (3–5 yrs)', factor: 1.0 },
  senior: { label: 'Senior (5–8 yrs)', factor: 1.28 },
  staff: { label: 'Staff / Principal / Lead (8+ yrs)', factor: 1.52 },
};

const REGION_MULTIPLIERS: Record<string, { label: string; factor: number; note: string }> = {
  global_flat: {
    label: 'Location-Agnostic Global Band (US Benchmark)',
    factor: 1.0,
    note: 'Used by remote-first startups paying uniform global bands regardless of residence.',
  },
  north_america: {
    label: 'United States & Canada',
    factor: 1.05,
    note: 'Direct W-2 / Canadian payroll or top-tier North American remote benchmark.',
  },
  western_europe: {
    label: 'UK, Western Europe & Nordics',
    factor: 0.9,
    note: 'Typically hired via Employer of Record (EOR) with statutory European holiday & healthcare benefits.',
  },
  apac_australia: {
    label: 'Australia, New Zealand & Singapore',
    factor: 0.92,
    note: 'Competitive APAC time-zone hub compensation.',
  },
  latam_eastern_eu: {
    label: 'Latin America, Central/Eastern Europe & Global',
    factor: 0.76,
    note: 'Most commonly structured as USD/EUR B2B independent contractor agreements with low tax overhead.',
  },
};

export default function SalaryGuidePage() {
  const [selectedRoleId, setSelectedRoleId] = useState<string>('swe');
  const [seniority, setSeniority] = useState<string>('senior');
  const [region, setRegion] = useState<string>('global_flat');

  const role = ROLES.find((r) => r.id === selectedRoleId) || ROLES[0];
  const senObj = SENIORITY_MULTIPLIERS[seniority] || SENIORITY_MULTIPLIERS.mid;
  const regObj = REGION_MULTIPLIERS[region] || REGION_MULTIPLIERS.global_flat;

  const minAnnual = Math.round((role.baseMid * senObj.factor * regObj.factor) / 1000) * 1000;
  const maxAnnual = Math.round((role.baseMax * senObj.factor * regObj.factor) / 1000) * 1000;
  const medianAnnual = Math.round((minAnnual + maxAnnual) / 2 / 1000) * 1000;

  // Contractor hourly equivalent (assuming 1,920 billable hours/yr + 22% contractor self-employment buffer)
  const hourlyMin = Math.round((minAnnual * 1.22) / 1920);
  const hourlyMax = Math.round((maxAnnual * 1.22) / 1920);

  return (
    <div className="container" style={{ paddingBottom: '5rem' }}>
      <div style={{ margin: '2rem 0 1rem 0' }}>
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

      {/* Header */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '1.25rem',
          padding: '2.5rem',
          marginBottom: '2.5rem',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(16, 185, 129, 0.14)',
            color: '#34D399',
            padding: '0.3rem 0.85rem',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '0.85rem',
          }}
        >
          <Calculator size={15} /> Interactive Compensation Tool & Market Research
        </div>
        <h1 style={{ fontSize: '2.35rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Global Remote Salary Calculator & Compensation Guide
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.08rem', maxWidth: '780px', lineHeight: '1.65' }}>
          Calculate realistic annual base pay and independent contractor hourly rates across 12 core remote career tracks. Benchmarks are derived from verified salary disclosures across active distributed employers.
        </p>
      </div>

      {/* Interactive Calculator */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          marginBottom: '3.5rem',
        }}
      >
        {/* Controls */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '1.25rem',
            padding: '2rem',
          }}
        >
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.5rem' }}>
            1. Configure Role Parameters
          </h2>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.5rem', color: '#E2E8F0' }}>
              Select Remote Discipline / Role
            </label>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '0.75rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: '#fff',
                fontSize: '0.95rem',
              }}
            >
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.5rem', color: '#E2E8F0' }}>
              Seniority & Experience Level
            </label>
            <select
              value={seniority}
              onChange={(e) => setSeniority(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '0.75rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: '#fff',
                fontSize: '0.95rem',
              }}
            >
              {Object.entries(SENIORITY_MULTIPLIERS).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.5rem', color: '#E2E8F0' }}>
              Compensation Model / Hiring Region
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '0.75rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: '#fff',
                fontSize: '0.95rem',
              }}
            >
              {Object.entries(REGION_MULTIPLIERS).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
            <p style={{ color: 'var(--text-subtle)', fontSize: '0.82rem', marginTop: '0.5rem' }}>{regObj.note}</p>
          </div>
        </div>

        {/* Output Card */}
        <div
          style={{
            background: 'linear-gradient(145deg, #121F36 0%, #0D1627 100%)',
            border: '1.5px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '1.25rem',
            padding: '2.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ color: '#38BDF8', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              ESTIMATED GLOBAL COMPENSATION BAND
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '1.25rem' }}>
              {role.label}
            </h3>

            <div
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                borderRadius: '1rem',
                padding: '1.35rem',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Annual Full-Time Base Salary Range (USD)
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#34D399' }}>
                ${minAnnual.toLocaleString()} – ${maxAnnual.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#E2E8F0', marginTop: '0.3rem' }}>
                Target Median: <strong>${medianAnnual.toLocaleString()} / year</strong> ($
                {Math.round(medianAnnual / 12).toLocaleString()} / month)
              </div>
            </div>

            <div
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '1rem',
                padding: '1.15rem 1.35rem',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                Equivalent Independent B2B Contractor Rate
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#38BDF8' }}>
                ${hourlyMin} – ${hourlyMax} USD / hour
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginTop: '0.2rem' }}>
                Includes 22% buffer for self-funded healthcare, holidays, and local tax compliance.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href={`/category/${role.categorySlug}`} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
              Browse Matching Open Jobs <ArrowRight size={16} />
            </Link>
            <Link
              href="/guides/remote-salary-negotiation-and-global-compensation-guide"
              className="btn-secondary"
              style={{ justifyContent: 'center' }}
            >
              Negotiation Guide
            </Link>
          </div>
        </div>
      </div>

      {/* Methodology & Editorial Notes */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '1.25rem',
          padding: '2.25rem',
        }}
      >
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>
          How We Calculate Remote Compensation Benchmarks
        </h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: '1.75', marginBottom: '1rem', fontSize: '0.96rem' }}>
          Our compensation research team analyzes thousands of active remote job postings every month across North American, European, and fully distributed companies. We normalize disclosed salary ranges into USD annual equivalents and cross-reference contractor day rates against full-time Employer of Record (EOR) packages.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem', marginTop: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#38BDF8', marginBottom: '0.4rem' }}>
              Base Salary vs. Total Compensation
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.6' }}>
              Numbers shown reflect cash base salary (or OTE for commission-based sales roles) and exclude early-stage startup equity or public RSUs, which typically add 10%–35% to senior technical packages.
            </p>
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#34D399', marginBottom: '0.4rem' }}>
              Contractor vs. Full-Time EOR
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.6' }}>
              When comparing a gross B2B contractor rate to a salaried EOR offer, always account for statutory paid leave, employer payroll tax contributions, and private health insurance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
