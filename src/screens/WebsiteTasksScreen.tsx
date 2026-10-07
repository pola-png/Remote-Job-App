import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ArrowLeft, Globe, Clock, CheckCircle2, ExternalLink } from '../components/LucideIcons';
import { JobsService, MicroJobItem } from '../services/jobs';

interface Props {
  userId: string;
  onBack: () => void;
  onCompleted?: () => void;
  task?: MicroJobItem;
}

export const WebsiteTasksScreen: React.FC<Props> = ({
  userId,
  onBack,
  onCompleted,
  task,
}: Props) => {
  const taskItem: MicroJobItem = task || {
    id: 'web_sponsor_browse',
    title: 'Visit Sponsor Portal & Verify Load',
    category: 'WEBSITE',
    rewardUsd: 0.15,
    durationSeconds: 15,
    description: 'Browse partner landing page for 15 seconds to verify server responsiveness.',
  };

  const [timerSeconds, setTimerSeconds] = useState(taskItem.durationSeconds || 15);
  const [isCompletedTimer, setIsCompletedTimer] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    if (timerSeconds <= 0) {
      setIsCompletedTimer(true);
      return;
    }
    const timer = setInterval(() => {
      setTimerSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timerSeconds]);

  const handleClaim = async () => {
    setIsClaiming(true);
    const res = await JobsService.completeTask(userId, taskItem);
    setIsClaiming(false);

    if (res.success) {
      Alert.alert(
        'Task Verified!',
        `+$${taskItem.rewardUsd.toFixed(2)} credited to your available payout balance.`
      );
      onCompleted?.();
      onBack();
    } else {
      Alert.alert('Error', 'Unable to record task verification.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft color="#F8FAFC" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Website Task Gateway</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.rewardTag}>
          <Globe color="#34D399" size={16} />
          <Text style={styles.rewardText}>Reward: +${taskItem.rewardUsd.toFixed(2)}</Text>
        </View>

        <Text style={styles.title}>{taskItem.title}</Text>
        <Text style={styles.desc}>{taskItem.description}</Text>

        <View style={styles.timerCard}>
          <Clock color={isCompletedTimer ? '#34D399' : '#38BDF8'} size={28} />
          <Text style={styles.timerNumber}>
            {isCompletedTimer ? 'Ready!' : `${timerSeconds}s`}
          </Text>
          <Text style={styles.timerSubtitle}>
            {isCompletedTimer
              ? 'Visit duration verified by gateway'
              : 'Verifying active session on target page...'}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.claimBtn,
            (!isCompletedTimer || isClaiming) && styles.claimBtnDisabled,
          ]}
          onPress={handleClaim}
          disabled={!isCompletedTimer || isClaiming}
        >
          {isClaiming ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.claimBtnText}>
              {isCompletedTimer ? 'Claim Reward' : `Wait ${timerSeconds}s`}
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
    backgroundColor: '#0F291E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#059669',
    marginBottom: 16,
  },
  rewardText: { color: '#34D399', fontSize: 13, fontWeight: '700', marginLeft: 6 },
  title: { fontSize: 20, fontWeight: '800', color: '#F8FAFC', marginBottom: 8 },
  desc: { fontSize: 14, color: '#94A3B8', lineHeight: 20, marginBottom: 24 },
  timerCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 30,
  },
  timerNumber: { fontSize: 32, fontWeight: '800', color: '#F8FAFC', marginVertical: 8 },
  timerSubtitle: { fontSize: 12, color: '#94A3B8', textAlign: 'center' },
  claimBtn: {
    backgroundColor: '#10B981',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimBtnDisabled: { backgroundColor: '#334155' },
  claimBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
