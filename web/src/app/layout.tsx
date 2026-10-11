import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import CookieConsent from './components/CookieConsent';

export const metadata: Metadata = {
  metadataBase: new URL('https://remotejobshq.online'),
  title: {
    default: 'Remote Jobs HQ | High-Paying Tech & Remote Jobs',
    template: '%s | Remote Jobs HQ'
  },
  description: 'Discover 10,000+ verified remote jobs in tech, design, AI, and marketing. Work from anywhere with top global companies hiring remote talent.',
  keywords: [
    'remote jobs',
    'work from home',
    'remote developer jobs',
    'remote software engineer',
    'remote tech jobs',
    'work from anywhere',
    'remote marketing jobs',
    'remote designer jobs',
    'remote job board'
  ],
  authors: [{ name: 'Remote Jobs HQ Team' }],
  creator: 'Remote Jobs HQ',
  publisher: 'Remote Jobs HQ',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://remotejobshq.online',
    siteName: 'Remote Jobs HQ',
    title: 'Remote Jobs HQ - Verified Work From Anywhere Jobs',
    description: 'Explore curated remote tech, engineering, design, and marketing jobs from vetted companies worldwide.',
    images: [
      {
        url: 'https://remotejobshq.online/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Remote Jobs HQ - The #1 Remote Job Platform'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Remote Jobs HQ - Remote Work Opportunities',
    description: 'Find your next remote career opportunity today with verified global companies.',
    creator: '@remotejobshq'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'f4X0tMifV0LsE0L8VXngAUCPyM6NY8INP4mRO5wr1Fc',
    other: {
      monetag: '3ba7674718137c812899fbff9b92504c',
      'google-adsense-account': 'ca-pub-3004467059794580',
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="google-adsense-account" content="ca-pub-3004467059794580" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3004467059794580"
          crossOrigin="anonymous"
        />
        <meta name="monetag" content="3ba7674718137c812899fbff9b92504c" />
        <script
          src="https://quge5.com/88/tag.min.js"
          data-zone="294143"
          async
          data-cfasync="false"
        />
        <meta name="google-site-verification" content="f4X0tMifV0LsE0L8VXngAUCPyM6NY8INP4mRO5wr1Fc" />
        <link rel="canonical" href="https://remotejobshq.online" />
      </head>
      <body>
        <header className="navbar">
          <div className="container nav-container">
            <Link href="/" className="brand-logo">
              🌐 RemoteJobsHQ
            </Link>
            <nav className="nav-links">
              <Link href="/" className="nav-link">Find Jobs</Link>
              <Link href="/#categories" className="nav-link">Categories</Link>
              <Link href="/post-job" className="btn-primary">Post a Job</Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="footer" style={{ borderTop: '1px solid var(--border-color)', marginTop: '4rem', padding: '3.5rem 0 2rem 0', background: '#070C18' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2.5rem', marginBottom: '3rem' }}>
              <div>
                <div className="brand-logo" style={{ marginBottom: '0.75rem' }}>🌐 RemoteJobsHQ</div>
                <p style={{ color: 'var(--text-subtle)', fontSize: '0.85rem', lineHeight: '1.6' }}>
                  The premier verified global job platform connecting top talent with 1,200+ high-paying remote roles in engineering, product, design, and marketing.
                </p>
                <div style={{ marginTop: '1rem' }}>
                  <Link href="/all-jobs" style={{ color: '#38BDF8', fontSize: '0.85rem', fontWeight: 700 }}>
                    📂 Complete Jobs Directory →
                  </Link>
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#F8FAFC', marginBottom: '1rem' }}>Popular Categories</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <Link href="/category/development" className="nav-link">Software & Tech</Link>
                  <Link href="/category/design" className="nav-link">Design & Creative</Link>
                  <Link href="/category/marketing" className="nav-link">Marketing & Growth</Link>
                  <Link href="/category/sales" className="nav-link">Sales & BD</Link>
                  <Link href="/category/support" className="nav-link">Customer Support</Link>
                  <Link href="/category/data" className="nav-link">Data & AI</Link>
                  <Link href="/category/writing" className="nav-link">Writing & Content</Link>
                  <Link href="/category/finance" className="nav-link">Finance & Payroll</Link>
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#F8FAFC', marginBottom: '1rem' }}>Trending Roles</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <Link href="/role/react" className="nav-link">React Developer</Link>
                  <Link href="/role/python" className="nav-link">Python Engineer</Link>
                  <Link href="/role/fullstack" className="nav-link">Full Stack Engineer</Link>
                  <Link href="/role/devops" className="nav-link">DevOps Engineer</Link>
                  <Link href="/role/product-manager" className="nav-link">Product Manager</Link>
                  <Link href="/role/ui-ux" className="nav-link">UI/UX Designer</Link>
                  <Link href="/role/copywriter" className="nav-link">Copywriter</Link>
                  <Link href="/role/data-analyst" className="nav-link">Data Analyst</Link>
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#F8FAFC', marginBottom: '1rem' }}>Remote Locations</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <Link href="/location/worldwide" className="nav-link">Worldwide (100% Anywhere)</Link>
                  <Link href="/location/united-states" className="nav-link">United States</Link>
                  <Link href="/location/europe" className="nav-link">Europe</Link>
                  <Link href="/location/united-kingdom" className="nav-link">United Kingdom</Link>
                  <Link href="/location/canada" className="nav-link">Canada</Link>
                  <Link href="/location/australia" className="nav-link">Australia</Link>
                  <Link href="/location/latin-america" className="nav-link">Latin America</Link>
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#F8FAFC', marginBottom: '1rem' }}>Platform</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <Link href="/" className="nav-link">Browse Jobs</Link>
                  <Link href="/post-job" className="nav-link">Post a Job</Link>
                  <Link href="/all-jobs" className="nav-link">All Jobs Index</Link>
                  <Link href="/privacy" className="nav-link">Privacy Policy</Link>
                  <Link href="/terms" className="nav-link">Terms of Service</Link>
                  <a href="https://play.google.com/store/apps/details?id=com.xapzap.app" target="_blank" rel="noopener noreferrer" className="nav-link" style={{ color: '#38BDF8' }}>
                    📱 Android App
                  </a>
                </div>
              </div>
            </div>

            <div style={{ paddingTop: '2rem', borderTop: '1px solid var(--border-color)', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.8rem' }}>
              © {new Date().getFullYear()} RemoteJobsHQ.online. All rights reserved. Ultra-optimized for Google Search & Remote Job Seekers.
            </div>
          </div>
        </footer>

        <CookieConsent />
      </body>
    </html>
  );
}
