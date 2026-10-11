'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('cookie_consent');
      if (!consent) {
        // Small delay for smooth entry after page load
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage may fail in strict private browsing
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem('cookie_consent', 'accepted');
    } catch {}
    setIsVisible(false);
  };

  const handleDecline = () => {
    try {
      localStorage.setItem('cookie_consent', 'declined');
    } catch {}
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Cookie Consent Banner"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        maxWidth: '480px',
        width: 'calc(100% - 3rem)',
        background: 'rgba(18, 31, 54, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        borderRadius: '1rem',
        padding: '1.25rem 1.5rem',
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.7), 0 0 25px rgba(56, 189, 248, 0.15)',
        zIndex: 99999,
        animation: 'slideUp 0.3s ease-out forwards',
        fontFamily: 'inherit',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
        <span style={{ fontSize: '1.6rem', lineHeight: 1 }} role="img" aria-label="Cookie">
          🍪
        </span>
        <div style={{ flex: 1 }}>
          <h4
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: '#F8FAFC',
              marginBottom: '0.35rem',
            }}
          >
            We Value Your Privacy
          </h4>
          <p
            style={{
              fontSize: '0.85rem',
              color: '#94A3B8',
              lineHeight: '1.5',
              marginBottom: '1rem',
            }}
          >
            We use cookies to personalize job recommendations, deliver ads (Google AdSense), and measure traffic. By clicking &ldquo;Accept All&rdquo;, you consent to our use of cookies in accordance with our{' '}
            <Link
              href="/privacy"
              style={{
                color: '#38BDF8',
                textDecoration: 'underline',
                fontWeight: 600,
              }}
            >
              Privacy Policy
            </Link>
            .
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleAccept}
              style={{
                background: 'linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '9999px',
                padding: '0.5rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'opacity 0.2s ease',
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Accept All
            </button>
            <button
              onClick={handleDecline}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#94A3B8',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '9999px',
                padding: '0.5rem 1.1rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = '#94A3B8';
              }}
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
