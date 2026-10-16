import { NativeModules, Platform, DeviceEventEmitter } from 'react-native';
import {
  SubscriptionService,
  SubscriptionTier,
  BillingCycle,
  getSkuForPlan,
  getPlanForSku,
  PLAN_PRICING,
} from './subscription';

const { GooglePlayBillingModule } = NativeModules;

export interface PlayProductDetails {
  productId: string;
  title: string;
  description: string;
  formattedPrice?: string;
  priceCurrencyCode?: string;
  billingPeriod?: string;
}

export interface PurchaseResult {
  success: boolean;
  message: string;
  orderId?: string;
  purchaseToken?: string;
  tier?: SubscriptionTier;
}

export const BillingService = {
  /**
   * Queries product details directly from Google Play Store
   */
  async getAvailableProducts(): Promise<PlayProductDetails[]> {
    if (Platform.OS !== 'android' || !GooglePlayBillingModule) {
      return [];
    }

    try {
      const products: PlayProductDetails[] = await GooglePlayBillingModule.getProductDetails();
      return products || [];
    } catch (_) {
      return [];
    }
  },

  /**
   * Initiates Google Play subscription purchase flow with automatic tier upgrade
   */
  async purchaseSubscription(
    tier: SubscriptionTier,
    cycle: BillingCycle,
    userId: string
  ): Promise<PurchaseResult> {
    if (tier === 'FREE') {
      const res = await SubscriptionService.upgradeSubscription(userId, 'FREE', 'monthly');
      return {
        success: res.success,
        message: 'Switched to Free plan successfully.',
        tier: 'FREE',
      };
    }

    const sku = getSkuForPlan(tier, cycle);
    if (!sku) {
      return { success: false, message: 'Invalid subscription SKU.' };
    }

    // If on Android and native module is available, use Google Play Billing
    if (Platform.OS === 'android' && GooglePlayBillingModule) {
      try {
        const purchase = await GooglePlayBillingModule.purchaseSubscription(sku);
        if (purchase && purchase.purchaseToken) {
          // Upgrade user in Supabase & local state only with verified Google Play purchase
          const upgradeRes = await SubscriptionService.upgradeSubscription(userId, tier, cycle);
          return {
            success: true,
            message: `🎉 Successfully subscribed to ${PLAN_PRICING[tier].name}!`,
            orderId: purchase.orderId,
            purchaseToken: purchase.purchaseToken,
            tier: tier,
          };
        }
        return {
          success: false,
          message: 'Payment verification failed. Please try again.',
        };
      } catch (err: any) {
        // If user canceled
        if (err.message && err.message.includes('canceled')) {
          return { success: false, message: 'Purchase was canceled.' };
        }

        console.warn('[BillingService] Native purchase flow error:', err.message);
        return {
          success: false,
          message:
            err.message ||
            'Payment could not be completed. Please ensure your Google Play account has an active payment method.',
        };
      }
    }

    return {
      success: false,
      message: 'In-app purchases are only available on Android devices.',
    };
  },

  /**
   * Listens for asynchronous purchase updates from Google Play
   */
  registerPurchaseListener(onSuccess: (tier: SubscriptionTier) => void) {
    if (Platform.OS !== 'android') return () => {};

    const subscription = DeviceEventEmitter.addListener(
      'onPlayStorePurchaseSuccess',
      (purchase: any) => {
        if (purchase && purchase.productId) {
          const plan = getPlanForSku(purchase.productId);
          if (plan) {
            onSuccess(plan.tier);
          }
        }
      }
    );

    return () => subscription.remove();
  },
};
