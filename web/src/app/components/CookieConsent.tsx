'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

type ConsentChoice = 'accepted' | 'rejected' | 'custom';

interface ConsentPreferences {
  essential: boolean;
  analytics: boolean;
  advertising: boolean;
}

function applyGoogleConsentMode(prefs: ConsentPreferences) {
  if (typeof window === 'undefined') return;
  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  function gtag(...args: any[]) {
    w.dataLayer.push(args);
  }

  gtag('consent', 'update', {
    ad_storage: prefs.advertising ? 'granted' : 'denied',
    ad_user_data: prefs.advertising ? 'granted' : 'denied',
    ad_personalization: prefs.advertising ? 'granted' : 'denied',
    analytics_storage: prefs.analytics ? 'granted' : 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
  });

  w.adsbygoogle = w.adsbygoogle || [];
  w.adsbygoogle.requestNonPersonalizedAds = prefs.advertising ? 0 : 1;
}

function saveConsentState(choice: ConsentChoice, prefs: ConsentPreferences) {
  try {
    localStorage.setItem('cookie_consent', choice);
    localStorage.setItem('cookie_consent_prefs', JSON.stringify(prefs));
    document.cookie = `rjhq_cookie_consent=${choice}; max-age=31536000; path=/; SameSite=Lax`;
  } catch {
    // Ignore storage errors in strict private browsing
  }
  applyGoogleConsentMode(prefs);
}

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [hasSavedChoice, setHasSavedChoice] = useState(false);
  const [prefs, setPrefs] = useState<ConsentPreferences>({
    essential: true,
    analytics: true,
    advertising: true,
  });

  useEffect(() => {
    try {
      const savedChoice = localStorage.getItem('cookie_consent') as ConsentChoice | null;
      const savedPrefsRaw = localStorage.getItem('cookie_consent_prefs');
      if (savedChoice) {
        setHasSavedChoice(true);
        const parsedPrefs: ConsentPreferences = savedPrefsRaw
          ? JSON.parse(savedPrefsRaw)
          : {
              essential: true,
              analytics: savedChoice === 'accepted',
              advertising: savedChoice === 'accepted',
            };
        setPrefs(parsedPrefs);
        applyGoogleConsentMode(parsedPrefs);
      } else {
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    } catch {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const nextPrefs = { essential: true, analytics: true, advertising: true };
    setPrefs(nextPrefs);
    saveConsentState('accepted', nextPrefs);
    setHasSavedChoice(true);
    setIsVisible(false);
    setShowDetails(false);
  };

  const handleRejectAll = () => {
    const nextPrefs = { essential: true, analytics: false, advertising: false };
    setPrefs(nextPrefs);
    saveConsentState('rejected', nextPrefs);
    setHasSavedChoice(true);
    setIsVisible(false);
    setShowDetails(false);
  };

  const handleSaveCustom = () => {
    saveConsentState('custom', prefs);
    setHasSavedChoice(true);
    setIsVisible(false);
    setShowDetails(false);
  };

  if (!isVisible) {
    return hasSavedChoice ? (
      <button
        type="button"
        onClick={() => setIsVisible(true)}
        aria-label="Manage Cookie and Cache Preferences"
        title="Cookie & Privacy Preferences"
        style={{
          position: 'fixed',
          bottom: '1rem',
          left: '1rem',
          zIndex: 9990,
          background: 'rgba(18, 31, 54, 0.9)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-muted)',
          borderRadius: '9999px',
          padding: '0.4rem 0.85rem',
          fontSize: '0.75rem',
          fontWeight: 600,
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
        }}
      >
        🍪 Cookie Settings
      </button>
    ) : null;
  }

  return (
    <aside
      role="dialog"
      aria-label="Cookie and Cache Consent Banner"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        maxWidth: '520px',
        width: 'calc(100% - 3rem)',
        background: 'rgba(13, 22, 39, 0.98)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(56, 189, 248, 0.4)',
        borderRadius: '1.15rem',
        padding: '1.4rem 1.6rem',
        boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.8), 0 0 25px rgba(56, 189, 248, 0.15)',
        zIndex: 99999,
        animation: 'slideUp 0.3s ease-out forwards',
        fontFamily: 'inherit',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.9rem' }}>
        <span style={{ fontSize: '1.6rem', lineHeight: 1 }} role="img" aria-label="Cookie">
          🍪
        </span>
        <div style={{ flex: 1 }}>
          <h4
            style={{
              fontSize: '1.05rem',
              fontWeight: 800,
              color: '#F8FAFC',
              marginBottom: '0.35rem',
            }}
          >
            Cookie, Cache & Advertising Preferences
          </h4>
          <p
            style={{
              fontSize: '0.84rem',
              color: '#94A3B8',
              lineHeight: '1.55',
              marginBottom: '1rem',
            }}
          >
            We use browser cache and cookies to speed up job search, analyze traffic, and serve personalized or non-personalized ads via Google AdSense. You can accept all cookies, reject non-essential cookies, or customize your preferences at any time. Read our{' '}
            <Link
              href="/privacy"
              style={{
                color: '#38BDF8',
                textDecoration: 'underline',
                fontWeight: 600,
              }}
            >
              Privacy & Cookie Policy
            </Link>
            .
          </p>

          {showDetails && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.75rem',
                padding: '0.9rem',
                marginBottom: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
                fontSize: '0.82rem',
              }}
            >
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#E2E8F0' }}>
                <span>
                  <strong>Essential & Cache Storage</strong> (Required for site navigation)
                </span>
                <input type="checkbox" checked disabled />
              </label>

              <label
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  color: '#E2E8F0',
                  cursor: 'pointer',
                }}
              >
                <span>
                  <strong>Analytics Storage</strong> (Anonymous performance metrics)
                </span>
                <input
                  type="checkbox"
                  checked={prefs.analytics}
                  onChange={(e) => setPrefs({ ...prefs, analytics: e.target.checked })}
                />
              </label>

              <label
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  color: '#E2E8F0',
                  cursor: 'pointer',
                }}
              >
                <span>
                  <strong>Google AdSense & Personalized Ads</strong> (Ad storage & personalization)
                </span>
                <input
                  type="checkbox"
                  checked={prefs.advertising}
                  onChange={(e) => setPrefs({ ...prefs, advertising: e.target.checked })}
                />
              </label>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleAcceptAll}
              style={{
                background: 'linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '9999px',
                padding: '0.5rem 1.15rem',
                fontSize: '0.83rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Accept All
            </button>

            <button
              type="button"
              onClick={handleRejectAll}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#E2E8F0',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                borderRadius: '9999px',
                padding: '0.5rem 1.05rem',
                fontSize: '0.83rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reject Non-Essential
            </button>

            {!showDetails ? (
              <button
                type="button"
                onClick={() => setShowDetails(true)}
                style={{
                  background: 'transparent',
                  color: '#38BDF8',
                  border: 'none',
                  padding: '0.45rem 0.6rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Customize
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveCustom}
                style={{
                  background: 'rgba(16, 185, 129, 0.18)',
                  color: '#34D399',
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                  borderRadius: '9999px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.83rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Save Preferences
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
