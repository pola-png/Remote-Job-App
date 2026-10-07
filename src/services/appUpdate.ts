import { Linking, Platform, NativeModules } from 'react-native';
import { supabase } from '../config/supabase';
import { MemoryAndDiskCache } from './cache';

const { InAppUpdateModule } = NativeModules;

export interface AppUpdateInfo {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  isForceUpdate: boolean;
  releaseNotes?: string;
  playStoreUrl: string;
}

export const CURRENT_APP_VERSION = '1.0.0';
export const PLAY_STORE_PACKAGE_NAME = 'com.xapzap.app';
export const PLAY_STORE_MARKET_URL = `market://details?id=${PLAY_STORE_PACKAGE_NAME}`;
export const PLAY_STORE_WEB_URL = `https://play.google.com/store/apps/details?id=${PLAY_STORE_PACKAGE_NAME}`;

export const AppUpdateService = {
  getCurrentVersion(): string {
    return CURRENT_APP_VERSION;
  },

  /**
   * Start Google Play In-App Update directly inside the app (no redirect)
   */
  async startDirectInAppUpdate(type: 'IMMEDIATE' | 'FLEXIBLE' = 'IMMEDIATE'): Promise<{ success: boolean; message: string }> {
    if (Platform.OS === 'android' && InAppUpdateModule && InAppUpdateModule.startInAppUpdate) {
      try {
        await InAppUpdateModule.startInAppUpdate(type);
        return { success: true, message: 'Google Play In-App Update launched directly.' };
      } catch (err: any) {
        console.warn('Native Play In-App Update fallback:', err);
        // Fallback to store url if not installed via Google Play
        await this.openPlayStore();
        return { success: false, message: err.message || 'Launched Play Store' };
      }
    } else {
      await this.openPlayStore();
      return { success: true, message: 'Opened store link' };
    }
  },

  async openPlayStore(): Promise<void> {
    try {
      const canOpenMarket = await Linking.canOpenURL(PLAY_STORE_MARKET_URL);
      if (canOpenMarket) {
        await Linking.openURL(PLAY_STORE_MARKET_URL);
      } else {
        await Linking.openURL(PLAY_STORE_WEB_URL);
      }
    } catch (_) {
      try {
        await Linking.openURL(PLAY_STORE_WEB_URL);
      } catch (err) {
        console.warn('Unable to open Play Store link:', err);
      }
    }
  },

  isVersionNewer(latest: string, current: string): boolean {
    const parse = (v: string) => v.split('.').map((num) => parseInt(num, 10) || 0);
    const [lMajor = 0, lMinor = 0, lPatch = 0] = parse(latest);
    const [cMajor = 0, cMinor = 0, cPatch = 0] = parse(current);

    if (lMajor > cMajor) return true;
    if (lMajor === cMajor && lMinor > cMinor) return true;
    if (lMajor === cMajor && lMinor === cMinor && lPatch > cPatch) return true;
    return false;
  },

  async checkForUpdates(forceRefresh: boolean = false): Promise<AppUpdateInfo> {
    const defaultInfo: AppUpdateInfo = {
      updateAvailable: false,
      currentVersion: CURRENT_APP_VERSION,
      latestVersion: CURRENT_APP_VERSION,
      isForceUpdate: false,
      releaseNotes: 'Performance improvements and bug fixes.',
      playStoreUrl: PLAY_STORE_WEB_URL,
    };

    if (Platform.OS !== 'android') {
      return defaultInfo;
    }

    const cacheKey = 'app_update_check_v1';
    if (!forceRefresh) {
      const cached = await MemoryAndDiskCache.get<AppUpdateInfo>(cacheKey, 1000 * 60 * 60 * 6); // 6 hours
      if (cached) return cached;
    }

    try {
      // Check remote config table from Supabase if available
      const { data, error } = await supabase
        .from('app_config')
        .select('latest_version, min_required_version, release_notes, force_update')
        .eq('platform', 'android')
        .maybeSingle();

      if (!error && data && data.latest_version) {
        const latest = data.latest_version;
        const isNewer = this.isVersionNewer(latest, CURRENT_APP_VERSION);
        const isForce = data.force_update === true || (data.min_required_version && this.isVersionNewer(data.min_required_version, CURRENT_APP_VERSION));

        const result: AppUpdateInfo = {
          updateAvailable: isNewer,
          currentVersion: CURRENT_APP_VERSION,
          latestVersion: latest,
          isForceUpdate: isForce,
          releaseNotes: data.release_notes || 'Latest features, updated remote job postings, and optimized payout processing.',
          playStoreUrl: PLAY_STORE_WEB_URL,
        };

        await MemoryAndDiskCache.set(cacheKey, result);
        return result;
      }

      return defaultInfo;
    } catch (_) {
      return defaultInfo;
    }
  },
};
