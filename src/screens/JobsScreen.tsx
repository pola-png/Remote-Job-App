import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  BackHandler,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import {
  Briefcase,
  DollarSign,
  Sparkles,
  Globe,
  Video,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Lock,
  Play,
  Award,
  Smartphone,
  Star,
  ShieldAlert,
  AlertTriangle,
} from '../components/LucideIcons';
import { JobsService, MicroJobItem } from '../services/jobs';
import { RealOfferTaskScreen } from './RealOfferTaskScreen';
import { RewardedAdModal } from '../components/RewardedAdModal';
import { NativeAdCard } from '../components/NativeAdCard';
import { AdTierService } from '../services/adTierService';
import { WatchAdsService, WatchAdsStats } from '../services/watchAdsService';
import { InAppReviewService } from '../services/inAppReview';
import { WatchAdsScreen } from './WatchAdsScreen';

interface Props {
  userId: string;
  userEmail?: string;
  isAdmin?: boolean;
  onNavigateToWatchAds?: () => void;
  highlightTaskId?: string | null;
  onClearHighlightTask?: () => void;
  isActive?: boolean;
}

type TaskCategoryFilter = 'ALL' | 'WATCH_ADS' | 'SURVEY' | 'APP_INSTALL' | 'WEBSITE';

export const JobsScreen: React.FC<Props> = ({
  userId,
  userEmail,
  isAdmin: initialIsAdmin,
  onNavigateToWatchAds,
  highlightTaskId,
  onClearHighlightTask,
  isActive,
}: Props) => {
  const [balance, setBalance] = useState<number>(0);
  const [jobs, setJobs] = useState<MicroJobItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<TaskCategoryFilter>('ALL');
  const [activeTaskView, setActiveTaskView] = useState<MicroJobItem | null>(null);
  const [selectedTaskForAd, setSelectedTaskForAd] = useState<MicroJobItem | null>(null);
  const [showRewardedAdModal, setShowRewardedAdModal] = useState<boolean>(false);
  const [watchStats, setWatchStats] = useState<WatchAdsStats | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [isWatchingAd, setIsWatchingAd] = useState<boolean>(false);
  const [userIsAdmin, setUserIsAdmin] = useState<boolean>(Boolean(initialIsAdmin));
  const [showWatchAdsView, setShowWatchAdsView] = useState<boolean>(false);
  const [reviewClaimed, setReviewClaimed] = useState<boolean>(false);

  const isAdMobEligible = userIsAdmin || AdTierService.isAdMobAllowedSync();

  // Fast-path: Load cached tasks immediately on mount (0ms) so user never sees empty screen
  useEffect(() => {
    let isMounted = true;
    JobsService.isReviewClaimed(userId).then((claimed) => {
      if (isMounted && claimed) {
        setReviewClaimed(true);
      }
    });
    JobsService.getCachedTasks(userId).then((cached) => {
      if (isMounted && cached && cached.length > 0) {
        setJobs(cached);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [userId]);

  const loadData = async (forceRefresh: boolean = false) => {
    if (jobs.length === 0) {
      setIsLoading(true);
    }
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

    const canSeeWatchAds = adm || AdTierService.isAdMobAllowedSync();

    try {
      const [userBal, userJobs, stats] = await Promise.all([
        JobsService.getBalance(userId, forceRefresh),
        JobsService.getJobs(userId, forceRefresh),
        canSeeWatchAds ? WatchAdsService.getStats() : Promise.resolve(null),
      ]);
      setBalance((prev) => (typeof userBal === 'number' && !isNaN(userBal) ? Math.max(prev, userBal) : prev));
      if (userJobs && userJobs.length > 0) {
        setJobs(userJobs);
      }
      if (stats) {
        setWatchStats(stats);
        setCooldownRemaining(stats.cooldownSecondsRemaining);
      }
    } catch (err) {
      console.warn('[JobsScreen] Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (userIsAdmin || AdTierService.isAdMobAllowedSync()) {
      const { AdMobService } = require('../services/admob');
      AdMobService.preloadRewardedAd();
      AdMobService.preloadAppOpenAd();
    } else {
      const { InMobiService } = require('../services/inmobi');
      InMobiService.preloadRewardedAd();
    }
  }, [userId, userIsAdmin, isActive]);

  // 10-second Cooldown countdown ticker
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

  useEffect(() => {
    const handleHardwareBack = () => {
      if (activeTaskView) {
        setActiveTaskView(null);
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
    return () => sub.remove();
  }, [activeTaskView]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  };

  const handleStartTask = async (task: MicroJobItem) => {
    // 1. Google Play In-App Review Task ($1.00 Reward)
    // Verification flow: Do not reward if user simply closes without submitting
    if (task.id === 'playstore_inapp_review_v1') {
      if (task.isCompleted) {
        Alert.alert('Already Claimed', 'You have already claimed your $1.00 Google Play review bonus.');
        return;
      }

      const completeReviewReward = async () => {
        try {
          setReviewClaimed(true);
          await JobsService.markReviewClaimed(userId);
          const res = await JobsService.completeTask(userId, task);
          setBalance(res.newBalance);
          setJobs((prev) => prev.filter((j) => j.id !== task.id));
          Alert.alert(
            '🎉 $1.00 Reward Credited!',
            'Thank you for your rating & review on Google Play! $1.00 has been added to your balance.'
          );
        } catch (_) {
          Alert.alert('Error', 'Could not record reward. Please try again.');
        }
      };

      try {
        console.log('[JobsScreen] Launching Google Play in-app review bottom sheet...');
        await InAppReviewService.requestReview();

        // Show verification prompt so closing without writing a review will NOT reward
        Alert.alert(
          '⭐ Google Play Review',
          'Did you submit your review and rating on Google Play?',
          [
            {
              text: 'Not Yet',
              style: 'cancel',
              onPress: () => {
                Alert.alert(
                  'Review Incomplete',
                  'No problem! You can complete your review anytime to claim your $1.00 cash bonus.'
                );
              },
            },
            {
              text: 'Open Play Store',
              onPress: async () => {
                await InAppReviewService.openPlayStoreListing();
                setTimeout(() => {
                  Alert.alert(
                    'Confirm Review',
                    'Did you submit your review on Google Play?',
                    [
                      { text: 'Not Yet', style: 'cancel' },
                      { text: 'Yes, I Submitted', onPress: completeReviewReward },
                    ]
                  );
                }, 1200);
              },
            },
            {
              text: 'Yes, I Submitted',
              onPress: completeReviewReward,
            },
          ]
        );
      } catch (err) {
        Alert.alert(
          'Review on Play Store',
          'Would you like to open Google Play to submit your review?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Play Store',
              onPress: async () => {
                await InAppReviewService.openPlayStoreListing();
                setTimeout(() => {
                  Alert.alert(
                    'Confirm Review',
                    'Did you submit your review on Google Play?',
                    [
                      { text: 'Not Yet', style: 'cancel' },
                      { text: 'Yes, I Submitted', onPress: completeReviewReward },
                    ]
                  );
                }, 1200);
              },
            },
          ]
        );
      }
      return;
    }

    // 2. Watch Ads Dedicated Screen Entry Card ($0.02 - $0.20, AdMob Rewarded)
    if (task.id === 'watch_ads_hub_v1' || task.id.startsWith('watch_ad_')) {
      handleOpenWatchAds();
      return;
    }

    // 3. Regular CPA / Partner Offers (Unlock via Rewarded Ad Modal)
    if (task.isCompleted) {
      Alert.alert('Task Completed', 'You have already completed this offer.');
      return;
    }
    setSelectedTaskForAd(task);
    setShowRewardedAdModal(true);
  };

  const handleOpenWatchAds = () => {
    if (onNavigateToWatchAds) {
      onNavigateToWatchAds();
    } else {
      setShowWatchAdsView(true);
    }
  };

  const handleRewardEarned = () => {
    if (selectedTaskForAd) {
      setShowRewardedAdModal(false);
      setActiveTaskView(selectedTaskForAd);
    }
  };

  if (showWatchAdsView) {
    return (
      <WatchAdsScreen
        userId={userId}
        userEmail={userEmail}
        isAdmin={userIsAdmin}
        onBack={() => {
          setShowWatchAdsView(false);
          loadData(true);
        }}
        onBalanceUpdated={(newBal) => {
          if (typeof newBal === 'number' && !isNaN(newBal)) {
            setBalance((prev) => Math.max(prev, newBal));
          }
          loadData(true);
        }}
      />
    );
  }

  if (activeTaskView) {
    return (
      <RealOfferTaskScreen
        userId={userId}
        task={activeTaskView}
        onBack={() => setActiveTaskView(null)}
        onCompleted={(newBal) => {
          if (typeof newBal === 'number' && !isNaN(newBal)) {
            setBalance((prev) => Math.max(prev, newBal));
          }
          loadData(true);
        }}
      />
    );
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'APP_INSTALL':
        return <Smartphone color="#38BDF8" size={20} />;
      case 'WEBSITE':
        return <Globe color="#34D399" size={20} />;
      case 'VIDEO':
        return <Video color="#F472B6" size={20} />;
      case 'SURVEY':
      default:
        return <Briefcase color="#A78BFA" size={20} />;
    }
  };

  const filteredJobs = jobs.filter((j) => {
    // Completely remove claimed review task from list permanently once claimed
    if (j.id === 'playstore_inapp_review_v1' && (j.isCompleted || reviewClaimed)) return false;
    if (highlightTaskId && j.id === highlightTaskId) return true;
    if (activeCategory === 'ALL') return true;
    if (activeCategory === 'WATCH_ADS') {
      return j.id === 'watch_ads_hub_v1' || j.id.startsWith('watch_ad_');
    }
    return j.category === activeCategory;
  });

  if (highlightTaskId) {
    filteredJobs.sort((a, b) => {
      if (a.id === highlightTaskId) return -1;
      if (b.id === highlightTaskId) return 1;
      return 0;
    });
  }

  const categories: { id: TaskCategoryFilter; label: string }[] = [
    { id: 'ALL', label: `All (${jobs.length})` },
    ...(isAdMobEligible ? [{ id: 'WATCH_ADS' as TaskCategoryFilter, label: '🎬 Watch Ads (2 - 20 Pts)' }] : []),
    { id: 'SURVEY', label: 'Surveys & Forms' },
    { id: 'APP_INSTALL', label: 'App Installs' },
    { id: 'WEBSITE', label: 'Web Offers' },
  ];

  return (
    <View style={styles.container}>
      {/* Top App Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.topTitle}>Remote Job</Text>
          <Text style={styles.topSubtitle}>Available Micro-Tasks</Text>
        </View>
        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>{jobs.length} Tasks Live</Text>
        </View>
      </View>

      <FlatList<MicroJobItem>
        data={filteredJobs}
        keyExtractor={(item: MicroJobItem) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#38BDF8"
          />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Balance Overview Card */}
            <View style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
                <View style={styles.levelBadge}>
                  <TrendingUp color="#FBBF24" size={14} />
                  <Text style={styles.levelText}>Tier 1 Member</Text>
                </View>
              </View>

              <Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text>
              <Text style={styles.balanceNotice}>
                Minimum withdrawal threshold is $30.00 • Payouts on the 27th
              </Text>
            </View>

            {/* Admin Override Badge (if admin user) */}
            {userIsAdmin && (
              <View style={styles.adminBanner}>
                <Award color="#FBBF24" size={15} />
                <Text style={styles.adminBannerText}>
                  ADMIN MODE ACTIVE • Watch Ads Unlocked Regardless of Tier
                </Text>
              </View>
            )}

            {/* Category Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
              style={{ marginBottom: 14 }}
            >
              {categories.map((c) => {
                const isActive = activeCategory === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                    onPress={() => {
                      if (c.id === 'WATCH_ADS') {
                        handleOpenWatchAds();
                      } else {
                        setActiveCategory(c.id);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>ACTIVE MICRO-JOBS</Text>
              <Text style={styles.sectionCount}>{filteredJobs.length} Tasks Ready</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          isLoading && jobs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color="#38BDF8" />
              <Text style={styles.emptyTitle}>Loading Available Tasks...</Text>
              <Text style={styles.emptySubtitle}>
                Connecting to live sponsor offers & micro-jobs...
              </Text>
            </View>
          ) : !refreshing ? (
            <View style={styles.emptyContainer}>
              <Briefcase color="#64748B" size={42} />
              <Text style={styles.emptyTitle}>No Offers Available Right Now</Text>
              <Text style={styles.emptySubtitle}>
                Live partner offers update dynamically based on your country. Pull down to refresh!
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item, index }: { item: MicroJobItem; index: number }) => {
          const isReviewTask = item.id === 'playstore_inapp_review_v1';
          const isWatchAd = item.id.startsWith('watch_ad_');
          const isLocker = item.id.startsWith('cpalead_locker_');

          // 1. Google Play In-App Review Task Item (Omit completely if claimed)
          if (isReviewTask) {
            if (item.isCompleted) return null;
            return (
              <View>
                <TouchableOpacity
                  style={[
                    styles.taskCard,
                    styles.taskCardReview,
                    item.isCompleted && styles.taskCardCompleted,
                  ]}
                  onPress={() => handleStartTask(item)}
                  activeOpacity={0.75}
                >
                  <View style={styles.reviewIconContainer}>
                    <Star color="#FBBF24" size={24} />
                  </View>

                  <View style={styles.taskDetails}>
                    <View style={styles.reviewVipBadge}>
                      <Sparkles color="#FBBF24" size={11} style={{ marginRight: 3 }} />
                      <Text style={styles.reviewVipBadgeText} numberOfLines={1}>
                        VIP REVIEW BONUS
                      </Text>
                    </View>
                    <Text style={styles.taskTitleReview} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.taskDesc} numberOfLines={2}>
                      {item.description}
                    </Text>

                    <View style={styles.taskMeta}>
                      <View style={styles.rewardTagReview}>
                        <Text style={styles.rewardTextReview} numberOfLines={1}>
                          +$1.00 CASH
                        </Text>
                      </View>

                      <View style={styles.networkBadgeReview}>
                        <Text style={styles.networkBadgeTextReview} numberOfLines={1}>
                          Google Play
                        </Text>
                      </View>

                      <View style={styles.timeTag}>
                        <Clock color="#94A3B8" size={11} />
                        <Text style={styles.timeText}>{item.durationSeconds}s</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.taskAction}>
                    {item.isCompleted ? (
                      <View style={styles.completedBadge}>
                        <CheckCircle2 color="#34D399" size={20} />
                        <Text style={styles.completedBadgeText}>Claimed</Text>
                      </View>
                    ) : (
                      <View style={styles.reviewPill}>
                        <Star color="#78350F" size={12} style={{ marginRight: 3 }} />
                        <Text style={styles.reviewPillText} numberOfLines={1}>
                          Claim $1
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Inline Native Ad Card */}
                {(index + 1) % 4 === 0 && (
                  <NativeAdCard placement={`task_list_inline_${index}`} />
                )}
              </View>
            );
          }

          // 2. Watch Ads Dedicated Screen Card (Points Reward: 2 - 20 Points per ad)
          if (item.id === 'watch_ads_hub_v1' || isWatchAd) {
            return (
              <View>
                <TouchableOpacity
                  style={[
                    styles.taskCard,
                    styles.taskCardWatchAd,
                  ]}
                  onPress={handleOpenWatchAds}
                  activeOpacity={0.75}
                >
                  <View style={styles.watchAdIconContainer}>
                    <Video color="#C084FC" size={24} />
                  </View>

                  <View style={styles.taskDetails}>
                    <View style={styles.watchAdTag}>
                      <Sparkles color="#C084FC" size={11} style={{ marginRight: 3 }} />
                      <Text style={styles.watchAdTagText} numberOfLines={1}>
                        SPONSOR VIDEO POOL
                      </Text>
                    </View>
                    <Text style={styles.taskTitleWatchAd} numberOfLines={2}>
                      🎬 Watch & Earn Video Ads
                    </Text>
                    <Text style={styles.taskDesc} numberOfLines={2}>
                      Earn 2 – 20 Reward Points for each 30s video ad watched • Up to 2,000 daily slots available!
                    </Text>

                    <View style={styles.taskMeta}>
                      <View style={styles.rewardTagWatchAd}>
                        <Sparkles color="#C084FC" size={11} style={{ marginRight: 3 }} />
                        <Text style={styles.rewardTextWatchAd} numberOfLines={1}>
                          +2–20 Pts
                        </Text>
                      </View>

                      <View style={styles.networkBadgeWatchAd}>
                        <Text style={styles.networkBadgeTextWatchAd} numberOfLines={1}>
                          Sponsored
                        </Text>
                      </View>

                      <View style={styles.timeTag}>
                        <Clock color="#94A3B8" size={11} />
                        <Text style={styles.timeText} numberOfLines={1}>
                          {watchStats ? `${watchStats.completedCount}/2000` : '2000 Ads'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.taskAction}>
                    <View style={styles.watchPill}>
                      <Play color="#FFFFFF" size={11} style={{ marginRight: 4 }} />
                      <Text style={styles.watchPillText} numberOfLines={1}>
                        Watch →
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Inline Native Ad Card */}
                {(index + 1) % 4 === 0 && (
                  <NativeAdCard placement={`task_list_inline_${index}`} />
                )}
              </View>
            );
          }

          // 3. Regular CPA & Link Locker Tasks
          const isHighlighted = item.id === highlightTaskId;
          return (
            <View>
              <TouchableOpacity
                style={[
                  styles.taskCard,
                  isLocker && styles.taskCardLocker,
                  isHighlighted && styles.taskCardHighlighted,
                  item.isCompleted && styles.taskCardCompleted,
                ]}
                onPress={() => handleStartTask(item)}
                activeOpacity={0.75}
              >
                {isLocker ? (
                  <View style={styles.lockerIconContainer}>
                    <Award color="#FBBF24" size={24} />
                  </View>
                ) : item.photoUrl ? (
                  <View style={styles.taskThumbnailContainer}>
                    <Image source={{ uri: item.photoUrl }} style={styles.taskThumbnail} resizeMode="contain" />
                  </View>
                ) : (
                  <View style={styles.taskIconContainer}>{getCategoryIcon(item.category)}</View>
                )}

                <View style={styles.taskDetails}>
                  {isHighlighted ? (
                    <View style={styles.highlightAlertBanner}>
                      <Sparkles color="#38BDF8" size={11} style={{ marginRight: 4 }} />
                      <Text style={styles.highlightAlertBannerText} numberOfLines={1}>
                        ⚡ HIGHEST PAYOUT
                      </Text>
                    </View>
                  ) : isLocker ? (
                    <View style={styles.vipTagContainer}>
                      <Sparkles color="#FBBF24" size={11} style={{ marginRight: 3 }} />
                      <Text style={styles.vipTagText} numberOfLines={1}>
                        HIGHEST PAYOUT LOCKER
                      </Text>
                    </View>
                  ) : null}
                  <Text style={[styles.taskTitle, (isLocker || isHighlighted) && styles.taskTitleLocker]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.taskDesc} numberOfLines={2}>
                    {item.description}
                  </Text>

                  <View style={styles.taskMeta}>
                    <View style={[styles.rewardTag, isLocker && styles.rewardTagLocker]}>
                      <Text style={[styles.rewardText, isLocker && styles.rewardTextLocker]} numberOfLines={1}>
                        +{item.points || Math.round(item.rewardUsd * 100)} pts
                      </Text>
                      <Text style={[styles.rewardSubText, isLocker && styles.rewardSubTextLocker]} numberOfLines={1}>
                        (${item.rewardUsd.toFixed(2)})
                      </Text>
                    </View>

                    <View style={[styles.networkBadge, isLocker && styles.networkBadgeLocker]}>
                      <Text style={[styles.networkBadgeText, isLocker && styles.networkBadgeTextLocker]} numberOfLines={1}>
                        CPAlead
                      </Text>
                    </View>

                    {item.acceptedCountries ? (
                      <View style={styles.countryBadge}>
                        <Globe color="#38BDF8" size={10} style={{ marginRight: 3 }} />
                        <Text style={styles.countryBadgeText} numberOfLines={1} ellipsizeMode="tail">
                          {item.acceptedCountries}
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.timeTag}>
                      <Clock color="#94A3B8" size={11} />
                      <Text style={styles.timeText}>{item.durationSeconds}s</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.taskAction}>
                  {item.isCompleted ? (
                    <View style={styles.completedBadge}>
                      <CheckCircle2 color="#34D399" size={20} />
                      <Text style={styles.completedBadgeText}>Done</Text>
                    </View>
                  ) : (
                    <View style={[styles.lockedPill, isLocker && styles.lockedPillLocker]}>
                      <Lock color={isLocker ? '#78350F' : '#0F172A'} size={12} style={{ marginRight: 3 }} />
                      <Text style={[styles.lockedPillText, isLocker && styles.lockedPillTextLocker]} numberOfLines={1}>
                        Unlock
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              {/* Intersperse real Native Ad Card every 4 tasks */}
              {(index + 1) % 4 === 0 && (
                <NativeAdCard placement={`task_list_inline_${index}`} />
              )}
            </View>
          );
        }}
      />

      {/* Rewarded Ad Modal to Unlock Micro-Task */}
      <RewardedAdModal
        visible={showRewardedAdModal}
        onClose={() => setShowRewardedAdModal(false)}
        onRewardEarned={handleRewardEarned}
        jobTitle={selectedTaskForAd?.title}
        rewardAmount={selectedTaskForAd ? `+${selectedTaskForAd.points || Math.round(selectedTaskForAd.rewardUsd * 100)} Points ($${selectedTaskForAd.rewardUsd.toFixed(2)})` : undefined}
        mode="MICRO_TASK"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  topTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.4,
  },
  topSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F291E',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#059669',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
    marginRight: 6,
  },
  onlineText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34D399',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  balanceCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#312E81',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  levelText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#F8FAFC',
    marginVertical: 8,
  },
  balanceNotice: {
    fontSize: 12,
    color: '#64748B',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  sectionCount: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '600',
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    overflow: 'hidden',
  },
  taskCardCompleted: {
    opacity: 0.6,
    borderColor: '#1E293B',
  },
  taskIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  taskDetails: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
    overflow: 'hidden',
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  taskDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
    lineHeight: 16,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    rowGap: 5,
    columnGap: 6,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  timeText: {
    color: '#94A3B8',
    fontSize: 11,
    marginLeft: 4,
  },
  rewardTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: '100%',
    flexShrink: 1,
  },
  rewardText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 1,
  },
  rewardSubText: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 3,
    flexShrink: 0,
  },
  taskAction: {
    marginLeft: 8,
    flexShrink: 0,
  },
  startBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38BDF8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  lockedPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  completedBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34D399',
    marginTop: 2,
  },
  categoryScroll: {
    paddingHorizontal: 4,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryChipActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  categoryChipTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  taskThumbnailContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskThumbnail: {
    width: '100%',
    height: '100%',
  },
  countryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    maxWidth: 95,
  },
  countryBadgeText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    flexShrink: 1,
  },
  networkBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  networkBadgeText: {
    color: '#38BDF8',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 14,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  taskCardLocker: {
    borderColor: '#F59E0B',
    borderWidth: 1.5,
    backgroundColor: '#1E1B38',
  },
  lockerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  vipTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    marginBottom: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  vipTagText: {
    color: '#FDE68A',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  taskTitleLocker: {
    color: '#FEF3C7',
    fontWeight: '800',
  },
  rewardTagLocker: {
    backgroundColor: '#78350F',
  },
  rewardTextLocker: {
    color: '#FDE68A',
  },
  rewardSubTextLocker: {
    color: '#FEF3C7',
  },
  networkBadgeLocker: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  networkBadgeTextLocker: {
    color: '#FBBF24',
  },
  lockedPillLocker: {
    backgroundColor: '#FBBF24',
  },
  lockedPillTextLocker: {
    color: '#78350F',
    fontWeight: '800',
  },
  /* AdMob Compliance Notice Banner */
  complianceNoticeCard: {
    backgroundColor: '#1E1B18',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  complianceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  complianceTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FBBF24',
    letterSpacing: 0.5,
    marginLeft: 6,
  },
  complianceBody: {
    fontSize: 12,
    color: '#FDE68A',
    lineHeight: 17,
  },
  /* Cooldown Active Banner */
  cooldownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    marginBottom: 14,
  },
  cooldownText: {
    fontSize: 12,
    color: '#E0F2FE',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  cooldownHighlight: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  /* Watch Ads Progress Card */
  watchStatsCard: {
    backgroundColor: '#1A1830',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.35)',
    marginBottom: 14,
  },
  watchStatsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  watchStatsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#C084FC',
    letterSpacing: 0.5,
  },
  watchStatsCount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F3E8FF',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#0F172A',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#A855F7',
    borderRadius: 4,
  },
  /* Google Play In-App Review Card */
  taskCardReview: {
    borderColor: '#10B981',
    borderWidth: 1.5,
    backgroundColor: '#062B20',
  },
  reviewIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  reviewVipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    marginBottom: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(251, 191, 36, 0.5)',
  },
  reviewVipBadgeText: {
    color: '#FDE68A',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  taskTitleReview: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ECFDF5',
    marginBottom: 4,
  },
  rewardTagReview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#065F46',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: '100%',
    flexShrink: 1,
  },
  rewardTextReview: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '800',
    flexShrink: 1,
  },
  rewardSubTextReview: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 3,
  },
  networkBadgeReview: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  networkBadgeTextReview: {
    color: '#34D399',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  reviewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBBF24',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  reviewPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#78350F',
  },
  /* AdMob Watch Video Ad Card */
  taskCardWatchAd: {
    borderColor: '#8B5CF6',
    borderWidth: 1.2,
    backgroundColor: '#161426',
  },
  watchAdIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  watchAdTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    marginBottom: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
  watchAdTagText: {
    color: '#E9D5FF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
    flexShrink: 1,
  },
  taskTitleWatchAd: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F3E8FF',
    marginBottom: 4,
  },
  rewardTagWatchAd: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4C1D95',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: '100%',
    flexShrink: 1,
  },
  rewardTextWatchAd: {
    color: '#E9D5FF',
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 1,
  },
  rewardSubTextWatchAd: {
    color: '#C084FC',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 3,
  },
  networkBadgeWatchAd: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.35)',
  },
  networkBadgeTextWatchAd: {
    color: '#C084FC',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  watchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  watchPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cooldownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#475569',
  },
  cooldownPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  adminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    marginBottom: 14,
  },
  adminBannerText: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  taskCardHighlighted: {
    borderColor: '#38BDF8',
    borderWidth: 2,
    backgroundColor: '#0F172A',
  },
  highlightAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  highlightAlertBannerText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
});
