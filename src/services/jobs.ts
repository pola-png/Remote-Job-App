import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { MemoryAndDiskCache } from './cache';
import { CPAGRIP_CONFIG } from '../config/cpagrip';
import { CPALEAD_CONFIG } from '../config/cpalead';
import { AdTierService } from './adTierService';

export type TaskCategory = 'SURVEY' | 'APP_INSTALL' | 'WEBSITE' | 'VIDEO' | 'AI_DATA' | 'OTHER';

export interface MicroJobItem {
  id: string;
  title: string;
  category: TaskCategory;
  rewardUsd: number;
  points?: number; // CPAlead points (100 points per $1.00 payout)
  durationSeconds: number;
  description: string;
  actionUrl?: string;
  photoUrl?: string;
  acceptedCountries?: string;
  isCompleted?: boolean;
  network?: 'CPAGRIP' | 'CPALEAD' | 'DIRECT';
}

const CACHE_KEY_CPAGRIP = 'cpagrip_live_offers_v1';
const CACHE_KEY_CPALEAD = 'cpalead_live_offers_v1';
export const CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes cache

/**
 * Format accepted countries cleanly to prevent horizontal layout distortion
 */
export function formatAcceptedCountries(raw: string[] | string | undefined): string | undefined {
  if (!raw) return undefined;
  let list: string[] = [];
  if (Array.isArray(raw)) {
    list = raw.map((c) => String(c).trim().toUpperCase()).filter(Boolean);
  } else {
    list = String(raw)
      .split(/[,|\s/]+/)
      .map((c) => c.trim().toUpperCase())
      .filter((c) => Boolean(c) && c !== 'AND');
  }

  if (list.length === 0) return undefined;
  if (
    list.length >= 8 ||
    list.includes('ALL') ||
    list.includes('GLOBAL') ||
    list.includes('ALL_DEVICES') ||
    list.includes('WORLDWIDE')
  ) {
    return 'Global';
  }
  if (list.length > 2) {
    return `${list[0]}, ${list[1]} +${list.length - 2}`;
  }
  return list.join(', ');
}

