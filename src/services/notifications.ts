import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, PermissionsAndroid } from 'react-native';
import { supabase } from '../config/supabase';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'JOB_ALERT' | 'PAYOUT_UPDATE' | 'TASK_CREDIT' | 'SECURITY';
  createdAt: string;
  isRead: boolean;
  targetScreen?: 'REMOTE_JOBS' | 'MICRO_JOBS' | 'PAYOUT' | 'POLICY';
  taskId?: string;
  reward?: string;
  actionUrl?: string;
}

export interface HighestPayingTaskInfo {
  id: string;
  title: string;
  rewardUsd: number;
  rewardFormatted: string;
  category: string;
  description: string;
  actionUrl?: string;
  network?: string;
}

const NOTIFICATION_PERMISSION_KEY = 'remote_jobs_notification_permission_granted';
const NOTIFICATION_PROMPT_SEEN_KEY = 'remote_jobs_notification_prompt_shown_v1';
const NOTIFICATIONS_STORAGE_KEY = 'remote_jobs_user_notifications_v1';
const LAST_HIGHEST_TASK_ALERT_KEY = 'remote_jobs_last_highest_task_alert_time_v1';
const LAST_ALERTED_TASK_ID_KEY = 'remote_jobs_last_alerted_task_id_v1';

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_highest_task_preview',
    title: '🔥 $2.50 High-Payout Task Live: VIP Offer Locker',
    body: 'Complete a quick verified sponsor requirement to earn $2.50 cash balance. Tap to start now!',
    type: 'TASK_CREDIT',
    createdAt: '5m ago',
    isRead: false,
    targetScreen: 'MICRO_JOBS',
    taskId: 'cpalead_locker_67493',
    reward: '$2.50',
    actionUrl: 'https://www.fastsvr.com/unlock/suMfPdJ?publisherUserId=3367742',
  },
  {
    id: 'notif_1',
    title: '💼 New Remote Job: Senior Mobile Engineer',
    body: 'Nexus Cloud is hiring React Native developers ($85k - $120k). Tap to apply!',
    type: 'JOB_ALERT',
    createdAt: '15m ago',
    isRead: false,
    targetScreen: 'REMOTE_JOBS',
  },
  {
    id: 'notif_2',
    title: '⭐ Google Play Review Bonus Available',
    body: 'Submit a verified rating on Google Play to claim $1.00 instant reward.',
    type: 'TASK_CREDIT',
    createdAt: '1h ago',
    isRead: false,
    targetScreen: 'MICRO_JOBS',
    taskId: 'playstore_inapp_review_v1',
    reward: '$1.00',
  },
  {
    id: 'notif_3',
    title: '💰 Payout Cycle Notice',
    body: 'The monthly payout window is active. Payouts are distributed on the 27th.',
    type: 'PAYOUT_UPDATE',
    createdAt: '1d ago',
    isRead: true,
    targetScreen: 'PAYOUT',
  },
];

