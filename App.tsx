import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  BackHandler,
  Platform,
  DeviceEventEmitter,
  AppState,
} from 'react-native';
import {
  Briefcase,
  Zap,
  Wallet,
  ShieldCheck,
  Home,
  Bell,
  Search,
  Plus,
} from './src/components/LucideIcons';
import { supabase } from './src/config/supabase';
import { AuthService, UserProfile } from './src/services/auth';
import {
  AppNotification,
  NotificationService,
} from './src/services/notifications';
import { AppUpdateService, AppUpdateInfo } from './src/services/appUpdate';
import { AppUpdateModal } from './src/components/AppUpdateModal';
import { SignInScreen } from './src/screens/SignInScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { LandingScreen } from './src/screens/LandingScreen';
import { RemoteJobsListingScreen } from './src/screens/RemoteJobsListingScreen';
import { JobsScreen } from './src/screens/JobsScreen';
import { PayoutScreen } from './src/screens/PayoutScreen';
import { PolicyPrivacyScreen } from './src/screens/PolicyPrivacyScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { PostJobScreen } from './src/screens/PostJobScreen';
import { SubscriptionPlansScreen } from './src/screens/SubscriptionPlansScreen';
import { WatchAdsScreen } from './src/screens/WatchAdsScreen';
import { InAppNotificationBanner } from './src/components/InAppNotificationBanner';
import mobileAds from 'react-native-google-mobile-ads';
import { AdTierService } from './src/services/adTierService';
import { SubscriptionTier } from './src/services/subscription';

