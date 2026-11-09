import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import CookieConsent from './components/CookieConsent';

export const metadata: Metadata = {
  metadataBase: new URL('https://remotejobshq.online'),
  title: {
    default: 'Remote Jobs HQ | Verified Remote Jobs, Salary Benchmarks & Career Guides',
    template: '%s | Remote Jobs HQ'
  },
  description: 'Explore verified remote jobs in software engineering, product, design, AI, data, marketing, and operations. Includes global remote salary benchmarks and distributed career guides.',
  keywords: [
    'remote jobs',
    'work from home',
    'remote developer jobs',
    'remote software engineer',
    'remote tech jobs',
    'work from anywhere',
    'remote salary guide',
    'distributed career guides',
    'remote job board'
  ],
  authors: [{ name: 'Remote Jobs HQ Editorial & Talent Team' }],
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
    title: 'Remote Jobs HQ - Verified Work From Anywhere Careers & Salary Guide',
    description: 'Explore curated remote tech, engineering, design, and marketing jobs from vetted companies worldwide, plus in-depth remote career guides.',
    images: [
      {
        url: 'https://remotejobshq.online/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Remote Jobs HQ - Verified Remote Career Platform'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Remote Jobs HQ - Verified Remote Work Opportunities',
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
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                'ad_storage': 'granted',
                'ad_user_data': 'granted',
                'ad_personalization': 'granted',
                'analytics_storage': 'granted',
                'functionality_storage': 'granted',
                'security_storage': 'granted'
              });
            `,
          }}
        />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3004467059794580"
          crossOrigin="anonymous"
        />
        <meta name="google-site-verification" content="f4X0tMifV0LsE0L8VXngAUCPyM6NY8INP4mRO5wr1Fc" />
      </head>
      <body>
        <header className="navbar">
          <div className="container nav-container">
            <Link href="/" className="brand-logo">
              🌐 RemoteJobsHQ
            </Link>
            <nav className="nav-links" aria-label="Primary Navigation">
              <Link href="/all-jobs" className="nav-link">Browse All Jobs</Link>
              <Link href="/salary-guide" className="nav-link">Salary Guide</Link>
              <Link href="/guides" className="nav-link">Career Guides</Link>
              <Link href="/about" className="nav-link">About & Curation</Link>
              <Link href="/post-job" className="btn-primary">Post a Job</Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="footer" style={{ borderTop: '1px solid var(--border-color)', marginTop: '4rem', padding: '3.5rem 0 2rem 0', background: '#070C18' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: '2.5rem', marginBottom: '3rem' }}>
              <div>
                <div className="brand-logo" style={{ marginBottom: '0.75rem' }}>🌐 RemoteJobsHQ</div>
                <p style={{ color: 'var(--text-subtle)', fontSize: '0.85rem', lineHeight: '1.6' }}>
                  An independent remote career publication, compensation research hub, and curated job platform connecting distributed professionals with verified global employers.
                </p>
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <Link href="/all-jobs" style={{ color: '#38BDF8', fontSize: '0.85rem', fontWeight: 700 }}>
                    📂 Complete Jobs Directory →
                  </Link>
                  <Link href="/guides" style={{ color: '#34D399', fontSize: '0.85rem', fontWeight: 700 }}>
                    📘 Remote Career Guides →
                  </Link>
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#F8FAFC', marginBottom: '1rem' }}>Job Categories</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <Link href="/category/development" className="nav-link">Software & Engineering</Link>
                  <Link href="/category/design" className="nav-link">Product & UI/UX Design</Link>
                  <Link href="/category/marketing" className="nav-link">Marketing & Growth</Link>
                  <Link href="/category/sales" className="nav-link">Sales & Partnerships</Link>
                  <Link href="/category/support" className="nav-link">Customer Success & Support</Link>
                  <Link href="/category/data" className="nav-link">Data Science & AI</Link>
                  <Link href="/category/writing" className="nav-link">Editorial & Content</Link>
                  <Link href="/category/finance" className="nav-link">Finance & Operations</Link>
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#F8FAFC', marginBottom: '1rem' }}>In-Demand Roles</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <Link href="/role/software-engineer" className="nav-link">Software Engineer</Link>
                  <Link href="/role/product-manager" className="nav-link">Product Manager</Link>
                  <Link href="/role/data-analyst" className="nav-link">Data Analyst</Link>
                  <Link href="/role/product-designer" className="nav-link">Product Designer</Link>
                  <Link href="/role/devops" className="nav-link">DevOps & Cloud Engineer</Link>
                  <Link href="/role/account-executive" className="nav-link">Account Executive</Link>
                  <Link href="/role/customer-support" className="nav-link">Customer Support</Link>
                  <Link href="/role/executive-assistant" className="nav-link">Executive Assistant</Link>
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#F8FAFC', marginBottom: '1rem' }}>Remote Hiring Hubs</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <Link href="/location/worldwide" className="nav-link">Worldwide (100% Anywhere)</Link>
                  <Link href="/location/united-states" className="nav-link">United States</Link>
                  <Link href="/location/europe" className="nav-link">Europe (EMEA)</Link>
                  <Link href="/location/united-kingdom" className="nav-link">United Kingdom</Link>
                  <Link href="/location/canada" className="nav-link">Canada</Link>
                  <Link href="/location/australia" className="nav-link">Australia & APAC</Link>
                  <Link href="/location/latin-america" className="nav-link">Latin America (LATAM)</Link>
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#F8FAFC', marginBottom: '1rem' }}>Editorial & Trust</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <Link href="/guides" className="nav-link">Remote Career Guides</Link>
                  <Link href="/salary-guide" className="nav-link">Global Salary Calculator</Link>
                  <Link href="/about" className="nav-link">About Us & Editorial Policy</Link>
                  <Link href="/contact" className="nav-link">Contact & Trust Support</Link>
                  <Link href="/post-job" className="nav-link">Employer Job Posting</Link>
                  <Link href="/privacy" className="nav-link">Privacy & Cookie Policy</Link>
                  <Link href="/terms" className="nav-link">Terms of Service</Link>
                </div>
              </div>
            </div>

            <div style={{ paddingTop: '2rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', color: 'var(--text-subtle)', fontSize: '0.8rem' }}>
              <div>
                © {new Date().getFullYear()} RemoteJobsHQ.online. All rights reserved. Independent Remote Career Resource & Verified Job Platform.
              </div>
              <div style={{ display: 'flex', gap: '1.25rem' }}>
                <Link href="/about" className="nav-link" style={{ fontSize: '0.8rem' }}>About</Link>
                <Link href="/guides" className="nav-link" style={{ fontSize: '0.8rem' }}>Guides</Link>
                <Link href="/salary-guide" className="nav-link" style={{ fontSize: '0.8rem' }}>Salaries</Link>
                <Link href="/contact" className="nav-link" style={{ fontSize: '0.8rem' }}>Contact</Link>
                <Link href="/privacy" className="nav-link" style={{ fontSize: '0.8rem' }}>Privacy</Link>
                <Link href="/terms" className="nav-link" style={{ fontSize: '0.8rem' }}>Terms</Link>
              </div>
            </div>
          </div>
        </footer>

        <CookieConsent />
      </body>
    </html>
  );
}
