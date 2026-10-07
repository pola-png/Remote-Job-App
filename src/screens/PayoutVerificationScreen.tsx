import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { ArrowLeft, ShieldCheck, CheckCircle2, AlertCircle } from '../components/LucideIcons';

interface Props {
  isVerified: boolean;
  onBack: () => void;
}

export const PayoutVerificationScreen: React.FC<Props> = ({ isVerified, onBack }: Props) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft color="#F8FAFC" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payout Verification</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statusCard}>
          <View style={styles.iconCircle}>
            <ShieldCheck color={isVerified ? '#34D399' : '#FBBF24'} size={32} />
          </View>
          <Text style={styles.statusTitle}>
            {isVerified ? 'Verification Complete' : 'Tier 1 Standard Member'}
          </Text>
          <Text style={styles.statusSubtitle}>
            {isVerified
              ? 'Your identity is verified. Payouts are dispatched automatically.'
              : 'You can earn and request standard task payouts up to monthly limits.'}
          </Text>
        </View>

        <Text style={styles.sectionHeader}>VERIFICATION TIERS</Text>

        <View style={styles.tierCard}>
          <View style={styles.tierHeader}>
            <Text style={styles.tierName}>Tier 1 (Default)</Text>
            <CheckCircle2 color="#34D399" size={18} />
          </View>
          <Text style={styles.tierDesc}>
            • Standard Micro-Job earnings.{'\n'}
            • Monthly withdrawal limit: $500.00.{'\n'}
            • Basic anti-fraud verification.
          </Text>
        </View>

        <View style={styles.tierCard}>
          <View style={styles.tierHeader}>
            <Text style={styles.tierName}>Tier 2 (Enterprise & Pro)</Text>
            {isVerified ? (
              <CheckCircle2 color="#34D399" size={18} />
            ) : (
              <AlertCircle color="#64748B" size={18} />
            )}
          </View>
          <Text style={styles.tierDesc}>
            • High-yield AI data annotation batches.{'\n'}
            • Unlimited monthly withdrawal volume.{'\n'}
            • Priority payment processing queue on the 27th.
          </Text>
        </View>
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
  statusCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusTitle: { fontSize: 18, fontWeight: '700', color: '#F8FAFC', marginBottom: 6 },
  statusSubtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 18 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 12,
    marginLeft: 4,
  },
  tierCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tierName: { fontSize: 15, fontWeight: '700', color: '#F1F5F9' },
  tierDesc: { fontSize: 13, color: '#94A3B8', lineHeight: 20 },
});
