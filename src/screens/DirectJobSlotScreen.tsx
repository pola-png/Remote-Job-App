import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  BackHandler,
  Linking,
} from 'react-native';
import {
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  Crown,
  ShieldCheck,
  Zap,
  Briefcase,
  Send,
  Award,
  Clock,
} from '../components/LucideIcons';
import {
  SubscriptionService,
  SubscriptionTier,
  VipDirectSlotState,
  VipDirectSlotIntake,
} from '../services/subscription';
import { BillingService } from '../services/billing';
import { NotificationService } from '../services/notifications';

interface Props {
  userId: string;
  userEmail?: string;
  currentTier: SubscriptionTier;
  onBack: () => void;
  onNavigateToSubscription: (targetTier?: SubscriptionTier) => void;
  onSubscriptionUpdated?: (tier: SubscriptionTier) => void;
}

const EXPERIENCE_OPTIONS = [
  'Entry Level / No Experience',
  '1–2 Years Experience',
  '3–5 Years Experience',
  '5+ Years Senior',
];

export const DirectJobSlotScreen: React.FC<Props> = ({
  userId,
  userEmail,
  currentTier,
  onBack,
  onNavigateToSubscription,
  onSubscriptionUpdated,
}) => {
  const [vipState, setVipState] = useState<VipDirectSlotState>({
    isActive: false,
    status: 'NOT_PURCHASED',
  });
  const [isPurchasingVip, setIsPurchasingVip] = useState(false);
  const [isPurchasingPlan, setIsPurchasingPlan] = useState<SubscriptionTier | null>(null);
  const [isSubmittingIntake, setIsSubmittingIntake] = useState(false);

  // VIP Candidate Intake Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(userEmail || '');
  const [whatsappOrPhone, setWhatsappOrPhone] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState(EXPERIENCE_OPTIONS[0]);
  const [resumeOrLinkedinUrl, setResumeOrLinkedinUrl] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const handleHardwareBack = () => {
      onBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
    return () => sub.remove();
  }, [onBack]);

  useEffect(() => {
    loadVipStatus();
  }, [userId]);

  const loadVipStatus = async () => {
    const state = await SubscriptionService.getVipDirectSlot(userId);
    setVipState(state);
    if (state.intake) {
      setFullName(state.intake.fullName);
      setEmail(state.intake.email || userEmail || '');
      setWhatsappOrPhone(state.intake.whatsappOrPhone);
      setTargetRole(state.intake.targetRole);
      setExperienceLevel(state.intake.experienceLevel || EXPERIENCE_OPTIONS[0]);
      setResumeOrLinkedinUrl(state.intake.resumeOrLinkedinUrl);
      setNotes(state.intake.notes || '');
    }
  };

  const handlePurchaseVipSlot = async () => {
    setIsPurchasingVip(true);
    const res = await BillingService.purchaseVipDirectJobSlot(userId);
    setIsPurchasingVip(false);

    if (res.success) {
      const updated = await SubscriptionService.getVipDirectSlot(userId);
      setVipState(updated);
      if (onSubscriptionUpdated) {
        onSubscriptionUpdated('PRO');
      }
      Alert.alert(
        '🎉 VIP Direct Job Slot Activated!',
        'Your $100 VIP Direct Placement Slot is now active and your account has been upgraded to PRO Career! Please complete your VIP Candidate Intake Form below so our recruitment support team can begin matching and pitching your profile.'
      );
      NotificationService.triggerInAppNotification(
        '🎯 VIP Direct Job Slot Reserved',
        'Our Recruitment Support Team is ready! Complete your VIP intake form to start direct employer placement.',
        'JOB_ALERT',
        'REMOTE_JOBS'
      );
    } else {
      if (res.message && !res.message.includes('canceled')) {
        Alert.alert('VIP Slot Notice', res.message);
      }
    }
  };

  const handleQuickPlanUpgrade = async (tier: 'PREMIUM' | 'PRO') => {
    if (currentTier === tier) {
      Alert.alert('Current Plan', `You are already on the ${tier} plan.`);
      return;
    }
    setIsPurchasingPlan(tier);
    const res = await BillingService.purchaseSubscription(tier, 'monthly', userId);
    setIsPurchasingPlan(null);

    if (res.success) {
      if (onSubscriptionUpdated) {
        onSubscriptionUpdated(tier);
      }
      Alert.alert('🎉 Plan Activated!', res.message);
    } else if (res.message && !res.message.includes('canceled')) {
      Alert.alert('Upgrade Notice', res.message);
    }
  };

  const handleSubmitVipIntake = async () => {
    if (!fullName.trim() || !email.trim() || !whatsappOrPhone.trim() || !targetRole.trim()) {
      Alert.alert(
        'Missing Information',
        'Please fill in your Full Name, Email, WhatsApp/Phone number, and Target Remote Job Role so our support team can reach you.'
      );
      return;
    }

    setIsSubmittingIntake(true);
    const intakeData: VipDirectSlotIntake = {
      fullName: fullName.trim(),
      email: email.trim(),
      whatsappOrPhone: whatsappOrPhone.trim(),
      targetRole: targetRole.trim(),
      experienceLevel,
      resumeOrLinkedinUrl: resumeOrLinkedinUrl.trim(),
      notes: notes.trim(),
    };

    const updated = await SubscriptionService.submitVipDirectSlotIntake(userId, intakeData);
    setVipState(updated);
    setIsSubmittingIntake(false);

    const subject = encodeURIComponent(
      `[VIP DIRECT JOB SLOT #${updated.orderId || 'VIP'}] ${intakeData.fullName} - ${intakeData.targetRole}`
    );
    const body = encodeURIComponent(
      `VIP DIRECT JOB PLACEMENT REQUEST\n` +
        `================================\n` +
        `Order ID: ${updated.orderId || 'Verified Google Play Purchase'}\n` +
        `User ID: ${userId}\n` +
        `Full Name: ${intakeData.fullName}\n` +
        `Email: ${intakeData.email}\n` +
        `WhatsApp / Phone: ${intakeData.whatsappOrPhone}\n` +
        `Target Remote Role: ${intakeData.targetRole}\n` +
        `Experience Level: ${intakeData.experienceLevel}\n` +
        `CV / LinkedIn Link: ${intakeData.resumeOrLinkedinUrl || 'Will attach via email'}\n` +
        `Candidate Notes: ${intakeData.notes || 'None'}\n`
    );

    Alert.alert(
      '✅ VIP Dossier Saved!',
      'Your details have been saved. Tap "Send to Recruitment Team" to dispatch your priority placement dossier directly to our support specialists.',
      [
        {
          text: 'Send to Recruitment Team',
          onPress: () => {
            Linking.openURL(`mailto:SupportRemotehq@gmail.com?subject=${subject}&body=${body}`).catch(() => {});
          },
        },
        { text: 'Done', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.75}>
          <ArrowLeft color="#F8FAFC" size={18} />
          <Text style={styles.backBtnText}>Jobs</Text>
        </TouchableOpacity>

        <View style={styles.topBarCenter}>
          <View style={styles.topBadge}>
            <Crown color="#FBBF24" size={12} style={{ marginRight: 4 }} />
            <Text style={styles.topBadgeText}>VIP DIRECT PLACEMENT</Text>
          </View>
          <Text style={styles.topTitle} numberOfLines={1}>
            Direct Job Connection Slot
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => onNavigateToSubscription('PRO')}
          style={styles.allPlansBtn}
          activeOpacity={0.75}
        >
          <Text style={styles.allPlansBtnText}>Plans</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* HERO BANNER: $100 ONE-TIME VIP CONCIERGE SLOT */}
        <View style={styles.vipHeroCard}>
          <View style={styles.vipRibbonRow}>
            <View style={styles.vipRibbonBadge}>
              <Sparkles color="#0F172A" size={12} style={{ marginRight: 4 }} />
              <Text style={styles.vipRibbonText}>DEDICATED HUMAN RECRUITMENT TEAM</Text>
            </View>
            <View style={styles.vipSlotLimitBadge}>
              <Text style={styles.vipSlotLimitText}>LIMITED SLOTS</Text>
            </View>
          </View>

          <Text style={styles.vipHeroTitle}>
            Skip the Stress — Let Our Support Team Help Land Your Remote Job
          </Text>
          <Text style={styles.vipHeroSubtitle}>
            Stop sending hundreds of applications into a black hole. Reserve a{' '}
            <Text style={{ color: '#FBBF24', fontWeight: '800' }}>VIP Direct Job Connection Slot</Text>{' '}
            and our career specialists will overhaul your CV, match your skills, and pitch you directly to verified hiring managers.
          </Text>

          {/* Price Box */}
          <View style={styles.priceHighlightBox}>
            <View style={{ flex: 1 }}>
              <Text style={styles.priceBoxLabel}>VIP Direct Placement Concierge</Text>
              <Text style={styles.priceBoxSub}>
                One-time payment • Includes 1-on-1 Support + PRO Career Pass
              </Text>
            </View>
            <View style={styles.priceRightCol}>
              <Text style={styles.priceAmount}>$100</Text>
              <Text style={styles.priceOneTimeTag}>ONE-TIME</Text>
            </View>
          </View>

          {/* Benefits List */}
          <View style={styles.benefitsList}>
            {[
              '1-on-1 Dedicated Recruitment Specialist assigned to your profile',
              'Complete ATS Resume, Cover Letter & Remote Portfolio optimization',
              'Direct profile pitching & warm introductions to partner employers',
              'Priority interview slot coordination & salary negotiation prep',
              'Includes full PRO Career Membership (Ad-Free + 3h Early Access + Match %)',
            ].map((benefit, idx) => (
              <View key={idx} style={styles.benefitItem}>
                <CheckCircle2 color="#34D399" size={16} style={{ marginRight: 8, marginTop: 1 }} />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          {/* Primary CTA or Active Status */}
          {vipState.isActive ? (
            <View style={styles.vipActiveBanner}>
              <ShieldCheck color="#34D399" size={20} style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.vipActiveTitle}>
                  VIP Direct Job Slot Active ({vipState.orderId || 'Verified'})
                </Text>
                <Text style={styles.vipActiveSub}>
                  {vipState.status === 'TEAM_ASSIGNED'
                    ? 'Your intake dossier is submitted. Our support team is actively working on your placement.'
                    : 'Please complete the VIP Candidate Intake Form below so our team can start immediately.'}
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.vipBuyBtn}
              onPress={handlePurchaseVipSlot}
              disabled={isPurchasingVip}
              activeOpacity={0.85}
            >
              {isPurchasingVip ? (
                <ActivityIndicator color="#0F172A" size="small" />
              ) : (
                <>
                  <Crown color="#0F172A" size={18} style={{ marginRight: 8 }} />
                  <Text style={styles.vipBuyBtnText}>
                    Get Direct Job Slot Now — $100 One-Time
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <Text style={styles.googlePlaySafeNote}>
            🔒 Secured by Google Play Billing • Instant VIP Activation & Priority Support
          </Text>
        </View>

        {/* HOW IT WORKS TIMELINE */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Award color="#38BDF8" size={18} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>How Direct Job Placement Works</Text>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Reserve Your VIP Slot & Submit Intake</Text>
              <Text style={styles.stepDesc}>
                Unlock your VIP slot for a one-time $100 fee and tell our team your preferred remote roles, skills, and availability.
              </Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>CV Overhaul & Direct Employer Pitching</Text>
              <Text style={styles.stepDesc}>
                Within 24 hours, your assigned career specialist tailors your resume and submits your profile directly to hiring managers.
              </Text>
            </View>
          </View>

          <View style={[styles.stepRow, { marginBottom: 0 }]}>
            <View style={[styles.stepCircle, { backgroundColor: 'rgba(52, 211, 153, 0.2)', borderColor: '#34D399' }]}>
              <Text style={[styles.stepNumber, { color: '#34D399' }]}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Priority Interviews & Onboarding Guidance</Text>
              <Text style={styles.stepDesc}>
                Receive direct interview slots, 1-on-1 prep guidance, and ongoing support until you start your remote position.
              </Text>
            </View>
          </View>
        </View>

        {/* VIP CANDIDATE INTAKE FORM (Always visible so users can see or fill after purchase) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Briefcase color="#FBBF24" size={18} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>VIP Recruitment Team Intake Form</Text>
          </View>
          <Text style={styles.intakeIntroText}>
            {vipState.isActive
              ? 'Fill out your career details below so your dedicated specialist can begin matching and pitching your profile right away:'
              : 'Preview the priority placement dossier our recruitment team uses after you activate your $100 VIP Direct Job Slot:'}
          </Text>

          <Text style={styles.inputLabel}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Alex Johnson"
            placeholderTextColor="#64748B"
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.inputLabel}>Contact Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#64748B"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.inputLabel}>WhatsApp / Phone Number (with Country Code) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. +1 555 234 5678"
            placeholderTextColor="#64748B"
            keyboardType="phone-pad"
            value={whatsappOrPhone}
            onChangeText={setWhatsappOrPhone}
          />

          <Text style={styles.inputLabel}>Preferred Remote Job Role(s) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Customer Support, Virtual Assistant, Data Entry, React Dev"
            placeholderTextColor="#64748B"
            value={targetRole}
            onChangeText={setTargetRole}
          />

          <Text style={styles.inputLabel}>Experience Level</Text>
          <View style={styles.expChipsRow}>
            {EXPERIENCE_OPTIONS.map((opt) => {
              const active = experienceLevel === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.expChip, active && styles.expChipActive]}
                  onPress={() => setExperienceLevel(opt)}
                >
                  <Text style={[styles.expChipText, active && styles.expChipTextActive]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.inputLabel}>Resume / CV Link or LinkedIn URL</Text>
          <TextInput
            style={styles.input}
            placeholder="https://drive.google.com/... or https://linkedin.com/in/..."
            placeholderTextColor="#64748B"
            autoCapitalize="none"
            value={resumeOrLinkedinUrl}
            onChangeText={setResumeOrLinkedinUrl}
          />

          <Text style={styles.inputLabel}>Salary Expectations & Notes for Support Team</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="Tell our team your preferred work hours, target monthly pay, or skills..."
            placeholderTextColor="#64748B"
            multiline
            value={notes}
            onChangeText={setNotes}
          />

          {vipState.isActive ? (
            <TouchableOpacity
              style={styles.submitIntakeBtn}
              onPress={handleSubmitVipIntake}
              disabled={isSubmittingIntake}
              activeOpacity={0.85}
            >
              {isSubmittingIntake ? (
                <ActivityIndicator color="#0F172A" size="small" />
              ) : (
                <>
                  <Send color="#0F172A" size={16} style={{ marginRight: 8 }} />
                  <Text style={styles.submitIntakeBtnText}>
                    {vipState.status === 'TEAM_ASSIGNED'
                      ? 'Update & Resend VIP Placement Dossier'
                      : 'Submit Dossier to VIP Placement Team'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.unlockIntakeBtn}
              onPress={handlePurchaseVipSlot}
              disabled={isPurchasingVip}
              activeOpacity={0.85}
            >
              <Crown color="#FBBF24" size={16} style={{ marginRight: 8 }} />
              <Text style={styles.unlockIntakeBtnText}>
                Unlock VIP Slot ($100) to Submit Directly to Support Team
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* SELF-SERVE FAST-TRACK PLANS ($4.99 & $9.99) */}
        <View style={styles.selfServeContainer}>
          <Text style={styles.selfServeHeader}>
            Prefer Self-Serve Fast-Track Applications?
          </Text>
          <Text style={styles.selfServeSub}>
            Upgrade your monthly membership to skip sponsor ads, unlock 3-hour early job postings, and boost your profile in employer searches:
          </Text>

          {/* PRO CAREER CARD */}
          <View style={styles.fastPlanCardPro}>
            <View style={styles.fastPlanTop}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Crown color="#FBBF24" size={16} style={{ marginRight: 6 }} />
                  <Text style={styles.fastPlanTitlePro}>PRO CAREER PASS</Text>
                </View>
                <Text style={styles.fastPlanDesc}>
                  Featured in Employer Recommended Candidates + Skill Match % + Ad-Free Direct Apply
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
                <Text style={styles.fastPlanPricePro}>$9.99</Text>
                <Text style={styles.fastPlanCycle}>/month</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.fastPlanBtnPro}
              onPress={() => handleQuickPlanUpgrade('PRO')}
              disabled={isPurchasingPlan !== null}
              activeOpacity={0.85}
            >
              {isPurchasingPlan === 'PRO' ? (
                <ActivityIndicator color="#0F172A" size="small" />
              ) : (
                <Text style={styles.fastPlanBtnProText}>
                  {currentTier === 'PRO' ? 'Current Plan (Active)' : 'Upgrade to Pro Career ($9.99/mo)'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* PREMIUM CARD */}
          <View style={styles.fastPlanCardPremium}>
            <View style={styles.fastPlanTop}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Zap color="#38BDF8" size={16} style={{ marginRight: 6 }} />
                  <Text style={styles.fastPlanTitlePremium}>PREMIUM FAST-TRACK</Text>
                </View>
                <Text style={styles.fastPlanDesc}>
                  Last 3h & 24h early jobs + Entry-level & High-Pay filters + Ad-Free Direct Apply
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
                <Text style={styles.fastPlanPricePremium}>$4.99</Text>
                <Text style={styles.fastPlanCycle}>/month</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.fastPlanBtnPremium}
              onPress={() => handleQuickPlanUpgrade('PREMIUM')}
              disabled={isPurchasingPlan !== null}
              activeOpacity={0.85}
            >
              {isPurchasingPlan === 'PREMIUM' ? (
                <ActivityIndicator color="#0F172A" size="small" />
              ) : (
                <Text style={styles.fastPlanBtnPremiumText}>
                  {currentTier === 'PREMIUM' ? 'Current Plan (Active)' : 'Upgrade to Premium ($4.99/mo)'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 5,
  },
  topBarCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
    marginBottom: 2,
  },
  topBadgeText: {
    color: '#FBBF24',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  topTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  allPlansBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  allPlansBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  vipHeroCard: {
    backgroundColor: '#131C31',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    marginBottom: 18,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
  vipRibbonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 6,
  },
  vipRibbonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBBF24',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  vipRibbonText: {
    color: '#0F172A',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  vipSlotLimitBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  vipSlotLimitText: {
    color: '#FCA5A5',
    fontSize: 10,
    fontWeight: '800',
  },
  vipHeroTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 27,
    marginBottom: 8,
  },
  vipHeroSubtitle: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  priceHighlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    marginBottom: 14,
  },
  priceBoxLabel: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
  },
  priceBoxSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  priceRightCol: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  priceAmount: {
    color: '#FBBF24',
    fontSize: 26,
    fontWeight: '900',
  },
  priceOneTimeTag: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  benefitsList: {
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 9,
  },
  benefitText: {
    flex: 1,
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  vipBuyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBBF24',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  vipBuyBtnText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
  },
  vipActiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 14,
    padding: 12,
  },
  vipActiveTitle: {
    color: '#34D399',
    fontSize: 14,
    fontWeight: '800',
  },
  vipActiveSub: {
    color: '#CBD5E1',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
  googlePlaySafeNote: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
  },
  sectionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumber: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '900',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 3,
  },
  stepDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
  },
  intakeIntroText: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  inputLabel: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: '#F8FAFC',
    fontSize: 13,
    marginBottom: 12,
  },
  expChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  expChip: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  expChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    borderColor: '#38BDF8',
  },
  expChipText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  expChipTextActive: {
    color: '#38BDF8',
  },
  submitIntakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34D399',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  submitIntakeBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
  },
  unlockIntakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  unlockIntakeBtnText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '800',
  },
  selfServeContainer: {
    marginTop: 4,
  },
  selfServeHeader: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  selfServeSub: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  fastPlanCardPro: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.45)',
    marginBottom: 12,
  },
  fastPlanCardPremium: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    marginBottom: 12,
  },
  fastPlanTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  fastPlanTitlePro: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '900',
  },
  fastPlanTitlePremium: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '900',
  },
  fastPlanDesc: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  fastPlanPricePro: {
    color: '#FBBF24',
    fontSize: 20,
    fontWeight: '900',
  },
  fastPlanPricePremium: {
    color: '#38BDF8',
    fontSize: 20,
    fontWeight: '900',
  },
  fastPlanCycle: {
    color: '#94A3B8',
    fontSize: 11,
  },
  fastPlanBtnPro: {
    backgroundColor: '#FBBF24',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  fastPlanBtnProText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  fastPlanBtnPremium: {
    backgroundColor: '#38BDF8',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  fastPlanBtnPremiumText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
});

