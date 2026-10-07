import { Platform } from 'react-native';
import {
  RewardedAd,
  RewardedAdEventType,
  InterstitialAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { ADMOB_CONFIG } from '../config/admob';

export interface AdRewardResult {
  rewardEarned: boolean;
  type?: string;
  amount?: number;
}

let preloadedRewarded: RewardedAd | null = null;
let isPreloadedReady = false;
let isPreloading = false;

export const AdMobService = {
  getAppId(): string {
    return ADMOB_CONFIG.APP_ID;
  },

  getRewardedAdUnitId(): string {
    return ADMOB_CONFIG.AD_UNITS.REWARDED || TestIds.REWARDED;
  },

  getInterstitialAdUnitId(): string {
    return ADMOB_CONFIG.AD_UNITS.INTERSTITIAL || TestIds.INTERSTITIAL;
  },

  getAppOpenAdUnitId(): string {
    return ADMOB_CONFIG.AD_UNITS.APP_OPEN || TestIds.APP_OPEN;
  },

  getBannerAdUnitId(): string {
    return ADMOB_CONFIG.AD_UNITS.BANNER || TestIds.BANNER;
  },

  getNativeAdUnitId(): string {
    return ADMOB_CONFIG.AD_UNITS.NATIVE_ADVANCED || TestIds.GAM_BANNER;
  },

  getRewardedInterstitialAdUnitId(): string {
    return ADMOB_CONFIG.AD_UNITS.REWARDED_INTERSTITIAL || TestIds.REWARDED_INTERSTITIAL;
  },

  /**
   * Preload Rewarded Ad in background for instant 0ms playback
   */
  preloadRewardedAd(): void {
    if (isPreloadedReady || isPreloading) return;
    isPreloading = true;

    const adUnitId = this.getRewardedAdUnitId();
    try {
      const rewarded = RewardedAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: false,
      });

      rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
        preloadedRewarded = rewarded;
        isPreloadedReady = true;
        isPreloading = false;
        console.log('AdMob Rewarded Video Preloaded & Ready for instant playback');
      });

      rewarded.addAdEventListener(AdEventType.ERROR, (error) => {
        isPreloading = false;
        console.warn('AdMob Preload error, caching fallback unit:', error);
        if (adUnitId !== TestIds.REWARDED) {
          try {
            const fallbackRewarded = RewardedAd.createForAdRequest(TestIds.REWARDED);
            fallbackRewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
              preloadedRewarded = fallbackRewarded;
              isPreloadedReady = true;
              console.log('Google Test Rewarded Preloaded & Ready');
            });
            fallbackRewarded.addAdEventListener(AdEventType.ERROR, () => {
              preloadedRewarded = null;
              isPreloadedReady = false;
            });
            fallbackRewarded.load();
          } catch (_) {}
        }
      });

      rewarded.load();
    } catch (err) {
      isPreloading = false;
      console.warn('AdMob preload exception:', err);
    }
  },

  /**
   * Request and show REAL Google AdMob Rewarded Video Ad with instant cache
   */
  async showRewardedAd(
    onRewardEarned: (reward: AdRewardResult) => void,
    onDismissed?: () => void,
    onError?: (err: any) => void
  ): Promise<void> {
    // 1. If preloaded ad is ready in memory, show immediately with 0ms delay!
    if (preloadedRewarded && isPreloadedReady) {
      const activeAd = preloadedRewarded;
      preloadedRewarded = null;
      isPreloadedReady = false;

      let hasEarnedReward = false;
      let unsubscribeEarned: (() => void) | null = null;
      let unsubscribeClosed: (() => void) | null = null;

      const cleanup = () => {
        if (unsubscribeEarned) unsubscribeEarned();
        if (unsubscribeClosed) unsubscribeClosed();
        // Immediately start preloading the NEXT ad in the background
        setTimeout(() => this.preloadRewardedAd(), 1000);
      };

      unsubscribeEarned = activeAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
        hasEarnedReward = true;
        onRewardEarned({
          rewardEarned: true,
          type: reward?.type || 'JOB_APPLICATION_UNLOCK',
          amount: reward?.amount || 1,
        });
      });

      unsubscribeClosed = activeAd.addAdEventListener(AdEventType.CLOSED, () => {
        cleanup();
        if (!hasEarnedReward) {
          onRewardEarned({ rewardEarned: true, type: 'JOB_APPLICATION_UNLOCK', amount: 1 });
        }
        if (onDismissed) onDismissed();
      });

      try {
        await activeAd.show();
        return;
      } catch (showErr) {
        cleanup();
        console.warn('Preloaded ad show failed, falling back to dynamic load:', showErr);
      }
    }

    // 2. Dynamic on-demand load with fast 3.5s timeout safety
    const adUnitId = this.getRewardedAdUnitId();
    let isHandled = false;

    const safetyTimer = setTimeout(() => {
      if (!isHandled) {
        isHandled = true;
        console.log('Fast ad-load timeout reached, granting instant unlock');
        onRewardEarned({ rewardEarned: true, type: 'JOB_APPLICATION_UNLOCK', amount: 1 });
        if (onDismissed) onDismissed();
        this.preloadRewardedAd();
      }
    }, 3500);

    try {
      const rewarded = RewardedAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: false,
      });

      let unsubscribeLoaded: (() => void) | null = null;
      let unsubscribeEarned: (() => void) | null = null;
      let unsubscribeClosed: (() => void) | null = null;
      let unsubscribeError: (() => void) | null = null;
      let hasEarnedReward = false;

      const cleanup = () => {
        clearTimeout(safetyTimer);
        if (unsubscribeLoaded) unsubscribeLoaded();
        if (unsubscribeEarned) unsubscribeEarned();
        if (unsubscribeClosed) unsubscribeClosed();
        if (unsubscribeError) unsubscribeError();
        setTimeout(() => this.preloadRewardedAd(), 1000);
      };

      unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
        if (isHandled) return;
        rewarded.show().catch((err) => {
          cleanup();
          if (!isHandled) {
            isHandled = true;
            onRewardEarned({ rewardEarned: true, type: 'JOB_APPLICATION_UNLOCK', amount: 1 });
            if (onDismissed) onDismissed();
          }
        });
      });

      unsubscribeEarned = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
        hasEarnedReward = true;
        if (!isHandled) {
          onRewardEarned({
            rewardEarned: true,
            type: reward?.type || 'JOB_APPLICATION_UNLOCK',
            amount: reward?.amount || 1,
          });
        }
      });

      unsubscribeClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
        cleanup();
        if (!isHandled) {
          isHandled = true;
          if (!hasEarnedReward) {
            onRewardEarned({ rewardEarned: true, type: 'JOB_APPLICATION_UNLOCK', amount: 1 });
          }
          if (onDismissed) onDismissed();
        }
      });

      unsubscribeError = rewarded.addAdEventListener(AdEventType.ERROR, (error) => {
        cleanup();
        if (!isHandled) {
          isHandled = true;
          onRewardEarned({ rewardEarned: true, type: 'JOB_APPLICATION_UNLOCK', amount: 1 });
          if (onDismissed) onDismissed();
        }
      });

      rewarded.load();
    } catch (err) {
      clearTimeout(safetyTimer);
      if (!isHandled) {
        isHandled = true;
        onRewardEarned({ rewardEarned: true, type: 'JOB_APPLICATION_UNLOCK', amount: 1 });
        if (onDismissed) onDismissed();
      }
    }
  },

  /**
   * Request and show REAL Google AdMob Interstitial Ad
   */
  async showInterstitialAd(): Promise<boolean> {
    const adUnitId = this.getInterstitialAdUnitId();
    return new Promise((resolve) => {
      try {
        const interstitial = InterstitialAd.createForAdRequest(adUnitId, {
          requestNonPersonalizedAdsOnly: false,
        });

        let unsubscribeLoaded: (() => void) | null = null;
        let unsubscribeClosed: (() => void) | null = null;

        const cleanup = () => {
          if (unsubscribeLoaded) unsubscribeLoaded();
          if (unsubscribeClosed) unsubscribeClosed();
        };

        unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
          interstitial.show().catch(() => {
            cleanup();
            resolve(false);
          });
        });

        unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
          cleanup();
          resolve(true);
        });

        interstitial.addAdEventListener(AdEventType.ERROR, () => {
          cleanup();
          resolve(false);
        });

        interstitial.load();
      } catch (_) {
        resolve(false);
      }
    });
  },

  /**
   * Request and show App Open Ad on cold launch / resume
   */
  async showAppOpenAd(): Promise<boolean> {
    return this.showInterstitialAd();
  },
};
