import { NativeModules, Linking, Platform } from 'react-native';

const { InAppReviewModule } = NativeModules;

export const InAppReviewService = {
  /**
   * Request Google Play In-App Review Flow.
   * Opens the official Play Store bottom sheet review dialog inside the app without redirecting.
   */
  async requestReview(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;

    if (InAppReviewModule?.requestReview) {
      try {
        console.log('[InAppReview] Requesting in-app review flow...');
        const success = await InAppReviewModule.requestReview();
        console.log('[InAppReview] Flow completed with result:', success);
        return success;
      } catch (err) {
        console.warn('[InAppReview] Flow exception:', err);
      }
    }

    return true;
  },

  /**
   * Open the app's listing page on Play Store as fallback
   */
  async openPlayStoreListing(): Promise<void> {
    const pkg = 'com.xapzap.app';
    const marketUrl = `market://details?id=${pkg}`;
    const webUrl = `https://play.google.com/store/apps/details?id=${pkg}`;

    try {
      const supported = await Linking.canOpenURL(marketUrl);
      if (supported) {
        await Linking.openURL(marketUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch (_) {
      try {
        await Linking.openURL(webUrl);
      } catch (_) {}
    }
  },
};
