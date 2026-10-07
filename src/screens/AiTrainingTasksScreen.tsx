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
import { ArrowLeft, Sparkles, CheckCircle2, Shield } from '../components/LucideIcons';
import { JobsService, MicroJobItem } from '../services/jobs';
import { NotificationService } from '../services/notifications';

interface Props {
  userId: string;
  onBack: () => void;
  onCompleted?: () => void;
  task?: MicroJobItem;
}

export const AiTrainingTasksScreen: React.FC<Props> = ({
  userId,
  onBack,
  onCompleted,
  task,
}: Props) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const taskItem: MicroJobItem = task || {
    id: 'ai_data_sample_batch',
    title: 'AI Model Safety Evaluation Batch',
    category: 'AI_DATA',
    rewardUsd: 0.35,
    durationSeconds: 45,
    description: 'Verify adherence of generative language model answers to safety benchmarks.',
  };

  const handleComplete = async () => {
    if (selectedOption === null) {
      Alert.alert('Selection Required', 'Please select the most appropriate AI output rating.');
      return;
    }

    setIsSubmitting(true);
    const res = await JobsService.completeTask(userId, taskItem);
    setIsSubmitting(false);

    if (res.success) {
      Alert.alert(
        'Annotation Submitted!',
        `+$${taskItem.rewardUsd.toFixed(2)} credited to your available payout balance.`
      );
      NotificationService.triggerInAppNotification(
        '⚡ Reward Credited',
        `+$${taskItem.rewardUsd.toFixed(2)} earned from AI model annotation.`,
        'TASK_CREDIT',
        'MICRO_JOBS'
      );
      onCompleted?.();
      onBack();
    } else {
      Alert.alert('Submission Error', 'Could not record annotation.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft color="#F8FAFC" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Data Annotation</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.rewardTag}>
          <Sparkles color="#38BDF8" size={16} />
          <Text style={styles.rewardText}>Reward: +${taskItem.rewardUsd.toFixed(2)}</Text>
        </View>

        <Text style={styles.promptHeader}>AI Prompt Under Test:</Text>
        <View style={styles.promptCard}>
          <Text style={styles.promptText}>
            "Explain quantum computing fundamentals in simple terms for beginners."
          </Text>
        </View>

        <Text style={styles.promptHeader}>Generated Model Output:</Text>
        <View style={styles.responseCard}>
          <Text style={styles.responseText}>
            "Traditional computers use bits (0s and 1s) like light switches. Quantum computers use quantum bits (qubits) which can exist as both 0 and 1 simultaneously thanks to superposition. This enables solving complex simulations much faster."
          </Text>
        </View>

        <Text style={styles.sectionTitle}>EVALUATE ACCURACY & CLARITY</Text>

        {[
          '1. Highly Accurate, Safe & Clear for Beginners',
          '2. Generally Accurate with Minor Complexities',
          '3. Inaccurate / Misleading Explanation',
        ].map((opt, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.optionCard, selectedOption === idx && styles.optionCardActive]}
            onPress={() => setSelectedOption(idx)}
          >
            <Text style={[styles.optionText, selectedOption === idx && styles.optionTextActive]}>
              {opt}
            </Text>
            {selectedOption === idx && <CheckCircle2 color="#38BDF8" size={18} />}
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && { opacity: 0.6 }]}
          onPress={handleComplete}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Verified Annotation</Text>
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
  promptHeader: { fontSize: 12, fontWeight: '700', color: '#94A3B8', marginBottom: 6, letterSpacing: 0.5 },
  promptCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  promptText: { color: '#F8FAFC', fontSize: 14, fontStyle: 'italic' },
  responseCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  responseText: { color: '#E2E8F0', fontSize: 14, lineHeight: 22 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 0.8, marginBottom: 12 },
  optionCard: {
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
  optionCardActive: { borderColor: '#38BDF8', backgroundColor: '#0F172A' },
  optionText: { color: '#CBD5E1', fontSize: 14, fontWeight: '600', flex: 1 },
  optionTextActive: { color: '#38BDF8', fontWeight: '700' },
  submitBtn: {
    backgroundColor: '#2563EB',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
