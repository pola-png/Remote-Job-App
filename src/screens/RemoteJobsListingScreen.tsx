import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  RefreshControl,
  BackHandler,
  Linking,
} from 'react-native';
import {
  Briefcase,
  Search,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle2,
  Building,
  ArrowLeft,
  X,
  Send,
  Sparkles,
  Zap,
  Crown,
  ShieldCheck,
  Globe,
  ExternalLink,
} from '../components/LucideIcons';
import { RemoteJob, RemoteJobsService, JobFilterOptions } from '../services/remoteJobs';
import { NotificationService } from '../services/notifications';
import {
  SubscriptionService,
  SubscriptionTier,
  UserSubscription,
} from '../services/subscription';
import { JobDetailsView } from '../components/JobDetailsView';
import { RewardedAdModal } from '../components/RewardedAdModal';
import { SubscriptionPlansModal } from '../components/SubscriptionPlansModal';
import { JobMatchScoreBadge } from '../components/JobMatchScoreBadge';
import { CompanyLogoAvatar } from '../components/CompanyLogoAvatar';
import { BannerAdView } from '../components/BannerAdView';
import { NativeAdCard } from '../components/NativeAdCard';

interface Props {
  userId: string;
  userEmail?: string;
  onBackToLanding?: () => void;
  isSearchVisible?: boolean;
  onToggleSearch?: () => void;
  onNavigateToPostJob?: () => void;
  onNavigateToSubscription?: (targetTier?: SubscriptionTier) => void;
}

interface FilterTab {
  id: string;
  label: string;
  isPremium?: boolean;
  isPro?: boolean;
}

const FILTER_TABS: FilterTab[] = [
  { id: 'ALL', label: 'All Remote Jobs' },
  { id: 'LAST_24H', label: '⚡ Last 24h', isPremium: true },
  { id: 'LAST_3H', label: '🔥 Last 3h Early', isPremium: true },
  { id: 'HIGH_PAY', label: '💰 $100k+ High Pay', isPremium: true },
  { id: 'ENTRY_LEVEL', label: '🌱 Entry / No Exp' },
  { id: 'WORLDWIDE', label: '🌎 Worldwide' },
  { id: 'DEVELOPMENT', label: '💻 Dev & Tech' },
  { id: 'DESIGN', label: '🎨 Design' },
  { id: 'WRITING', label: '✍️ Writing' },
  { id: 'SUPPORT', label: '🎧 Support' },
  { id: 'ASSISTANT', label: '📋 Assistant' },
  { id: 'DATA', label: '📊 Data Entry' },
  { id: 'SALES', label: '💼 Sales' },
  { id: 'FINANCE', label: '📈 Finance' },
];

