import { supabase } from '../config/supabase';
import { MemoryAndDiskCache } from './cache';

export type SubscriptionTier = 'FREE' | 'PREMIUM' | 'PRO';
export type BillingCycle = 'monthly' | 'yearly';

export interface PlanFeature {
  title: string;
  includedInFree: boolean;
  includedInPremium: boolean;
  includedInPro: boolean;
}

export interface UserSubscription {
  tier: SubscriptionTier;
  billingCycle?: BillingCycle;
  expiresAt?: string;
  isOpenToWork?: boolean;
  preferredJobRole?: string;
  userSkills?: string[];
}

export interface FeatureGroup {
  category: string;
  features: string[];
}

export interface TierBenefitStructure {
  name: string;
  priceMonthly: string;
  priceYearly: string;
  headline: string;
  groups: FeatureGroup[];
}

export const TIER_BENEFITS: Record<SubscriptionTier, TierBenefitStructure> = {
  FREE: {
    name: 'Free',
    priceMonthly: '$0',
    priceYearly: '$0',
    headline: 'Essential remote job discovery & basic applications',
    groups: [
      {
        category: 'Core Benefits',
        features: [
          'Unlimited job browsing',
          'Unlimited job search',
          'Basic filters',
          'Country and salary filters',
          'Job-type filters',
          'Save jobs',
          'Apply to jobs',
          'Basic job alerts',
          'Basic company information',
          'Basic application tracker',
        ],
      },
    ],
  },
  PREMIUM: {
    name: 'Premium',
    priceMonthly: '$4.99/month',
    priceYearly: '$39.99/year',
    headline: 'Everything in Free, plus:',
    groups: [
      {
        category: 'Job Discovery',
        features: [
          'Unlimited personalized job matching',
          'Advanced filters',
          'Jobs posted in the last 24 hours',
          'Jobs posted in the last 3 hours',
          'Early job alerts',
          'Salary-range filtering',
          '"Can I apply from my country?" filter',
          'Worldwide jobs filter',
          'No-experience jobs',
          'Entry-level jobs',
          'Part-time remote jobs',
          'High-paying jobs',
          'Verified employer filter',
        ],
      },
      {
        category: 'Applications',
        features: [
          'Unlimited application tracking',
          'Interview reminders',
          'Follow-up reminders',
          'Application notes',
          'Saved job collections',
          'Application status management',
        ],
      },
      {
        category: 'Alerts',
        features: [
          'Personalized job alerts',
          'Early access to matching jobs',
          'New-job notifications based on skills, salary and location',
        ],
      },
    ],
  },
  PRO: {
    name: 'Pro Career',
    priceMonthly: '$9.99/month',
    priceYearly: '$79.99/year',
    headline: 'Everything in Premium, plus:',
    groups: [
      {
        category: 'Advanced Job Matching',
        features: [
          'Advanced job matching',
          'Detailed job-to-candidate match score',
          'Skill matching',
          'Experience matching',
          'Salary matching',
          'Location/eligibility matching',
          'Missing-skill identification',
          'Job competitiveness insights',
        ],
      },
      {
        category: 'Employer Visibility',
        features: [
          'Recommended to relevant employers',
          'Appears in employer recommended candidates',
          'Higher visibility in relevant employer searches',
          'Employer discovery based on skills and experience',
          '"Open to Work" / "Available for Remote Work" status',
          'Priority consideration for relevant employer opportunities',
        ],
      },
      {
        category: 'Advanced Features',
        features: [
          'Salary comparison',
          'Company comparison',
          'Advanced application analytics',
          'Multiple career profiles',
          'Priority job alerts',
        ],
      },
    ],
  },
};

export const SUBSCRIPTION_SKUS = {
  PREMIUM_MONTHLY: 'premium_monthly',
  PREMIUM_YEARLY: 'premium_yearly',
  PRO_MONTHLY: 'pro_monthly',
  PRO_YEARLY: 'pro_yearly',
} as const;

export function getSkuForPlan(tier: SubscriptionTier, cycle: BillingCycle = 'monthly'): string | null {
  if (tier === 'PREMIUM') {
    return cycle === 'yearly' ? SUBSCRIPTION_SKUS.PREMIUM_YEARLY : SUBSCRIPTION_SKUS.PREMIUM_MONTHLY;
  }
  if (tier === 'PRO') {
    return cycle === 'yearly' ? SUBSCRIPTION_SKUS.PRO_YEARLY : SUBSCRIPTION_SKUS.PRO_MONTHLY;
  }
  return null;
}

export function getPlanForSku(sku: string): { tier: SubscriptionTier; cycle: BillingCycle } | null {
  switch (sku) {
    case 'premium_monthly':
      return { tier: 'PREMIUM', cycle: 'monthly' };
    case 'premium_yearly':
      return { tier: 'PREMIUM', cycle: 'yearly' };
    case 'pro_monthly':
      return { tier: 'PRO', cycle: 'monthly' };
    case 'pro_yearly':
      return { tier: 'PRO', cycle: 'yearly' };
    default:
      return null;
  }
}

