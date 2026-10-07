import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { ArrowLeft, ShieldCheck } from '../components/LucideIcons';

interface Props {
  onBack: () => void;
}

export const PrivacyPolicyScreen: React.FC<Props> = ({ onBack }: Props) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft color="#F8FAFC" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconCircle}>
          <ShieldCheck color="#38BDF8" size={32} />
        </View>

        <Text style={styles.title}>Remote jobs Privacy Policy</Text>
        <Text style={styles.date}>Last updated: October 2026</Text>

        <Text style={styles.paragraph}>
          This Privacy Policy describes Our policies and procedures on the collection, use, and disclosure of Your information when You use the Remote jobs application.
        </Text>

        <Text style={styles.heading}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          • Account Data: Email address, username, and authentication tokens needed to manage your member account and payouts.{'\n'}
          • Task Completion Metrics: Verification logs of completed micro-jobs, surveys, AI data tasks, and timestamps.{'\n'}
          • Payout Details: Account holder names, mobile money numbers, bank details, or crypto wallet addresses submitted for withdrawal transfers.
        </Text>

        <Text style={styles.heading}>2. Use of Your Personal Data</Text>
        <Text style={styles.paragraph}>
          We use Your Personal Data to provide and maintain our Service, process task verifications, prevent fraud and automated abuse, and execute earnings payouts to your verified payment method.
        </Text>

        <Text style={styles.heading}>3. Data Security & Storage</Text>
        <Text style={styles.paragraph}>
          All data communications with our backend infrastructure and databases are encrypted using industry-standard TLS protocols. We do not sell or lease personal data to third parties.
        </Text>

        <Text style={styles.heading}>4. Your Privacy Rights</Text>
        <Text style={styles.paragraph}>
          You have the right to review, update, or permanently delete your account and associated task data at any time directly through the in-app Account Deletion tool.
        </Text>
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
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#F8FAFC', marginBottom: 4 },
  date: { fontSize: 12, color: '#64748B', marginBottom: 20 },
  heading: { fontSize: 16, fontWeight: '700', color: '#38BDF8', marginTop: 18, marginBottom: 8 },
  paragraph: { fontSize: 14, color: '#CBD5E1', lineHeight: 22 },
});
