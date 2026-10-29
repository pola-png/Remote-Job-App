import AsyncStorage from '@react-native-async-storage/async-storage';
import { JobsService, MicroJobItem } from './jobs';
import { AdMobService } from './admob';
import { AdTierService } from './adTierService';

export const MAX_WATCH_ADS = 2000;
const STORAGE_KEY_WATCH_COUNT = '@watch_ads_completed_count_v1';
const STORAGE_KEY_WATCH_IDS = '@watch_ads_completed_ids_v1';
const STORAGE_KEY_COOLDOWN_UNTIL = '@watch_ads_cooldown_until_v1';
const STORAGE_KEY_WATCH_DATE = '@watch_ads_pool_date_v1';

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Deterministically mixes prices between $0.02 and $0.20 across the 500 ad slots
 */
export function getWatchAdReward(index: number): number {
  // 10-tier cycle with pseudo-random deterministic variation based on index
  const baseRewards = [0.03, 0.05, 0.08, 0.12, 0.04, 0.15, 0.06, 0.20, 0.07, 0.10];
  const base = baseRewards[(index - 1) % baseRewards.length];
  // Mix with slight deterministic variation
  const variation = (((index * 13) % 7) - 3) * 0.01;
  const finalVal = Math.min(0.20, Math.max(0.02, parseFloat((base + variation).toFixed(2))));
  return finalVal;
}

/**
 * Converts reward USD to Points (100 Points = $1.00 USD)
 * Fully compliant with Google Play Store & Google AdMob Rewarded Inventory Policy
 */
export function getWatchAdPoints(index: number): number {
  const usd = getWatchAdReward(index);
  return Math.round(usd * 100);
}

export interface WatchAdsStats {
  completedCount: number;
  maxAds: number;
  remainingCount: number;
  isAllCompleted: boolean;
  cooldownSecondsRemaining: number;
  totalEarnedUsd: number;
  nextAvailableIndex: number;
}