export const RemoteJobsListingScreen: React.FC<Props> = ({
  userId,
  userEmail,
  onBackToLanding,
  isSearchVisible: parentSearchVisible,
  onToggleSearch,
  onNavigateToPostJob,
  onNavigateToSubscription,
}: Props) => {
  const [jobs, setJobs] = useState<RemoteJob[]>([]);
  const [displayedCount, setDisplayedCount] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedJob, setSelectedJob] = useState<RemoteJob | null>(null);

  // Subscription state
  const [userSubscription, setUserSubscription] = useState<UserSubscription>({
    tier: 'FREE',
    billingCycle: 'monthly',
    isOpenToWork: false,
  });
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Rewarded Ad unlock state for free users
  const [unlockedJobIds, setUnlockedJobIds] = useState<string[]>([]);
  const [pendingJobForAd, setPendingJobForAd] = useState<RemoteJob | null>(null);
  const [showRewardedAdModal, setShowRewardedAdModal] = useState<boolean>(false);

  // Local search toggle if not controlled by parent
  const [localSearchVisible, setLocalSearchVisible] = useState(false);
  const isSearchOpen = parentSearchVisible !== undefined ? parentSearchVisible : localSearchVisible;

  // Application Modal state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState(userEmail || '');
  const [resumeUrl, setResumeUrl] = useState('');
  const [coverNote, setCoverNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load user subscription
  const loadSubscription = async () => {
    const sub = await SubscriptionService.getUserSubscription(userId);
    setUserSubscription(sub);
  };

  const loadJobs = async () => {
    const filterOptions: JobFilterOptions = {
      searchQuery,
    };

    if (selectedFilter === 'LAST_24H') {
      filterOptions.postedWithinHours = 24;
    } else if (selectedFilter === 'LAST_3H') {
      filterOptions.postedWithinHours = 3;
    } else if (selectedFilter === 'HIGH_PAY') {
      filterOptions.minSalary = 100000;
    } else if (selectedFilter === 'ENTRY_LEVEL') {
      filterOptions.experienceLevel = 'entry';
    } else if (selectedFilter === 'WORLDWIDE') {
      filterOptions.isWorldwideOnly = true;
    } else if (selectedFilter !== 'ALL') {
      filterOptions.category = selectedFilter;
    }

    const data = await RemoteJobsService.getRemoteJobs(filterOptions);
    setJobs(data);
    setDisplayedCount(10);
  };

  useEffect(() => {
    loadSubscription();
    // Preload rewarded ad in background for instant 0ms playback when user taps a job
    const { AdMobService } = require('../services/admob');
    AdMobService.preloadRewardedAd();
  }, [userId]);

  useEffect(() => {
    loadJobs();
  }, [selectedFilter, searchQuery]);

  // Hardware Back Handler: Handles returning from Job Details / Modals without jumping to Landing
  useEffect(() => {
    const handleHardwareBack = () => {
      if (showApplyModal) {
        setShowApplyModal(false);
        return true;
      }
      if (showRewardedAdModal) {
        setShowRewardedAdModal(false);
        setPendingJobForAd(null);
        return true;
      }
      if (selectedJob) {
        setSelectedJob(null);
        return true; // Consume back press to stay on Remote Jobs Feed!
      }
      return false; // Let parent App.tsx handle screen navigation
    };

    const backSub = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
    return () => backSub.remove();
  }, [showApplyModal, showRewardedAdModal, selectedJob]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadJobs(), loadSubscription()]);
    setRefreshing(false);
  };

  const handleSelectFilter = (tab: FilterTab) => {
    if (tab.isPremium && userSubscription.tier === 'FREE') {
      if (onNavigateToSubscription) {
        onNavigateToSubscription('PREMIUM');
      } else {
        setShowSubscriptionModal(true);
      }
      return;
    }
    setSelectedFilter(tab.id);
  };

  // Called when user taps a Job Card or "View Details & Apply"
  const handleOpenJobDetails = (job: RemoteJob) => {
    // If user has Pro/Premium tier or has already unlocked this job
    if (SubscriptionService.isAdFree(userSubscription.tier) || unlockedJobIds.includes(job.id)) {
      setSelectedJob(job);
      return;
    }

    // Free user: prompt rewarded sponsor ad before opening job details
    setPendingJobForAd(job);
    setShowRewardedAdModal(true);
  };

  const handleOpenApplyModal = (job: RemoteJob) => {
    if (job.isApplied) {
      Alert.alert('Already Applied', 'You have already submitted an application for this position.');
      return;
    }
    setSelectedJob(job);
    setShowApplyModal(true);
  };

  const handleRewardUnlocked = () => {
    if (pendingJobForAd) {
      setUnlockedJobIds((prev) => [...prev, pendingJobForAd.id]);
      setSelectedJob(pendingJobForAd);
      setPendingJobForAd(null);
    } else if (selectedJob) {
      setUnlockedJobIds((prev) => [...prev, selectedJob.id]);
      setShowApplyModal(true);
    }
    setShowRewardedAdModal(false);
  };

  const handleSubmitApplication = async () => {
    if (!selectedJob) return;
    if (!applicantName.trim() || !applicantEmail.trim() || !resumeUrl.trim()) {
      Alert.alert('Required Fields', 'Please provide your Full Name, Email, and Resume/Portfolio link.');
      return;
    }

    setIsSubmitting(true);
    const res = await RemoteJobsService.applyForJob(userId, selectedJob, {
      fullName: applicantName,
      email: applicantEmail,
      portfolioOrResumeUrl: resumeUrl,
      coverNote,
    });
    setIsSubmitting(false);

    if (res.success) {
      setShowApplyModal(false);
      const appliedJobTitle = selectedJob.title;
      const appliedCompany = selectedJob.company;
      setSelectedJob(null);
      setResumeUrl('');
      setCoverNote('');
      Alert.alert('Application Submitted!', res.message);
      NotificationService.triggerInAppNotification(
        '📄 Application Submitted',
        `Your application for ${appliedJobTitle} at ${appliedCompany} was received.`,
        'JOB_ALERT',
        'REMOTE_JOBS'
      );
      loadJobs();
    } else {
      Alert.alert('Submission Error', res.message);
    }
  };

  // Dedicated Full Screen Job Details View
  if (selectedJob && !showApplyModal) {
    return (
      <View style={{ flex: 1 }}>
        <JobDetailsView
          job={selectedJob}
          onBack={() => setSelectedJob(null)}
          onApply={() => handleOpenApplyModal(selectedJob)}
          isUnlocked={unlockedJobIds.includes(selectedJob.id) || SubscriptionService.isAdFree(userSubscription.tier)}
          userTier={userSubscription.tier}
          onUpgradePress={() => {
            if (onNavigateToSubscription) {
              onNavigateToSubscription('PRO');
            } else {
              setShowSubscriptionModal(true);
            }
          }}
        />

        {/* Rewarded Ad Unlock Modal for Free users */}
        <RewardedAdModal
          visible={showRewardedAdModal}
          onClose={() => setShowRewardedAdModal(false)}
          onRewardEarned={handleRewardUnlocked}
          jobTitle={selectedJob.title}
          company={selectedJob.company}
        />

        {/* Fallback Subscription Upgrade Modal */}
        <SubscriptionPlansModal
          visible={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          userId={userId}
          currentTier={userSubscription.tier}
          onSubscriptionUpdated={(newTier) => {
            setUserSubscription((prev) => ({ ...prev, tier: newTier }));
            loadJobs();
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Expandable Search Area (Opens below top bar) */}
      {isSearchOpen && (
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Search color="#94A3B8" size={18} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search title, skills, company..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                <X color="#94A3B8" size={16} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => {
                if (onToggleSearch) onToggleSearch();
                else setLocalSearchVisible(false);
              }}
              style={styles.closeSearchBtn}
            >
              <Text style={styles.closeSearchText}>Hide</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Plan Header Strip */}
      <View style={styles.membershipStrip}>
        <View style={styles.membershipLeft}>
          {userSubscription.tier === 'PRO' ? (
            <Crown color="#FBBF24" size={16} style={{ marginRight: 6 }} />
          ) : userSubscription.tier === 'PREMIUM' ? (
            <Zap color="#38BDF8" size={16} style={{ marginRight: 6 }} />
          ) : (
            <Sparkles color="#94A3B8" size={16} style={{ marginRight: 6 }} />
          )}
          <Text style={styles.membershipTierText}>
            Plan: <Text style={styles.membershipTierName}>{userSubscription.tier}</Text>
          </Text>
          {userSubscription.isOpenToWork && (
            <View style={styles.openToWorkChip}>
              <Text style={styles.openToWorkChipText}>🟢 Open to Work</Text>
            </View>
          )}
        </View>

        {userSubscription.tier === 'FREE' ? (
          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={() => {
              if (onNavigateToSubscription) onNavigateToSubscription('PRO');
              else setShowSubscriptionModal(true);
            }}
            activeOpacity={0.8}
          >
            <Crown color="#0F172A" size={12} style={{ marginRight: 4 }} />
            <Text style={styles.upgradeBtnText}>Upgrade to Pro</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.managePlanBtn}
            onPress={() => {
              if (onNavigateToSubscription) onNavigateToSubscription(userSubscription.tier);
              else setShowSubscriptionModal(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.managePlanBtnText}>Manage Plan</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category & Smart Filter Row */}
      <View style={styles.filterAndActionRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {FILTER_TABS.map((tab) => {
            const isSelected = selectedFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.categoryChip,
                  isSelected && styles.categoryChipActive,
                  tab.isPremium && styles.categoryChipPremium,
                ]}
                onPress={() => handleSelectFilter(tab)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && styles.categoryChipTextActive,
                    tab.isPremium && !isSelected && styles.categoryChipTextPremium,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Jobs List */}
      <FlatList<RemoteJob>
        data={jobs.slice(0, displayedCount)}
        keyExtractor={(item: RemoteJob) => item.id}
        onEndReached={() => {
          if (displayedCount < jobs.length) {
            setDisplayedCount((prev) => prev + 10);
          }
        }}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#38BDF8"
          />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.resultsCount}>{jobs.length} Verified Remote Openings</Text>
              {!isSearchOpen && (
                <TouchableOpacity
                  onPress={() => {
                    if (onToggleSearch) onToggleSearch();
                    else setLocalSearchVisible(true);
                  }}
                  style={styles.inlineSearchToggle}
                >
                  <Search color="#38BDF8" size={14} style={{ marginRight: 4 }} />
                  <Text style={styles.inlineSearchToggleText}>Search & Filter</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
        ListFooterComponent={
          displayedCount < jobs.length ? (
            <View style={{ paddingVertical: 18, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="small" color="#38BDF8" />
              <Text style={{ color: '#64748B', fontSize: 12, marginTop: 6 }}>Loading more remote jobs...</Text>
            </View>
          ) : jobs.length > 0 ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ color: '#475569', fontSize: 12 }}>Showing all {jobs.length} remote positions</Text>
            </View>
          ) : null
        }
        renderItem={({ item, index }: { item: RemoteJob; index: number }) => {
          const hasSalary = Boolean(
            item.salaryRange &&
            item.salaryRange.trim().length > 0 &&
            !item.salaryRange.toLowerCase().includes('competitive') &&
            !item.salaryRange.toLowerCase().includes('undefined')
          );
          const formattedSalary = hasSalary ? item.salaryRange!.replace(/^\$\s*/, '') : '';
          const isAdFree = SubscriptionService.isAdFree(userSubscription.tier);
          const shouldShowAd = !isAdFree && (index + 1) % 2 === 0;
          const isNativeAdPlacement = (index + 1) % 4 === 2;

          return (
            <View>
              <TouchableOpacity
                style={styles.jobCard}
                onPress={() => handleOpenJobDetails(item)}
                activeOpacity={0.8}
              >
                <View style={styles.jobCardTop}>
                  <CompanyLogoAvatar
                    company={item.company}
                    logoUrl={item.companyLogo}
                    size={42}
                    fontSize={14}
                    borderRadius={12}
                  />
                  <View style={styles.jobCardHeaderTitles}>
                    <Text style={styles.jobTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.companyName} numberOfLines={1}>
                      {item.company}
                    </Text>
                  </View>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText} numberOfLines={1}>{item.jobType}</Text>
                  </View>
                </View>

                {/* Candidate Match Score Badge */}
                <View style={{ marginBottom: 10, alignSelf: 'flex-start' }}>
                  <JobMatchScoreBadge
                    job={item}
                    userTier={userSubscription.tier}
                    onUpgradePress={() => {
                      if (onNavigateToSubscription) onNavigateToSubscription('PRO');
                      else setShowSubscriptionModal(true);
                    }}
                    compact
                  />
                </View>

                {/* Metadata Badges (Location & Salary) with wrapping container */}
                <View style={styles.metaRow}>
                  <View style={styles.metaBadge}>
                    <MapPin color="#38BDF8" size={13} style={{ marginRight: 4 }} />
                    <Text style={styles.metaBadgeText} numberOfLines={1} ellipsizeMode="tail">
                      {item.location}
                    </Text>
                  </View>

                  {hasSalary && (
                    <View style={styles.salaryBadge}>
                      <DollarSign color="#34D399" size={13} style={{ marginRight: 2 }} />
                      <Text style={styles.salaryBadgeText} numberOfLines={1} ellipsizeMode="tail">
                        {formattedSalary}
                      </Text>
                    </View>
                  )}

                  {item.contactEmail ? (
                    <View style={styles.contactEmailBadge}>
                      <Text style={styles.contactEmailBadgeText} numberOfLines={1} ellipsizeMode="tail">
                        ✉️ Send CV: {item.contactEmail}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.jobDesc} numberOfLines={2}>
                  {item.description}
                </Text>

                <View style={styles.tagsRow}>
                  {item.tags.slice(0, 4).map((tag, idx) => (
                    <View key={idx} style={styles.tag}>
                      <Text style={styles.tagText} numberOfLines={1}>{tag}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.jobCardFooter}>
                  <View style={styles.jobCardFooterLeft}>
                    <Clock color="#64748B" size={12} style={{ marginRight: 4 }} />
                    <Text style={styles.postedDate} numberOfLines={1}>{item.postedDate}</Text>
                  </View>

                  {item.isApplied ? (
                    <View style={styles.appliedBadge}>
                      <CheckCircle2 color="#34D399" size={14} style={{ marginRight: 4 }} />
                      <Text style={styles.appliedBadgeText}>Applied</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.applyBtn}
                      onPress={() => handleOpenJobDetails(item)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.applyBtnText}>
                        {item.contactEmail ? 'Send CV / Details' : 'View Details & Apply'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>

              {/* Feed Sponsored Ad after every 2 jobs */}
              {shouldShowAd && (
                isNativeAdPlacement ? (
                  <NativeAdCard
                    placement="feed_inline_native"
                    onUpgradePress={() => {
                      if (onNavigateToSubscription) onNavigateToSubscription('PRO');
                      else setShowSubscriptionModal(true);
                    }}
                  />
                ) : (
                  <BannerAdView
                    placement="feed_inline_banner"
                    onUpgradePress={() => {
                      if (onNavigateToSubscription) onNavigateToSubscription('PRO');
                      else setShowSubscriptionModal(true);
                    }}
                  />
                )
              )}
            </View>
          );
        }}
      />

      {/* Application Form Modal */}
      <Modal visible={showApplyModal} animationType="slide" transparent onRequestClose={() => setShowApplyModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalCard}>
            <View style={styles.detailHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailTitle}>Apply for Position</Text>
                <Text style={styles.detailCompany}>
                  {selectedJob?.title} at {selectedJob?.company}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowApplyModal(false)}>
                <X color="#94A3B8" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailBody} keyboardShouldPersistTaps="handled">
              {selectedJob?.directApplyUrl && (
                <TouchableOpacity
                  style={styles.modalDirectApplyBanner}
                  onPress={() => {
                    if (selectedJob.directApplyUrl) {
                      Linking.openURL(selectedJob.directApplyUrl).catch(() => {});
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalDirectApplyTitle}>Official Careers Page</Text>
                    <Text style={styles.modalDirectApplySub}>
                      Apply directly on {selectedJob.company}'s portal
                    </Text>
                  </View>
                  <ExternalLink color="#38BDF8" size={16} />
                </TouchableOpacity>
              )}

              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Sarah Jenkins"
                placeholderTextColor="#64748B"
                value={applicantName}
                onChangeText={setApplicantName}
              />

              <Text style={styles.inputLabel}>Email Address *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. sarah@example.com"
                placeholderTextColor="#64748B"
                value={applicantEmail}
                onChangeText={setApplicantEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Resume / Portfolio Link (Google Drive, LinkedIn, GitHub) *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="https://..."
                placeholderTextColor="#64748B"
                value={resumeUrl}
                onChangeText={setResumeUrl}
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Short Cover Note (Optional)</Text>
              <TextInput
                style={[styles.modalInput, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
                placeholder="Why you are a great fit for this role..."
                placeholderTextColor="#64748B"
                multiline
                value={coverNote}
                onChangeText={setCoverNote}
              />

              <TouchableOpacity
                style={[styles.primaryModalBtn, isSubmitting && { opacity: 0.6 }]}
                onPress={handleSubmitApplication}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Send color="#FFFFFF" size={18} style={{ marginRight: 8 }} />
                    <Text style={styles.primaryModalBtnText}>Submit In-App Application</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Rewarded Ad Unlock Modal */}
      <RewardedAdModal
        visible={showRewardedAdModal}
        onClose={() => {
          setShowRewardedAdModal(false);
          setPendingJobForAd(null);
        }}
        onRewardEarned={handleRewardUnlocked}
        jobTitle={pendingJobForAd?.title || selectedJob?.title}
        company={pendingJobForAd?.company || selectedJob?.company}
        mode="JOB_DETAILS"
      />

      {/* Rewarded Ad Unlock Modal for Free users (Triggered on Job Card Click or View Details & Apply) */}
      <RewardedAdModal
        visible={showRewardedAdModal}
        onClose={() => {
          setShowRewardedAdModal(false);
          setPendingJobForAd(null);
        }}
        onRewardEarned={handleRewardUnlocked}
        jobTitle={pendingJobForAd?.title || selectedJob?.title}
        company={pendingJobForAd?.company || selectedJob?.company}
        mode="JOB_DETAILS"
      />

      {/* Subscription Plans Modal */}
      <SubscriptionPlansModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        userId={userId}
        currentTier={userSubscription.tier}
        onSubscriptionUpdated={(newTier) => {
          setUserSubscription((prev) => ({ ...prev, tier: newTier }));
          loadJobs();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  closeSearchBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 6,
  },
  closeSearchText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  membershipStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  membershipLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  membershipTierText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  membershipTierName: {
    color: '#F8FAFC',
    fontWeight: '800',
  },
  openToWorkChip: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  openToWorkChipText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '700',
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBBF24',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  upgradeBtnText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '800',
  },
  managePlanBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  managePlanBtnText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  filterAndActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B1120',
    paddingVertical: 8,
  },
  categoriesContent: {
    paddingHorizontal: 16,
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
  categoryChipPremium: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
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
  categoryChipTextPremium: {
    color: '#FBBF24',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  listHeader: {
    marginBottom: 12,
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  inlineSearchToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  inlineSearchToggleText: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '600',
  },
  jobCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  jobCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  jobCardHeaderTitles: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  companyIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    lineHeight: 20,
  },
  companyName: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  typeBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    alignSelf: 'flex-start',
  },
  typeBadgeText: {
    fontSize: 10,
    color: '#38BDF8',
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 6,
    marginBottom: 6,
    maxWidth: '100%',
    flexShrink: 1,
  },
  metaBadgeText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    flexShrink: 1,
  },
  salaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    marginRight: 6,
    marginBottom: 6,
    maxWidth: '100%',
    flexShrink: 1,
  },
  salaryBadgeText: {
    fontSize: 12,
    color: '#34D399',
    fontWeight: '700',
    flexShrink: 1,
  },
  contactEmailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    marginRight: 6,
    marginBottom: 6,
    maxWidth: '100%',
    flexShrink: 1,
  },
  contactEmailBadgeText: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '700',
    flexShrink: 1,
  },
  jobDesc: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  tag: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: 160,
  },
  tagText: {
    fontSize: 11,
    color: '#64748B',
  },
  jobCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  jobCardFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: 8,
  },
  postedDate: {
    fontSize: 11,
    color: '#64748B',
    flexShrink: 1,
  },
  applyBtn: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    flexShrink: 0,
  },
  applyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  appliedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  appliedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#34D399',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'flex-end',
  },
  detailModalCard: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 20,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  detailCompany: {
    fontSize: 13,
    color: '#38BDF8',
    marginTop: 2,
  },
  detailBody: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 6,
    marginTop: 10,
  },
  modalInput: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  primaryModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#38BDF8',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  primaryModalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalDirectApplyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  modalDirectApplyTitle: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
  modalDirectApplySub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
});
