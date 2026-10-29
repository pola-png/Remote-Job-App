import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  Video,
  Sparkles,
  CheckCircle2,
  X,
  Play,
  ShieldCheck,
  Award,
} from './LucideIcons';
import { UnifiedAdService } from '../services/ads';
import { AdTierService } from '../services/adTierService';

interface Props {
  visible: boolean;
  onClose: () => void;
  onRewardEarned: () => void;
  jobTitle?: string;
  company?: string;
  mode?: 'JOB_APPLY' | 'JOB_DETAILS' | 'MICRO_TASK';
  rewardAmount?: string;
}

export const RewardedAdModal: React.FC<Props> = ({
  visible,
  onClose,
  onRewardEarned,
  jobTitle,
  company,
  mode = 'JOB_DETAILS',
  rewardAmount,
}) => {
  const [isLoadingAd, setIsLoadingAd] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setIsLoadingAd(false);
      setAdError(null);
    }
  }, [visible]);

  const handleStartAd = async () => {
    setAdError(null);
    setIsLoadingAd(true);
    // Request and show real Google AdMob + Pangle Rewarded Video
    await UnifiedAdService.showRewardedAd(
      (reward) => {
        setIsLoadingAd(false);
        if (reward?.rewardEarned) {
          onRewardEarned();
          onClose();
        }
      },
      () => {
        setIsLoadingAd(false);
      },
      (err) => {
        setIsLoadingAd(false);
        console.warn('Real Rewarded Ad was not completed / no fill:', err);
        if (err?.code === 'AD_CLOSED_EARLY') {
          setAdError('You closed the video before it finished playing. You must watch the full video ad to unlock.');
        } else {
          setAdError('Sponsor video ad failed to load right now. Please tap Retry Ad below.');
        }
      }
    );
  };

  if (!visible) return null;

  const isMicroTask = mode === 'MICRO_TASK';
  const isJobDetails = mode === 'JOB_DETAILS';

  const getBadgeText = () => {
    if (isMicroTask) return 'Sponsored Task Access';
    if (isJobDetails) return 'Free Job Details Access';
    return 'Free Application Access';
  };

  const getTitle = () => {
    if (isMicroTask) return 'Unlock Micro-Task';
    if (isJobDetails) return 'Unlock Job Details';
    return 'Unlock Application';
  };

  const getBtnText = () => {
    if (isLoadingAd) return 'Loading Video Ad...';
    if (adError) return 'Retry Ad';
    if (isMicroTask) return 'Watch Video & Start Task';
    if (isJobDetails) return 'Watch Video & View Details';
    return 'Watch Video & Apply';
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badge}>
              <Award color="#F59E0B" size={14} style={{ marginRight: 4 }} />
              <Text style={styles.badgeText}>{getBadgeText()}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={isLoadingAd}>
              <X color="#94A3B8" size={18} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.body}>
            <View style={styles.iconCircle}>
              {isLoadingAd ? (
                <ActivityIndicator color="#38BDF8" size="large" />
              ) : (
                <Sparkles color="#38BDF8" size={32} />
              )}
            </View>
            <Text style={styles.title}>
              {getTitle()}
            </Text>
            <Text style={styles.subtitle}>
              {isMicroTask ? (
                <>
                  Watch a short sponsor video to unlock{' '}
                  <Text style={{ color: '#F8FAFC', fontWeight: 'bold' }}>{jobTitle || 'this task'}</Text>
                  {rewardAmount ? ` and earn ${rewardAmount}` : ''}.
                </>
              ) : isJobDetails ? (
                <>
                  Watch a short sponsor video to view full requirements and apply for{' '}
                  <Text style={{ color: '#F8FAFC', fontWeight: 'bold' }}>{jobTitle || 'this role'}</Text>
                  {company ? ` at ${company}` : ''}.
                </>
              ) : (
                <>
                  Watch a short sponsor video to unlock your direct job application for{' '}
                  <Text style={{ color: '#F8FAFC', fontWeight: 'bold' }}>{jobTitle || 'this role'}</Text>
                  {company ? ` at ${company}` : ''}.
                </>
              )}
            </Text>

            <View style={styles.perksList}>
              <View style={styles.perkRow}>
                <CheckCircle2 color="#34D399" size={16} />
                <Text style={styles.perkText}>
                  {isMicroTask ? 'Instant Balance Crediting' : '100% Free for Job Seekers'}
                </Text>
              </View>
              <View style={styles.perkRow}>
                <CheckCircle2 color="#34D399" size={16} />
                <Text style={styles.perkText}>
                  {isMicroTask ? 'Verified Payout Tasks' : 'Direct Employer Links & Easy Apply'}
                </Text>
              </View>
            </View>

            {adError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{adError}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.watchBtn,
                adError ? styles.retryBtn : null,
                isLoadingAd && styles.watchBtnDisabled,
              ]}
              onPress={handleStartAd}
              activeOpacity={0.85}
              disabled={isLoadingAd}
            >
              {isLoadingAd ? (
                <ActivityIndicator color="#0F172A" style={{ marginRight: 8 }} />
              ) : (
                <Play color="#0F172A" size={18} style={{ marginRight: 6 }} />
              )}
              <Text style={styles.watchBtnText}>{getBtnText()}</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  badgeText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#334155',
  },
  body: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  perksList: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  perkText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '500',
  },
  errorBanner: {
    width: '100%',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  errorBannerText: {
    color: '#FCA5A5',
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  watchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#38BDF8',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryBtn: {
    backgroundColor: '#F59E0B',
  },
  watchBtnDisabled: {
    backgroundColor: '#334155',
    opacity: 0.8,
  },
  watchBtnText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  unlockBtn: {
    backgroundColor: '#34D399',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  unlockBtnText: {
    color: '#064E3B',
    fontSize: 15,
    fontWeight: '700',
  },
});
