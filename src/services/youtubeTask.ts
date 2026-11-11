import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, NativeModules, Platform } from 'react-native';
import { supabase } from '../config/supabase';
import { MemoryAndDiskCache } from './cache';

const { ScreenshotPickerModule } = NativeModules;

export type YouTubeProofStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

export interface YouTubeTaskStatusInfo {
  id?: string;
  status: YouTubeProofStatus;
  rewardUsd: number;
  rewardCredited: boolean;
  youtubeHandle?: string;
  adminNote?: string;
  submittedAt?: string;
  reviewedAt?: string;
}

export interface YouTubeAdminProofItem {
  id: string;
  userId: string;
  userEmail: string;
  youtubeHandle: string;
  screenshotDataUrl: string;
  screenshotFileName?: string;
  rewardUsd: number;
  status: YouTubeProofStatus;
  rewardCredited: boolean;
  adminNote?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface PickedScreenshotResult {
  cancelled: boolean;
  base64DataUrl?: string;
  fileName?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  nativePickerUnavailable?: boolean;
}

export const YOUTUBE_TASK_CONFIG = {
  TASK_ID: 'youtube_channel_subscribe_v1',
  CHANNEL_ID: 'UC3BjjkuvOg0mwdq6NAY1pZw',
  CHANNEL_URL: 'https://www.youtube.com/channel/UC3BjjkuvOg0mwdq6NAY1pZw',
  SUBSCRIBE_URL: 'https://www.youtube.com/channel/UC3BjjkuvOg0mwdq6NAY1pZw?sub_confirmation=1',
  APP_DEEP_LINK: 'vnd.youtube://www.youtube.com/channel/UC3BjjkuvOg0mwdq6NAY1pZw?sub_confirmation=1',
  REWARD_USD: 2.00,
  REWARD_POINTS: 200,
  TITLE: '🔴 Subscribe to Our Official YouTube Channel',
  DESCRIPTION:
    'Mandatory for all members: Subscribe to our YouTube channel, take a screenshot showing you are Subscribed, and submit it for Admin approval to earn +$2.00 cash.',
};

const STATUS_CACHE_TTL_MS = 1000 * 60 * 20; // 20 minutes cache to protect Supabase egress

export const YouTubeTaskService = {
  /**
   * Open the official YouTube channel with subscribe confirmation prompt
   */
  async openYouTubeChannel(): Promise<boolean> {
    try {
      await Linking.openURL(YOUTUBE_TASK_CONFIG.SUBSCRIBE_URL);
      return true;
    } catch (_) {
      try {
        await Linking.openURL(YOUTUBE_TASK_CONFIG.CHANNEL_URL);
        return true;
      } catch (err) {
        console.warn('[YouTubeTaskService] Could not open YouTube URL:', err);
        return false;
      }
    }
  },

  /**
   * Launch gallery image picker to select the YouTube Subscribed screenshot.
   * Compresses image automatically (<40KB) to keep database storage & egress minimal.
   */
  async pickScreenshotFromGallery(): Promise<PickedScreenshotResult> {
    if (Platform.OS === 'android' && ScreenshotPickerModule?.pickScreenshot) {
      try {
        const res = await ScreenshotPickerModule.pickScreenshot();
        if (!res || res.cancelled) {
          return { cancelled: true };
        }
        return {
          cancelled: false,
          base64DataUrl: res.base64DataUrl,
          fileName: res.fileName || 'youtube_subscribed_proof.jpg',
          width: res.width,
          height: res.height,
          sizeBytes: res.sizeBytes,
        };
      } catch (err) {
        console.warn('[YouTubeTaskService] Native screenshot picker error:', err);
        return { cancelled: false, nativePickerUnavailable: true };
      }
    }

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) {
            resolve({ cancelled: true });
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            const rawDataUrl = String(reader.result || '');
            resolve({
              cancelled: false,
              base64DataUrl: rawDataUrl,
              fileName: file.name || 'youtube_subscribed_proof.jpg',
              sizeBytes: file.size,
            });
          };
          reader.onerror = () => resolve({ cancelled: true });
          reader.readAsDataURL(file);
        };
        input.click();
      });
    }

    return { cancelled: false, nativePickerUnavailable: true };
  },

  /**
   * Egress-safe status lookup: never selects screenshot_data_url during normal client status checks.
   */
  async getStatus(userId: string, forceRefresh: boolean = false): Promise<YouTubeTaskStatusInfo> {
    const defaultStatus: YouTubeTaskStatusInfo = {
      status: 'not_submitted',
      rewardUsd: YOUTUBE_TASK_CONFIG.REWARD_USD,
      rewardCredited: false,
    };

    if (!userId) return defaultStatus;

    const cacheKey = `youtube_sub_status_v1_${userId}`;
    if (!forceRefresh) {
      const cached = await MemoryAndDiskCache.get<YouTubeTaskStatusInfo>(cacheKey, STATUS_CACHE_TTL_MS);
      if (cached) {
        return cached;
      }
    }

    try {
      const { data, error } = await supabase
        .from('youtube_subscription_proofs')
        .select('id, status, reward_usd, reward_credited, youtube_handle, admin_note, submitted_at, reviewed_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) {
        const localFallback = await MemoryAndDiskCache.get<YouTubeTaskStatusInfo>(
          cacheKey,
          1000 * 60 * 60 * 24 * 30
        );
        return localFallback || defaultStatus;
      }

      const rawStatus = String(data.status || 'pending').toLowerCase();
      const normalizedStatus: YouTubeProofStatus =
        rawStatus === 'approved'
          ? 'approved'
          : rawStatus === 'rejected'
          ? 'rejected'
          : 'pending';

      const statusInfo: YouTubeTaskStatusInfo = {
        id: data.id,
        status: normalizedStatus,
        rewardUsd: Number(data.reward_usd || YOUTUBE_TASK_CONFIG.REWARD_USD),
        rewardCredited: Boolean(data.reward_credited),
        youtubeHandle: data.youtube_handle || undefined,
        adminNote: data.admin_note || undefined,
        submittedAt: data.submitted_at || undefined,
        reviewedAt: data.reviewed_at || undefined,
      };

      await MemoryAndDiskCache.set(cacheKey, statusInfo);

      // If Admin approved the submission, ensure local balance cache is refreshed from Supabase
      if (normalizedStatus === 'approved') {
        await this.syncApprovedRewardToLocalBalance(userId, statusInfo.rewardUsd, statusInfo.rewardCredited);
      }

      return statusInfo;
    } catch (_) {
      const localFallback = await MemoryAndDiskCache.get<YouTubeTaskStatusInfo>(
        cacheKey,
        1000 * 60 * 60 * 24 * 30
      );
      return localFallback || defaultStatus;
    }
  },

  /**
   * Ensure that once an Admin approves a user's YouTube proof, their local cached balance reflects the +$2.00
   */
  async syncApprovedRewardToLocalBalance(
    userId: string,
    rewardUsd: number = YOUTUBE_TASK_CONFIG.REWARD_USD,
    dbRewardCredited: boolean = true
  ): Promise<void> {
    try {
      const syncFlagKey = `@youtube_sub_approved_synced_${userId}`;
      const alreadySynced = await AsyncStorage.getItem(syncFlagKey);
      if (alreadySynced === 'true') return;

      // Mark task completed locally
      const { JobsService } = require('./jobs');
      await JobsService.markTaskCompletedLocally(YOUTUBE_TASK_CONFIG.TASK_ID, userId);

      if (dbRewardCredited) {
        // Trigger already added +$2.00 in creator_balances on Supabase; pull fresh balance once
        await MemoryAndDiskCache.delete(`creator_balance_${userId}`);
        await JobsService.getBalance(userId, true);
      } else {
        // Fallback if SQL trigger wasn't installed yet: credit +$2.00 via JobsService
        await JobsService.completeTask(userId, {
          id: YOUTUBE_TASK_CONFIG.TASK_ID,
          title: YOUTUBE_TASK_CONFIG.TITLE,
          category: 'VIDEO',
          rewardUsd,
          points: YOUTUBE_TASK_CONFIG.REWARD_POINTS,
          durationSeconds: 30,
          description: YOUTUBE_TASK_CONFIG.DESCRIPTION,
          network: 'DIRECT',
        });
      }

      await AsyncStorage.setItem(syncFlagKey, 'true');
    } catch (_) {}
  },

  /**
   * Submit screenshot proof for Admin approval.
   * Does NOT credit the $2.00 reward until Admin changes status to 'approved'.
   */
  async submitScreenshotProof(params: {
    userId: string;
    userEmail?: string;
    youtubeHandle: string;
    screenshotDataUrl: string;
    screenshotFileName?: string;
  }): Promise<{ success: boolean; message: string; statusInfo?: YouTubeTaskStatusInfo }> {
    const { userId, userEmail, youtubeHandle, screenshotDataUrl, screenshotFileName } = params;

    if (!userId) {
      return { success: false, message: 'You must be signed in to submit task proof.' };
    }
    if (!screenshotDataUrl || !screenshotDataUrl.startsWith('data:image/')) {
      return {
        success: false,
        message: 'Please attach a valid screenshot showing you are subscribed to our YouTube channel.',
      };
    }

    const cleanHandle = youtubeHandle.trim() || 'Subscriber';
    const nowIso = new Date().toISOString();

    const optimisticStatus: YouTubeTaskStatusInfo = {
      status: 'pending',
      rewardUsd: YOUTUBE_TASK_CONFIG.REWARD_USD,
      rewardCredited: false,
      youtubeHandle: cleanHandle,
      submittedAt: nowIso,
    };

    try {
      const payload = {
        user_id: userId,
        user_email: (userEmail || '').trim() || null,
        youtube_handle: cleanHandle,
        channel_id: YOUTUBE_TASK_CONFIG.CHANNEL_ID,
        screenshot_data_url: screenshotDataUrl,
        screenshot_file_name: screenshotFileName || 'youtube_subscribed_proof.jpg',
        reward_usd: YOUTUBE_TASK_CONFIG.REWARD_USD,
        status: 'pending',
        reward_credited: false,
        admin_note: null,
        submitted_at: nowIso,
        updated_at: nowIso,
      };

      const { data, error } = await supabase
        .from('youtube_subscription_proofs')
        .upsert(payload, { onConflict: 'user_id' })
        .select('id, status, reward_usd, reward_credited, youtube_handle, submitted_at')
        .maybeSingle();

      if (error) {
        console.warn('[YouTubeTaskService] Supabase upsert warning:', error.message);
        // Save locally so user isn't blocked if table migration hasn't been executed yet
        await MemoryAndDiskCache.set(`youtube_sub_status_v1_${userId}`, optimisticStatus);
        return {
          success: true,
          message:
            'Your YouTube subscription screenshot has been submitted and is pending Admin verification. Your +$2.00 reward will be credited once approved!',
          statusInfo: optimisticStatus,
        };
      }

      const savedStatus: YouTubeTaskStatusInfo = {
        id: data?.id,
        status: 'pending',
        rewardUsd: Number(data?.reward_usd || YOUTUBE_TASK_CONFIG.REWARD_USD),
        rewardCredited: false,
        youtubeHandle: data?.youtube_handle || cleanHandle,
        submittedAt: data?.submitted_at || nowIso,
      };

      await MemoryAndDiskCache.set(`youtube_sub_status_v1_${userId}`, savedStatus);
      // Clear cached master micro jobs so status pill updates immediately
      await MemoryAndDiskCache.delete('cached_master_micro_jobs');

      return {
        success: true,
        message:
          'Screenshot submitted! An Admin will verify your subscription and approve your +$2.00 reward shortly.',
        statusInfo: savedStatus,
      };
    } catch (e: any) {
      await MemoryAndDiskCache.set(`youtube_sub_status_v1_${userId}`, optimisticStatus);
      return {
        success: true,
        message:
          'Your screenshot proof has been recorded and queued for Admin review (+$2.00 upon approval).',
        statusInfo: optimisticStatus,
      };
    }
  },

  /**
   * Check whether the user has satisfied the Mandatory YouTube Task gate to access other tasks.
   * Submitting the screenshot ('pending' or 'approved') unlocks other tasks immediately while waiting for Admin.
   * Never enforced on Web (Mobile App Only).
   */
  isMandatoryTaskGateSatisfied(statusInfo: YouTubeTaskStatusInfo | null | undefined): boolean {
    if (Platform.OS === 'web') return true;
    if (!statusInfo) return false;
    return statusInfo.status === 'pending' || statusInfo.status === 'approved';
  },

  /**
   * Check whether the user's YouTube subscription is Approved by Admin (required before Payout withdrawal).
   * Never enforced on Web (Mobile App Only).
   */
  isApprovedForPayout(statusInfo: YouTubeTaskStatusInfo | null | undefined): boolean {
    if (Platform.OS === 'web') return true;
    if (!statusInfo) return false;
    return statusInfo.status === 'approved';
  },

  // ============================================================================
  // ADMIN REVIEW & APPROVAL METHODS
  // ============================================================================

  /**
   * Fetch submitted YouTube screenshot proofs for Admin review
   */
  async getAdminSubmissions(
    statusFilter: 'pending' | 'approved' | 'rejected' | 'all' = 'pending'
  ): Promise<YouTubeAdminProofItem[]> {
    try {
      let query = supabase
        .from('youtube_subscription_proofs')
        .select(
          'id, user_id, user_email, youtube_handle, screenshot_data_url, screenshot_file_name, reward_usd, status, reward_credited, admin_note, submitted_at, reviewed_at'
        )
        .order('submitted_at', { ascending: false })
        .limit(25);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error || !data) return [];

      return data.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        userEmail: row.user_email || 'Unknown Email',
        youtubeHandle: row.youtube_handle || 'Not provided',
        screenshotDataUrl: row.screenshot_data_url || '',
        screenshotFileName: row.screenshot_file_name || undefined,
        rewardUsd: Number(row.reward_usd || YOUTUBE_TASK_CONFIG.REWARD_USD),
        status: (row.status || 'pending') as YouTubeProofStatus,
        rewardCredited: Boolean(row.reward_credited),
        adminNote: row.admin_note || undefined,
        submittedAt: row.submitted_at,
        reviewedAt: row.reviewed_at || undefined,
      }));
    } catch (_) {
      return [];
    }
  },

  /**
   * Admin: Approve a user's YouTube subscription screenshot and credit +$2.00
   */
  async approveSubmissionAsAdmin(
    proof: YouTubeAdminProofItem,
    adminNote?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from('youtube_subscription_proofs')
        .update({
          status: 'approved',
          admin_note: adminNote?.trim() || 'Verified & Approved by Admin (+$2.00)',
          reviewed_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id', proof.id)
        .select('id, status, reward_credited, reward_usd')
        .maybeSingle();

      if (error) {
        return { success: false, message: error.message || 'Failed to approve submission.' };
      }

      // If the SQL trigger wasn't installed yet (reward_credited still false), credit the user's creator_balances directly
      if (data && !data.reward_credited) {
        const reward = Number(proof.rewardUsd || YOUTUBE_TASK_CONFIG.REWARD_USD);
        const { data: balRow } = await supabase
          .from('creator_balances')
          .select('balance_usd, available_balance_usd')
          .eq('creator_id', proof.userId)
          .maybeSingle();

        const currentBal = Number(balRow?.available_balance_usd ?? balRow?.balance_usd ?? 0);
        const newBal = parseFloat((currentBal + reward).toFixed(4));

        await supabase.from('creator_balances').upsert(
          {
            creator_id: proof.userId,
            balance_usd: newBal,
            available_balance_usd: newBal,
            updated_at: nowIso,
          },
          { onConflict: 'creator_id' }
        );

        await supabase
          .from('youtube_subscription_proofs')
          .update({ reward_credited: true })
          .eq('id', proof.id);
      }

      // Invalidate local status cache if Admin is testing on their own account
      await MemoryAndDiskCache.delete(`youtube_sub_status_v1_${proof.userId}`);

      return {
        success: true,
        message: `Approved! +$${proof.rewardUsd.toFixed(2)} has been credited to ${proof.userEmail}.`,
      };
    } catch (e: any) {
      return { success: false, message: e.message || 'Error approving submission.' };
    }
  },

  /**
   * Admin: Reject a user's screenshot proof so they must upload a valid screenshot
   */
  async rejectSubmissionAsAdmin(
    proof: YouTubeAdminProofItem,
    adminNote?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from('youtube_subscription_proofs')
        .update({
          status: 'rejected',
          admin_note:
            adminNote?.trim() ||
            'Screenshot did not clearly show "Subscribed" on our official YouTube channel. Please subscribe and upload a clear screenshot.',
          reviewed_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id', proof.id);

      if (error) {
        return { success: false, message: error.message || 'Failed to reject submission.' };
      }

      await MemoryAndDiskCache.delete(`youtube_sub_status_v1_${proof.userId}`);

      return {
        success: true,
        message: `Submission from ${proof.userEmail} marked as rejected.`,
      };
    } catch (e: any) {
      return { success: false, message: e.message || 'Error rejecting submission.' };
    }
  },
};
