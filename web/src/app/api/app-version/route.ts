import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    {
      platform: 'android',
      packageName: 'com.xapzap.app',
      latestVersionCode: 70,
      latestVersionName: '30.0.25',
      minRequiredVersionCode: 63,
      forceUpdate: false,
      releaseNotes: 'Performance improvements, ultra-fast job search, and full support for latest Android 16 & 16 KB memory page size.',
      playStoreUrl: 'https://play.google.com/store/apps/details?id=com.xapzap.app',
      marketUrl: 'market://details?id=com.xapzap.app',
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
