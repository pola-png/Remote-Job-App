import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  metadataBase: new URL('https://remotejobshq.online'),
  title: {
    default: 'Remote Jobs HQ | Find High-Paying Remote Tech, Design & Marketing Jobs',
    template: '%s | Remote Jobs HQ'
  },
  description: 'Discover 10,000+ verified remote jobs in Software Engineering, Product, Design, AI, Marketing and Customer Support. Work from anywhere with top global companies.',
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://remotejobshq.online',
    siteName: 'Remote Jobs HQ',
    title: 'Remote Jobs HQ - Find Verified Work From Anywhere Jobs',
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
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
              <Link href="/post-job" className="btn-primary">Post a Job ($99)</Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="footer">
          <div className="container footer-content">
            <div>
              <div className="brand-logo" style={{ marginBottom: '0.5rem' }}>🌐 RemoteJobsHQ</div>
              <p style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>
                Connecting top talent with the best remote companies globally.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <Link href="/" className="nav-link">Browse Jobs</Link>
              <Link href="/post-job" className="nav-link">Post a Job</Link>
              <Link href="/privacy" className="nav-link">Privacy Policy</Link>
              <Link href="/terms" className="nav-link">Terms of Service</Link>
            </div>
          </div>
          <div className="container" style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.8rem' }}>
            © {new Date().getFullYear()} RemoteJobsHQ.online. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}
