import { Linking, Platform, NativeModules } from 'react-native';
import { supabase } from '../config/supabase';
import { MemoryAndDiskCache } from './cache';

const { InAppUpdateModule } = NativeModules;

export interface AppUpdateInfo {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  currentVersionCode?: number;
  latestVersionCode?: number;
  isForceUpdate: boolean;
  releaseNotes?: string;
  playStoreUrl: string;
}

export const CURRENT_APP_VERSION = '30.0.14';
export const CURRENT_VERSION_CODE = 59;
export const PLAY_STORE_PACKAGE_NAME = 'com.xapzap.app';
export const PLAY_STORE_MARKET_URL = `market://details?id=${PLAY_STORE_PACKAGE_NAME}`;
export const PLAY_STORE_WEB_URL = `https://play.google.com/store/apps/details?id=${PLAY_STORE_PACKAGE_NAME}`;
export const REMOTE_VERSION_ENDPOINT = 'https://www.remotejobshq.online/api/app-version';

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
        console.warn('Native Play In-App Update flow failed, falling back to Play Store link:', err);
        await this.openPlayStore();
        return { success: false, message: err?.message || 'Launched Play Store' };
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

  async getInstalledVersionDetails(): Promise<{ versionCode: number; versionName: string }> {
    if (Platform.OS === 'android' && InAppUpdateModule?.getAppVersionInfo) {
      try {
        const info = await InAppUpdateModule.getAppVersionInfo();
        if (info && typeof info.versionCode === 'number') {
          return {
            versionCode: info.versionCode,
            versionName: info.versionName || CURRENT_APP_VERSION,
          };
        }
      } catch (e) {
        console.log('Unable to query native version info:', e);
      }
    }
    return {
      versionCode: CURRENT_VERSION_CODE,
      versionName: CURRENT_APP_VERSION,
    };
  },

  async checkForUpdates(forceRefresh: boolean = false): Promise<AppUpdateInfo> {
    const localInfo = await this.getInstalledVersionDetails();

    const defaultInfo: AppUpdateInfo = {
      updateAvailable: false,
      currentVersion: localInfo.versionName,
      latestVersion: localInfo.versionName,
      currentVersionCode: localInfo.versionCode,
      latestVersionCode: localInfo.versionCode,
      isForceUpdate: false,
      releaseNotes: 'Performance improvements and bug fixes.',
      playStoreUrl: PLAY_STORE_WEB_URL,
    };

    if (Platform.OS !== 'android') {
      return defaultInfo;
    }

    const cacheKey = 'app_update_check_v2';
    if (!forceRefresh) {
      const cached = await MemoryAndDiskCache.get<AppUpdateInfo>(cacheKey, 1000 * 60 * 60 * 2); // 2 hours
      if (cached) return cached;
    }

    // TIER 1: Native Google Play In-App Updates API (Official Google Play Core)
    if (InAppUpdateModule && InAppUpdateModule.checkForPlayStoreUpdate) {
      try {
        const playResult = await InAppUpdateModule.checkForPlayStoreUpdate();
        if (playResult && playResult.updateAvailable === true) {
          const availCode = playResult.availableVersionCode || (localInfo.versionCode + 1);
          const result: AppUpdateInfo = {
            updateAvailable: true,
            currentVersion: localInfo.versionName,
            latestVersion: `Build ${availCode}`,
            currentVersionCode: localInfo.versionCode,
            latestVersionCode: availCode,
            isForceUpdate: playResult.isImmediateAllowed === true && playResult.isFlexibleAllowed !== true,
            releaseNotes: 'A newer release is ready on Google Play with new job feeds and stability enhancements.',
            playStoreUrl: PLAY_STORE_WEB_URL,
          };
          await MemoryAndDiskCache.set(cacheKey, result);
          return result;
        }
      } catch (nativeErr) {
        console.log('Google Play Core in-app update check notice (falling to remote endpoint):', nativeErr);
      }
    }

    // TIER 2: Live Remote API Endpoint (Serves sideloaded, test builds, and Google Play caching lag)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const resp = await fetch(REMOTE_VERSION_ENDPOINT, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const data = await resp.json();
        const remoteVersionCode = Number(data.latestVersionCode) || 0;
        const remoteVersionName = data.latestVersionName || localInfo.versionName;
        const minRequiredCode = Number(data.minRequiredVersionCode) || 0;

        const isNewerByCode = remoteVersionCode > localInfo.versionCode;
        const isNewerByName = this.isVersionNewer(remoteVersionName, localInfo.versionName);
        const updateAvailable = isNewerByCode || isNewerByName;

        const isForce = data.forceUpdate === true || (minRequiredCode > 0 && localInfo.versionCode < minRequiredCode);

        if (updateAvailable) {
          const result: AppUpdateInfo = {
            updateAvailable: true,
            currentVersion: localInfo.versionName,
            latestVersion: remoteVersionName,
            currentVersionCode: localInfo.versionCode,
            latestVersionCode: remoteVersionCode,
            isForceUpdate: isForce,
            releaseNotes: data.releaseNotes || 'Latest features, updated remote job postings, and optimized payout processing.',
            playStoreUrl: data.playStoreUrl || PLAY_STORE_WEB_URL,
          };
          await MemoryAndDiskCache.set(cacheKey, result);
          return result;
        }
      }
    } catch (apiErr) {
      console.log('Remote version API check notice:', apiErr);
    }

    // TIER 3: Supabase app_config fallback if configured
    try {
      const { data, error } = await supabase
        .from('app_config')
        .select('latest_version, min_required_version, release_notes, force_update')
        .eq('platform', 'android')
        .maybeSingle();

      if (!error && data && data.latest_version) {
        const latest = data.latest_version;
        const isNewer = this.isVersionNewer(latest, localInfo.versionName);
        const isForce = data.force_update === true || (data.min_required_version && this.isVersionNewer(data.min_required_version, localInfo.versionName));

        if (isNewer) {
          const result: AppUpdateInfo = {
            updateAvailable: true,
            currentVersion: localInfo.versionName,
            latestVersion: latest,
            currentVersionCode: localInfo.versionCode,
            isForceUpdate: isForce,
            releaseNotes: data.release_notes || 'Latest features and updated remote job postings.',
            playStoreUrl: PLAY_STORE_WEB_URL,
          };
          await MemoryAndDiskCache.set(cacheKey, result);
          return result;
        }
      }
    } catch (_) {}

    return defaultInfo;
  },
};

