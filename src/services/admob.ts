import {
  AppOpenAd,
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

let preloadedAppOpen: AppOpenAd | null = null;
let isAppOpenReady = false;
let isAppOpenLoading = false;
let lastAppOpenShowTime = 0;
let isAnyAdShowing = false;
const APP_OPEN_COOLDOWN_MS = 60 * 1000; // 1-minute cooldown between app open ads

let appOpenWaiters: Array<(ad: AppOpenAd | null) => void> = [];

export const AdMobService = {
  getAppId(): string {
    return ADMOB_CONFIG.APP_ID;
  },

  getRewardedAdUnitId(): string {
    if (__DEV__ || ADMOB_CONFIG.TEST_MODE) {
      return TestIds.REWARDED;
    }
    return ADMOB_CONFIG.AD_UNITS.REWARDED;
  },

  getInterstitialAdUnitId(): string {
    if (__DEV__ || ADMOB_CONFIG.TEST_MODE) {
      return TestIds.INTERSTITIAL;
    }
    return ADMOB_CONFIG.AD_UNITS.INTERSTITIAL;
  },

  getAppOpenAdUnitId(): string {
    if (__DEV__ || ADMOB_CONFIG.TEST_MODE) {
      return TestIds.APP_OPEN;
    }
    return ADMOB_CONFIG.AD_UNITS.APP_OPEN;
  },

  getBannerAdUnitId(): string {
    if (__DEV__ || ADMOB_CONFIG.TEST_MODE) {
      return TestIds.BANNER;
    }
    return ADMOB_CONFIG.AD_UNITS.BANNER;
  },

  getNativeAdUnitId(): string {
    if (__DEV__ || ADMOB_CONFIG.TEST_MODE) {
      return TestIds.BANNER;
    }
    return ADMOB_CONFIG.AD_UNITS.BANNER;
  },

  getRewardedInterstitialAdUnitId(): string {
    if (__DEV__ || ADMOB_CONFIG.TEST_MODE) {
      return TestIds.REWARDED_INTERSTITIAL;
    }
    return ADMOB_CONFIG.AD_UNITS.REWARDED_INTERSTITIAL;
  },

  /**
   * Preload App Open Ad in background for immediate launch / resume presentation
   */
  preloadAppOpenAd(): void {
    if (isAppOpenReady || isAppOpenLoading) return;
    isAppOpenLoading = true;

    const adUnitId = this.getAppOpenAdUnitId();
    try {
      console.log('AdMob: Preloading App Open Ad with unit ID:', adUnitId);
      const appOpen = AppOpenAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: false,
      });

      appOpen.addAdEventListener(AdEventType.LOADED, () => {
        preloadedAppOpen = appOpen;
        isAppOpenReady = true;
        isAppOpenLoading = false;
        console.log('AdMob: App Open Ad preloaded and ready for presentation');

        // Notify any pending show requests waiting on cold startup
        const waiters = [...appOpenWaiters];
        appOpenWaiters = [];
        waiters.forEach((cb) => cb(appOpen));
      });

      appOpen.addAdEventListener(AdEventType.ERROR, (error) => {
        isAppOpenLoading = false;
        isAppOpenReady = false;
        preloadedAppOpen = null;
        console.warn('AdMob: App Open Ad preload error:', error);

        const waiters = [...appOpenWaiters];
        appOpenWaiters = [];
        waiters.forEach((cb) => cb(null));
      });

      appOpen.load();
    } catch (err) {
      isAppOpenLoading = false;
      console.warn('AdMob: App Open Ad preload exception:', err);
    }
  },

  /**
   * Request and show App Open Ad on app launch / resume
   */
  async showAppOpenAd(): Promise<boolean> {
    const now = Date.now();
    // Do not show if another full-screen ad is active or if shown recently within cooldown window
    if (isAnyAdShowing) {
      console.log('AdMob: Another ad is currently displaying, skipping App Open Ad');
      return false;
    }

    if (now - lastAppOpenShowTime < APP_OPEN_COOLDOWN_MS) {
      console.log('AdMob: App Open Ad cooldown period active, skipping');
      return false;
    }

    const presentAd = (ad: AppOpenAd): Promise<boolean> => {
      preloadedAppOpen = null;
      isAppOpenReady = false;
      isAnyAdShowing = true;
      lastAppOpenShowTime = Date.now();

      return new Promise<boolean>((resolve) => {
        let closedSub: (() => void) | null = null;
        let errorSub: (() => void) | null = null;

        const cleanup = () => {
          isAnyAdShowing = false;
          if (closedSub) closedSub();
          if (errorSub) errorSub();
          setTimeout(() => this.preloadAppOpenAd(), 1000);
        };

        closedSub = ad.addAdEventListener(AdEventType.CLOSED, () => {
          cleanup();
          resolve(true);
        });

        errorSub = ad.addAdEventListener(AdEventType.ERROR, () => {
          cleanup();
          resolve(false);
        });

        ad.show().catch((err) => {
          cleanup();
          console.warn('AdMob: Failed to show App Open Ad:', err);
          resolve(false);
        });
      });
    };

    // 1. If preloaded ad is already in memory, display immediately
    if (preloadedAppOpen && isAppOpenReady) {
      return presentAd(preloadedAppOpen);
    }

    // 2. If ad is currently in flight loading (cold startup), wait up to 8 seconds
    if (isAppOpenLoading) {
      return new Promise<boolean>((resolve) => {
        let resolved = false;
        const timer = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve(false);
          }
        }, 8000);

        appOpenWaiters.push((ad) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            if (ad) {
              presentAd(ad).then(resolve);
            } else {
              resolve(false);
            }
          }
        });
      });
    }

    // 3. Fallback: on-demand load and show
    return new Promise<boolean>((resolve) => {
      const adUnitId = this.getAppOpenAdUnitId();
      let handled = false;

      const timeout = setTimeout(() => {
        if (!handled) {
          handled = true;
          this.preloadAppOpenAd();
          resolve(false);
        }
      }, 8000);

      try {
        const appOpen = AppOpenAd.createForAdRequest(adUnitId, {
          requestNonPersonalizedAdsOnly: false,
        });

        appOpen.addAdEventListener(AdEventType.LOADED, () => {
          if (handled || isAnyAdShowing) return;
          clearTimeout(timeout);
          handled = true;
          presentAd(appOpen).then(resolve);
        });

        appOpen.addAdEventListener(AdEventType.ERROR, (err) => {
          if (!handled) {
            handled = true;
            clearTimeout(timeout);
            console.warn('AdMob on-demand App Open error:', err);
            resolve(false);
          }
        });

        appOpen.load();
      } catch (err) {
        clearTimeout(timeout);
        console.warn('AdMob on-demand App Open exception:', err);
        resolve(false);
      }
    });
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
        console.warn('AdMob Preload error:', error);
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
   * Preload App Open Ad in background for immediate launch / resume presentation
   */
  preloadAppOpenAd(): void {
    if (isAppOpenReady || isAppOpenLoading) return;
    isAppOpenLoading = true;

    const adUnitId = this.getAppOpenAdUnitId();
    try {
      const appOpen = AppOpenAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: false,
      });

      appOpen.addAdEventListener(AdEventType.LOADED, () => {
        preloadedAppOpen = appOpen;
        isAppOpenReady = true;
        isAppOpenLoading = false;
        console.log('AdMob App Open Ad preloaded and ready for presentation');
      });

      appOpen.addAdEventListener(AdEventType.ERROR, (error) => {
        isAppOpenLoading = false;
        isAppOpenReady = false;
        preloadedAppOpen = null;
        console.warn('AdMob App Open Ad preload error:', error);
      });

      appOpen.load();
    } catch (err) {
      isAppOpenLoading = false;
      console.warn('AdMob App Open Ad preload exception:', err);
    }
  },

  /**
   * Request and show App Open Ad on app launch / resume
   */
  async showAppOpenAd(): Promise<boolean> {
    const now = Date.now();
    // Do not show if another full-screen ad is active or if shown recently within cooldown window
    if (isAnyAdShowing) {
      console.log('AdMob: Another ad is currently displaying, skipping App Open Ad');
      return false;
    }

    if (now - lastAppOpenShowTime < APP_OPEN_COOLDOWN_MS) {
      console.log('AdMob: App Open Ad cooldown period active, skipping');
      return false;
    }

    // 1. If preloaded ad is already in memory, display immediately
    if (preloadedAppOpen && isAppOpenReady) {
      const activeAd = preloadedAppOpen;
      preloadedAppOpen = null;
      isAppOpenReady = false;
      isAnyAdShowing = true;
      lastAppOpenShowTime = now;

      return new Promise<boolean>((resolve) => {
        let unsubscribeClosed: (() => void) | null = null;
        let unsubscribeError: (() => void) | null = null;

        const cleanup = () => {
          isAnyAdShowing = false;
          if (unsubscribeClosed) unsubscribeClosed();
          if (unsubscribeError) unsubscribeError();
          // Preload next ad in background
          setTimeout(() => this.preloadAppOpenAd(), 1000);
        };

        unsubscribeClosed = activeAd.addAdEventListener(AdEventType.CLOSED, () => {
          cleanup();
          resolve(true);
        });

        unsubscribeError = activeAd.addAdEventListener(AdEventType.ERROR, () => {
          cleanup();
          resolve(false);
        });

        activeAd.show().catch((err) => {
          cleanup();
          console.warn('AdMob: Failed to show preloaded App Open Ad:', err);
          resolve(false);
        });
      });
    }

    // 2. Fallback: on-demand load with 3-second timeout
    return new Promise<boolean>((resolve) => {
      const adUnitId = this.getAppOpenAdUnitId();
      let handled = false;

      const timeout = setTimeout(() => {
        if (!handled) {
          handled = true;
          this.preloadAppOpenAd();
          resolve(false);
        }
      }, 3000);

      try {
        const appOpen = AppOpenAd.createForAdRequest(adUnitId, {
          requestNonPersonalizedAdsOnly: false,
        });

        appOpen.addAdEventListener(AdEventType.LOADED, () => {
          if (handled || isAnyAdShowing) return;
          clearTimeout(timeout);
          handled = true;
          isAnyAdShowing = true;
          lastAppOpenShowTime = Date.now();

          appOpen.addAdEventListener(AdEventType.CLOSED, () => {
            isAnyAdShowing = false;
            setTimeout(() => this.preloadAppOpenAd(), 1000);
            resolve(true);
          });

          appOpen.addAdEventListener(AdEventType.ERROR, () => {
            isAnyAdShowing = false;
            setTimeout(() => this.preloadAppOpenAd(), 1000);
            resolve(false);
          });

          appOpen.show().catch(() => {
            isAnyAdShowing = false;
            resolve(false);
          });
        });

        appOpen.addAdEventListener(AdEventType.ERROR, () => {
          if (!handled) {
            handled = true;
            clearTimeout(timeout);
            resolve(false);
          }
        });

        appOpen.load();
      } catch (_) {
        clearTimeout(timeout);
        resolve(false);
      }
    });
  },
};
