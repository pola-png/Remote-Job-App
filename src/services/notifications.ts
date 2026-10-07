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
}

const NOTIFICATION_PERMISSION_KEY = 'remote_jobs_notification_permission_granted';
const NOTIFICATION_PROMPT_SEEN_KEY = 'remote_jobs_notification_prompt_shown_v1';
const NOTIFICATIONS_STORAGE_KEY = 'remote_jobs_user_notifications_v1';

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_1',
    title: '💼 New Remote Job: Senior Mobile Engineer',
    body: 'Nexus Cloud is hiring React Native developers ($85k - $120k). Tap to apply!',
    type: 'JOB_ALERT',
    createdAt: '10m ago',
    isRead: false,
    targetScreen: 'REMOTE_JOBS',
  },
  {
    id: 'notif_2',
    title: '⚡ Task Verification Bonus Available',
    body: 'AI model annotation tasks have been refreshed. Earn up to $0.35 per batch.',
    type: 'TASK_CREDIT',
    createdAt: '1h ago',
    isRead: false,
    targetScreen: 'MICRO_JOBS',
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
              message: 'Get real-time alerts for new high-paying remote jobs and application updates.',
              buttonPositive: 'Allow',
              buttonNegative: 'Don\'t Allow',
            }
          );
          const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
          await this.setPermissionGranted(isGranted);
          return isGranted;
        }
      }
      await this.setPermissionGranted(true);
      return true;
    } catch (_) {
      return false;
    }
  },

  async setPermissionGranted(granted: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, granted ? 'true' : 'false');
      await AsyncStorage.setItem(NOTIFICATION_PROMPT_SEEN_KEY, 'true');
    } catch (_) {}
  },

  async registerPushToken(userId: string, token: string): Promise<void> {
    try {
      await supabase.from('profiles').update({
        push_token: token,
        updated_at: new Date().toISOString(),
      }).eq('id', userId);
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
    targetScreen?: 'REMOTE_JOBS' | 'MICRO_JOBS' | 'PAYOUT' | 'POLICY'
  ): Promise<AppNotification> {
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      title,
      body,
      type,
      createdAt: 'Just now',
      isRead: false,
      targetScreen,
    };

    try {
      const list = await this.getNotifications();
      const updated = [newNotif, ...list];
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {}

    return newNotif;
  },
};
