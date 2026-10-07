import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { ArrowLeft, ShieldAlert } from '../components/LucideIcons';

interface Props {
  onBack: () => void;
}

export const SafetyStandardsScreen: React.FC<Props> = ({ onBack }: Props) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft color="#F8FAFC" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety Standards</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconCircle}>
          <ShieldAlert color="#FBBF24" size={32} />
        </View>

        <Text style={styles.title}>Safety & Anti-Fraud Standards</Text>
        <Text style={styles.date}>Last updated: October 2026</Text>

        <Text style={styles.paragraph}>
          Remote jobs is committed to maintaining a safe, fraud-free, and lawful ecosystem for workers, developers, and task sponsors.
        </Text>

        <Text style={styles.heading}>1. Zero-Tolerance for CSAE</Text>
        <Text style={styles.paragraph}>
          We maintain zero tolerance for child sexual abuse material or child exploitation of any kind. Any account involved in or attempting to circulate harmful or exploitative material will be immediately terminated and reported to legal and law enforcement authorities.
        </Text>

        <Text style={styles.heading}>2. Platform Integrity & Anti-Bot Policy</Text>
        <Text style={styles.paragraph}>
          Task integrity is enforced by automated anti-cheat systems. The use of emulators with automated macro scripts, proxy farms, or spoofed GPS to artificially harvest rewards is strictly prohibited.
        </Text>

        <Text style={styles.heading}>3. Safe Communication</Text>
        <Text style={styles.paragraph}>
          Members must not solicit or trade sensitive personal contact credentials, private financial passwords, or confidential sponsor data off-platform.
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
