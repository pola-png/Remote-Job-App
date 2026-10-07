import { LEVELPLAY_CONFIG } from '../config/ironSource';

export interface LevelPlayRewardResult {
  rewardEarned: boolean;
  adUnitId: string;
  type: string;
  amount: number;
}

export const IronSourceLevelPlayService = {
  getAppKey(): string {
    return LEVELPLAY_CONFIG.APP_KEY;
  },

  getAppName(): string {
    return LEVELPLAY_CONFIG.APP_NAME;
  },

  getBannerAdUnitId(): string {
    return LEVELPLAY_CONFIG.AD_UNITS.BANNER;
  },

  getNativeAdUnitId(): string {
    return LEVELPLAY_CONFIG.AD_UNITS.NATIVE;
  },

  getRewardedAdUnitId(): string {
    return LEVELPLAY_CONFIG.AD_UNITS.REWARDED;
  },

  /**
   * Request and show LevelPlay Rewarded Video ad
   * Used for unlocking job applications, viewing job details, and micro-task earnings
   */
  async showRewardedAd(
    onRewardEarned: (reward: LevelPlayRewardResult) => void,
    onDismissed?: () => void,
    onError?: (err: any) => void
  ): Promise<void> {
    try {
      console.log('Attempting IronSource LevelPlay Rewarded Video...');
      
      // Check if native IronSource module is registered
      const { NativeModules } = require('react-native');
      const IronSourceNative = NativeModules.IronSourceLevelPlay || NativeModules.IronSource || NativeModules.RNIronSource;

      if (IronSourceNative && typeof IronSourceNative.showRewardedVideo === 'function') {
        IronSourceNative.showRewardedVideo(LEVELPLAY_CONFIG.AD_UNITS.REWARDED, (status: string) => {
          if (status === 'REWARDED' || status === 'COMPLETED') {
            onRewardEarned({
              rewardEarned: true,
              adUnitId: LEVELPLAY_CONFIG.AD_UNITS.REWARDED,
              type: 'LEVELPLAY_REWARD',
              amount: 1,
            });
          } else {
            onDismissed?.();
          }
        });
      } else {
        // IronSource native adapter not ready or returned no fill -> trigger waterfall to AdMob
        console.warn('IronSource LevelPlay rewarded ad has no fill / not ready. Cascading to Google AdMob...');
        if (onError) {
          onError(new Error('IronSource no-fill'));
        } else {
          onDismissed?.();
        }
      }
    } catch (err) {
      console.warn('IronSource LevelPlay Rewarded Ad Error, cascading to Google AdMob:', err);
      if (onError) {
        onError(err);
      } else if (onDismissed) {
        onDismissed();
      }
    }
  },
};
