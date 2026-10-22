import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  TIER_1_COUNTRIES,
  TIER_2_COUNTRIES,
  TIER_3_COUNTRIES,
  TIER_3_TIMEZONES,
  AD_TIER_CONFIG,
} from '../config/adTiers';

const STORAGE_KEY_COUNTRY = '@user_geo_country';
const STORAGE_KEY_TIER = '@user_geo_tier';

export type AdTier = 'TIER_1' | 'TIER_2' | 'TIER_3' | 'UNKNOWN';

let detectedCountry: string | null = null;
let detectedTier: AdTier = 'UNKNOWN';
let isAllowedCache: boolean | null = null;
let isResolving = false;
let initPromise: Promise<boolean> | null = null;

/**
 * Determine if a given country code qualifies as Tier 1, Tier 2, or Tier 3
 */
function classifyCountry(countryCode: string): { tier: AdTier; allowed: boolean } {
  const code = countryCode.toUpperCase().trim();

  if (TIER_1_COUNTRIES[code]) {
    return { tier: 'TIER_1', allowed: true };
  }

  if (TIER_2_COUNTRIES[code]) {
    return { tier: 'TIER_2', allowed: true };
  }

  if (TIER_3_COUNTRIES[code]) {
    return { tier: 'TIER_3', allowed: false };
  }

  // Not in whitelist (unknown or other developing territory)
  if (AD_TIER_CONFIG.WHITELIST_ONLY) {
    return { tier: 'UNKNOWN', allowed: false };
  }

  return { tier: 'UNKNOWN', allowed: AD_TIER_CONFIG.ALLOW_ON_UNKNOWN_GEO };
}

/**
 * Fast timezone-based heuristic (0ms, offline)
 */
function checkTimezoneHeuristic(): { isTier3: boolean; isTier1Or2: boolean } {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (!tz) return { isTier3: false, isTier1Or2: false };

    // Check if timezone is explicitly in Tier 3 list
    if (TIER_3_TIMEZONES.includes(tz)) {
      return { isTier3: true, isTier1Or2: false };
    }

    // Common Tier 1 & 2 Timezone prefixes
    const tier1Or2Prefixes = [
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Phoenix',
      'America/Toronto',
      'America/Vancouver',
      'Europe/London',
      'Europe/Berlin',
      'Europe/Paris',
      'Europe/Rome',
      'Europe/Madrid',
      'Europe/Amsterdam',
      'Europe/Stockholm',
      'Europe/Oslo',
      'Europe/Copenhagen',
      'Europe/Helsinki',
      'Europe/Vienna',
      'Europe/Dublin',
      'Europe/Brussels',
      'Europe/Zurich',
      'Australia/Sydney',
      'Australia/Melbourne',
      'Australia/Brisbane',
      'Australia/Perth',
      'Asia/Tokyo',
      'Asia/Singapore',
      'Asia/Dubai',
      'Asia/Seoul',
    ];

    if (tier1Or2Prefixes.some((prefix) => tz.startsWith(prefix))) {
      return { isTier3: false, isTier1Or2: true };
    }
  } catch (_) {
    // Ignore timezone resolution error
  }
  return { isTier3: false, isTier1Or2: false };
}

