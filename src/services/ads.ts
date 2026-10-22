import { ADMOB_CONFIG } from '../config/admob';
import { PANGLE_CONFIG } from '../config/pangle';
import { INMOBI_CONFIG } from '../config/inmobi';
import { AdMobService } from './admob';
import { InMobiService } from './inmobi';
import { AdTierService } from './adTierService';

export interface UnifiedAdRewardResult {
  rewardEarned: boolean;
  network: 'ADMOB' | 'PANGLE' | 'INMOBI';
  adUnitId: string;
  amount: number;
}

export const UnifiedAdService = {
  /**
   * Primary Ad Units
   * Tier 1 & 2 -> AdMob + Pangle
   * Tier 3 -> InMobi
   */
  getBannerAdUnits() {
    const isTier3 = AdTierService.isTier3();
    if (isTier3) {
      return {
        network: 'INMOBI' as const,
        placement: INMOBI_CONFIG.PLACEMENTS.BANNER,
      };
    }
    return {
      network: 'ADMOB' as const,
      primary: ADMOB_CONFIG.AD_UNITS.BANNER,
      panglePlacement: PANGLE_CONFIG.PLACEMENTS.BANNER.PRIMARY_AUTO,
    };
  },

  getNativeAdUnits() {
    const isTier3 = AdTierService.isTier3();
    if (isTier3) {
      return {
        network: 'INMOBI' as const,
        placement: INMOBI_CONFIG.PLACEMENTS.NATIVE,
      };
    }
    return {
      network: 'ADMOB' as const,
      primary: ADMOB_CONFIG.AD_UNITS.NATIVE_ADVANCED,
      panglePlacement: PANGLE_CONFIG.PLACEMENTS.NATIVE.PRIMARY_HIGH_ECPM,
    };
  },

  getRewardedAdUnits() {
    const isTier3 = AdTierService.isTier3();
    if (isTier3) {
      return {
        network: 'INMOBI' as const,
        placement: INMOBI_CONFIG.PLACEMENTS.REWARDED,
      };
    }
    return {
      network: 'ADMOB' as const,
      primary: ADMOB_CONFIG.AD_UNITS.REWARDED,
      panglePlacement: PANGLE_CONFIG.PLACEMENTS.REWARDED.PRIMARY_HIGH_ECPM,
    };
  },

  /**
   * Show Real Rewarded Video Ad:
   * Tier 1 & 2: AdMob (with Pangle fallback)
   * Tier 3: InMobi
   */
  async showRewardedAd(
    onRewardEarned: (reward: UnifiedAdRewardResult) => void,
    onDismissed?: () => void,
    onError?: (err: any) => void
  ): Promise<void> {
    const activeNetwork = AdTierService.getActiveAdNetwork();

    // Route Tier 3 country traffic directly to InMobi
    if (activeNetwork === 'INMOBI') {
      console.log('[UnifiedAd] Routing Tier 3 user to InMobi Rewarded Ad...');
      await InMobiService.showRewardedAd(
        (reward) => {
          if (reward.rewardEarned) {
            onRewardEarned({
              rewardEarned: true,
              network: 'INMOBI',
              adUnitId: INMOBI_CONFIG.PLACEMENTS.REWARDED,
              amount: reward.amount || 1,
            });
          }
        },
        onDismissed,
        onError
      );
      return;
    }

    // Route Tier 1 & 2 country traffic to AdMob
    try {
      console.log('[UnifiedAd] Routing Tier 1/2 user to AdMob Rewarded Ad...');
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
   * Show Real Interstitial Ad
   */
  async showInterstitialAd(): Promise<boolean> {
    const activeNetwork = AdTierService.getActiveAdNetwork();
    if (activeNetwork === 'INMOBI') {
      return await InMobiService.showInterstitialAd();
    }
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
    const activeNetwork = AdTierService.getActiveAdNetwork();
    if (activeNetwork === 'INMOBI') {
      return await InMobiService.showAppOpenAd();
    }
    try {
      return await AdMobService.showAppOpenAd();
    } catch (err) {
      console.warn('AdMob App Open Error:', err);
      return false;
    }
  },
};

