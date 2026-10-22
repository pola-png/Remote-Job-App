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
} from '../components/LucideIcons';
import { JobsService, MicroJobItem } from '../services/jobs';
import { RealOfferTaskScreen } from './RealOfferTaskScreen';
import { RewardedAdModal } from '../components/RewardedAdModal';
import { NativeAdCard } from '../components/NativeAdCard';
import { AdTierService } from '../services/adTierService';

interface Props {
  userId: string;
}

type TaskCategoryFilter = 'ALL' | 'SURVEY' | 'APP_INSTALL' | 'WEBSITE';

export const JobsScreen: React.FC<Props> = ({ userId }: Props) => {
  const [balance, setBalance] = useState<number>(0);
  const [jobs, setJobs] = useState<MicroJobItem[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<TaskCategoryFilter>('ALL');
  const [activeTaskView, setActiveTaskView] = useState<MicroJobItem | null>(null);
  const [selectedTaskForAd, setSelectedTaskForAd] = useState<MicroJobItem | null>(null);
  const [showRewardedAdModal, setShowRewardedAdModal] = useState<boolean>(false);

  const loadData = async (forceRefresh: boolean = false) => {
    const [userBal, userJobs] = await Promise.all([
      JobsService.getBalance(userId, forceRefresh),
      JobsService.getJobs(userId, forceRefresh),
    ]);
    setBalance(userBal);
    setJobs(userJobs);
  };

  useEffect(() => {
    loadData();
    if (AdTierService.isAdMobAllowedSync()) {
      const { AdMobService } = require('../services/admob');
      AdMobService.preloadRewardedAd();
    } else {
      const { InMobiService } = require('../services/inmobi');
      InMobiService.preloadRewardedAd();
    }
  }, [userId]);

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

  const handleStartTask = (task: MicroJobItem) => {
    if (task.isCompleted) {
      Alert.alert('Task Completed', 'You have already completed this offer.');
      return;
    }
    // Rewarded ad modal unlocks task for all users (Tier 1/2 -> AdMob, Tier 3 -> InMobi)
    setSelectedTaskForAd(task);
    setShowRewardedAdModal(true);
  };

  const handleRewardEarned = () => {
    if (selectedTaskForAd) {
      setShowRewardedAdModal(false);
      setActiveTaskView(selectedTaskForAd);
    }
  };

  if (activeTaskView) {
    return (
      <RealOfferTaskScreen
        userId={userId}
        task={activeTaskView}
        onBack={() => setActiveTaskView(null)}
        onCompleted={() => loadData(true)}
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
    if (activeCategory === 'ALL') return true;
    return j.category === activeCategory;
  });

  const categories: { id: TaskCategoryFilter; label: string }[] = [
    { id: 'ALL', label: `All (${jobs.length})` },
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
                    onPress={() => setActiveCategory(c.id)}
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
          !refreshing ? (
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
          const isLocker = item.id.startsWith('cpalead_locker_');
          return (
            <View>
              <TouchableOpacity
                style={[
                  styles.taskCard,
                  isLocker && styles.taskCardLocker,
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
                  {isLocker && (
                    <View style={styles.vipTagContainer}>
                      <Sparkles color="#FBBF24" size={11} style={{ marginRight: 3 }} />
                      <Text style={styles.vipTagText}>HIGHEST PAYOUT LOCKER</Text>
                    </View>
                  )}
                  <Text style={[styles.taskTitle, isLocker && styles.taskTitleLocker]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.taskDesc} numberOfLines={2}>
                    {item.description}
                  </Text>

                  <View style={styles.taskMeta}>
                    <View style={[styles.rewardTag, isLocker && styles.rewardTagLocker]}>
                      <DollarSign color={isLocker ? '#FBBF24' : '#34D399'} size={12} />
                      <Text style={[styles.rewardText, isLocker && styles.rewardTextLocker]}>
                        +{item.points || Math.round(item.rewardUsd * 100)} pts
                      </Text>
                      <Text style={[styles.rewardSubText, isLocker && styles.rewardSubTextLocker]}>
                        (${item.rewardUsd.toFixed(2)})
                      </Text>
                    </View>

                    <View style={[styles.networkBadge, isLocker && styles.networkBadgeLocker]}>
                      <Text style={[styles.networkBadgeText, isLocker && styles.networkBadgeTextLocker]}>
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
                      <Text style={[styles.lockedPillText, isLocker && styles.lockedPillTextLocker]}>Unlock</Text>
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
  },
  rewardText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 2,
  },
  rewardSubText: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 3,
  },
  taskAction: {
    marginLeft: 10,
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
    marginBottom: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  vipTagText: {
    color: '#FDE68A',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
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
});
