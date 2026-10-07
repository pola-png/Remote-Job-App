import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Sparkles,
  CheckCircle2,
  X,
  Zap,
  Crown,
  ShieldCheck,
  TrendingUp,
  Award,
} from './LucideIcons';
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
  visible: boolean;
  onClose: () => void;
  userId: string;
  currentTier: SubscriptionTier;
  onSubscriptionUpdated?: (tier: SubscriptionTier) => void;
  targetTier?: SubscriptionTier;
}

export const SubscriptionPlansModal: React.FC<Props> = ({
  visible,
  onClose,
  userId,
  currentTier,
  onSubscriptionUpdated,
  targetTier = 'PREMIUM',
}) => {
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(targetTier);
  const [isProcessing, setIsProcessing] = useState(false);

  React.useEffect(() => {
    const unsubscribe = BillingService.registerPurchaseListener((updatedTier) => {
      if (onSubscriptionUpdated) {
        onSubscriptionUpdated(updatedTier);
      }
      onClose();
    });
    return () => unsubscribe();
  }, []);

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
      onClose();
      Alert.alert('🎉 Plan Activated!', res.message);
      NotificationService.triggerInAppNotification(
        '⭐ Subscription Upgraded',
        `Welcome to ${PLAN_PRICING[tier].name}! All premium features are now unlocked.`,
        'JOB_ALERT',
        'REMOTE_JOBS'
      );
    } else {
      if (res.message && !res.message.includes('canceled')) {
        Alert.alert('Upgrade Notice', res.message);
      }
    }
  };

  if (!visible) return null;

  const currentTierBenefits = TIER_BENEFITS[selectedTier];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.headerBadge}>
                <Crown color="#F59E0B" size={14} style={{ marginRight: 4 }} />
                <Text style={styles.headerBadgeText}>Remote Jobs Career Membership</Text>
              </View>
              <Text style={styles.title}>Choose Your Plan</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color="#94A3B8" size={20} />
            </TouchableOpacity>
          </View>

          {/* Billing Cycle Switcher */}
          <View style={styles.cycleSwitcher}>
            <TouchableOpacity
              style={[styles.cycleBtn, cycle === 'monthly' && styles.cycleBtnActive]}
              onPress={() => setCycle('monthly')}
            >
              <Text style={[styles.cycleBtnText, cycle === 'monthly' && styles.cycleBtnTextActive]}>
                Monthly Billing
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cycleBtn, cycle === 'yearly' && styles.cycleBtnActive]}
              onPress={() => setCycle('yearly')}
            >
              <Text style={[styles.cycleBtnText, cycle === 'yearly' && styles.cycleBtnTextActive]}>
                Annual (Save 33%)
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Plans Selector Row */}
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
                    <Text style={[
                      styles.categoryHeaderText,
                      selectedTier === 'PRO' && { color: '#FBBF24' },
                      selectedTier === 'PREMIUM' && { color: '#38BDF8' },
                    ]}>
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

            <View style={{ height: 24 }} />
          </ScrollView>

          {/* Action Button */}
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
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerBadgeText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#334155',
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
    paddingVertical: 8,
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
  scrollBody: {},
  plansContainer: {
    gap: 10,
    marginBottom: 16,
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
    marginTop: 6,
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
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
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
});
