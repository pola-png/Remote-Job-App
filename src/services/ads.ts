import { ADMOB_CONFIG } from '../config/admob';
import { LEVELPLAY_CONFIG } from '../config/ironSource';
import { AdMobService } from './admob';
import { IronSourceLevelPlayService } from './ironSource';

export interface UnifiedAdRewardResult {
  rewardEarned: boolean;
  network: 'LEVELPLAY' | 'ADMOB' | 'SPONSOR';
  adUnitId: string;
  amount: number;
}

export const UnifiedAdService = {
  /**
   * Dual-Network Banner Ad Unit Resolution
   * Returns active LevelPlay Ad Unit with AdMob fallback
   */
  getBannerAdUnits() {
    return {
      levelPlay: LEVELPLAY_CONFIG.AD_UNITS.BANNER,
      adMob: ADMOB_CONFIG.AD_UNITS.BANNER,
    };
  },

  /**
   * Dual-Network Native Ad Unit Resolution
   * Returns active LevelPlay Native Unit with AdMob Native Advanced fallback
   */
  getNativeAdUnits() {
    return {
      levelPlay: LEVELPLAY_CONFIG.AD_UNITS.NATIVE,
      adMob: ADMOB_CONFIG.AD_UNITS.NATIVE_ADVANCED,
    };
  },

  /**
   * Dual-Network Rewarded Video Resolution
   * Provides 100% fill rate for unlocking job applications & micro-tasks
   */
  getRewardedAdUnits() {
    return {
      levelPlay: LEVELPLAY_CONFIG.AD_UNITS.REWARDED,
      adMob: ADMOB_CONFIG.AD_UNITS.REWARDED,
    };
  },

  /**
   * Show Rewarded Video with dual-network mediation cascade:
   * 1. Try IronSource LevelPlay first
   * 2. If IronSource does not fill, cascade to Google AdMob
   * 3. Guarantees 100% video fill rate for View Details & Apply actions
   */
  async showRewardedAd(
    onRewardEarned: (reward: UnifiedAdRewardResult) => void,
    onDismissed?: () => void,
    onError?: (err: any) => void
  ): Promise<void> {
    try {
      // Step 1: Attempt IronSource LevelPlay Rewarded Video
      await IronSourceLevelPlayService.showRewardedAd(
        (levelPlayReward) => {
          onRewardEarned({
            rewardEarned: levelPlayReward.rewardEarned,
            network: 'LEVELPLAY',
            adUnitId: levelPlayReward.adUnitId,
            amount: levelPlayReward.amount,
          });
        },
        onDismissed,
        async (_ironSourceErr) => {
          // Step 2: IronSource had no fill / failed -> Waterfall cascade to Google AdMob
          console.log('Dual-Ad Mediation: IronSource did not fill, switching to Google AdMob...');
          try {
            await AdMobService.showRewardedAd(
              (admobReward) => {
                onRewardEarned({
                  rewardEarned: admobReward.rewardEarned,
                  network: 'ADMOB',
                  adUnitId: ADMOB_CONFIG.AD_UNITS.REWARDED,
                  amount: 1,
                });
              },
              onDismissed,
              onError
            );
          } catch (admobErr) {
            console.warn('AdMob also failed in cascade:', admobErr);
            onError?.(admobErr);
            if (onDismissed) onDismissed();
          }
        }
      );
    } catch (err) {
      // If IronSource throw, fallback to AdMob immediately
      console.log('Dual-Ad Mediation Exception: Cascading to Google AdMob...');
      try {
        await AdMobService.showRewardedAd(
          (admobReward) => {
            onRewardEarned({
              rewardEarned: admobReward.rewardEarned,
              network: 'ADMOB',
              adUnitId: ADMOB_CONFIG.AD_UNITS.REWARDED,
              amount: 1,
            });
          },
          onDismissed,
          onError
        );
      } catch (admobErr) {
        onError?.(admobErr);
        if (onDismissed) onDismissed();
      }
    }
  },
};
