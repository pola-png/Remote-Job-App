import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  Video,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ExternalLink,
  AlertTriangle,
  Sparkles,
  Award,
  Play,
} from '../components/LucideIcons';
import {
  YouTubeTaskService,
  YouTubeTaskStatusInfo,
  YouTubeAdminProofItem,
  YOUTUBE_TASK_CONFIG,
} from '../services/youtubeTask';

interface Props {
  userId: string;
  userEmail?: string;
  isAdmin?: boolean;
  initialAdminMode?: boolean;
  onBack: () => void;
  onStatusUpdated?: (newStatus: YouTubeTaskStatusInfo) => void;
}

export const YouTubeSubscribeTaskScreen: React.FC<Props> = ({
  userId,
  userEmail,
  isAdmin,
  initialAdminMode = false,
  onBack,
  onStatusUpdated,
}: Props) => {
  const [statusInfo, setStatusInfo] = useState<YouTubeTaskStatusInfo>({
    status: 'not_submitted',
    rewardUsd: YOUTUBE_TASK_CONFIG.REWARD_USD,
    rewardCredited: false,
  });
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(true);
  const [hasOpenedYouTube, setHasOpenedYouTube] = useState<boolean>(false);
  const [visitCountdown, setVisitCountdown] = useState<number>(8);
  const [youtubeHandle, setYoutubeHandle] = useState<string>('');
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string>('');
  const [screenshotFileName, setScreenshotFileName] = useState<string>('');
  const [screenshotSizeKb, setScreenshotSizeKb] = useState<number>(0);
  const [isPickingImage, setIsPickingImage] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Admin Review Tab State
  const [activeTab, setActiveTab] = useState<'USER_TASK' | 'ADMIN_REVIEW'>(
    initialAdminMode && isAdmin ? 'ADMIN_REVIEW' : 'USER_TASK'
  );
  const [adminFilter, setAdminFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [adminProofs, setAdminProofs] = useState<YouTubeAdminProofItem[]>([]);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState<boolean>(false);
  const [processingProofId, setProcessingProofId] = useState<string | null>(null);

  useEffect(() => {
    loadUserStatus();
  }, [userId]);

  useEffect(() => {
    if (activeTab === 'ADMIN_REVIEW' && isAdmin) {
      loadAdminQueue(adminFilter);
    }
  }, [activeTab, adminFilter, isAdmin]);

  useEffect(() => {
    if (!hasOpenedYouTube || visitCountdown <= 0) return;
    const timer = setInterval(() => {
      setVisitCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [hasOpenedYouTube, visitCountdown]);

  const loadUserStatus = async (forceRefresh: boolean = false) => {
    setIsLoadingStatus(true);
    const info = await YouTubeTaskService.getStatus(userId, forceRefresh);
    setStatusInfo(info);
    if (info.youtubeHandle) {
      setYoutubeHandle(info.youtubeHandle);
    }
    setIsLoadingStatus(false);
  };

  const loadAdminQueue = async (filter: 'pending' | 'approved' | 'rejected') => {
    setIsLoadingAdmin(true);
    const list = await YouTubeTaskService.getAdminSubmissions(filter);
    setAdminProofs(list);
    setIsLoadingAdmin(false);
  };

  const handleOpenYouTube = async () => {
    setHasOpenedYouTube(true);
    await YouTubeTaskService.openYouTubeChannel();
  };

  const handlePickScreenshot = async () => {
    if (!hasOpenedYouTube && statusInfo.status === 'not_submitted') {
      Alert.alert(
        'Open YouTube First',
        'Please tap "Step 1: Open YouTube & Subscribe" first, subscribe to our channel, and take a screenshot showing you are Subscribed.'
      );
      return;
    }

    setIsPickingImage(true);
    const res = await YouTubeTaskService.pickScreenshotFromGallery();
    setIsPickingImage(false);

    if (res.cancelled) return;

    if (res.nativePickerUnavailable) {
      Alert.alert(
        'Update Required for Gallery Picker',
        'Please rebuild or update the app to select images directly from your device gallery.'
      );
      return;
    }

    if (res.base64DataUrl) {
      setScreenshotDataUrl(res.base64DataUrl);
      setScreenshotFileName(res.fileName || 'youtube_subscribed_proof.jpg');
      setScreenshotSizeKb(res.sizeBytes ? Math.max(1, Math.round(res.sizeBytes / 1024)) : 32);
    }
  };

  const handleSubmitProof = async () => {
    if (!hasOpenedYouTube && statusInfo.status === 'not_submitted') {
      Alert.alert(
        'Step 1 Required',
        'Please tap "Step 1: Open YouTube & Subscribe" to subscribe to our official channel first.'
      );
      return;
    }

    if (visitCountdown > 0 && statusInfo.status === 'not_submitted') {
      Alert.alert(
        'Please Subscribe First',
        `Please wait ${visitCountdown} more seconds while subscribing on YouTube before submitting.`
      );
      return;
    }

    if (!youtubeHandle.trim()) {
      Alert.alert(
        'YouTube Name / @Handle Required',
        'Please enter your YouTube username or @handle so the Admin can verify your subscription.'
      );
      return;
    }

    if (!screenshotDataUrl) {
      Alert.alert(
        'Screenshot Required',
        'Please tap "Select Screenshot from Gallery" and attach a screenshot showing that you are Subscribed to our YouTube channel.'
      );
      return;
    }

    setIsSubmitting(true);
    const result = await YouTubeTaskService.submitScreenshotProof({
      userId,
      userEmail,
      youtubeHandle: youtubeHandle.trim(),
      screenshotDataUrl,
      screenshotFileName,
    });
    setIsSubmitting(false);

    if (result.success && result.statusInfo) {
      setStatusInfo(result.statusInfo);
      onStatusUpdated?.(result.statusInfo);
      Alert.alert(
        '⏳ Submitted for Admin Approval!',
        'Your screenshot proof has been submitted! All daily micro-tasks are now unlocked while you wait. Your +$2.00 reward will be credited to your wallet as soon as the Admin approves your screenshot.',
        [{ text: 'Continue to Tasks', onPress: onBack }]
      );
    } else {
      Alert.alert('Submission Error', result.message);
    }
  };

  const handleAdminApprove = async (item: YouTubeAdminProofItem) => {
    setProcessingProofId(item.id);
    const res = await YouTubeTaskService.approveSubmissionAsAdmin(item);
    setProcessingProofId(null);

    if (res.success) {
      Alert.alert('✅ Approved (+$2.00 Credited)', res.message);
      loadAdminQueue(adminFilter);
      if (item.userId === userId) {
        loadUserStatus(true);
      }
    } else {
      Alert.alert('Error', res.message);
    }
  };

  const handleAdminReject = (item: YouTubeAdminProofItem) => {
    Alert.alert(
      'Reject Screenshot Proof?',
      `Reject ${item.userEmail}'s screenshot? They will be asked to upload a clear screenshot showing "Subscribed".`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject Proof',
          style: 'destructive',
          onPress: async () => {
            setProcessingProofId(item.id);
            const res = await YouTubeTaskService.rejectSubmissionAsAdmin(item);
            setProcessingProofId(null);
            if (res.success) {
              Alert.alert('Rejected', res.message);
              loadAdminQueue(adminFilter);
              if (item.userId === userId) {
                loadUserStatus(true);
              }
            } else {
              Alert.alert('Error', res.message);
            }
          },
        },
      ]
    );
  };

  const canResubmit = statusInfo.status === 'not_submitted' || statusInfo.status === 'rejected';

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft color="#F8FAFC" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>YouTube Subscribe Task</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Admin Mode Switcher */}
      {isAdmin && (
        <View style={styles.adminToggleRow}>
          <TouchableOpacity
            style={[styles.adminTabBtn, activeTab === 'USER_TASK' && styles.adminTabBtnActive]}
            onPress={() => setActiveTab('USER_TASK')}
          >
            <Text style={[styles.adminTabText, activeTab === 'USER_TASK' && styles.adminTabTextActive]}>
              Task View
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.adminTabBtn, activeTab === 'ADMIN_REVIEW' && styles.adminTabBtnActive]}
            onPress={() => setActiveTab('ADMIN_REVIEW')}
          >
            <Award color={activeTab === 'ADMIN_REVIEW' ? '#0F172A' : '#FBBF24'} size={14} style={{ marginRight: 5 }} />
            <Text style={[styles.adminTabText, activeTab === 'ADMIN_REVIEW' && styles.adminTabTextActive]}>
              Admin Approvals ($2.00)
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'ADMIN_REVIEW' && isAdmin ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.adminFilterBar}>
            {(['pending', 'approved', 'rejected'] as const).map((st) => (
              <TouchableOpacity
                key={st}
                style={[styles.filterPill, adminFilter === st && styles.filterPillActive]}
                onPress={() => setAdminFilter(st)}
              >
                <Text style={[styles.filterPillText, adminFilter === st && styles.filterPillTextActive]}>
                  {st.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {isLoadingAdmin ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#38BDF8" />
              <Text style={styles.loadingText}>Loading screenshot submissions...</Text>
            </View>
          ) : adminProofs.length === 0 ? (
            <View style={styles.centerBox}>
              <CheckCircle2 color="#34D399" size={38} />
              <Text style={styles.emptyAdminTitle}>No {adminFilter} submissions</Text>
              <Text style={styles.emptyAdminDesc}>
                When users submit their YouTube subscription screenshots, they will appear here for 1-tap approval.
              </Text>
            </View>
          ) : (
            adminProofs.map((item) => (
              <View key={item.id} style={styles.adminProofCard}>
                <View style={styles.adminProofHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.adminUserEmail}>{item.userEmail}</Text>
                    <Text style={styles.adminUserHandle}>YouTube Handle: {item.youtubeHandle}</Text>
                    <Text style={styles.adminTimestamp}>
                      Submitted: {new Date(item.submittedAt).toLocaleString()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      item.status === 'approved'
                        ? styles.statusApproved
                        : item.status === 'rejected'
                        ? styles.statusRejected
                        : styles.statusPending,
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>{item.status.toUpperCase()}</Text>
                  </View>
                </View>

                {item.screenshotDataUrl ? (
                  <View style={styles.adminImageWrapper}>
                    <Image
                      source={{ uri: item.screenshotDataUrl }}
                      style={styles.adminScreenshotPreview}
                      resizeMode="contain"
                    />
                  </View>
                ) : null}

                {item.status === 'pending' && (
                  <View style={styles.adminActionButtons}>
                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={() => handleAdminApprove(item)}
                      disabled={processingProofId === item.id}
                    >
                      {processingProofId === item.id ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <CheckCircle2 color="#FFFFFF" size={16} style={{ marginRight: 6 }} />
                          <Text style={styles.approveBtnText}>Approve & Pay +$2.00</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => handleAdminReject(item)}
                      disabled={processingProofId === item.id}
                    >
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero Task Banner */}
          <View style={styles.heroCard}>
            <View style={styles.mandatoryBadgeRow}>
              <View style={styles.mandatoryBadge}>
                <Sparkles color="#FEE2E2" size={11} style={{ marginRight: 4 }} />
                <Text style={styles.mandatoryBadgeText}>MANDATORY FOR ALL USERS</Text>
              </View>
              <View style={styles.rewardPill}>
                <Text style={styles.rewardPillText}>+$2.00 USD</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>{YOUTUBE_TASK_CONFIG.TITLE}</Text>
            <Text style={styles.heroDesc}>
              Subscribe to our official YouTube channel, take a screenshot showing the{' '}
              <Text style={{ color: '#F8FAFC', fontWeight: '800' }}>"Subscribed"</Text> button, and upload it below.
              Once verified and approved by our Admin team, <Text style={{ color: '#34D399', fontWeight: '800' }}>+$2.00</Text>{' '}
              will be added directly to your payout balance!
            </Text>

            <View style={styles.rewardBox}>
              <View>
                <Text style={styles.rewardBoxLabel}>TASK REWARD UPON ADMIN APPROVAL</Text>
                <Text style={styles.rewardBoxAmount}>+$2.00 USD (200 Pts)</Text>
              </View>
              <View style={styles.verifiedTag}>
                <ShieldCheck color="#34D399" size={14} style={{ marginRight: 4 }} />
                <Text style={styles.verifiedTagText}>Admin Verified</Text>
              </View>
            </View>
          </View>

          {/* Current Submission Status Banner */}
          {isLoadingStatus ? (
            <View style={styles.statusBannerPending}>
              <ActivityIndicator size="small" color="#FBBF24" />
              <Text style={styles.statusBannerTitle}>Checking your submission status...</Text>
            </View>
          ) : statusInfo.status === 'approved' ? (
            <View style={styles.statusBannerApproved}>
              <CheckCircle2 color="#34D399" size={24} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.statusApprovedTitle}>
                  ✅ Approved by Admin! (+$2.00 Credited)
                </Text>
                <Text style={styles.statusApprovedDesc}>
                  Your YouTube channel subscription has been verified and +$2.00 has been credited to your balance.
                </Text>
              </View>
            </View>
          ) : statusInfo.status === 'pending' ? (
            <View style={styles.statusBannerPending}>
              <Clock color="#FBBF24" size={24} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.statusPendingTitle}>
                  ⏳ Pending Admin Approval (+$2.00)
                </Text>
                <Text style={styles.statusPendingDesc}>
                  We received your screenshot proof (Handle: {statusInfo.youtubeHandle || 'Submitted'}). An Admin is reviewing it now—your +$2.00 reward will credit automatically as soon as it is approved!
                </Text>
              </View>
            </View>
          ) : statusInfo.status === 'rejected' ? (
            <View style={styles.statusBannerRejected}>
              <AlertTriangle color="#F87171" size={24} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.statusRejectedTitle}>
                  ⚠️ Screenshot Rejected — Please Resubmit
                </Text>
                <Text style={styles.statusRejectedDesc}>
                  {statusInfo.adminNote ||
                    'Your screenshot did not clearly show that you are subscribed to our channel. Please subscribe and upload a clear screenshot below.'}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Step-by-Step Submission Form (Shown if not_submitted or rejected, or allow updating pending screenshot) */}
          {statusInfo.status !== 'approved' && (
            <View style={styles.stepsCard}>
              <Text style={styles.sectionHeading}>COMPLETE THESE 3 STEPS TO EARN $2.00</Text>

              {/* Step 1: Open YouTube Channel */}
              <View style={styles.stepBlock}>
                <View style={styles.stepHeaderRow}>
                  <View style={[styles.stepBadge, hasOpenedYouTube && styles.stepBadgeDone]}>
                    <Text style={styles.stepBadgeNum}>{hasOpenedYouTube ? '✓' : '1'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepTitle}>Open Our YouTube Channel & Subscribe</Text>
                    <Text style={styles.stepSub}>
                      Tap the red button below, click "Subscribe" on our YouTube channel, and take a screenshot showing "Subscribed".
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.youtubeBtn}
                  onPress={handleOpenYouTube}
                  activeOpacity={0.85}
                >
                  <Play color="#FFFFFF" size={16} style={{ marginRight: 8 }} />
                  <Text style={styles.youtubeBtnText}>
                    {hasOpenedYouTube ? 'Re-Open YouTube Channel' : 'Step 1: Open YouTube & Subscribe'}
                  </Text>
                  <ExternalLink color="#FFFFFF" size={15} style={{ marginLeft: 8 }} />
                </TouchableOpacity>

                {hasOpenedYouTube && visitCountdown > 0 && (
                  <Text style={styles.countdownHint}>
                    ⏳ Verifying YouTube visit... ({visitCountdown}s remaining)
                  </Text>
                )}
              </View>

              {/* Step 2: Enter YouTube Username / Handle */}
              <View style={styles.stepBlock}>
                <View style={styles.stepHeaderRow}>
                  <View style={[styles.stepBadge, youtubeHandle.trim().length > 1 && styles.stepBadgeDone]}>
                    <Text style={styles.stepBadgeNum}>{youtubeHandle.trim().length > 1 ? '✓' : '2'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepTitle}>Enter Your YouTube Name or @Handle</Text>
                    <Text style={styles.stepSub}>
                      Enter the name or @handle of the YouTube account you subscribed with.
                    </Text>
                  </View>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="e.g. @johndoe or John Doe"
                  placeholderTextColor="#64748B"
                  value={youtubeHandle}
                  onChangeText={setYoutubeHandle}
                  autoCapitalize="none"
                />
              </View>

              {/* Step 3: Upload Screenshot Proof */}
              <View style={styles.stepBlock}>
                <View style={styles.stepHeaderRow}>
                  <View style={[styles.stepBadge, Boolean(screenshotDataUrl) && styles.stepBadgeDone]}>
                    <Text style={styles.stepBadgeNum}>{screenshotDataUrl ? '✓' : '3'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepTitle}>Upload Screenshot of Subscription</Text>
                    <Text style={styles.stepSub}>
                      Select the screenshot from your phone gallery showing that you are Subscribed to our channel.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.pickImageBtn, Boolean(screenshotDataUrl) && styles.pickImageBtnSelected]}
                  onPress={handlePickScreenshot}
                  disabled={isPickingImage}
                  activeOpacity={0.8}
                >
                  {isPickingImage ? (
                    <ActivityIndicator color="#38BDF8" />
                  ) : (
                    <Text style={styles.pickImageBtnText}>
                      {screenshotDataUrl
                        ? '📸 Change Selected Screenshot'
                        : '📸 Select Screenshot from Gallery'}
                    </Text>
                  )}
                </TouchableOpacity>

                {screenshotDataUrl ? (
                  <View style={styles.previewContainer}>
                    <Image
                      source={{ uri: screenshotDataUrl }}
                      style={styles.screenshotPreview}
                      resizeMode="contain"
                    />
                    <View style={styles.previewMetaRow}>
                      <CheckCircle2 color="#34D399" size={14} style={{ marginRight: 6 }} />
                      <Text style={styles.previewMetaText} numberOfLines={1}>
                        {screenshotFileName} ({screenshotSizeKb} KB • Ready for Admin review)
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  (!screenshotDataUrl || !youtubeHandle.trim() || isSubmitting) && styles.submitBtnDisabled,
                ]}
                onPress={handleSubmitProof}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <CheckCircle2 color="#FFFFFF" size={18} style={{ marginRight: 8 }} />
                    <Text style={styles.submitBtnText}>
                      {statusInfo.status === 'pending'
                        ? 'Update Screenshot Proof ($2.00)'
                        : 'Submit Screenshot for Admin Approval (+$2.00)'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.disclaimerText}>
                ⚠️ Fake, uncropped, or unsubscribed screenshots will be rejected by Admin. Please make sure the "Subscribed" button is clearly visible in your screenshot.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
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
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 44,
  },
  heroCard: {
    backgroundColor: '#1E1520',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    marginBottom: 16,
  },
  mandatoryBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mandatoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#991B1B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F87171',
  },
  mandatoryBadgeText: {
    color: '#FEE2E2',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rewardPill: {
    backgroundColor: '#065F46',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#34D399',
  },
  rewardPillText: {
    color: '#A7F3D0',
    fontSize: 12,
    fontWeight: '800',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  heroDesc: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 19,
  },
  rewardBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(239, 68, 68, 0.3)',
  },
  rewardBoxLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  rewardBoxAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#34D399',
    marginTop: 2,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  verifiedTagText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
  },
  statusBannerPending: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F59E0B',
    marginBottom: 16,
  },
  statusBannerTitle: {
    color: '#FDE68A',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 10,
  },
  statusPendingTitle: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  statusPendingDesc: {
    color: '#FDE68A',
    fontSize: 12,
    lineHeight: 17,
  },
  statusBannerApproved: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#10B981',
    marginBottom: 16,
  },
  statusApprovedTitle: {
    color: '#34D399',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  statusApprovedDesc: {
    color: '#A7F3D0',
    fontSize: 12,
    lineHeight: 17,
  },
  statusBannerRejected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    marginBottom: 16,
  },
  statusRejectedTitle: {
    color: '#F87171',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  statusRejectedDesc: {
    color: '#FECACA',
    fontSize: 12,
    lineHeight: 17,
  },
  stepsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  stepBlock: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#0F172A',
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  stepBadgeDone: {
    backgroundColor: '#065F46',
    borderColor: '#34D399',
  },
  stepBadgeNum: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  stepSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 16,
  },
  youtubeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F87171',
  },
  youtubeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  countdownHint: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#FFFFFF',
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14,
  },
  pickImageBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    borderStyle: 'dashed',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickImageBtnSelected: {
    borderColor: '#34D399',
    borderStyle: 'solid',
  },
  pickImageBtnText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
  },
  previewContainer: {
    marginTop: 12,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  screenshotPreview: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    backgroundColor: '#020617',
  },
  previewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  previewMetaText: {
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#34D399',
    marginTop: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#334155',
    borderColor: '#475569',
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  disclaimerText: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  /* Admin Review Styles */
  adminToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  adminTabBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  adminTabBtnActive: {
    backgroundColor: '#FBBF24',
  },
  adminTabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  adminTabTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  adminFilterBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  filterPillActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  filterPillText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
  },
  filterPillTextActive: {
    color: '#0F172A',
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 10,
  },
  emptyAdminTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
  },
  emptyAdminDesc: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  adminProofCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 14,
  },
  adminProofHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  adminUserEmail: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
  },
  adminUserHandle: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  adminTimestamp: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  statusApproved: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusRejected: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusBadgeText: {
    color: '#F8FAFC',
    fontSize: 10,
    fontWeight: '800',
  },
  adminImageWrapper: {
    backgroundColor: '#020617',
    borderRadius: 12,
    overflow: 'hidden',
    height: 260,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  adminScreenshotPreview: {
    width: '100%',
    height: '100%',
  },
  adminActionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  approveBtn: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#7F1D1D',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  rejectBtnText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '800',
  },
});
