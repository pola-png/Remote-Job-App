import { ADMOB_CONFIG } from '../config/admob';
import { PANGLE_CONFIG } from '../config/pangle';
import { AdMobService } from './admob';

export interface UnifiedAdRewardResult {
  rewardEarned: boolean;
  network: 'ADMOB' | 'PANGLE';
  adUnitId: string;
  amount: number;
}

export const UnifiedAdService = {
  /**
   * Primary AdMob Banner Unit with Pangle mediation fallback
   */
  getBannerAdUnits() {
    return {
      primary: ADMOB_CONFIG.AD_UNITS.BANNER,
      panglePlacement: PANGLE_CONFIG.PLACEMENTS.BANNER.PRIMARY_FEED,
    };
  },

  /**
   * Primary AdMob Native Unit with Pangle mediation fallback
   */
  getNativeAdUnits() {
    return {
      primary: ADMOB_CONFIG.AD_UNITS.NATIVE_ADVANCED,
      panglePlacement: PANGLE_CONFIG.PLACEMENTS.NATIVE.FEED_INLINE,
    };
  },

  /**
   * Primary AdMob Rewarded Video Unit with Pangle mediation fallback
   */
  getRewardedAdUnits() {
    return {
      primary: ADMOB_CONFIG.AD_UNITS.REWARDED,
      panglePlacement: PANGLE_CONFIG.PLACEMENTS.REWARDED.PRIMARY_HIGH_ECPM,
    };
  },

  /**
   * Show Real Rewarded Video Ad (AdMob primary with Pangle mediation fallback)
   * Strictly requires completion of real ad before reward is granted - no mock/fake ads.
   */
  async showRewardedAd(
    onRewardEarned: (reward: UnifiedAdRewardResult) => void,
    onDismissed?: () => void,
    onError?: (err: any) => void
  ): Promise<void> {
    try {
      console.log('AdMob + Pangle Mediation: Requesting Real Rewarded Video...');
      await AdMobService.showRewardedAd(
        (admobReward) => {
          if (admobReward.rewardEarned) {
            onRewardEarned({
              rewardEarned: true,
              network: 'ADMOB',
              adUnitId: ADMOB_CONFIG.AD_UNITS.REWARDED,
              amount: admobReward.amount || 1,
            });
          }
        },
        onDismissed,
        (err) => {
          console.warn('AdMob Rewarded Error:', err);
          onError?.(err);
        }
      );
    } catch (err) {
      console.warn('AdMob Rewarded Exception:', err);
      onError?.(err);
      if (onDismissed) onDismissed();
    }
  },

  /**
   * Show Real Interstitial Ad (AdMob primary with Pangle mediation fallback)
   */
  async showInterstitialAd(): Promise<boolean> {
    try {
      return await AdMobService.showInterstitialAd();
    } catch (err) {
      console.warn('AdMob Interstitial Error:', err);
      return false;
    }
  },

  /**
   * Show Real App Open Ad on launch / resume
   */
  async showAppOpenAd(): Promise<boolean> {
    try {
      return await AdMobService.showAppOpenAd();
    } catch (err) {
      console.warn('AdMob App Open Error:', err);
      return false;
    }
  },
};
