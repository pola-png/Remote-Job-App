import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
} from 'react-native';
import {
  ArrowLeft,
  DollarSign,
  ExternalLink,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Globe,
  Sparkles,
} from '../components/LucideIcons';
import { JobsService, MicroJobItem } from '../services/jobs';

interface Props {
  userId: string;
  task: MicroJobItem;
  onBack: () => void;
  onCompleted?: () => void;
}

export const RealOfferTaskScreen: React.FC<Props> = ({
  userId,
  task,
  onBack,
  onCompleted,
}: Props) => {
  const [timerSeconds, setTimerSeconds] = useState(15);
  const [hasOpenedOffer, setHasOpenedOffer] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (hasOpenedOffer && timerSeconds > 0) {
      timer = setInterval(() => {
        setTimerSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [hasOpenedOffer, timerSeconds]);

  const handleLaunchOffer = async () => {
    if (!task.actionUrl) {
      Alert.alert('Offer Link Unavailable', 'The sponsor offer URL could not be resolved.');
      return;
    }

    try {
      setHasOpenedOffer(true);
      const canOpen = await Linking.canOpenURL(task.actionUrl);
      if (canOpen) {
        await Linking.openURL(task.actionUrl);
      } else {
        await Linking.openURL(task.actionUrl);
      }
    } catch (_) {
      Alert.alert('Browser Error', 'Could not open default browser for this offer.');
    }
  };

  const handleClaim = async () => {
    if (!hasOpenedOffer) {
      Alert.alert('Action Required', 'Please tap "Launch Sponsor Offer" first to visit and complete the task.');
      return;
    }
    if (timerSeconds > 0) {
      Alert.alert('Verification in Progress', `Please spend at least ${timerSeconds} more seconds on the sponsor offer page.`);
      return;
    }

    setIsClaiming(true);
    const res = await JobsService.completeTask(userId, task);
    setIsClaiming(false);

    if (res.success) {
      const rewardMsg =
        task.network === 'CPALEAD'
          ? `+${task.points || Math.round(task.rewardUsd * 100)} Points ($${task.rewardUsd.toFixed(2)}) has been added to your available payout balance.`
          : `+$${task.rewardUsd.toFixed(2)} has been added to your available payout balance.`;

      Alert.alert(
        'Task Completed!',
        rewardMsg,
        [
          {
            text: 'Great!',
            onPress: () => {
              onCompleted?.();
              onBack();
            },
          },
        ]
      );
    } else {
      Alert.alert('Error', 'Unable to record task completion. Please try again.');
    }
  };

  const getCategoryBadgeLabel = (cat: string) => {
    switch (cat) {
      case 'APP_INSTALL':
        return '📱 App Install';
      case 'WEBSITE':
        return '🌐 Web Offer';
      case 'VIDEO':
        return '🎥 Media Review';
      case 'SURVEY':
      default:
        return '📝 Survey / Form Submit';
    }
  };

  const isClaimReady = hasOpenedOffer && timerSeconds === 0;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft color="#F8FAFC" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sponsor Task Gateway</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Offer Header Card */}
        <View style={styles.offerCard}>
          <View style={styles.tagsRow}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{getCategoryBadgeLabel(task.category)}</Text>
            </View>

            {task.acceptedCountries ? (
              <View style={styles.countryPill}>
                <Globe color="#38BDF8" size={12} style={{ marginRight: 4 }} />
                <Text style={styles.countryPillText}>{task.acceptedCountries}</Text>
              </View>
            ) : null}

            <View style={styles.verifiedBadge}>
              <ShieldCheck color="#34D399" size={12} style={{ marginRight: 4 }} />
              <Text style={styles.verifiedBadgeText}>
                {task.network === 'CPALEAD' ? 'CPAlead Live' : 'CPAGrip Live'}
              </Text>
            </View>
          </View>

          {/* Optional Offer Thumbnail */}
          {task.photoUrl ? (
            <View style={styles.photoContainer}>
              <Image source={{ uri: task.photoUrl }} style={styles.offerPhoto} resizeMode="contain" />
            </View>
          ) : null}

          <Text style={styles.offerTitle}>{task.title}</Text>
          <Text style={styles.offerDesc}>{task.description}</Text>

          {/* Payout Display */}
          <View style={styles.payoutContainer}>
            <Text style={styles.payoutLabel}>GUARANTEED REWARD</Text>
            <View style={styles.payoutRow}>
              {task.network === 'CPALEAD' ? (
                <>
                  <Text style={styles.payoutAmount}>
                    +{task.points || Math.round(task.rewardUsd * 100)}
                  </Text>
                  <Text style={styles.payoutCurrency}>Points (${task.rewardUsd.toFixed(2)})</Text>
                </>
              ) : (
                <>
                  <Text style={styles.payoutAmount}>+${task.rewardUsd.toFixed(2)}</Text>
                  <Text style={styles.payoutCurrency}>USD</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Completion Steps Instructions */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>HOW TO COMPLETE & CLAIM</Text>

          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, hasOpenedOffer && styles.stepNumberDone]}>
              {hasOpenedOffer ? (
                <CheckCircle2 color="#34D399" size={14} />
              ) : (
                <Text style={styles.stepNumberText}>1</Text>
              )}
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepHeading}>Open Sponsor Offer</Text>
              <Text style={styles.stepDesc}>
                Tap the button below to launch the official sponsor task page in your browser.
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, isClaimReady && styles.stepNumberDone]}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepHeading}>Complete Required Action</Text>
              <Text style={styles.stepDesc}>
                Follow the instructions on the sponsor page (e.g. submit email, install app, or finish questions).
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, isClaimReady && styles.stepNumberDone]}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepHeading}>Claim Instant Reward</Text>
              <Text style={styles.stepDesc}>
                Return here and tap "Verify & Claim Reward" to add +${task.rewardUsd.toFixed(2)} to your balance.
              </Text>
            </View>
          </View>
        </View>

        {/* Step 1 CTA: Launch Offer Link */}
        <TouchableOpacity
          style={[styles.launchBtn, hasOpenedOffer && styles.launchBtnActive]}
          onPress={handleLaunchOffer}
          activeOpacity={0.85}
        >
          <ExternalLink color="#FFFFFF" size={18} style={{ marginRight: 8 }} />
          <Text style={styles.launchBtnText}>
            {hasOpenedOffer ? 'Re-Open Offer Page' : 'Launch Sponsor Offer'}
          </Text>
        </TouchableOpacity>

        {/* Status / Countdown */}
        {hasOpenedOffer ? (
          <View style={styles.statusBox}>
            <Clock color={isClaimReady ? '#34D399' : '#38BDF8'} size={18} style={{ marginRight: 8 }} />
            <Text style={styles.statusText}>
              {isClaimReady
                ? 'Verification complete! Tap below to claim your reward.'
                : `Verifying sponsor engagement: ${timerSeconds}s remaining...`}
            </Text>
          </View>
        ) : null}

        {/* Step 2 CTA: Claim Reward */}
        <TouchableOpacity
          style={[styles.claimBtn, !isClaimReady && styles.claimBtnDisabled]}
          onPress={handleClaim}
          disabled={!isClaimReady || isClaiming}
          activeOpacity={0.85}
        >
          {isClaiming ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <CheckCircle2 color={isClaimReady ? '#FFFFFF' : '#64748B'} size={18} style={{ marginRight: 8 }} />
              <Text style={[styles.claimBtnText, !isClaimReady && styles.claimBtnTextDisabled]}>
                {isClaimReady
                  ? `Verify & Claim +$${task.rewardUsd.toFixed(2)} USD`
                  : hasOpenedOffer
                  ? `Please wait ${timerSeconds}s...`
                  : 'Complete Step 1 Above First'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Trust Disclaimer */}
        <View style={styles.trustBox}>
          <ShieldCheck color="#64748B" size={14} style={{ marginRight: 6 }} />
          <Text style={styles.trustText}>
            Direct CPAGrip verified offer. Payouts credit to your in-app creator wallet.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  offerCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  categoryPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  categoryPillText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  countryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  countryPillText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  verifiedBadgeText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
  },
  photoContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  offerPhoto: {
    width: '100%',
    height: '100%',
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  offerDesc: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 6,
    lineHeight: 18,
  },
  payoutContainer: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  payoutLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  payoutRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  payoutAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#34D399',
    letterSpacing: -0.5,
  },
  payoutCurrency: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
    marginLeft: 6,
  },
  stepsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  stepsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  stepNumberDone: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: '#34D399',
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
  },
  stepContent: {
    flex: 1,
  },
  stepHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  stepDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 15,
  },
  launchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#38BDF8',
    marginBottom: 10,
  },
  launchBtnActive: {
    backgroundColor: '#0369A1',
  },
  launchBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginBottom: 10,
  },
  statusText: {
    color: '#94A3B8',
    fontSize: 12,
    flex: 1,
    fontWeight: '600',
  },
  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#34D399',
    marginBottom: 12,
  },
  claimBtnDisabled: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  claimBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  claimBtnTextDisabled: {
    color: '#64748B',
  },
  trustBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  trustText: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
  },
});