export const NotificationService = {
  async isPermissionGranted(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(NOTIFICATION_PERMISSION_KEY);
      return val === 'true';
    } catch (_) {
      return false;
    }
  },

  async hasSeenPermissionPrompt(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(NOTIFICATION_PROMPT_SEEN_KEY);
      return val === 'true';
    } catch (_) {
      return false;
    }
  },

  async requestNativeDevicePermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        if (typeof Platform.Version === 'number' ? Platform.Version >= 33 : parseInt(String(Platform.Version), 10) >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Remote Jobs Notification Permission',
              message: 'Get real-time alerts for highest-paying tasks, remote jobs, and application updates.',
              buttonPositive: 'Allow',
              buttonNegative: 'Don\'t Allow',
            }
          );
          const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
          await this.setPermissionGranted(isGranted);
          if (isGranted) {
            await this.initializeFcmTopicSubscription();
          }
          return isGranted;
        }
      }
      await this.setPermissionGranted(true);
      await this.initializeFcmTopicSubscription();
      return true;
    } catch (_) {
      return false;
    }
  },

  async initializeFcmTopicSubscription(): Promise<string | null> {
    try {
      const { NativeModules } = require('react-native');
      const FirebasePush = NativeModules.FirebasePushModule;
      if (FirebasePush) {
        await FirebasePush.subscribeToTopic('all-users').catch(() => {});
        const token = await FirebasePush.getFcmToken().catch(() => null);
        console.log('[FCM] Device registered and subscribed to topic "all-users". Token:', token);
        return token;
      }
    } catch (e) {
      console.warn('[FCM] Error initializing push topic subscription:', e);
    }
    return null;
  },

  async setPermissionGranted(granted: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, granted ? 'true' : 'false');
      await AsyncStorage.setItem(NOTIFICATION_PROMPT_SEEN_KEY, 'true');
    } catch (_) {}
  },

  async registerPushToken(userId: string, token?: string): Promise<void> {
    try {
      let fcmToken = token;
      if (!fcmToken) {
        fcmToken = (await this.initializeFcmTopicSubscription()) || undefined;
      }
      if (fcmToken && userId) {
        await supabase.from('profiles').update({
          push_token: fcmToken,
          updated_at: new Date().toISOString(),
        }).eq('id', userId);
      }
    } catch (_) {}
  },

  async getNotifications(): Promise<AppNotification[]> {
    try {
      const raw = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
      await AsyncStorage.setItem(
        NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify(INITIAL_NOTIFICATIONS)
      );
      return INITIAL_NOTIFICATIONS;
    } catch (_) {
      return INITIAL_NOTIFICATIONS;
    }
  },

  async markAsRead(notificationId: string): Promise<AppNotification[]> {
    try {
      const list = await this.getNotifications();
      const updated = list.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n
      );
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (_) {
      return INITIAL_NOTIFICATIONS;
    }
  },

  async markAllAsRead(): Promise<AppNotification[]> {
    try {
      const list = await this.getNotifications();
      const updated = list.map((n) => ({ ...n, isRead: true }));
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (_) {
      return [];
    }
  },

  async triggerInAppNotification(
    title: string,
    body: string,
    type: 'JOB_ALERT' | 'PAYOUT_UPDATE' | 'TASK_CREDIT' | 'SECURITY',
    targetScreen?: 'REMOTE_JOBS' | 'MICRO_JOBS' | 'PAYOUT' | 'POLICY',
    meta?: { taskId?: string; reward?: string; actionUrl?: string }
  ): Promise<AppNotification> {
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      title,
      body,
      type,
      createdAt: 'Just now',
      isRead: false,
      targetScreen,
      taskId: meta?.taskId,
      reward: meta?.reward,
      actionUrl: meta?.actionUrl,
    };

    try {
      const list = await this.getNotifications();
      const updated = [newNotif, ...list];
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {}

    return newNotif;
  },

  /**
   * Fetch active micro-tasks for user and determine the single highest-paying task
   */
  async fetchHighestPayingTask(userId: string): Promise<HighestPayingTaskInfo | null> {
    try {
      const { JobsService } = require('./jobs');
      const jobs = await JobsService.getJobs(userId, false);
      if (!Array.isArray(jobs) || jobs.length === 0) return null;

      // Filter out completed tasks and zero-payout tasks
      const validTasks = jobs.filter(
        (j: any) => !j.isCompleted && typeof j.rewardUsd === 'number' && j.rewardUsd > 0
      );
      if (validTasks.length === 0) return null;

      // Sort candidate tasks strictly descending by reward USD
      validTasks.sort((a: any, b: any) => b.rewardUsd - a.rewardUsd);
      const top = validTasks[0];

      return {
        id: top.id,
        title: top.title,
        rewardUsd: top.rewardUsd,
        rewardFormatted: `$${top.rewardUsd.toFixed(2)}`,
        category: top.category || 'SURVEY',
        description: top.description || '',
        actionUrl: top.actionUrl,
        network: top.network,
      };
    } catch (err) {
      console.warn('[NotificationService] Error fetching highest paying task:', err);
      return null;
    }
  },

  /**
   * Generate dynamic, high-converting notification title and body designed
   * to maximize click-through and bring users directly into the app.
   */
  generateHighestPayingTaskAlert(task: HighestPayingTaskInfo): { title: string; body: string } {
    const reward = task.rewardFormatted;
    const cleanTitle = task.title.length > 36 ? task.title.slice(0, 33).trim() + '...' : task.title;

    const templates = [
      {
        title: `🔥 ${reward} Task Available: ${cleanTitle}`,
        body: `Top paying task is live! Complete "${cleanTitle}" now and cash out ${reward} straight to your balance.`,
      },
      {
        title: `⚡ Top Earning Alert: Earn ${reward} Now`,
        body: `"${cleanTitle}" has limited capacity open. Tap here to start and claim your ${reward} payout instantly!`,
      },
      {
        title: `💰 High-Payout Bounty: ${reward} Live`,
        body: `New high-value task waiting for you! Finish "${cleanTitle}" to unlock instant ${reward} cash.`,
      },
      {
        title: `🚀 Instant Payout: ${reward} on "${cleanTitle}"`,
        body: `Earn ${reward} in just minutes! Open the app now and start earning today.`,
      },
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  },

  /**
   * Fetch highest-paying task and display an immediate in-app banner alert
   */
  async triggerHighestPayingTaskInAppAlert(userId: string): Promise<AppNotification | null> {
    const highest = await this.fetchHighestPayingTask(userId);
    if (!highest) return null;

    const alert = this.generateHighestPayingTaskAlert(highest);
    const notif = await this.triggerInAppNotification(
      alert.title,
      alert.body,
      'TASK_CREDIT',
      'MICRO_JOBS',
      {
        taskId: highest.id,
        reward: highest.rewardFormatted,
        actionUrl: highest.actionUrl,
      }
    );
    return notif;
  },

  /**
   * Automatically check and sync the highest-paying task notification on app start / resume.
   * Uses a smart 2-hour cooldown so users aren't spammed on every screen switch.
   */
  async syncHighestPayingTaskAlert(userId: string): Promise<AppNotification | null> {
    try {
      const lastTimeRaw = await AsyncStorage.getItem(LAST_HIGHEST_TASK_ALERT_KEY);
      const lastTaskId = await AsyncStorage.getItem(LAST_ALERTED_TASK_ID_KEY);
      const now = Date.now();
      const COOLDOWN_MS = 1000 * 60 * 60 * 2; // 2 hours

      const highest = await this.fetchHighestPayingTask(userId);
      if (!highest) return null;

      const timeElapsed = lastTimeRaw ? now - parseInt(lastTimeRaw, 10) : Infinity;
      const isNewTopTask = highest.id !== lastTaskId;

      if (timeElapsed >= COOLDOWN_MS || isNewTopTask) {
        await AsyncStorage.setItem(LAST_HIGHEST_TASK_ALERT_KEY, String(now));
        await AsyncStorage.setItem(LAST_ALERTED_TASK_ID_KEY, highest.id);

        const alert = this.generateHighestPayingTaskAlert(highest);
        return await this.triggerInAppNotification(
          alert.title,
          alert.body,
          'TASK_CREDIT',
          'MICRO_JOBS',
          {
            taskId: highest.id,
            reward: highest.rewardFormatted,
            actionUrl: highest.actionUrl,
          }
        );
      }
    } catch (e) {
      console.warn('[NotificationService] Error in syncHighestPayingTaskAlert:', e);
    }
    return null;
  },

  /**
   * Dispatch remote push notification via Supabase Edge Function with dynamic highest-paying task
   */
  async sendHighestPayingTaskPush(options?: { topic?: string; token?: string }): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          topic: options?.topic || 'all-users',
          token: options?.token,
          fetchHighestTask: true,
        },
      });
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[NotificationService] Failed to send push notification via Supabase:', err);
      return { success: false, error: String(err) };
    }
  },
};