type TabType =
  | 'LANDING'
  | 'REMOTE_JOBS'
  | 'MICRO_JOBS'
  | 'PAYOUT'
  | 'POLICY'
  | 'NOTIFICATIONS'
  | 'POST_JOB'
  | 'SUBSCRIPTION'
  | 'WATCH_ADS';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Navigation tab state and history hierarchy
  const [currentTab, setCurrentTab] = useState<TabType>('LANDING');
  const [navHistory, setNavHistory] = useState<TabType[]>(['LANDING']);

  // Subscription target tier for full-screen upgrade view
  const [targetSubscriptionTier, setTargetSubscriptionTier] = useState<SubscriptionTier>('PREMIUM');

  // Search trigger from Top Bar
  const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);

  // Highlighted task from push notification / alert click
  const [highlightTaskId, setHighlightTaskId] = useState<string | null>(null);

  // Play Store In-App Update State
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);

  // Track screens that have been loaded once to keep them alive and active in memory
  const [loadedTabs, setLoadedTabs] = useState<{ [key: string]: boolean }>({
    LANDING: true,
  });

  const navigateToTab = (tab: TabType, addToHistory: boolean = true) => {
    setLoadedTabs((prev) => ({ ...prev, [tab]: true }));
    setCurrentTab(tab);
    if (addToHistory && tab !== currentTab) {
      setNavHistory((prev) => [...prev, tab]);
    }
  };

  const navigateBack = () => {
    setNavHistory((prev) => {
      const historyCopy = [...prev];
      historyCopy.pop(); // Remove current screen

      const previousTab = historyCopy[historyCopy.length - 1] || 'LANDING';
      setLoadedTabs((loaded) => ({ ...loaded, [previousTab]: true }));
      setCurrentTab(previousTab);

      return historyCopy.length > 0 ? historyCopy : ['LANDING'];
    });
  };

  // Hardware Back Button Hierarchy Handler
  useEffect(() => {
    const handleHardwareBack = () => {
      if (currentTab === 'LANDING') {
        // On root screen, allow Android to minimize/exit
        return false;
      }

      // If search bar is open, close it first
      if (isSearchVisible) {
        setIsSearchVisible(false);
        return true;
      }

      // Pop previous tab from history stack
      navigateBack();
      return true; // Prevent app from closing
    };

    const backSubscription = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
    return () => backSubscription.remove();
  }, [currentTab, isSearchVisible]);

  // Auth mode state: 'SIGN_IN' | 'SIGN_UP'
  const [authMode, setAuthMode] = useState<'SIGN_IN' | 'SIGN_UP'>('SIGN_IN');
  const [initialPolicy, setInitialPolicy] = useState<'PRIVACY' | 'TERMS' | null>(null);

  // Notification workflow state
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = async () => {
    const list = await NotificationService.getNotifications();
    setUnreadCount(list.filter((n) => !n.isRead).length);
  };

  useEffect(() => {
    // Check active session on startup
    supabase.auth.getSession().then(({ data }: { data: { session: any } }) => {
      const sess = data.session;
      setSession(sess);
      if (sess?.user?.id) {
        AuthService.getUserProfile(sess.user.id).then(setProfile);
        // Pre-warm Remote Jobs & Micro-Jobs cache in background so screens open in 0ms
        try {
          const { RemoteJobsService } = require('./src/services/remoteJobs');
          const { JobsService } = require('./src/services/jobs');
          RemoteJobsService.getRemoteJobs().catch(() => {});
          JobsService.getJobs(sess.user.id).catch(() => {});
        } catch (_) {}
        // Automatically check and sync highest paying task opportunity for user
        NotificationService.syncHighestPayingTaskAlert(sess.user.id).then(() => {
          loadUnreadCount();
        });
      }
      setIsLoading(false);
    });

    // Check if app was opened via system push notification click (cold start / background)
    try {
      const { NativeModules } = require('react-native');
      const FirebasePush = NativeModules.FirebasePushModule;
      if (FirebasePush?.getInitialNotification) {
        FirebasePush.getInitialNotification().then((data: any) => {
          if (data && data.targetScreen) {
            if (data.taskId) {
              setHighlightTaskId(data.taskId);
            }
            const target = (['REMOTE_JOBS', 'MICRO_JOBS', 'PAYOUT', 'POLICY'].includes(data.targetScreen)
              ? data.targetScreen
              : 'MICRO_JOBS') as TabType;
            navigateToTab(target);
          }
        }).catch(() => {});
      }
    } catch (_) {}

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session);
      if (session?.user?.id) {
        AuthService.getUserProfile(session.user.id).then(setProfile);
      } else {
        setProfile(null);
      }
    });

    // Initialize appropriate ad network on startup based on Tier:
    // Tier 1 & 2 -> AdMob + Pangle
    // Tier 3 -> InMobi (AdMob completely blocked)
    AdTierService.isAdMobAllowed().then((isAllowed) => {
      if (!isAllowed) {
        console.log(
          '[Ad Gateway] Tier 3 country detected. Blocking AdMob completely and initializing InMobi SDK...'
        );
        const { InMobiService } = require('./src/services/inmobi');
        InMobiService.initialize().then((ok: boolean) => {
          console.log('[InMobi Startup] Native InMobi SDK init result:', ok);
          InMobiService.preloadRewardedAd();
        });
        return;
      }

      mobileAds()
        .initialize()
        .then((adapterStatuses) => {
          console.log('Google Mobile Ads Initialized Successfully:', adapterStatuses);
          const { AdMobService } = require('./src/services/admob');
          // Preload ads in background for instant playback
          AdMobService.preloadRewardedAd();
          AdMobService.preloadAppOpenAd();
          // Show App Open Ad on cold startup (handled seamlessly via preload waiter)
          AdMobService.showAppOpenAd();
        })
        .catch((err) => {
          console.warn('Google Mobile Ads Init Warning:', err);
        });
    });

    // Listen for app coming to foreground / resume to display App Open Ad (Tier 1 & 2 only)
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && AdTierService.isAdMobAllowedSync()) {
        const { AdMobService } = require('./src/services/admob');
        AdMobService.showAppOpenAd();
      }
    });

    // Request Real Native Phone Notification Permission & Subscribe to FCM Topics
    NotificationService.requestNativeDevicePermission().then(() => {
      loadUnreadCount();
    });

    // Listen for real Firebase Push Notifications received while app is foregrounded/active
    const pushSubscription = DeviceEventEmitter.addListener(
      'onRemotePushNotificationReceived',
      async (data: any) => {
        const title = data.title || 'Task Alert';
        const body = data.body || 'New opportunities are live.';
        const targetScreen = (['REMOTE_JOBS', 'MICRO_JOBS', 'PAYOUT', 'POLICY'].includes(data.targetScreen)
          ? data.targetScreen
          : 'MICRO_JOBS') as 'REMOTE_JOBS' | 'MICRO_JOBS' | 'PAYOUT' | 'POLICY';

        const notif = await NotificationService.triggerInAppNotification(
          title,
          body,
          data.type === 'highest_paying_task_alert' || data.type === 'task_alert' ? 'TASK_CREDIT' : 'JOB_ALERT',
          targetScreen,
          {
            taskId: data.taskId,
            reward: data.reward,
            actionUrl: data.actionUrl,
          }
        );
        setActiveToast(notif);
        loadUnreadCount();
      }
    );

    // Listen for notification tap event when app was in background
    const openSubscription = DeviceEventEmitter.addListener(
      'onNotificationOpened',
      (data: any) => {
        if (data && data.targetScreen) {
          if (data.taskId) {
            setHighlightTaskId(data.taskId);
          }
          const target = (['REMOTE_JOBS', 'MICRO_JOBS', 'PAYOUT', 'POLICY'].includes(data.targetScreen)
            ? data.targetScreen
            : 'MICRO_JOBS') as TabType;
          navigateToTab(target);
        }
      }
    );

    // Play Store Update Check on App Start
    AppUpdateService.checkForUpdates().then((info) => {
      if (info && info.updateAvailable) {
        setUpdateInfo(info);
        setShowUpdateModal(true);
      }
    });

    loadUnreadCount();

    return () => {
      subscription.unsubscribe();
      pushSubscription.remove();
      openSubscription.remove();
      appStateSubscription.remove();
    };
  }, []);

  const handleOpenPolicyFromAuth = (type: 'PRIVACY' | 'TERMS') => {
    setInitialPolicy(type);
    navigateToTab('POLICY');
  };

  const handleBannerPress = (notif: AppNotification) => {
    if (notif.taskId) {
      setHighlightTaskId(notif.taskId);
    }
    if (notif.targetScreen) {
      navigateToTab(notif.targetScreen as TabType);
    } else {
      navigateToTab('NOTIFICATIONS');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0B1120" />
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  // Not signed in
  if (!session) {
    if (currentTab === 'POLICY') {
      return (
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" backgroundColor="#0B1120" />
          <PolicyPrivacyScreen
            profile={null}
            onSignedOut={() => navigateToTab('LANDING')}
            initialPolicy={initialPolicy}
            onClearInitialPolicy={() => {
              setInitialPolicy(null);
              navigateToTab('LANDING');
            }}
          />
        </SafeAreaView>
      );
    }

    if (authMode === 'SIGN_UP') {
      return (
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" backgroundColor="#0B1120" />
          <SignUpScreen
            onSignedUp={() => navigateToTab('LANDING')}
            onNavigateToSignIn={() => setAuthMode('SIGN_IN')}
            onOpenPolicy={handleOpenPolicyFromAuth}
          />
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0B1120" />
        <SignInScreen
          onSignedIn={() => navigateToTab('LANDING')}
          onNavigateToSignUp={() => setAuthMode('SIGN_UP')}
          onOpenPolicy={handleOpenPolicyFromAuth}
        />
      </SafeAreaView>
    );
  }

  // Signed in main view
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1120" />

      {/* Global In-App Notification Banner */}
      <InAppNotificationBanner
        notification={activeToast}
        onPress={handleBannerPress}
        onDismiss={() => setActiveToast(null)}
      />

      {/* Global Top App Bar (Hidden on Landing, Post Job, Subscription, and Watch Ads screens) */}
      {currentTab !== 'LANDING' && currentTab !== 'POST_JOB' && currentTab !== 'SUBSCRIPTION' && currentTab !== 'WATCH_ADS' && (
        <View style={styles.globalTopBar}>
          <View style={styles.appNameContainer}>
            <Text style={styles.globalAppName}>Remote Job</Text>
          </View>

          <View style={styles.topRightActions}>
            {/* Post Job Button (For Employers) */}
            <TouchableOpacity
              style={styles.postJobTopBtn}
              onPress={() => navigateToTab('POST_JOB')}
              activeOpacity={0.8}
            >
              <Plus color="#FFFFFF" size={13} style={{ marginRight: 3 }} />
              <Text style={styles.postJobTopBtnText}>Post Job</Text>
            </TouchableOpacity>

            {/* Search Icon (Opens Expandable Search Bar) */}
            <TouchableOpacity
              style={[styles.topActionBtn, isSearchVisible && styles.topActionBtnActive]}
              onPress={() => {
                if (currentTab !== 'REMOTE_JOBS') {
                  navigateToTab('REMOTE_JOBS');
                  setIsSearchVisible(true);
                } else {
                  setIsSearchVisible((prev) => !prev);
                }
              }}
              activeOpacity={0.7}
            >
              <Search color={isSearchVisible ? '#38BDF8' : '#CBD5E1'} size={18} />
            </TouchableOpacity>

            {/* Notification Bell */}
            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => {
                navigateToTab('NOTIFICATIONS');
                loadUnreadCount();
              }}
            >
              <Bell color="#CBD5E1" size={18} />
              {unreadCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Screen Views with Keep-Alive / Persistent Active State */}
      <View style={styles.contentContainer}>
        {loadedTabs['LANDING'] && (
          <View style={[styles.screenWrapper, currentTab !== 'LANDING' && styles.hiddenScreen]}>
            <LandingScreen
              onSelectRemoteJobs={() => navigateToTab('REMOTE_JOBS')}
              onSelectMicroJobs={() => navigateToTab('MICRO_JOBS')}
              userEmail={session?.user?.email}
            />
          </View>
        )}

        {loadedTabs['REMOTE_JOBS'] && (
          <View style={[styles.screenWrapper, currentTab !== 'REMOTE_JOBS' && styles.hiddenScreen]}>
            <RemoteJobsListingScreen
              userId={session.user.id}
              userEmail={session.user.email}
              isActive={currentTab === 'REMOTE_JOBS'}
              onBackToLanding={() => navigateToTab('LANDING')}
              isSearchVisible={isSearchVisible}
              onToggleSearch={() => setIsSearchVisible((prev) => !prev)}
              onNavigateToPostJob={() => navigateToTab('POST_JOB')}
              onNavigateToSubscription={(tier) => {
                setTargetSubscriptionTier(tier || 'PREMIUM');
                navigateToTab('SUBSCRIPTION');
              }}
            />
          </View>
        )}

        {loadedTabs['POST_JOB'] && (
          <View style={[styles.screenWrapper, currentTab !== 'POST_JOB' && styles.hiddenScreen]}>
            <PostJobScreen
              userId={session.user.id}
              onBack={navigateBack}
              onJobPosted={() => {
                navigateToTab('REMOTE_JOBS');
              }}
            />
          </View>
        )}

        {loadedTabs['SUBSCRIPTION'] && (
          <View style={[styles.screenWrapper, currentTab !== 'SUBSCRIPTION' && styles.hiddenScreen]}>
            <SubscriptionPlansScreen
              userId={session.user.id}
              currentTier={profile?.subscriptionTier || 'FREE'}
              targetTier={targetSubscriptionTier}
              onBack={navigateBack}
              onSubscriptionUpdated={(newTier) => {
                if (profile) {
                  setProfile({ ...profile, subscriptionTier: newTier });
                }
              }}
            />
          </View>
        )}

        {loadedTabs['MICRO_JOBS'] && (
          <View style={[styles.screenWrapper, currentTab !== 'MICRO_JOBS' && styles.hiddenScreen]}>
            <JobsScreen
              userId={session.user.id}
              userEmail={session?.user?.email}
              isActive={currentTab === 'MICRO_JOBS'}
              isAdmin={
                Boolean(
                  profile?.is_admin ||
                  (profile as any)?.role === 'admin' ||
                  (profile as any)?.role === 'staff' ||
                  profile?.email?.toLowerCase().includes('admin') ||
                  profile?.handle?.toLowerCase().includes('admin') ||
                  session?.user?.email?.toLowerCase().includes('admin')
                )
              }
              onNavigateToWatchAds={() => navigateToTab('WATCH_ADS')}
              highlightTaskId={highlightTaskId}
              onClearHighlightTask={() => setHighlightTaskId(null)}
            />
          </View>
        )}

        {loadedTabs['WATCH_ADS'] && (
          <View style={[styles.screenWrapper, currentTab !== 'WATCH_ADS' && styles.hiddenScreen]}>
            <WatchAdsScreen
              userId={session.user.id}
              userEmail={session?.user?.email}
              isAdmin={
                Boolean(
                  profile?.is_admin ||
                  (profile as any)?.role === 'admin' ||
                  (profile as any)?.role === 'staff' ||
                  profile?.email?.toLowerCase().includes('admin') ||
                  profile?.handle?.toLowerCase().includes('admin') ||
                  session?.user?.email?.toLowerCase().includes('admin')
                )
              }
              onBack={navigateBack}
              onBalanceUpdated={(_newBal) => {}}
            />
          </View>
        )}

        {loadedTabs['PAYOUT'] && (
          <View style={[styles.screenWrapper, currentTab !== 'PAYOUT' && styles.hiddenScreen]}>
            <PayoutScreen userId={session.user.id} />
          </View>
        )}

        {loadedTabs['POLICY'] && (
          <View style={[styles.screenWrapper, currentTab !== 'POLICY' && styles.hiddenScreen]}>
            <PolicyPrivacyScreen
              profile={profile}
              onSignedOut={() => {
                setSession(null);
                setProfile(null);
                setLoadedTabs({ LANDING: true });
                setNavHistory(['LANDING']);
                setCurrentTab('LANDING');
              }}
            />
          </View>
        )}

        {loadedTabs['NOTIFICATIONS'] && (
          <View style={[styles.screenWrapper, currentTab !== 'NOTIFICATIONS' && styles.hiddenScreen]}>
            <NotificationsScreen
              onBack={() => {
                navigateBack();
                loadUnreadCount();
              }}
              onNavigateScreen={(screen, taskId) => {
                if (taskId) {
                  setHighlightTaskId(taskId);
                }
                navigateToTab(screen as TabType);
                loadUnreadCount();
              }}
            />
          </View>
        )}
      </View>

      {/* Bottom Navigation Bar (Hidden on Explore / Landing, Post Job, Subscription, and Watch Ads Screens) */}
      {currentTab !== 'LANDING' && currentTab !== 'POST_JOB' && currentTab !== 'SUBSCRIPTION' && currentTab !== 'WATCH_ADS' && (
        <View style={styles.navBar}>
          <TouchableOpacity
            style={[styles.navItem, currentTab === 'REMOTE_JOBS' && styles.navItemActive]}
            onPress={() => navigateToTab('REMOTE_JOBS')}
          >
            <Briefcase
              color={currentTab === 'REMOTE_JOBS' ? '#38BDF8' : '#64748B'}
              size={20}
            />
            <Text
              style={[
                styles.navText,
                currentTab === 'REMOTE_JOBS' && styles.navTextActive,
              ]}
            >
              Remote Jobs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, currentTab === 'MICRO_JOBS' && styles.navItemActive]}
            onPress={() => navigateToTab('MICRO_JOBS')}
          >
            <Zap
              color={currentTab === 'MICRO_JOBS' ? '#38BDF8' : '#64748B'}
              size={20}
            />
            <Text
              style={[
                styles.navText,
                currentTab === 'MICRO_JOBS' && styles.navTextActive,
              ]}
            >
              Micro-Tasks
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, currentTab === 'PAYOUT' && styles.navItemActive]}
            onPress={() => navigateToTab('PAYOUT')}
          >
            <Wallet
              color={currentTab === 'PAYOUT' ? '#38BDF8' : '#64748B'}
              size={20}
            />
            <Text
              style={[
                styles.navText,
                currentTab === 'PAYOUT' && styles.navTextActive,
              ]}
            >
              Payout
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, currentTab === 'POLICY' && styles.navItemActive]}
            onPress={() => navigateToTab('POLICY')}
          >
            <ShieldCheck
              color={currentTab === 'POLICY' ? '#38BDF8' : '#64748B'}
              size={20}
            />
            <Text
              style={[
                styles.navText,
                currentTab === 'POLICY' && styles.navTextActive,
              ]}
            >
              Legal
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Play Store App Update Modal */}
      <AppUpdateModal
        updateInfo={updateInfo}
        visible={!!updateInfo?.updateAvailable && showUpdateModal}
        onDismiss={() => setShowUpdateModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B1120',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0B1120',
    alignItems: 'center',
    justifyContent: 'center',
  },
  globalTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0B1120',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  appNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  globalAppName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postJobTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  postJobTopBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  topActionBtn: {
    padding: 7,
    backgroundColor: '#1E293B',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#334155',
  },
  topActionBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#38BDF8',
  },
  bellButton: {
    padding: 7,
    backgroundColor: '#1E293B',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bellBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  contentContainer: {
    flex: 1,
  },
  screenWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  hiddenScreen: {
    display: 'none',
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 10,
    justifyContent: 'space-around',
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  navItemActive: {
    backgroundColor: '#1E293B',
  },
  navText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  navTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
});
