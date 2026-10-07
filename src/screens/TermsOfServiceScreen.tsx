import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { ArrowLeft, FileText } from '../components/LucideIcons';

interface Props {
  onBack: () => void;
}

export const TermsOfServiceScreen: React.FC<Props> = ({ onBack }: Props) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft color="#F8FAFC" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconCircle}>
          <FileText color="#60A5FA" size={32} />
        </View>

        <Text style={styles.title}>Remote jobs Terms of Service</Text>
        <Text style={styles.date}>Last updated: October 2026</Text>

        <Text style={styles.paragraph}>
          These Terms of Service govern your access to and use of the Remote jobs application and platform services.
        </Text>

        <Text style={styles.heading}>1. Agreement & Eligibility</Text>
        <Text style={styles.paragraph}>
          By creating an account or accessing tasks on Remote jobs, you agree to comply with these terms. You must be at least 18 years old or the age of legal majority in your jurisdiction to perform tasks and receive monetary withdrawals.
        </Text>

        <Text style={styles.heading}>2. Micro-Jobs & Verification Rules</Text>
        <Text style={styles.paragraph}>
          Earnings are credited upon successful completion and verification of micro-tasks. Users must execute tasks honestly. Script automation, multi-account creation, bot spam, and fraudulent submissions will result in immediate disqualification and forfeiture of unpaid balances.
        </Text>

        <Text style={styles.heading}>3. Payouts & Thresholds</Text>
        <Text style={styles.paragraph}>
          The minimum withdrawal threshold is $30.00. Verified earnings are disbursed on the 27th of each calendar month to your registered payout method upon identity compliance review.
        </Text>

        <Text style={styles.heading}>4. Account Termination</Text>
        <Text style={styles.paragraph}>
          Remote jobs reserves the right to suspend or permanently ban accounts that violate platform policies, engage in harassment, or attempt to manipulate earnings systems.
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