export const PLAN_PRICING = {
  FREE: {
    monthly: 0,
    yearly: 0,
    name: 'Free',
    tagline: 'Essential remote job discovery & basic applications',
  },
  PREMIUM: {
    monthly: 4.99,
    yearly: 39.99,
    name: 'Premium',
    tagline: 'Early alerts, advanced filters & ad-free direct applications',
    badge: 'Popular',
    monthlySku: SUBSCRIPTION_SKUS.PREMIUM_MONTHLY,
    yearlySku: SUBSCRIPTION_SKUS.PREMIUM_YEARLY,
  },
  PRO: {
    monthly: 9.99,
    yearly: 79.99,
    name: 'Pro Career',
    tagline: 'Candidate skill matching, profile boost & employer recommended status',
    badge: 'Best Value',
    monthlySku: SUBSCRIPTION_SKUS.PRO_MONTHLY,
    yearlySku: SUBSCRIPTION_SKUS.PRO_YEARLY,
  },
};

export const PLAN_FEATURES: PlanFeature[] = [
  { title: 'Unlimited job browsing & search', includedInFree: true, includedInPremium: true, includedInPro: true },
  { title: 'Basic category, country & job-type filters', includedInFree: true, includedInPremium: true, includedInPro: true },
  { title: 'Save jobs & track applications', includedInFree: true, includedInPremium: true, includedInPro: true },
  { title: 'Ad-free instant direct apply (No sponsor ads)', includedInFree: false, includedInPremium: true, includedInPro: true },
  { title: 'Jobs posted in last 24h & 3h early access', includedInFree: false, includedInPremium: true, includedInPro: true },
  { title: 'No-experience & Entry-level remote filters', includedInFree: false, includedInPremium: true, includedInPro: true },
  { title: 'High-paying ($100k+) & Worldwide filters', includedInFree: false, includedInPremium: true, includedInPro: true },
  { title: 'Interview & follow-up reminders with notes', includedInFree: false, includedInPremium: true, includedInPro: true },
  { title: 'Detailed candidate-to-job skill match score (%)', includedInFree: false, includedInPremium: false, includedInPro: true },
  { title: 'Missing-skill identification & profile recommendations', includedInFree: false, includedInPremium: false, includedInPro: true },
  { title: 'Featured in Employer Recommended Candidates', includedInFree: false, includedInPremium: false, includedInPro: true },
  { title: '“Open to Work” verified remote candidate badge', includedInFree: false, includedInPremium: false, includedInPro: true },
  { title: 'Salary & company comparison tools', includedInFree: false, includedInPremium: false, includedInPro: true },
];

export const SubscriptionService = {
  async getUserSubscription(userId: string): Promise<UserSubscription> {
    const cacheKey = `user_sub_${userId}`;
    const cached = await MemoryAndDiskCache.get<UserSubscription>(cacheKey, 1000 * 60 * 15);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_period, is_open_to_work, preferred_skills')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data && data.subscription_tier) {
        const sub: UserSubscription = {
          tier: (data.subscription_tier as SubscriptionTier) || 'FREE',
          billingCycle: (data.subscription_period as BillingCycle) || 'monthly',
          isOpenToWork: data.is_open_to_work ?? false,
          userSkills: data.preferred_skills || ['React', 'TypeScript', 'Node.js', 'Remote Work', 'Communication'],
        };
        await MemoryAndDiskCache.set(cacheKey, sub);
        return sub;
      }
    } catch (_) {}

    const defaultSub: UserSubscription = {
      tier: 'FREE',
      billingCycle: 'monthly',
      isOpenToWork: false,
      userSkills: ['React', 'TypeScript', 'Node.js', 'Remote Work', 'Communication'],
    };
    return defaultSub;
  },

  async upgradeSubscription(
    userId: string,
    tier: SubscriptionTier,
    cycle: BillingCycle = 'monthly'
  ): Promise<{ success: boolean; message: string; sub?: UserSubscription }> {
    try {
      const sub: UserSubscription = {
        tier,
        billingCycle: cycle,
        isOpenToWork: tier === 'PRO',
        userSkills: ['React', 'TypeScript', 'Node.js', 'Remote Work', 'Communication'],
      };

      // Save locally immediately
      const cacheKey = `user_sub_${userId}`;
      await MemoryAndDiskCache.set(cacheKey, sub);

      // Save to Supabase in background
      (async () => {
        try {
          await supabase.from('profiles').update({
            subscription_tier: tier,
            subscription_period: cycle,
            is_open_to_work: tier === 'PRO',
            updated_at: new Date().toISOString(),
          }).eq('id', userId);
        } catch (_) {}
      })();

      return {
        success: true,
        message: `Congratulations! You are now on the ${PLAN_PRICING[tier].name} Plan.`,
        sub,
      };
    } catch (e: any) {
      return { success: false, message: e.message || 'Upgrade failed' };
    }
  },

  async toggleOpenToWork(userId: string, isOpen: boolean): Promise<boolean> {
    try {
      const sub = await this.getUserSubscription(userId);
      sub.isOpenToWork = isOpen;
      await MemoryAndDiskCache.set(`user_sub_${userId}`, sub);

      supabase.from('profiles').update({
        is_open_to_work: isOpen,
      }).eq('id', userId).then(() => {});

      return true;
    } catch (_) {
      return false;
    }
  },

  isAdFree(tier: SubscriptionTier): boolean {
    return tier === 'PREMIUM' || tier === 'PRO';
  },

  canAccessEarlyJobs(tier: SubscriptionTier): boolean {
    return tier === 'PREMIUM' || tier === 'PRO';
  },

  canAccessMatchScore(tier: SubscriptionTier): boolean {
    return tier === 'PRO';
  },

  canAccessAdvancedFilters(tier: SubscriptionTier): boolean {
    return tier === 'PREMIUM' || tier === 'PRO';
  },
};
