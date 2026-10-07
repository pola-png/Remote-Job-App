import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  ShieldCheck,
  FileText,
  ShieldAlert,
  Trash2,
  LogOut,
  ChevronRight,
  User,
} from '../components/LucideIcons';
import { AuthService, UserProfile } from '../services/auth';
import { PrivacyPolicyScreen } from './PrivacyPolicyScreen';
import { TermsOfServiceScreen } from './TermsOfServiceScreen';
import { SafetyStandardsScreen } from './SafetyStandardsScreen';
import { AccountDeletionScreen } from './AccountDeletionScreen';

interface Props {
  profile: UserProfile | null;
  onSignedOut: () => void;
  initialPolicy?: 'PRIVACY' | 'TERMS' | null;
  onClearInitialPolicy?: () => void;
}

type PolicyKey = 'PRIVACY' | 'TERMS' | 'SAFETY' | 'DELETION';

export const PolicyPrivacyScreen: React.FC<Props> = ({
  profile,
  onSignedOut,
  initialPolicy,
  onClearInitialPolicy,
}: Props) => {
  const [activePolicy, setActivePolicy] = useState<PolicyKey | null>(
    initialPolicy || null
  );

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of Remote jobs?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await AuthService.signOut();
          onSignedOut();
        },
      },
    ]);
  };

  const handleCloseSubscreen = () => {
    setActivePolicy(null);
    onClearInitialPolicy?.();
  };

  if (activePolicy === 'PRIVACY') {
    return <PrivacyPolicyScreen onBack={handleCloseSubscreen} />;
  }

  if (activePolicy === 'TERMS') {
    return <TermsOfServiceScreen onBack={handleCloseSubscreen} />;
  }

  if (activePolicy === 'SAFETY') {
    return <SafetyStandardsScreen onBack={handleCloseSubscreen} />;
  }

  if (activePolicy === 'DELETION') {
    return (
      <AccountDeletionScreen
        userId={profile?.id}
        onBack={handleCloseSubscreen}
        onDeleted={onSignedOut}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.topTitle}>Policy & Privacy</Text>
          <Text style={styles.topSubtitle}>Legal terms, safety, and account settings</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <User color="#38BDF8" size={24} />
          </View>
          <View style={{ marginLeft: 14 }}>
            <Text style={styles.profileName}>
              {profile?.displayName || profile?.handle || 'Remote jobs Member'}
            </Text>
            <Text style={styles.profileEmail}>
              {profile?.email || 'Verified Account'}
            </Text>
          </View>
        </View>

        {/* Section Header */}
        <Text style={styles.sectionHeader}>LEGAL & COMPLIANCE</Text>

        {/* Policy Items List */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setActivePolicy('PRIVACY')}
          >
            <View style={[styles.menuIconBg, { backgroundColor: '#064E3B' }]}>
              <ShieldCheck color="#34D399" size={20} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Privacy Policy</Text>
              <Text style={styles.menuSubtitle}>How your data is protected and used</Text>
            </View>
            <ChevronRight color="#64748B" size={18} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setActivePolicy('TERMS')}
          >
            <View style={[styles.menuIconBg, { backgroundColor: '#1E3A8A' }]}>
              <FileText color="#60A5FA" size={20} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Terms of Service</Text>
              <Text style={styles.menuSubtitle}>Platform agreement & payout rules</Text>
            </View>
            <ChevronRight color="#64748B" size={18} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setActivePolicy('SAFETY')}
          >
            <View style={[styles.menuIconBg, { backgroundColor: '#451A03' }]}>
              <ShieldAlert color="#FBBF24" size={20} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Safety Standards & Guidelines</Text>
              <Text style={styles.menuSubtitle}>Anti-fraud, safety, and task integrity</Text>
            </View>
            <ChevronRight color="#64748B" size={18} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setActivePolicy('DELETION')}
          >
            <View style={[styles.menuIconBg, { backgroundColor: '#450A0A' }]}>
              <Trash2 color="#F87171" size={20} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { color: '#F87171' }]}>
                Account Deletion & Data Removal
              </Text>
              <Text style={styles.menuSubtitle}>Permanently erase account data</Text>
            </View>
            <ChevronRight color="#64748B" size={18} />
          </TouchableOpacity>
        </View>

        {/* Section Header */}
        <Text style={styles.sectionHeader}>SESSION</Text>

        {/* Sign Out Card */}
        <TouchableOpacity style={styles.signOutCard} onPress={handleSignOut}>
          <View style={[styles.menuIconBg, { backgroundColor: '#450A0A' }]}>
            <LogOut color="#EF4444" size={20} />
          </View>
          <Text style={styles.signOutText}>Sign Out of Remote jobs</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Remote jobs • React Native Edition • v1.0.0</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1120' },
  topHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  topTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.4,
  },
  topSubtitle: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  profileName: { fontSize: 16, fontWeight: '700', color: '#F8FAFC' },
  profileEmail: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuTextContainer: { flex: 1 },
  menuTitle: { fontSize: 14, fontWeight: '600', color: '#F1F5F9' },
  menuSubtitle: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#334155', marginLeft: 66 },
  signOutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 32,
  },
  signOutText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
  versionText: { textAlign: 'center', color: '#475569', fontSize: 12 },
});
