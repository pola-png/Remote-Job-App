import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  BackHandler,
} from 'react-native';
import {
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  X,
  Zap,
  Crown,
  ShieldCheck,
  TrendingUp,
} from '../components/LucideIcons';
import {
  SubscriptionService,
  SubscriptionTier,
  BillingCycle,
  PLAN_PRICING,
  TIER_BENEFITS,
} from '../services/subscription';
import { BillingService } from '../services/billing';
import { NotificationService } from '../services/notifications';

interface Props {
  onBack: () => void;
  userId: string;
  currentTier: SubscriptionTier;
  onSubscriptionUpdated?: (tier: SubscriptionTier) => void;
  targetTier?: SubscriptionTier;
}

export const SubscriptionPlansScreen: React.FC<Props> = ({
  onBack,
  userId,
  currentTier,
  onSubscriptionUpdated,
  targetTier = 'PREMIUM',
}) => {
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(targetTier);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleHardwareBack = () => {
      onBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
    return () => sub.remove();
  }, [onBack]);

  useEffect(() => {
    const unsubscribe = BillingService.registerPurchaseListener((updatedTier) => {
      if (onSubscriptionUpdated) {
        onSubscriptionUpdated(updatedTier);
      }
      onBack();
    });
    return () => unsubscribe();
  }, [onBack]);

  const handleSelectPlan = async (tier: SubscriptionTier) => {
    if (tier === currentTier) {
      Alert.alert('Current Plan', `You are already on the ${PLAN_PRICING[tier].name} plan.`);
      return;
    }

    setIsProcessing(true);
    const res = await BillingService.purchaseSubscription(tier, cycle, userId);
    setIsProcessing(false);

    if (res.success) {
      if (onSubscriptionUpdated) {
        onSubscriptionUpdated(tier);
      }
      Alert.alert('🎉 Plan Activated!', res.message);
      NotificationService.triggerInAppNotification(
        '⭐ Subscription Upgraded',
        `Welcome to ${PLAN_PRICING[tier].name}! All features are now unlocked.`,
        'JOB_ALERT',
        'REMOTE_JOBS'
      );
      onBack();
    } else {
      if (res.message && !res.message.includes('canceled')) {
        Alert.alert('Upgrade Notice', res.message);
      }
    }
  };

  const currentTierBenefits = TIER_BENEFITS[selectedTier];

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar with Back & Cancel Buttons */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft color="#F8FAFC" size={18} />
          <Text style={styles.backBtnLabel}>Back</Text>
        </TouchableOpacity>

        <View style={styles.topBarTitleWrapper}>
          <View style={styles.headerBadge}>
            <Crown color="#F59E0B" size={13} style={{ marginRight: 4 }} />
            <Text style={styles.headerBadgeText}>Remote Jobs Career Pass</Text>
          </View>
          <Text style={styles.topBarTitle}>Choose Your Plan</Text>
        </View>

        <TouchableOpacity onPress={onBack} style={styles.cancelBtn} activeOpacity={0.7}>
          <X color="#94A3B8" size={18} />
          <Text style={styles.cancelBtnLabel}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollBodyContent} showsVerticalScrollIndicator={false}>
        {/* Billing Cycle Switcher */}
        <View style={styles.cycleSwitcher}>
          <TouchableOpacity
            style={[styles.cycleBtn, cycle === 'monthly' && styles.cycleBtnActive]}
            onPress={() => setCycle('monthly')}
            activeOpacity={0.8}
          >
            <Text style={[styles.cycleBtnText, cycle === 'monthly' && styles.cycleBtnTextActive]}>
              Monthly Billing
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cycleBtn, cycle === 'yearly' && styles.cycleBtnActive]}
            onPress={() => setCycle('yearly')}
            activeOpacity={0.8}
          >
            <Text style={[styles.cycleBtnText, cycle === 'yearly' && styles.cycleBtnTextActive]}>
              Annual (Save 33%)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Plans Selector Cards */}
        <View style={styles.plansContainer}>
          {/* FREE TIER CARD */}
          <TouchableOpacity
            style={[
              styles.planCard,
              selectedTier === 'FREE' && styles.planCardSelected,
              currentTier === 'FREE' && styles.planCardCurrent,
            ]}
            onPress={() => setSelectedTier('FREE')}
            activeOpacity={0.8}
          >
            <View style={styles.planCardHeader}>
              <Text style={styles.planName}>FREE</Text>
              <Text style={styles.planPrice}>$0</Text>
            </View>
            <Text style={styles.planTagline}>Unlimited job search & basic applications</Text>
            {currentTier === 'FREE' && <Text style={styles.currentBadge}>Current Plan</Text>}
          </TouchableOpacity>

          {/* PREMIUM TIER CARD */}
          <TouchableOpacity
            style={[
              styles.planCard,
              styles.premiumCard,
              selectedTier === 'PREMIUM' && styles.planCardSelected,
              currentTier === 'PREMIUM' && styles.planCardCurrent,
            ]}
            onPress={() => setSelectedTier('PREMIUM')}
            activeOpacity={0.8}
          >
            <View style={styles.popularBadge}>
              <Text style={styles.popularBadgeText}>POPULAR</Text>
            </View>
            <View style={styles.planCardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Zap color="#38BDF8" size={18} style={{ marginRight: 4 }} />
                <Text style={[styles.planName, { color: '#38BDF8' }]}>PREMIUM</Text>
              </View>
              <Text style={styles.planPrice}>
                {cycle === 'monthly' ? '$4.99/mo' : '$39.99/yr'}
              </Text>
            </View>
            <Text style={styles.planTagline}>
              Jobs in last 24h & 3h, entry-level filters & ad-free direct apply
            </Text>
            {currentTier === 'PREMIUM' && <Text style={styles.currentBadge}>Current Plan</Text>}
          </TouchableOpacity>

          {/* PRO TIER CARD */}
          <TouchableOpacity
            style={[
              styles.planCard,
              styles.proCard,
              selectedTier === 'PRO' && styles.planCardSelected,
              currentTier === 'PRO' && styles.planCardCurrent,
            ]}
            onPress={() => setSelectedTier('PRO')}
            activeOpacity={0.8}
          >
            <View style={[styles.popularBadge, { backgroundColor: '#F59E0B' }]}>
              <Text style={[styles.popularBadgeText, { color: '#0F172A' }]}>BEST VALUE</Text>
            </View>
            <View style={styles.planCardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Crown color="#FBBF24" size={18} style={{ marginRight: 4 }} />
                <Text style={[styles.planName, { color: '#FBBF24' }]}>PRO CAREER</Text>
              </View>
              <Text style={styles.planPrice}>
                {cycle === 'monthly' ? '$9.99/mo' : '$79.99/yr'}
              </Text>
            </View>
            <Text style={styles.planTagline}>
              Candidate match score %, missing skills & employer recommended status
            </Text>
            {currentTier === 'PRO' && <Text style={styles.currentBadge}>Current Plan</Text>}
          </TouchableOpacity>
        </View>

        {/* Categorized Features Breakdown */}
        <View style={styles.featuresSection}>
          <View style={styles.featuresHeaderRow}>
            <Text style={styles.featuresTitle}>
              {PLAN_PRICING[selectedTier].name} Plan Benefits
            </Text>
            <Text style={styles.featuresSubtitle}>
              {currentTierBenefits.headline}
            </Text>
          </View>

          {currentTierBenefits.groups.map((group, gIdx) => (
            <View key={gIdx} style={styles.featureCategoryBlock}>
              <View style={styles.categoryHeader}>
                <Sparkles
                  color={selectedTier === 'PRO' ? '#FBBF24' : selectedTier === 'PREMIUM' ? '#38BDF8' : '#94A3B8'}
                  size={14}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.categoryHeaderText,
                    selectedTier === 'PRO' && { color: '#FBBF24' },
                    selectedTier === 'PREMIUM' && { color: '#38BDF8' },
                  ]}
                >
                  {group.category}
                </Text>
              </View>

              <View style={styles.featureItemsBox}>
                {group.features.map((feat, fIdx) => (
                  <View key={fIdx} style={styles.featureRow}>
                    <CheckCircle2
                      color={selectedTier === 'PRO' ? '#FBBF24' : selectedTier === 'PREMIUM' ? '#38BDF8' : '#34D399'}
                      size={16}
                      style={{ marginTop: 2 }}
                    />
                    <Text style={styles.featureRowText}>{feat}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Fixed Bottom Action Button & Cancel Link */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            selectedTier === 'PRO' ? styles.proBtn : selectedTier === 'PREMIUM' ? styles.premiumBtn : styles.freeBtn,
            isProcessing && { opacity: 0.6 },
          ]}
          onPress={() => handleSelectPlan(selectedTier)}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#0F172A" />
          ) : (
            <Text style={styles.actionBtnText}>
              {selectedTier === currentTier
                ? 'Current Active Plan'
                : `Switch to ${PLAN_PRICING[selectedTier].name} (${cycle === 'monthly' ? `$${PLAN_PRICING[selectedTier].monthly}/mo` : `$${PLAN_PRICING[selectedTier].yearly}/yr`})`}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerCancelBtn}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.footerCancelBtnText}>Cancel & Return to Jobs</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    gap: 4,
  },
  backBtnLabel: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    gap: 4,
  },
  cancelBtnLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  topBarTitleWrapper: {
    alignItems: 'center',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  headerBadgeText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  scrollBody: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollBodyContent: {
    paddingTop: 14,
    paddingBottom: 40,
  },
  cycleSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cycleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cycleBtnActive: {
    backgroundColor: '#1E293B',
  },
  cycleBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  cycleBtnTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  plansContainer: {
    gap: 12,
    marginBottom: 18,
  },
  planCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  premiumCard: {
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  proCard: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  planCardSelected: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  planCardCurrent: {
    borderColor: '#34D399',
  },
  popularBadge: {
    position: 'absolute',
    top: -9,
    right: 14,
    backgroundColor: '#38BDF8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  popularBadgeText: {
    color: '#0F172A',
    fontSize: 9,
    fontWeight: '800',
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  planName: {
    color: '#CBD5E1',
    fontSize: 15,
    fontWeight: '800',
  },
  planPrice: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  planTagline: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
  },
  currentBadge: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  featuresSection: {
    marginTop: 4,
  },
  featuresHeaderRow: {
    marginBottom: 12,
  },
  featuresTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  featuresSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  featureCategoryBlock: {
    marginBottom: 14,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingLeft: 2,
  },
  categoryHeaderText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  featureItemsBox: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  featureRowText: {
    flex: 1,
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  actionBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freeBtn: {
    backgroundColor: '#334155',
  },
  premiumBtn: {
    backgroundColor: '#38BDF8',
  },
  proBtn: {
    backgroundColor: '#FBBF24',
  },
  actionBtnText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  footerCancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 8,
  },
  footerCancelBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
});