export const WatchAdsService = {
  MAX_ADS: MAX_WATCH_ADS,

  /**
   * Check whether Watch Ads task feature is active for current user.
   * Allowed for Tier 1 & Tier 2 countries using AdMob, OR Admin users regardless of tier.
   */
  async isEligible(userId?: string): Promise<boolean> {
    if (userId) {
      try {
        const { AuthService } = require('./auth');
        if (await AuthService.isAdminUser(userId)) {
          return true;
        }
      } catch (_) {}
    }
    return AdTierService.isAdMobAllowedSync();
  },

  /**
   * Get current watch ads progress and cooldown status
   */
  async getStats(): Promise<WatchAdsStats> {
    try {
      const [countRaw, cooldownRaw, completedIds] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_WATCH_COUNT),
        AsyncStorage.getItem(STORAGE_KEY_COOLDOWN_UNTIL),
        this.getCompletedIds(),
      ]);

      const completedCount = Math.min(MAX_WATCH_ADS, parseInt(countRaw || '0', 10) || completedIds.length);
      const cooldownUntil = parseInt(cooldownRaw || '0', 10) || 0;
      const now = Date.now();
      const cooldownSecondsRemaining = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));

      const completedSet = new Set(completedIds);
      let totalEarnedUsd = 0;
      let nextAvailableIndex = 1;
      let foundNext = false;

      for (let i = 1; i <= MAX_WATCH_ADS; i++) {
        if (completedSet.has(`watch_ad_${i}`)) {
          totalEarnedUsd += getWatchAdReward(i);
        } else if (!foundNext) {
          nextAvailableIndex = i;
          foundNext = true;
        }
      }

      return {
        completedCount,
        maxAds: MAX_WATCH_ADS,
        remainingCount: Math.max(0, MAX_WATCH_ADS - completedCount),
        isAllCompleted: completedCount >= MAX_WATCH_ADS,
        cooldownSecondsRemaining,
        totalEarnedUsd: parseFloat(totalEarnedUsd.toFixed(2)),
        nextAvailableIndex: foundNext ? nextAvailableIndex : MAX_WATCH_ADS,
      };
    } catch (_) {
      return {
        completedCount: 0,
        maxAds: MAX_WATCH_ADS,
        remainingCount: MAX_WATCH_ADS,
        isAllCompleted: false,
        cooldownSecondsRemaining: 0,
        totalEarnedUsd: 0,
        nextAvailableIndex: 1,
      };
    }
  },

  /**
   * Get list of completed watch ad IDs (auto-resets daily for 2,000 ads/day limit)
   */
  async getCompletedIds(): Promise<string[]> {
    try {
      const today = getTodayDateString();
      const [savedDate, raw] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_WATCH_DATE),
        AsyncStorage.getItem(STORAGE_KEY_WATCH_IDS),
      ]);
      if (savedDate && savedDate !== today) {
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEY_WATCH_DATE, today),
          AsyncStorage.setItem(STORAGE_KEY_WATCH_IDS, JSON.stringify([])),
          AsyncStorage.setItem(STORAGE_KEY_WATCH_COUNT, '0'),
        ]);
        return [];
      }
      if (!savedDate) {
        await AsyncStorage.setItem(STORAGE_KEY_WATCH_DATE, today);
      }
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  },

  /**
   * Generate the 2,000 Watch Ad items, marking completed ones.
   * Uses price ($0.02 to $0.20) and points (2 to 20).
   */
  async generateWatchAdTasks(limit: number = 2000): Promise<MicroJobItem[]> {
    const completedIds = new Set(await this.getCompletedIds());
    const tasks: MicroJobItem[] = [];

    const totalToGenerate = Math.min(MAX_WATCH_ADS, limit);

    for (let i = 1; i <= totalToGenerate; i++) {
      const taskId = `watch_ad_${i}`;
      const rewardUsd = getWatchAdReward(i);
      const points = getWatchAdPoints(i);
      const isCompleted = completedIds.has(taskId);

      tasks.push({
        id: taskId,
        title: `Video Ad #${i}`,
        category: 'VIDEO',
        rewardUsd,
        points,
        durationSeconds: 30,
        description: `Watch a short sponsor video to earn ${points} Reward Points.`,
        isCompleted,
        network: 'DIRECT',
        acceptedCountries: 'Global',
      });
    }

    return tasks;
  },

  /**
   * Record that a rewarded ad was watched and completed:
   * 1. Add reward ($0.02 - $0.20) to balance
   * 2. After each 4th rewarded ad (4, 8, 12...), trigger an Interstitial Ad
   * 3. After each 5th watch ad (5, 10, 15...), enforce 10s cooldown
   */
  async recordAdCompleted(
    userId: string,
    adIndex: number
  ): Promise<{
    reward: number;
    newBalance: number;
    showInterstitial: boolean;
    cooldownTriggered: boolean;
  }> {
    const taskId = `watch_ad_${adIndex}`;
    const rewardUsd = getWatchAdReward(adIndex);

    // Save completed ID
    const completedList = await this.getCompletedIds();
    if (!completedList.includes(taskId)) {
      completedList.push(taskId);
      await AsyncStorage.setItem(STORAGE_KEY_WATCH_IDS, JSON.stringify(completedList));
    }

    const newCompletedCount = completedList.length;
    await AsyncStorage.setItem(STORAGE_KEY_WATCH_COUNT, String(newCompletedCount));

    // Credit reward to balance
    const taskItem: MicroJobItem = {
      id: taskId,
      title: `Watch Video Ad #${adIndex}`,
      category: 'VIDEO',
      rewardUsd,
      durationSeconds: 30,
      description: `Watch rewarded ad #${adIndex}`,
      network: 'DIRECT',
    };

    const res = await JobsService.completeTask(userId, taskItem);

    // Rule: Every 4th rewarded ad, show Interstitial Ad
    const shouldShowInterstitial = newCompletedCount % 4 === 0 && newCompletedCount > 0;
    if (shouldShowInterstitial) {
      console.log(`[WatchAds] Milestone reached (${newCompletedCount} ads). Triggering Interstitial Ad...`);
      setTimeout(() => {
        AdMobService.showInterstitialAd().catch(() => {});
      }, 500);
    }

    // Rule: Every 5th watch ad, add 10 seconds wait cooldown
    const cooldownTriggered = newCompletedCount % 5 === 0 && newCompletedCount > 0;
    if (cooldownTriggered) {
      const cooldownUntil = Date.now() + 10 * 1000;
      await AsyncStorage.setItem(STORAGE_KEY_COOLDOWN_UNTIL, String(cooldownUntil));
      console.log(`[WatchAds] 5th ad milestone reached. 10s cooldown activated.`);
    }

    return {
      reward: rewardUsd,
      newBalance: res.newBalance,
      showInterstitial: shouldShowInterstitial,
      cooldownTriggered,
    };
  },
};