export const AdTierService = {
  /**
   * Initialize Geo detection (cached in AsyncStorage + network fetch fallback)
   */
  async initialize(): Promise<boolean> {
    if (initPromise) return initPromise;

    initPromise = (async () => {
      // 1. Check AsyncStorage for previously resolved country
      try {
        const storedCountry = await AsyncStorage.getItem(STORAGE_KEY_COUNTRY);
        if (storedCountry) {
          detectedCountry = storedCountry.toUpperCase();
          const { tier, allowed } = classifyCountry(detectedCountry);
          detectedTier = tier;
          isAllowedCache = allowed;
          console.log(`[AdTier] Cached country: ${detectedCountry} (${detectedTier}), AdMob allowed: ${allowed}`);
        }
      } catch (err) {
        console.warn('[AdTier] Failed reading cached country:', err);
      }

      // 2. If no cached country yet, use offline timezone heuristic
      if (isAllowedCache === null) {
        const tz = checkTimezoneHeuristic();
        if (tz.isTier3) {
          detectedTier = 'TIER_3';
          isAllowedCache = false;
          console.log('[AdTier] Detected Tier 3 timezone heuristic. AdMob strictly blocked.');
        } else if (tz.isTier1Or2) {
          isAllowedCache = true;
        }
      }

      // 3. Perform fast background network GeoIP check to confirm
      this.fetchGeoIpInBackground();

      return isAllowedCache ?? false;
    })();

    return initPromise;
  },

  /**
   * Background GeoIP lookup with fast timeout
   */
  async fetchGeoIpInBackground(): Promise<void> {
    if (isResolving) return;
    isResolving = true;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      let countryCode: string | null = null;

      // Primary source: freeipapi.com
      try {
        const resp = await fetch('https://freeipapi.com/api/json', {
          signal: controller.signal,
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.countryCode) {
            countryCode = data.countryCode;
          }
        }
      } catch (_) {
        // Fallback to secondary source: ipwho.is
        try {
          const resp2 = await fetch('https://ipwho.is/', {
            signal: controller.signal,
          });
          if (resp2.ok) {
            const data2 = await resp2.json();
            if (data2 && data2.country_code) {
              countryCode = data2.country_code;
            }
          }
        } catch (_) {
          // Both networks failed or timed out
        }
      } finally {
        clearTimeout(timeoutId);
      }

      if (countryCode) {
        const code = countryCode.toUpperCase();
        detectedCountry = code;
        const { tier, allowed } = classifyCountry(code);
        detectedTier = tier;
        isAllowedCache = allowed;

        await AsyncStorage.setItem(STORAGE_KEY_COUNTRY, code);
        await AsyncStorage.setItem(STORAGE_KEY_TIER, tier);

        console.log(
          `[AdTier] Verified GeoIP: ${code} (${tier}). AdMob allowed: ${allowed}`
        );
      }
    } catch (err) {
      console.warn('[AdTier] GeoIP fetch error:', err);
    } finally {
      isResolving = false;
    }
  },

  /**
   * Synchronous check for UI components and ad calls.
   * If country is Tier 3, strictly returns FALSE for AdMob.
   * Only returns TRUE if country is in Tier 1 or Tier 2.
   */
  isAdMobAllowedSync(): boolean {
    if (isAllowedCache !== null) {
      return isAllowedCache;
    }

    // Immediate check via timezone heuristic
    const tz = checkTimezoneHeuristic();
    if (tz.isTier3) {
      isAllowedCache = false;
      detectedTier = 'TIER_3';
      return false;
    }
    if (tz.isTier1Or2) {
      isAllowedCache = true;
      return true;
    }

    // Default to false to prevent accidental Tier 3 calls before geo resolves
    return AD_TIER_CONFIG.ALLOW_ON_UNKNOWN_GEO;
  },

  /**
   * Synchronous check if InMobi should be used.
   * InMobi is dedicated for Tier 3 countries.
   */
  isInMobiAllowedSync(): boolean {
    return !this.isAdMobAllowedSync();
  },

  /**
   * Get active ad network for current user:
   * Tier 1 & Tier 2 => ADMOB
   * Tier 3 => INMOBI
   */
  getActiveAdNetwork(): 'ADMOB' | 'INMOBI' {
    return this.isAdMobAllowedSync() ? 'ADMOB' : 'INMOBI';
  },

  /**
   * Quick check if user is in Tier 3
   */
  isTier3(): boolean {
    return !this.isAdMobAllowedSync();
  },

  /**
   * Async check - waits for geo initialization if needed
   */
  async isAdMobAllowed(): Promise<boolean> {
    if (isAllowedCache !== null) {
      return isAllowedCache;
    }
    return await this.initialize();
  },

  /**
   * Get detected Country ISO code (e.g., 'US', 'GB', 'NG', 'IN')
   */
  getUserCountry(): string | null {
    return detectedCountry;
  },

  /**
   * Get detected Ad Tier
   */
  getUserTier(): AdTier {
    return detectedTier;
  },

  /**
   * Manually override country (useful for testing or admin override)
   */
  async setOverrideCountry(countryCode: string): Promise<void> {
    const code = countryCode.toUpperCase();
    detectedCountry = code;
    const { tier, allowed } = classifyCountry(code);
    detectedTier = tier;
    isAllowedCache = allowed;
    await AsyncStorage.setItem(STORAGE_KEY_COUNTRY, code);
    await AsyncStorage.setItem(STORAGE_KEY_TIER, tier);
  },
};

// Start background initialization immediately on module load
AdTierService.initialize().catch(() => {});
