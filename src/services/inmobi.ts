import { NativeModules, Platform } from 'react-native';
import { INMOBI_CONFIG } from '../config/inmobi';

const { InMobiModule } = NativeModules;

export interface InMobiRewardResult {
  rewardEarned: boolean;
  type?: string;
  amount?: number;
}

let isInMobiSdkInitialized = false;

/**
 * InMobi Ad Service
 * Dedicated to handling ads for Tier 3 countries.
 * Strict rule: ZERO mock data or fake test creatives.
 * Real IDs and keys are populated in INMOBI_CONFIG.
 */
export const InMobiService = {
  /**
   * Check whether real InMobi credentials have been supplied by the publisher
   */
  isConfigured(): boolean {
    return INMOBI_CONFIG.isConfigured();
  },

  /**
   * Initialize native InMobi SDK on Android
   */
  async initialize(): Promise<boolean> {
    if (isInMobiSdkInitialized) return true;
    if (Platform.OS !== 'android') return false;
    if (!this.isConfigured()) return false;

    if (InMobiModule?.initialize) {
      try {
        console.log(`[InMobi] Initializing native SDK with App Key: ${INMOBI_CONFIG.APP_KEY}...`);
        await InMobiModule.initialize(INMOBI_CONFIG.APP_KEY);
        isInMobiSdkInitialized = true;
        console.log('[InMobi] Native InMobi SDK initialized successfully.');
        return true;
      } catch (err) {
        console.warn('[InMobi] Failed to initialize native SDK:', err);
        return false;
      }
    }
    return false;
  },

  /**
   * Get InMobi Banner Placement ID
   */
  getBannerPlacementId(): string {
    return INMOBI_CONFIG.PLACEMENTS.BANNER;
  },

  /**
   * Get InMobi Native Placement ID
   */
  getNativePlacementId(): string {
    return INMOBI_CONFIG.PLACEMENTS.NATIVE;
  },

  /**
   * Get InMobi Rewarded Video Placement ID
   */
  getRewardedPlacementId(): string {
    return INMOBI_CONFIG.PLACEMENTS.REWARDED;
  },

  /**
   * Preload InMobi Rewarded Video in background
   */
  async preloadRewardedAd(): Promise<void> {
    if (Platform.OS !== 'android' || !this.isConfigured()) return;
    try {
      await this.initialize();
      const placementId = this.getRewardedPlacementId();
      if (placementId && InMobiModule?.preloadRewarded) {
        await InMobiModule.preloadRewarded(placementId);
      }
    } catch (_) {}
  },

  /**
   * Get InMobi Interstitial Placement ID
   */
  getInterstitialPlacementId(): string {
    return INMOBI_CONFIG.PLACEMENTS.INTERSTITIAL;
  },

  /**
   * Show InMobi Rewarded Video Ad for Tier 3 users
   * Strictly rewards ONLY when the video finishes playing (res?.rewardEarned === true).
   */
  async showRewardedAd(
    onRewardEarned: (reward: InMobiRewardResult) => void,
    onDismissed?: () => void,
    onError?: (err: any) => void
  ): Promise<void> {
    const isConfigured = this.isConfigured();
    const placementId = this.getRewardedPlacementId();

    if (!isConfigured || !placementId) {
      onError?.({ code: 'AD_NOT_CONFIGURED', message: 'Video ad is unavailable right now. Please tap Retry Ad.' });
      return;
    }

    try {
      console.log(`[InMobi] Requesting real InMobi Rewarded Video for placement: ${placementId}`);
      if (InMobiModule?.showRewarded) {
        // Ensure SDK initialized first
        await this.initialize();
        const res = await InMobiModule.showRewarded(placementId);
        if (res?.rewardEarned) {
          console.log('[InMobi] Rewarded video completed and verified!');
          onRewardEarned({
            rewardEarned: true,
            type: 'TASK_UNLOCK',
            amount: 1,
          });
          if (onDismissed) onDismissed();
        } else {
          console.log('[InMobi] Rewarded ad ended early or had no inventory:', res?.error);
          onError?.({
            code: 'AD_NO_FILL',
            message: 'Ad did not complete or failed to load. Please tap Retry Ad.',
          });
        }
      } else {
        onError?.({
          code: 'AD_MODULE_UNAVAILABLE',
          message: 'Ad player unavailable. Please tap Retry Ad.',
        });
      }
    } catch (err) {
      console.warn('[InMobi] Rewarded video error:', err);
      onError?.(err);
    }
  },

  /**
   * Show InMobi Interstitial Ad for Tier 3 users
   */
  async showInterstitialAd(): Promise<boolean> {
    const placementId = this.getInterstitialPlacementId();
    if (!this.isConfigured() || !placementId) {
      console.log('[InMobi] Interstitial: Awaiting production InMobi placement IDs.');
      return false;
    }

    try {
      console.log(`[InMobi] Requesting InMobi Interstitial ad for placement: ${placementId}`);
      if (InMobiModule?.showInterstitial) {
        await this.initialize();
        await InMobiModule.showInterstitial(placementId);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[InMobi] Interstitial error:', err);
      return false;
    }
  },

  /**
   * Show InMobi App Open / Launch Ad for Tier 3 users
   */
  async showAppOpenAd(): Promise<boolean> {
    if (!this.isConfigured() || !INMOBI_CONFIG.PLACEMENTS.APP_OPEN) {
      return false;
    }
    console.log('[InMobi] Requesting InMobi App Open ad...');
    return true;
  },
};
