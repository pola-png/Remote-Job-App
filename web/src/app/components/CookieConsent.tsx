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
        className="cookie-floating-trigger"
      >
        🍪 Privacy
      </button>
    ) : null;
  }

  return (
    <aside
      role="dialog"
      aria-label="Cookie and Cache Consent Banner"
      className="cookie-banner"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.15rem', lineHeight: 1 }} role="img" aria-label="Cookie">
            🍪
          </span>
          <h4
            style={{
              fontSize: '0.95rem',
              fontWeight: 800,
              color: '#F8FAFC',
              margin: 0,
            }}
          >
            Cookie &amp; Privacy Preferences
          </h4>
        </div>
        <button
          type="button"
          onClick={handleAcceptAll}
          aria-label="Close cookie banner"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#94A3B8',
            borderRadius: '50%',
            width: '26px',
            height: '26px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>

      <p
        style={{
          fontSize: '0.8rem',
          color: '#94A3B8',
          lineHeight: '1.48',
          marginBottom: '0.85rem',
        }}
      >
        We use cookies &amp; cache to speed up job search, analyze traffic, and serve relevant ads. See our{' '}
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

      {showDetails && (
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.75rem',
            padding: '0.75rem',
            marginBottom: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.55rem',
            fontSize: '0.78rem',
          }}
        >
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', color: '#E2E8F0' }}>
            <span>
              <strong>Essential &amp; Cache</strong> (Required)
            </span>
            <input type="checkbox" checked disabled />
          </label>

          <label
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#E2E8F0',
              cursor: 'pointer',
            }}
          >
            <span>
              <strong>Analytics Storage</strong> (Site performance)
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
              gap: '0.5rem',
              color: '#E2E8F0',
              cursor: 'pointer',
            }}
          >
            <span>
              <strong>Personalized Ads</strong> (Google AdSense)
            </span>
            <input
              type="checkbox"
              checked={prefs.advertising}
              onChange={(e) => setPrefs({ ...prefs, advertising: e.target.checked })}
            />
          </label>
        </div>
      )}

      <div className="cookie-actions">
        <button
          type="button"
          onClick={handleAcceptAll}
          className="cookie-btn-accept"
        >
          Accept All
        </button>

        <button
          type="button"
          onClick={handleRejectAll}
          className="cookie-btn-reject"
        >
          Essential Only
        </button>

        {!showDetails ? (
          <button
            type="button"
            onClick={() => setShowDetails(true)}
            className="cookie-customize-btn"
            style={{
              background: 'transparent',
              color: '#38BDF8',
              border: 'none',
              padding: '0.4rem 0.5rem',
              fontSize: '0.78rem',
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
            className="cookie-btn-save cookie-customize-btn"
          >
            Save Preferences
          </button>
        )}
      </div>
    </aside>
  );
}
