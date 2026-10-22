/**
 * InMobi Production Ad Configuration
 * Designated ad network for Tier 3 country monetization (India, Nigeria, Pakistan, etc.)
 * Real production InMobi Account ID and Placement IDs
 */

export const INMOBI_CONFIG = {
  // InMobi Publisher Account ID (from InMobi Dashboard -> Settings -> API Key / Publisher payment ID)
  ACCOUNT_ID: 'e72372e29e4b41a5a68bc2513221d560',
  APP_KEY: 'e72372e29e4b41a5a68bc2513221d560',

  // InMobi App / Property ID and Package
  APP_ID: '10000244202',
  PACKAGE_NAME: 'com.xapzap.app',

  // InMobi Placement IDs for each format
  PLACEMENTS: {
    // 320x50 Banner Placement ID
    BANNER: '10000844850',

    // Medium Rectangle / Native In-Feed Placement ID
    NATIVE: '10000844853',

    // Fullscreen Interstitial Placement ID
    INTERSTITIAL: '10000844849',

    // Rewarded Video (Unlock tasks / direct job applications) Placement ID
    REWARDED: '10000844851',

    // App Open / Startup Splash Placement ID
    APP_OPEN: '',
  },

  // Target Tier
  TARGET_TIER: 'TIER_3',

  // Flag indicating whether production credentials have been inserted
  isConfigured(): boolean {
    return (
      Boolean(this.ACCOUNT_ID && this.ACCOUNT_ID.trim().length > 0) &&
      Boolean(this.APP_ID && this.APP_ID.trim().length > 0)
    );
  },
};
