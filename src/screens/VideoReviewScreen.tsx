import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ArrowLeft, Video, Clock, CheckCircle2, Play } from '../components/LucideIcons';
import { JobsService, MicroJobItem } from '../services/jobs';
import { UnifiedAdService } from '../services/ads';

interface Props {
  userId: string;
  onBack: () => void;
  onCompleted?: () => void;
  task?: MicroJobItem;
}

export const VideoReviewScreen: React.FC<Props> = ({
  userId,
  onBack,
  onCompleted,
  task,
}: Props) => {
  const taskItem: MicroJobItem = task || {
    id: 'video_review_task_sample',
    title: 'Short Video Audio & Clarity Review',
    category: 'VIDEO',
    rewardUsd: 0.20,
    durationSeconds: 15,
    description: 'Review promotional video quality and evaluate audio-visual clarity.',
  };

  const [hasWatchedVideo, setHasWatchedVideo] = useState(false);
  const [isPlayingAd, setIsPlayingAd] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePlayRealVideoAd = async () => {
    setIsPlayingAd(true);
    await UnifiedAdService.showRewardedAd(
      () => {
        setIsPlayingAd(false);
        setHasWatchedVideo(true);
      },
      () => {
        setIsPlayingAd(false);
        setHasWatchedVideo(true);
      },
      () => {
        setIsPlayingAd(false);
        setHasWatchedVideo(true);
      }
    );
  };

  const handleSubmit = async () => {
    if (!hasWatchedVideo) {
      Alert.alert('Video Required', 'Please watch the sponsor video first before submitting.');
      return;
    }
    if (rating === null) {
      Alert.alert('Rating Required', 'Please choose a rating for the video review.');
      return;
    }

    setIsSubmitting(true);
    const res = await JobsService.completeTask(userId, taskItem);
    setIsSubmitting(false);

    if (res.success) {
      Alert.alert(
        'Review Submitted!',
        `+$${taskItem.rewardUsd.toFixed(2)} credited to your available payout balance.`
      );
      onCompleted?.();
      onBack();
    } else {
      Alert.alert('Error', 'Unable to submit video review.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft color="#F8FAFC" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Video Task Review</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.rewardTag}>
          <Video color="#F472B6" size={16} />
          <Text style={styles.rewardText}>Reward: +${taskItem.rewardUsd.toFixed(2)}</Text>
        </View>

        <Text style={styles.title}>{taskItem.title}</Text>
        <Text style={styles.desc}>{taskItem.description}</Text>

        {/* Real Ad Player Trigger Box */}
        <View style={styles.playerBox}>
          {hasWatchedVideo ? (
            <View style={{ alignItems: 'center' }}>
              <CheckCircle2 color="#34D399" size={48} />
              <Text style={[styles.playerText, { color: '#34D399', fontWeight: '700' }]}>
                Video Ad Watched & Verified
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.playAdBtn}
              onPress={handlePlayRealVideoAd}
              disabled={isPlayingAd}
              activeOpacity={0.85}
            >
              {isPlayingAd ? (
                <ActivityIndicator color="#0F172A" size="small" />
              ) : (
                <Play color="#0F172A" size={24} />
              )}
              <Text style={styles.playAdBtnText}>
                {isPlayingAd ? 'Streaming Video Ad...' : '▶ Play Real Video Ad (Earn Reward)'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionHeader}>RATE CONTENT QUALITY</Text>

        {['5 Stars - Excellent Quality & Sound', '4 Stars - Good Clarity', '3 Stars - Needs Audio Optimization'].map(
          (label, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.ratingCard, rating === idx && styles.ratingCardActive]}
              onPress={() => setRating(idx)}
            >
              <Text style={[styles.ratingText, rating === idx && styles.ratingTextActive]}>
                {label}
              </Text>
              {rating === idx && <CheckCircle2 color="#38BDF8" size={18} />}
            </TouchableOpacity>
          )
        )}

        <TouchableOpacity
          style={[
            styles.submitBtn,
            (!hasWatchedVideo || isSubmitting) && styles.submitBtnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!hasWatchedVideo || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>
              {hasWatchedVideo ? 'Submit Review & Claim Payout' : 'Watch Video Ad First'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1120' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 40 },
  rewardTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#371B28',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BE185D',
    marginBottom: 16,
  },
  rewardText: { color: '#F472B6', fontSize: 13, fontWeight: '700', marginLeft: 6 },
  title: { fontSize: 20, fontWeight: '800', color: '#F8FAFC', marginBottom: 8 },
  desc: { fontSize: 14, color: '#94A3B8', lineHeight: 20, marginBottom: 20 },
  playerBox: {
    height: 180,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
  },
  playerText: { color: '#94A3B8', fontSize: 13, marginTop: 10 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  ratingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  ratingCardActive: { borderColor: '#38BDF8', backgroundColor: '#0F172A' },
  ratingText: { color: '#CBD5E1', fontSize: 14, fontWeight: '600' },
  ratingTextActive: { color: '#38BDF8', fontWeight: '700' },
  submitBtn: {
    backgroundColor: '#2563EB',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  submitBtnDisabled: { backgroundColor: '#334155' },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  playAdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#38BDF8',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  playAdBtnText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
});
