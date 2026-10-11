/**
 * Pangle Global Ad Placements Configuration
 * App: Remote job-microjob earn money
 * App ID: 8907140
 * Platform: Android
 */

export const PANGLE_CONFIG = {
  APP_ID: '8907140',
  APP_NAME: 'Remote job-microjob earn money',

  PLACEMENTS: {
    // Interstitial Placements
    INTERSTITIAL: {
      PRIMARY_HIGH_ECPM: '983712162', // 10 USD
      FALLBACK: '983712171',
    },

    // App Open Ad Placements
    APP_OPEN: {
      PRIMARY_AUTO: '983712185', // Automatic
      HIGH_ECPM: '890188695', // 10 USD
      AUTO_FALLBACK: '890188657', // Automatic
      BIDDING: '890188694', // In-App Bidding
    },

    // Rewarded Video Placements
    REWARDED: {
      PRIMARY_HIGH_ECPM: '983712172', // 10 USD
      FALLBACK: '983712163',
    },

    // Banner Placements
    BANNER: {
      PRIMARY_AUTO: '983712174', // Automatic
      HIGH_ECPM: '983712181', // 10 USD
      BIDDING: '983712173', // In-App Bidding
    },

    // Native Ad Placements
    NATIVE: {
      PRIMARY_HIGH_ECPM: '983712183', // 10 USD
      FALLBACK_AUTO: '983712165', // Automatic
      FALLBACK_SECONDARY: '983712164',
    },
  },
};