export const JobsService = {
  /**
   * Fetch live CPA micro-tasks directly from CPAGrip JSON Feed using the public key.
   * Eliminates all mock/fake data.
   */
  async fetchLiveCpaGripOffers(userId: string, forceRefresh: boolean = false): Promise<MicroJobItem[]> {
    if (!forceRefresh) {
      const cached = await MemoryAndDiskCache.get<MicroJobItem[]>(CACHE_KEY_CPAGRIP, CACHE_TTL_MS);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return cached;
      }
    }

    const feedUrl = CPAGRIP_CONFIG.getClientFeedUrl(userId, CPAGRIP_CONFIG.DEFAULT_LIMIT);
    console.log(`[CPAGrip] Fetching real live offer feed for user: ${userId}...`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(feedUrl, {
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`CPAGrip feed returned HTTP ${response.status}`);
      }

      const json = await response.json();
      const rawOffers = json?.offers;

      if (!rawOffers || !Array.isArray(rawOffers) || rawOffers.length === 0) {
        console.log('[CPAGrip] No offers returned for this visitor IP/country.');
        return [];
      }

      const mappedOffers: MicroJobItem[] = rawOffers.map((offer: any) => {
        const parsedPayout = parseFloat(offer.payout);
        const rewardUsd = isNaN(parsedPayout) || parsedPayout <= 0 ? 0.20 : parsedPayout;
        const points = CPALEAD_CONFIG.usdToPoints(rewardUsd);

        let category: TaskCategory = 'SURVEY';
        const rawCat = (offer.category || '').toLowerCase();
        if (rawCat.includes('install') || rawCat.includes('mobile') || rawCat.includes('app') || rawCat.includes('download')) {
          category = 'APP_INSTALL';
        } else if (rawCat.includes('pin') || rawCat.includes('credit') || rawCat.includes('trial') || rawCat.includes('purchase')) {
          category = 'WEBSITE';
        } else if (rawCat.includes('video') || rawCat.includes('stream')) {
          category = 'VIDEO';
        } else {
          category = 'SURVEY';
        }

        const durationSeconds = Math.min(60, Math.max(25, Math.round(rewardUsd * 80)));

        return {
          id: `cpagrip_${offer.offer_id}`,
          title: offer.title ? String(offer.title).trim() : 'Complete Partner Task',
          category,
          rewardUsd,
          points,
          durationSeconds,
          description: offer.description
            ? String(offer.description).trim()
            : 'Complete the verified sponsor requirements to claim reward.',
          actionUrl: String(offer.offerlink || '').trim(),
          photoUrl: offer.offerphoto ? String(offer.offerphoto).trim() : undefined,
          acceptedCountries: formatAcceptedCountries(offer.accepted_countries),
          network: 'CPAGRIP',
          isCompleted: false,
        };
      });

      await MemoryAndDiskCache.set(CACHE_KEY_CPAGRIP, mappedOffers);
      console.log(`[CPAGrip] Successfully loaded ${mappedOffers.length} real offers.`);
      return mappedOffers;
    } catch (err) {
      console.warn('[CPAGrip] Failed to fetch live feed:', err);
      const cached = await MemoryAndDiskCache.get<MicroJobItem[]>(CACHE_KEY_CPAGRIP, 1000 * 60 * 60 * 24);
      return cached || [];
    }
  },

  /**
   * Fetch live CPA micro-tasks from CPAlead API using Publisher ID 3367742.
   * Real live partner offers with 100 points per $1.00 USD.
   */
  async fetchLiveCpaLeadOffers(userId: string, forceRefresh: boolean = false): Promise<MicroJobItem[]> {
    if (!forceRefresh) {
      const cached = await MemoryAndDiskCache.get<MicroJobItem[]>(CACHE_KEY_CPALEAD, CACHE_TTL_MS);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return cached;
      }
    }

    const feedUrl = CPALEAD_CONFIG.getOffersUrl(userId, CPALEAD_CONFIG.DEFAULT_LIMIT);
    console.log(`[CPAlead] Fetching real live offer feed for user: ${userId}...`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(feedUrl, {
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`CPAlead feed returned HTTP ${response.status}`);
      }

      const json = await response.json();
      const rawOffers = json?.offers;

      if (!rawOffers || !Array.isArray(rawOffers) || rawOffers.length === 0) {
        console.log('[CPAlead] No offers returned for this visitor IP/country.');
        return [];
      }

      const mappedOffers: MicroJobItem[] = rawOffers.map((offer: any) => {
        const rewardRaw = parseFloat(String(offer.amount ?? '0'));
        const rewardUsd = !isNaN(rewardRaw) && rewardRaw > 0 ? rewardRaw : 0.15;
        const points = CPALEAD_CONFIG.usdToPoints(rewardUsd);

        let category: TaskCategory = 'SURVEY';
        const typeStr = (offer.payout_type || '').toUpperCase();
        const descStr = ((offer.title || '') + ' ' + (offer.description || '') + ' ' + (offer.conversion || '')).toLowerCase();

        if (typeStr === 'CPI' || descStr.includes('install') || descStr.includes('download') || descStr.includes('app')) {
          category = 'APP_INSTALL';
        } else if (descStr.includes('register') || descStr.includes('sign up') || descStr.includes('enter to win') || descStr.includes('entry')) {
          category = 'WEBSITE';
        } else if (descStr.includes('survey') || descStr.includes('quiz') || descStr.includes('opinion')) {
          category = 'SURVEY';
        } else if (descStr.includes('video') || descStr.includes('watch')) {
          category = 'VIDEO';
        } else {
          category = 'OTHER';
        }

        const durationSeconds = Math.min(60, Math.max(25, Math.round(rewardUsd * 80)));
        const photoUrl = offer.creatives?.url || offer.creatives?.og_image || undefined;

        return {
          id: `cpalead_${offer.id}`,
          title: offer.title ? String(offer.title).trim() : 'Complete CPAlead Task',
          category,
          rewardUsd,
          points,
          durationSeconds,
          description: offer.conversion
            ? String(offer.conversion).trim()
            : offer.description
            ? String(offer.description).trim()
            : CPALEAD_CONFIG.INSTRUCTIONS,
          actionUrl: String(offer.link || '').trim(),
          photoUrl,
          acceptedCountries: formatAcceptedCountries(offer.countries),
          network: 'CPALEAD',
          isCompleted: false,
        };
      });

      await MemoryAndDiskCache.set(CACHE_KEY_CPALEAD, mappedOffers);
      console.log(`[CPAlead] Successfully loaded ${mappedOffers.length} real offers.`);
      return mappedOffers;
    } catch (err) {
      console.warn('[CPAlead] Failed to fetch live feed:', err);
      const cached = await MemoryAndDiskCache.get<MicroJobItem[]>(CACHE_KEY_CPALEAD, 1000 * 60 * 60 * 24);
      return cached || [];
    }
  },

  /**
   * Get user creator balance
   */
  async getBalance(userId: string, forceRefresh: boolean = false): Promise<number> {
    const cacheKey = `creator_balance_${userId}`;
    const cached = await MemoryAndDiskCache.get<number>(cacheKey, 1000 * 60 * 30); // 30 min cache

    if (!forceRefresh && cached !== null && cached !== undefined && !isNaN(cached)) {
      return cached;
    }

    try {
      const { data, error } = await supabase
        .from('creator_balances')
        .select('available_balance_usd, balance_usd')
        .eq('creator_id', userId)
        .maybeSingle();

      if (data && !error) {
        const rawVal = Number(data.available_balance_usd ?? data.balance_usd ?? 0);
        const val = !isNaN(rawVal) ? rawVal : 0;
        const safeCached = typeof cached === 'number' && !isNaN(cached) ? cached : 0;
        // Take the highest of remote and local cache to prevent race condition if remote write was delayed
        const bestVal = Math.max(val, safeCached);
        await MemoryAndDiskCache.set(cacheKey, bestVal);
        return bestVal;
      }

      // If remote returned nothing/error, preserve user's cached earnings!
      const fallback = typeof cached === 'number' && !isNaN(cached)
        ? cached
        : MemoryAndDiskCache.getInMemory<number>(cacheKey) ?? 0;
      return fallback;
    } catch (_) {
      const fallback = typeof cached === 'number' && !isNaN(cached)
        ? cached
        : MemoryAndDiskCache.getInMemory<number>(cacheKey) ?? 0;
      return fallback;
    }
  },

  /**
   * Get active micro-tasks for user from CPAGrip, CPAlead, and High-Paying Link Locker task.
   */
  async getJobs(userId: string, forceRefresh: boolean = false): Promise<MicroJobItem[]> {
    try {
      const [cpagripResult, cpaleadResult, completedList] = await Promise.all([
        this.fetchLiveCpaGripOffers(userId, forceRefresh).catch(() => [] as MicroJobItem[]),
        this.fetchLiveCpaLeadOffers(userId, forceRefresh).catch(() => [] as MicroJobItem[]),
        this.getCompletedTaskIds(),
      ]);

      // 1. VIP $1.00 Google Play In-App Review Task (Price only: $1.00 Cash, no points)
      // Once claimed once by this user, permanently omit it from the task list!
      const playStoreReviewTaskId = 'playstore_inapp_review_v1';
      const isReviewClaimed =
        completedList.includes(playStoreReviewTaskId) || (await this.isReviewClaimed(userId));
      const playStoreReviewTask: MicroJobItem | null = isReviewClaimed
        ? null
        : {
            id: playStoreReviewTaskId,
            title: '⭐ Rate & Review on Google Play',
            category: 'OTHER',
            rewardUsd: 1.00,
            durationSeconds: 20,
            description: 'Drop an in-app review to support the app and instantly claim $1.00 cash.',
            network: 'DIRECT',
            acceptedCountries: 'Global',
            isCompleted: false,
          };

      // 2. Watch Ads Hub Task Card (Placed directly below Rate & Review on Google Play)
      let watchAdsHubTask: MicroJobItem | null = null;
      let isAdmin = false;
      try {
        const { AuthService } = require('./auth');
        isAdmin = await AuthService.isAdminUser(userId);
        if (isAdmin) {
          AdTierService.setAdminOverride(true);
        }
      } catch (_) {}

      if (isAdmin || AdTierService.isAdMobAllowedSync()) {
        try {
          const { WatchAdsService } = require('./watchAdsService');
          const stats = await WatchAdsService.getStats();
          watchAdsHubTask = {
            id: 'watch_ads_hub_v1',
            title: '🎬 Watch & Earn Video Ads',
            category: 'VIDEO',
            rewardUsd: 0.20,
            points: 20,
            durationSeconds: 30,
            description: `Earn 2 – 20 Reward Points per video watched • ${stats.completedCount}/2000 completed daily!`,
            network: 'DIRECT',
            acceptedCountries: 'Global',
            isCompleted: stats.isAllCompleted,
          };
        } catch (_) {}
      }

      // 3. High-Paying CPAlead Link Locker Offer (Tool 67493 / Slug suMfPdJ)
      const lockerTaskId = `cpalead_locker_${CPALEAD_CONFIG.LOCKER.TOOL_ID}`;
      const premiumLockerTask: MicroJobItem = {
        id: lockerTaskId,
        title: CPALEAD_CONFIG.LOCKER.TITLE,
        category: 'SURVEY',
        rewardUsd: CPALEAD_CONFIG.LOCKER.HIGH_PAYING_REWARD_USD,
        points: CPALEAD_CONFIG.LOCKER.HIGH_PAYING_POINTS,
        durationSeconds: 90,
        description: CPALEAD_CONFIG.LOCKER.DESCRIPTION,
        actionUrl: CPALEAD_CONFIG.LOCKER.getDirectUrl(userId),
        network: 'CPALEAD',
        acceptedCountries: 'Global',
        isCompleted: completedList.includes(lockerTaskId),
      };

      // Prepend review (if not yet claimed), followed immediately by Watch & Earn Video Ads, then Locker & CPA offers
      const merged: MicroJobItem[] = [
        ...(playStoreReviewTask ? [playStoreReviewTask] : []),
        ...(watchAdsHubTask ? [watchAdsHubTask] : []),
        premiumLockerTask,
        ...cpagripResult,
        ...cpaleadResult,
      ];

      // Deduplicate offers by unique id
      const seenIds = new Set<string>();
      const deduped: MicroJobItem[] = [];
      for (const item of merged) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          deduped.push({
            ...item,
            isCompleted: completedList.includes(item.id) || Boolean(item.isCompleted),
          });
        }
      }

      // Cache master task list for instant 0ms offline and cold start rendering
      if (deduped.length > 0) {
        MemoryAndDiskCache.set('cached_master_micro_jobs', deduped).catch(() => {});
      }

      return deduped;
    } catch (_) {
      return this.getCachedTasks(userId);
    }
  },

  /**
   * Fast-path: read cached micro-jobs instantly (0ms) so user never sees blank screen
   */
  async getCachedTasks(userId?: string): Promise<MicroJobItem[]> {
    try {
      const [cached, completedList, reviewClaimed] = await Promise.all([
        MemoryAndDiskCache.get<MicroJobItem[]>('cached_master_micro_jobs', 1000 * 60 * 60 * 24),
        this.getCompletedTaskIds(),
        this.isReviewClaimed(userId),
      ]);
      const isRevDone = reviewClaimed || completedList.includes('playstore_inapp_review_v1');

      if (cached && Array.isArray(cached) && cached.length > 0) {
        const filtered = cached.filter((item) => {
          if (item.id === 'playstore_inapp_review_v1' && (isRevDone || item.isCompleted)) {
            return false;
          }
          return true;
        });

        // Ensure Watch & Earn Video Ads is ordered directly below Rate & Review on Google Play
        const reviewItem = filtered.find((i) => i.id === 'playstore_inapp_review_v1');
        const watchItem = filtered.find((i) => i.id === 'watch_ads_hub_v1');
        const rest = filtered.filter(
          (i) => i.id !== 'playstore_inapp_review_v1' && i.id !== 'watch_ads_hub_v1'
        );
        return [
          ...(reviewItem ? [reviewItem] : []),
          ...(watchItem ? [watchItem] : []),
          ...rest,
        ];
      }
      const cpagrip = (await MemoryAndDiskCache.get<MicroJobItem[]>(CACHE_KEY_CPAGRIP, 1000 * 60 * 60 * 24)) || [];
      const cpalead = (await MemoryAndDiskCache.get<MicroJobItem[]>(CACHE_KEY_CPALEAD, 1000 * 60 * 60 * 24)) || [];
      const fallbackList = [...cpagrip, ...cpalead];
      return fallbackList;
    } catch (_) {
      return [];
    }
  },

  /**
   * Check whether the user has already claimed the one-time Google Play Review bonus
   */
  async isReviewClaimed(userId?: string): Promise<boolean> {
    try {
      const keys = ['@playstore_review_claimed_v1'];
      if (userId) keys.push(`@playstore_review_claimed_${userId}`);
      const results = await Promise.all(keys.map((k) => AsyncStorage.getItem(k)));
      return results.some((v) => v === 'true');
    } catch (_) {
      return false;
    }
  },

  /**
   * Permanently record that the user has claimed the one-time Google Play Review bonus
   */
  async markReviewClaimed(userId?: string): Promise<void> {
    try {
      await AsyncStorage.setItem('@playstore_review_claimed_v1', 'true');
      if (userId) {
        await AsyncStorage.setItem(`@playstore_review_claimed_${userId}`, 'true');
      }
    } catch (_) {}
  },

  /**
   * Complete micro-task and credit user earnings
   */
  async completeTask(userId: string, task: MicroJobItem): Promise<{ newBalance: number; success: boolean }> {
    try {
      const reward = typeof task.rewardUsd === 'number' && !isNaN(task.rewardUsd) && task.rewardUsd > 0
        ? task.rewardUsd
        : 0.15;
      const currentBalance = await this.getBalance(userId);
      const safeCurrentBalance = typeof currentBalance === 'number' && !isNaN(currentBalance) ? currentBalance : 0;
      const updatedBalance = parseFloat((safeCurrentBalance + reward).toFixed(4));
      const cacheKey = `creator_balance_${userId}`;

      // Update in memory/disk cache immediately (Optimistic local-first update)
      await MemoryAndDiskCache.set(cacheKey, updatedBalance);
      await this.markTaskCompletedLocally(task.id, userId);

      // Sync to Supabase creator_balances
      try {
        const { error: upsertError } = await supabase.from('creator_balances').upsert(
          {
            creator_id: userId,
            balance_usd: updatedBalance,
            available_balance_usd: updatedBalance,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'creator_id' }
        );
        if (upsertError) {
          console.warn('[JobsService] creator_balances upsert warning (kept local):', upsertError.message);
        }
      } catch (err) {
        console.warn('creator_balances upsert error (kept local):', err);
      }

      // Record in monetization events ledger in background
      (async () => {
        try {
          await supabase.from('monetization_events').insert({
            user_id: userId,
            event_type: task.category.toLowerCase(),
            format: task.network === 'CPALEAD' ? 'cpalead_offer' : 'cpagrip_offer',
            creator_earnings_micros: Math.round(reward * 1000000),
            created_at: new Date().toISOString(),
          });
        } catch (_) {}
      })();

      return { newBalance: updatedBalance, success: true };
    } catch (e) {
      return { newBalance: 0, success: false };
    }
  },

  /**
   * Completed task IDs stored locally (10-year retention)
   */
  async getCompletedTaskIds(): Promise<string[]> {
    try {
      const cached = await MemoryAndDiskCache.get<string[]>('completed_tasks_v2', 1000 * 60 * 60 * 24 * 365 * 10);
      return cached || [];
    } catch (_) {
      return [];
    }
  },

  /**
   * Mark a task as completed locally and update cached master list
   */
  async markTaskCompletedLocally(taskId: string, userId?: string): Promise<void> {
    try {
      if (taskId === 'playstore_inapp_review_v1') {
        await this.markReviewClaimed(userId);
      }
      const existing = await this.getCompletedTaskIds();
      if (!existing.includes(taskId)) {
        existing.push(taskId);
        await MemoryAndDiskCache.set('completed_tasks_v2', existing);
      }
      // Also update cached_master_micro_jobs immediately so claimed review task is removed from cache
      const cachedMaster = await MemoryAndDiskCache.get<MicroJobItem[]>('cached_master_micro_jobs', 1000 * 60 * 60 * 24);
      if (cachedMaster && Array.isArray(cachedMaster)) {
        const updatedMaster =
          taskId === 'playstore_inapp_review_v1'
            ? cachedMaster.filter((item) => item.id !== 'playstore_inapp_review_v1')
            : cachedMaster.map((item) => (item.id === taskId ? { ...item, isCompleted: true } : item));
        await MemoryAndDiskCache.set('cached_master_micro_jobs', updatedMaster);
      }
    } catch (_) {}
  },
};
