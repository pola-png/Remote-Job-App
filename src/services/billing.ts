import { NativeModules, Platform, DeviceEventEmitter } from 'react-native';
import {
  SubscriptionService,
  SubscriptionTier,
  BillingCycle,
  SUBSCRIPTION_SKUS,
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
   * Initiates $100 One-Time VIP Direct Job Placement Slot purchase via Google Play Billing
   */
  async purchaseVipDirectJobSlot(userId: string): Promise<PurchaseResult> {
    const sku = SUBSCRIPTION_SKUS.VIP_DIRECT_SLOT_100;

    if (Platform.OS === 'android' && GooglePlayBillingModule) {
      try {
        const purchaseFn =
          GooglePlayBillingModule.purchaseOneTimeProduct ||
          GooglePlayBillingModule.purchaseSubscription;
        const purchase = await purchaseFn(sku);
        if (purchase && purchase.purchaseToken) {
          await SubscriptionService.activateVipDirectSlot(userId, purchase.orderId);
          return {
            success: true,
            message:
              '🎉 VIP Direct Job Connection Slot reserved! Our Career & Recruitment Team is ready to receive your intake details.',
            orderId: purchase.orderId,
            purchaseToken: purchase.purchaseToken,
            tier: 'PRO',
          };
        }
        return {
          success: false,
          message: 'Payment verification failed. Please try again.',
        };
      } catch (err: any) {
        if (err.message && err.message.includes('canceled')) {
          return { success: false, message: 'Purchase was canceled.' };
        }

        console.warn('[BillingService] VIP Direct Slot purchase error:', err.message);
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
          if (purchase.productId === SUBSCRIPTION_SKUS.VIP_DIRECT_SLOT_100) {
            onSuccess('PRO');
            return;
          }
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
