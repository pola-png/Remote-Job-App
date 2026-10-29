import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  BackHandler,
  ActivityIndicator,
  StatusBar,
  Modal,
} from 'react-native';
import {
  ArrowLeft,
  DollarSign,
  Play,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  ShieldAlert,
  TrendingUp,
  Video,
  Coins,
  X,
} from '../components/LucideIcons';
import { JobsService, MicroJobItem } from '../services/jobs';
import { WatchAdsService, WatchAdsStats, getWatchAdReward, getWatchAdPoints } from '../services/watchAdsService';
import { AdMobService } from '../services/admob';
import { AdTierService } from '../services/adTierService';

interface Props {
  userId: string;
  userEmail?: string;
  isAdmin?: boolean;
  onBack: () => void;
  onBalanceUpdated?: (newBalance: number) => void;
}

const ITEM_HEIGHT = 80;

export const WatchAdsScreen: React.FC<Props> = ({
  userId,
  userEmail,
  isAdmin: initialIsAdmin,
  onBack,
  onBalanceUpdated,
}: Props) => {
  const [balance, setBalance] = useState<number>(0);
  const [tasks, setTasks] = useState<MicroJobItem[]>([]);
  const [stats, setStats] = useState<WatchAdsStats | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [isWatchingAd, setIsWatchingAd] = useState<boolean>(false);
  const [activeAdIndex, setActiveAdIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [userIsAdmin, setUserIsAdmin] = useState<boolean>(Boolean(initialIsAdmin));
  const [selectedAdForPrompt, setSelectedAdForPrompt] = useState<{
    index: number;
    points: number;
    rewardUsd: number;
  } | null>(null);

  const isAdMobEligible = userIsAdmin || AdTierService.isAdMobAllowedSync();

  // Load user data, balance, and the 500 watch ad tasks
  const loadData = useCallback(
    async (forceRefresh: boolean = false) => {
      let adm = userIsAdmin || Boolean(initialIsAdmin);
      try {
        const { AuthService } = require('../services/auth');
        const checkedAdmin = await AuthService.isAdminUser(userId);
        if (checkedAdmin) {
          adm = true;
          setUserIsAdmin(true);
          AdTierService.setAdminOverride(true);
        }
      } catch (_) {}

      const canSeeAds = adm || AdTierService.isAdMobAllowedSync();
      if (!canSeeAds) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        const [userBal, currentStats, adTasks] = await Promise.all([
          JobsService.getBalance(userId, forceRefresh),
          WatchAdsService.getStats(),
          WatchAdsService.generateWatchAdTasks(2000),
        ]);

        if (typeof userBal === 'number' && !isNaN(userBal)) {
          setBalance((prev) => Math.max(prev, userBal));
        }
        setStats(currentStats);
        setCooldownRemaining(currentStats.cooldownSecondsRemaining);
        setTasks(adTasks);
      } catch (err) {
        console.warn('[WatchAdsScreen] Failed to load watch ads data:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId, userIsAdmin, initialIsAdmin]
  );

  useEffect(() => {
    loadData();
    // Preload AdMob Rewarded ads
    if (userIsAdmin || AdTierService.isAdMobAllowedSync()) {
      AdMobService.preloadRewardedAd();
    }
  }, [loadData, userIsAdmin]);

  // Hardware Back Button Handler
  useEffect(() => {
    const handleHardwareBack = () => {
      onBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
    return () => sub.remove();
  }, [onBack]);

  // Cooldown countdown timer (10s countdown after every 5 ads)
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const interval = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownRemaining]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
  };

  // Watch Rewarded Ad Action
  const handleWatchAd = async (adIndex: number) => {
    if (!isAdMobEligible) {
      Alert.alert(
        'Not Supported',
        'Watch Ads is not available in your region at this time.'
      );
      return;
    }

    const taskId = `watch_ad_${adIndex}`;
    const targetTask = tasks.find((t) => t.id === taskId);
    if (targetTask && targetTask.isCompleted) {
      Alert.alert('Ad Completed', `You have already watched Video Ad #${adIndex}.`);
      return;
    }

    if (cooldownRemaining > 0) {
      Alert.alert(
        'Quality Pacing Active',
        `Please wait ${cooldownRemaining} seconds before watching the next video ad.`
      );
      return;
    }

    if (stats && stats.isAllCompleted) {
      Alert.alert(
        'All 2,000 Ads Completed!',
        'You have completed all 2,000 video ads available in today\'s pool! Great job.'
      );
      return;
    }

    if (isWatchingAd) return;

    setIsWatchingAd(true);
    setActiveAdIndex(adIndex);

    try {
      await AdMobService.showRewardedAd(
        async (reward: any) => {
          if (!reward?.rewardEarned) return;

          const result = await WatchAdsService.recordAdCompleted(userId, adIndex);

          // Update local balance
          setBalance(result.newBalance);
          onBalanceUpdated?.(result.newBalance);

          // Mark task as completed in local list
          setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, isCompleted: true } : t))
          );

          // If milestone 5th ad was reached, activate 10s cooldown
          if (result.cooldownTriggered) {
            setCooldownRemaining(10);
          }

          // Refresh stats
          const updatedStats = await WatchAdsService.getStats();
          setStats(updatedStats);

          const earnedPoints = getWatchAdPoints(adIndex);
          Alert.alert(
            '🎉 Points Credited!',
            `You earned +${earnedPoints} Reward Points (+$${result.reward.toFixed(2)} USD added to your balance) for watching Video Ad #${adIndex}!\n\nNotice: Please do NOT click any ads unless you are genuinely interested in what was advertised.`
          );
        },
        () => {
          // Ad dismissed
          setIsWatchingAd(false);
          setActiveAdIndex(null);
          // Preload next ad immediately
          AdMobService.preloadRewardedAd();
        },
        (err: any) => {
          setIsWatchingAd(false);
          setActiveAdIndex(null);
          AdMobService.preloadRewardedAd();
          const isClosedEarly = err?.code === 'AD_CLOSED_EARLY';
          Alert.alert(
            isClosedEarly ? 'Ad Not Completed' : 'Ad Failed to Load',
            isClosedEarly
              ? 'You closed the video before it finished playing. You must watch the full video ad to earn your reward points.'
              : 'The sponsor video ad could not be loaded right now. Please tap Retry Ad to try again.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Retry Ad',
                onPress: () => handleWatchAd(adIndex),
              },
            ]
          );
        }
      );
    } catch (err) {
      setIsWatchingAd(false);
      setActiveAdIndex(null);
      Alert.alert(
        'Ad Error',
        'Failed to display video ad. Please tap Retry Ad to try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Retry Ad',
            onPress: () => handleWatchAd(adIndex),
          },
        ]
      );
    }
  };

  // Move all watched/completed ads to the bottom of the list
  const sortedTasks = useMemo(() => {
    const uncompleted: MicroJobItem[] = [];
    const completed: MicroJobItem[] = [];

    for (const t of tasks) {
      if (t.isCompleted) {
        completed.push(t);
      } else {
        uncompleted.push(t);
      }
    }

    return [...uncompleted, ...completed];
  }, [tasks]);

  // Next available unwatched ad index
  const nextAdIndex = useMemo(() => {
    const firstUncompleted = sortedTasks.find((t) => !t.isCompleted);
    if (firstUncompleted) {
      return parseInt(firstUncompleted.id.replace('watch_ad_', ''), 10) || 1;
    }
    return stats?.nextAvailableIndex || 1;
  }, [sortedTasks, stats]);

  const nextReward = useMemo(() => {
    return getWatchAdReward(nextAdIndex);
  }, [nextAdIndex]);

  // List Item Layout for 60fps scrolling across 500 items
  const getItemLayout = (_: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1120" />

      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft color="#38BDF8" size={22} />
          <Text style={styles.backButtonText}>Tasks</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Watch & Earn
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            2,000 Daily Ads • 2–20 Pts/Ad
          </Text>
        </View>

        <View style={styles.balanceChip}>
          <Text style={styles.balanceChipText} numberOfLines={1}>
            ${balance.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Loading state */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#A855F7" />
          <Text style={styles.loadingText}>Loading 2,000 Watch Ad Slots...</Text>
        </View>
      ) : !isAdMobEligible ? (
        <View style={styles.centerContainer}>
          <ShieldAlert color="#EF4444" size={48} />
          <Text style={styles.restrictedTitle}>Region Not Eligible</Text>
          <Text style={styles.restrictedText}>
            Watch Ads is currently not available in your region. You can complete
            other high-paying CPA micro-tasks in the Tasks tab!
          </Text>
          <TouchableOpacity style={styles.returnBtn} onPress={onBack}>
            <Text style={styles.returnBtnText}>Return to Tasks</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList<MicroJobItem>
          data={sortedTasks}
          keyExtractor={(item) => item.id}
          getItemLayout={getItemLayout}
          initialNumToRender={15}
          maxToRenderPerBatch={15}
          windowSize={7}
          removeClippedSubviews={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#A855F7"
            />
          }
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.headerContent}>
              {/* Admin Mode Override Banner (if admin) */}
              {userIsAdmin && (
                <View style={styles.adminBanner}>
                  <Award color="#FBBF24" size={16} />
                  <Text style={styles.adminBannerText}>
                    ADMIN MODE ACTIVE • Watch Ads Unlocked Regardless of Tier
                  </Text>
                </View>
              )}

              {/* Compliance Notice Banner (Strict AdMob Policy Requirement) */}
              <View style={styles.complianceCard}>
                <View style={styles.complianceHeader}>
                  <ShieldAlert color="#F59E0B" size={16} />
                  <Text style={styles.complianceTitle}>AD SPONSOR NOTICE & COMPLIANCE</Text>
                </View>
                <Text style={styles.complianceBody}>
                  Please do NOT click any ads unless you are genuinely interested in the advert
                  you saw. Artificially clicking ads violates partner policy.
                </Text>
              </View>

              {/* Watch Ads Pool Stats Card */}
              <View style={styles.statsCard}>
                <View style={styles.statsHeader}>
                  <View style={styles.statsHeaderLeft}>
                    <Text style={styles.statsLabel} numberOfLines={1}>
                      DAILY REWARDED AD POOL
                    </Text>
                    <Text style={styles.statsRewardRange} numberOfLines={1}>
                      2 – 20 Points per video ad
                    </Text>
                  </View>
                  <View style={styles.totalEarnedTag}>
                    <TrendingUp color="#34D399" size={12} style={{ marginRight: 3 }} />
                    <Text style={styles.totalEarnedText} numberOfLines={1}>
                      +{Math.round((stats?.totalEarnedUsd || 0) * 100)} Pts Earned
                    </Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={styles.progressRow}>
                  <Text style={styles.progressText}>
                    {stats?.completedCount || 0} / 2,000 Completed
                  </Text>
                  <Text style={styles.progressPercentage}>
                    {Math.round(((stats?.completedCount || 0) / 2000) * 100)}%
                  </Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(
                          100,
                          ((stats?.completedCount || 0) / 2000) * 100
                        )}%`,
                      },
                    ]}
                  />
                </View>

                <View style={styles.statsRulesRow}>
                  <Text style={styles.statsRuleItem}>• 10s wait after every 5 ads</Text>
                  <Text style={styles.statsRuleItem}>• Interstitial after every 4 ads</Text>
                </View>
              </View>

              {/* Quality Pacing Cooldown Banner */}
              {cooldownRemaining > 0 && (
                <View style={styles.cooldownBanner}>
                  <Clock color="#38BDF8" size={16} />
                  <Text style={styles.cooldownText}>
                    Cooldown active: Please wait{' '}
                    <Text style={styles.cooldownHighlight}>{cooldownRemaining}s</Text> before
                    watching the next ad (Quality pacing).
                  </Text>
                </View>
              )}

              {/* Quick Play Primary Action Button */}
              {stats && !stats.isAllCompleted && (
                <TouchableOpacity
                  style={[
                    styles.primaryQuickPlayBtn,
                    (cooldownRemaining > 0 || isWatchingAd) && styles.primaryQuickPlayBtnDisabled,
                  ]}
                  onPress={() => setSelectedAdForPrompt({
                    index: nextAdIndex,
                    points: getWatchAdPoints(nextAdIndex),
                    rewardUsd: nextReward,
                  })}
                  disabled={cooldownRemaining > 0 || isWatchingAd}
                  activeOpacity={0.8}
                >
                  {isWatchingAd ? (
                    <>
                      <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.primaryQuickPlayText}>Playing Ad #{nextAdIndex}...</Text>
                    </>
                  ) : cooldownRemaining > 0 ? (
                    <>
                      <Clock color="#94A3B8" size={18} style={{ marginRight: 8 }} />
                      <Text style={styles.primaryQuickPlayTextDisabled}>
                        Pacing Cooldown ({cooldownRemaining}s)
                      </Text>
                    </>
                  ) : (
                    <>
                      <Play color="#FFFFFF" size={18} style={{ marginRight: 8 }} />
                      <Text style={styles.primaryQuickPlayText}>
                        ▶ Watch Next Ad #{nextAdIndex} (+{getWatchAdPoints(nextAdIndex)} Points)
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* List Header Label */}
              <View style={styles.listSectionHeader}>
                <Text style={styles.listSectionTitle}>ALL 2,000 VIDEO AD SLOTS</Text>
                <Text style={styles.listSectionSubtitle}>
                  {stats ? 2000 - stats.completedCount : 2000} Available
                </Text>
              </View>
            </View>
          }
          renderItem={({ item, index }) => {
            const adIndex = parseInt(item.id.replace('watch_ad_', ''), 10) || (index + 1);
            const isCompleted = Boolean(item.isCompleted);
            const isTargetedWatching = isWatchingAd && activeAdIndex === adIndex;
            const isCoolingDown = cooldownRemaining > 0;
            const adPoints = getWatchAdPoints(adIndex);

            return (
              <TouchableOpacity
                style={[
                  styles.adCard,
                  isCompleted && styles.adCardCompleted,
                ]}
                onPress={() => setSelectedAdForPrompt({
                  index: adIndex,
                  points: adPoints,
                  rewardUsd: item.rewardUsd,
                })}
                disabled={isCompleted || isCoolingDown || isWatchingAd}
                activeOpacity={0.75}
              >
                {/* Left Icon Badge */}
                <View
                  style={[
                    styles.adIconContainer,
                    isCompleted && styles.adIconContainerCompleted,
                  ]}
                >
                  {isCompleted ? (
                    <CheckCircle2 color="#34D399" size={20} />
                  ) : (
                    <Video color="#C084FC" size={20} />
                  )}
                </View>

                {/* Center Content */}
                <View style={styles.adContent}>
                  <View style={styles.adTitleRow}>
                    <Text
                      style={[
                        styles.adTitle,
                        isCompleted && styles.adTitleCompleted,
                      ]}
                      numberOfLines={1}
                    >
                      Video Ad #{adIndex}
                    </Text>
                    {isCompleted && (
                      <View style={styles.claimedPill}>
                        <Text style={styles.claimedPillText}>Claimed</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.adMetaRow}>
                    {/* Points Reward Badge (Compliant with Google Play Store & AdMob) */}
                    <View style={styles.rewardTag}>
                      <Coins color="#C084FC" size={12} />
                      <Text style={styles.rewardTagText}>
                        +{adPoints} Points
                      </Text>
                    </View>

                    <View style={styles.adDurationTag}>
                      <Clock color="#64748B" size={11} />
                      <Text style={styles.adDurationText}>30s</Text>
                    </View>

                    <View style={styles.adNetworkTag}>
                      <Text style={styles.adNetworkText}>Sponsored</Text>
                    </View>
                  </View>
                </View>

                {/* Right Action Button */}
                <View style={styles.adActionContainer}>
                  {isCompleted ? (
                    <View style={styles.doneBadge}>
                      <CheckCircle2 color="#34D399" size={16} />
                      <Text style={styles.doneBadgeText}>Done</Text>
                    </View>
                  ) : isTargetedWatching ? (
                    <View style={styles.watchingPill}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    </View>
                  ) : isCoolingDown ? (
                    <View style={styles.cooldownPill}>
                      <Clock color="#94A3B8" size={11} style={{ marginRight: 3 }} />
                      <Text style={styles.cooldownPillText}>{cooldownRemaining}s</Text>
                    </View>
                  ) : (
                    <View style={styles.watchPill}>
                      <Play color="#FFFFFF" size={11} style={{ marginRight: 4 }} />
                      <Text style={styles.watchPillText}>
                        Watch (+{adPoints} Pts)
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Pre-Roll Rewarded Video Confirmation Modal */}
      <Modal
        visible={Boolean(selectedAdForPrompt)}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedAdForPrompt(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <View style={styles.modalBadge}>
                  <Video color="#A855F7" size={14} style={{ marginRight: 4 }} />
                  <Text style={styles.modalBadgeText}>SPONSORED VIDEO AD</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedAdForPrompt(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.modalCloseBtn}
              >
                <X color="#94A3B8" size={20} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalTitle}>
              Video Ad #{selectedAdForPrompt?.index}
            </Text>

            {/* Points Reward Box */}
            <View style={styles.modalPointsBox}>
              <View style={styles.modalPointsRow}>
                <Coins color="#FBBF24" size={26} style={{ marginRight: 8 }} />
                <Text style={styles.modalPointsValue}>
                  +{selectedAdForPrompt?.points} Points
                </Text>
              </View>
              <Text style={styles.modalPointsSub}>
                Reward value: ~${selectedAdForPrompt?.rewardUsd.toFixed(2)} USD
              </Text>
            </View>

            {/* Reward Breakdown Cards */}
            <View style={styles.modalDetailsCard}>
              <View style={styles.modalDetailRow}>
                <Text style={styles.modalDetailLabel}>Reward:</Text>
                <Text style={styles.modalDetailValue}>+{selectedAdForPrompt?.points} Reward Points</Text>
              </View>
              <View style={styles.modalDetailRow}>
                <Text style={styles.modalDetailLabel}>Credit Value:</Text>
                <Text style={styles.modalDetailValueHighlight}>
                  +${selectedAdForPrompt?.rewardUsd.toFixed(2)} added to balance
                </Text>
              </View>
              <View style={styles.modalDetailRow}>
                <Text style={styles.modalDetailLabel}>Conversion Rate:</Text>
                <Text style={styles.modalDetailValue}>100 Points = $1.00 USD</Text>
              </View>
              <View style={[styles.modalDetailRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <Text style={styles.modalDetailLabel}>Duration:</Text>
                <Text style={styles.modalDetailValue}>~30 seconds</Text>
              </View>
            </View>

            {/* Policy & Guidance Notice */}
            <View style={styles.modalPolicyNotice}>
              <ShieldAlert color="#F59E0B" size={14} style={{ marginRight: 6, marginTop: 1 }} />
              <Text style={styles.modalPolicyNoticeText}>
                Please watch the video to completion without closing to receive your reward points. Do not click ads unless genuinely interested.
              </Text>
            </View>

            {/* Modal Actions */}
            <TouchableOpacity
              style={styles.modalWatchBtn}
              onPress={() => {
                const targetIndex = selectedAdForPrompt?.index;
                setSelectedAdForPrompt(null);
                if (typeof targetIndex === 'number') {
                  handleWatchAd(targetIndex);
                }
              }}
              activeOpacity={0.8}
            >
              <Play color="#FFFFFF" size={16} style={{ marginRight: 8 }} />
              <Text style={styles.modalWatchBtnText}>
                Watch Video Now (+{selectedAdForPrompt?.points} Pts)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setSelectedAdForPrompt(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0F172A',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingRight: 8,
    flexShrink: 0,
  },
  backButtonText: {
    color: '#38BDF8',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 2,
  },
  headerTitleContainer: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  balanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    flexShrink: 0,
  },
  balanceChipText: {
    color: '#FBBF24',
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  headerContent: {
    paddingTop: 14,
    paddingBottom: 6,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 12,
  },
  restrictedTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  restrictedText: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  returnBtn: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  returnBtnText: {
    color: '#0B1120',
    fontSize: 14,
    fontWeight: '700',
  },

  // Admin banner
  adminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: '#FBBF24',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  adminBannerText: {
    color: '#FDE68A',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
    flex: 1,
  },

  // Compliance Notice Card
  complianceCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  complianceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  complianceTitle: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginLeft: 6,
  },
  complianceBody: {
    color: '#FDE68A',
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '500',
  },

  // Stats Card
  statsCard: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    overflow: 'hidden',
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsHeaderLeft: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  statsLabel: {
    color: '#A855F7',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  statsRewardRange: {
    color: '#F1F5F9',
    fontSize: 13.5,
    fontWeight: '700',
    marginTop: 2,
  },
  totalEarnedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    flexShrink: 0,
  },
  totalEarnedText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  progressPercentage: {
    color: '#A855F7',
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#0F172A',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#A855F7',
    borderRadius: 4,
  },
  statsRulesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 8,
  },
  statsRuleItem: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },

  // Cooldown Banner
  cooldownBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  cooldownText: {
    color: '#E0F2FE',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  cooldownHighlight: {
    color: '#38BDF8',
    fontWeight: '800',
  },

  // Primary Quick Play Button
  primaryQuickPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9333EA',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#9333EA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryQuickPlayBtnDisabled: {
    backgroundColor: '#334155',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryQuickPlayText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  primaryQuickPlayTextDisabled: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },

  // Section Header
  listSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  listSectionTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  listSectionSubtitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },

  // Ad Slot Card
  adCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    height: 72,
  },
  adCardCompleted: {
    opacity: 0.6,
    borderColor: '#1E293B',
    backgroundColor: '#131D2E',
  },
  adIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  adIconContainerCompleted: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
  },
  adContent: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  adTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  adTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  adTitleCompleted: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  claimedPill: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 6,
  },
  claimedPillText: {
    color: '#34D399',
    fontSize: 9,
    fontWeight: '700',
  },
  adMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  rewardTagText: {
    color: '#C084FC',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 1,
  },
  adDurationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
  },
  adDurationText: {
    color: '#64748B',
    fontSize: 10.5,
    marginLeft: 3,
  },
  adNetworkTag: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  adNetworkText: {
    color: '#64748B',
    fontSize: 9.5,
    fontWeight: '600',
  },
  adActionContainer: {
    marginLeft: 8,
    flexShrink: 0,
  },
  watchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9333EA',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  watchPillText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  doneBadgeText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 3,
  },
  cooldownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cooldownPillText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  watchingPill: {
    backgroundColor: '#9333EA',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },

  // Pre-roll Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  modalBadgeText: {
    color: '#C084FC',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14,
  },
  modalPointsBox: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  modalPointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalPointsValue: {
    color: '#FBBF24',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  modalPointsSub: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  modalDetailsCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  modalDetailLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  modalDetailValue: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
  modalDetailValueHighlight: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
  },
  modalPolicyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  modalPolicyNoticeText: {
    color: '#FDE68A',
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
    fontWeight: '500',
  },
  modalWatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9333EA',
    paddingVertical: 13,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#9333EA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  modalWatchBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  modalCancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  modalCancelBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
});
