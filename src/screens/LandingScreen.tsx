import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {
  Briefcase,
  Zap,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Globe,
  DollarSign,
} from '../components/LucideIcons';

interface Props {
  onSelectRemoteJobs: () => void;
  onSelectMicroJobs: () => void;
  onNavigateToAuth?: () => void;
  userEmail?: string | null;
}

export const LandingScreen: React.FC<Props> = ({
  onSelectRemoteJobs,
  onSelectMicroJobs,
  onNavigateToAuth,
  userEmail,
}: Props) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1120" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* App Title Badge */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Briefcase color="#38BDF8" size={32} />
          </View>
          <Text style={styles.appName}>Remote Job</Text>
          <Text style={styles.tagline}>
            Your Global Gateway to Full-Time Remote Careers & Daily Micro-Tasks
          </Text>
        </View>

        {/* Card 1: Remote Jobs Marketplace */}
        <TouchableOpacity
          style={styles.choiceCard}
          onPress={onSelectRemoteJobs}
          activeOpacity={0.8}
        >
          <View style={styles.cardTopRow}>
            <View style={[styles.choiceIconBg, { backgroundColor: '#1E3A8A' }]}>
              <Briefcase color="#60A5FA" size={26} />
            </View>
            <View style={styles.badgeRemote}>
              <TrendingUp color="#38BDF8" size={12} />
              <Text style={styles.badgeRemoteText}>Career Jobs</Text>
            </View>
          </View>

          <Text style={styles.choiceTitle}>Remote Job Listings</Text>
          <Text style={styles.choiceDesc}>
            Explore thousands of verified full-time, part-time, and contract remote jobs. Apply directly to hiring companies with your portfolio and resume.
          </Text>

          <View style={styles.tagsRow}>
            <View style={styles.tagPill}>
              <Text style={styles.tagPillText}>💻 Tech & Dev</Text>
            </View>
            <View style={styles.tagPill}>
              <Text style={styles.tagPillText}>✍️ Copywriting</Text>
            </View>
            <View style={styles.tagPill}>
              <Text style={styles.tagPillText}>🎨 UI/UX Design</Text>
            </View>
            <View style={styles.tagPill}>
              <Text style={styles.tagPillText}>🎧 Support</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <Text style={styles.actionTextBlue}>Browse & Apply For Jobs</Text>
            <ArrowRight color="#38BDF8" size={18} style={{ marginLeft: 6 }} />
          </View>
        </TouchableOpacity>

        {/* Card 2: Micro-Jobs & Daily Tasks */}
        <TouchableOpacity
          style={[styles.choiceCard, styles.choiceCardEmerald]}
          onPress={onSelectMicroJobs}
          activeOpacity={0.8}
        >
          <View style={styles.cardTopRow}>
            <View style={[styles.choiceIconBg, { backgroundColor: '#064E3B' }]}>
              <Zap color="#34D399" size={26} />
            </View>
            <View style={styles.badgeMicro}>
              <DollarSign color="#34D399" size={12} />
              <Text style={styles.badgeMicroText}>Instant Rewards</Text>
            </View>
          </View>

          <Text style={styles.choiceTitle}>Daily Micro-Tasks</Text>
          <Text style={styles.choiceDesc}>
            Complete quick data labeling tasks, website reviews, sponsor visits, and tech surveys. Instant balance crediting with monthly automated payouts.
          </Text>

          <View style={styles.tagsRow}>
            <View style={styles.tagPill}>
              <Text style={styles.tagPillText}>🎯 Data Labeling</Text>
            </View>
            <View style={styles.tagPill}>
              <Text style={styles.tagPillText}>🌐 Website Visits</Text>
            </View>
            <View style={styles.tagPill}>
              <Text style={styles.tagPillText}>📹 Video Reviews</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <Text style={styles.actionTextEmerald}>Start Earning Today</Text>
            <ArrowRight color="#34D399" size={18} style={{ marginLeft: 6 }} />
          </View>
        </TouchableOpacity>

        {/* Trust Badges Footer */}
        <View style={styles.trustSection}>
          <View style={styles.trustItem}>
            <ShieldCheck color="#38BDF8" size={18} />
            <Text style={styles.trustText}>Verified Employers</Text>
          </View>
          <View style={styles.trustItem}>
            <Globe color="#34D399" size={18} />
            <Text style={styles.trustText}>Worldwide Access</Text>
          </View>
          <View style={styles.trustItem}>
            <DollarSign color="#FBBF24" size={18} />
            <Text style={styles.trustText}>Direct Payouts</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginVertical: 16,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  userBanner: {
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    marginBottom: 20,
  },
  userBannerText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  userEmail: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  authBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  authBannerText: {
    color: '#CBD5E1',
    fontSize: 13,
  },
  authBannerLink: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  selectHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 14,
    marginLeft: 4,
  },
  choiceCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  choiceCardEmerald: {
    borderColor: '#065F46',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  choiceIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRemote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeRemoteText: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  badgeMicro: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeMicroText: {
    color: '#6EE7B7',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  choiceTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  choiceDesc: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 19,
    marginBottom: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  tagPill: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tagPillText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  actionTextBlue: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
  },
  arrowCircleBlue: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextEmerald: {
    color: '#34D399',
    fontSize: 14,
    fontWeight: '700',
  },
  arrowCircleEmerald: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
});
