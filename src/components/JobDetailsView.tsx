import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Linking,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  Building,
  MapPin,
  DollarSign,
  Clock,
  Briefcase,
  CheckCircle2,
  Send,
  Sparkles,
  Tag,
  Share2,
  ExternalLink,
  Globe,
} from './LucideIcons';
import { RemoteJob } from '../services/remoteJobs';
import { SubscriptionService, SubscriptionTier } from '../services/subscription';
import { JobMatchScoreBadge } from './JobMatchScoreBadge';
import { CompanyLogoAvatar } from './CompanyLogoAvatar';
import { BannerAdView } from './BannerAdView';
import { NativeAdCard } from './NativeAdCard';

interface Props {
  job: RemoteJob;
  onBack: () => void;
  onApply: () => void;
  isUnlocked?: boolean;
  userTier?: SubscriptionTier;
  onUpgradePress?: () => void;
}

export const JobDetailsView: React.FC<Props> = ({
  job,
  onBack,
  onApply,
  isUnlocked = false,
  userTier = 'FREE',
  onUpgradePress,
}) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [layoutHeight, setLayoutHeight] = useState(0);

  const hasSalary = Boolean(
    job.salaryRange &&
    job.salaryRange.trim().length > 0 &&
    !job.salaryRange.toLowerCase().includes('competitive') &&
    !job.salaryRange.toLowerCase().includes('undefined')
  );
  const formattedSalary = hasSalary ? job.salaryRange!.replace(/^\$\s*/, '') : '';
  const isAdFree = SubscriptionService.isAdFree(userTier);

  // Split description into distinct paragraphs for readable layout and in-between ads
  const rawParagraphs = job.description
    ? job.description
        .split(/\n\s*\n|\r\n\r\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0)
    : [];
  const paragraphs = rawParagraphs.length > 0 ? rawParagraphs : [job.description || ''];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 80;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleApplyPress = () => {
    if (!hasScrolledToBottom) {
      Alert.alert(
        'Read Job Details First',
        'Please scroll down and review all the job requirements, responsibilities, and benefits before applying.'
      );
      return;
    }
    onApply();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1120" />
      {/* Header Navigation */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <View style={styles.backIconCircle}>
            <ArrowLeft color="#F8FAFC" size={18} />
          </View>
          <Text style={styles.backBtnText}>All Remote Jobs</Text>
        </TouchableOpacity>

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{job.category}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onLayout={(e) => {
          setLayoutHeight(e.nativeEvent.layout.height);
        }}
        onContentSizeChange={(_w, contentH) => {
          if (layoutHeight > 0 && contentH <= layoutHeight + 40) {
            setHasScrolledToBottom(true);
          }
        }}
      >
        {/* Job Title & Company Card */}
        <View style={styles.heroCard}>
          <View style={styles.companyRow}>
            <CompanyLogoAvatar
              company={job.company}
              logoUrl={job.companyLogo}
              size={48}
              fontSize={16}
              borderRadius={14}
            />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.companyName}>{job.company}</Text>
              <View style={styles.verifiedRow}>
                <CheckCircle2 color="#34D399" size={14} />
                <Text style={styles.verifiedText}>Verified Remote Employer</Text>
              </View>
            </View>
          </View>

          <Text style={styles.jobTitle}>{job.title}</Text>

          {/* Key Meta Badges */}
          <View style={styles.metaGrid}>
            {hasSalary && (
              <View style={styles.metaBadge}>
                <DollarSign color="#34D399" size={16} />
                <Text style={styles.metaBadgeSalary}>{formattedSalary}</Text>
              </View>
            )}
            <View style={styles.metaBadge}>
              <MapPin color="#38BDF8" size={16} />
              <Text style={styles.metaBadgeText}>{job.location}</Text>
            </View>
            <View style={styles.metaBadge}>
              <Briefcase color="#F59E0B" size={16} />
              <Text style={styles.metaBadgeText}>{job.jobType}</Text>
            </View>
            <View style={styles.metaBadge}>
              <Clock color="#94A3B8" size={16} />
              <Text style={styles.metaBadgeText}>{job.postedDate}</Text>
            </View>
          </View>
        </View>

        {/* Direct Contact Option & Send CV Direct */}
        {job.contactEmail && (
          <View style={[styles.sectionCard, styles.directContactCard]}>
            <View style={styles.directContactHeader}>
              <View style={styles.directContactBadge}>
                <Text style={styles.directContactBadgeText}>DIRECT EMPLOYER CONTACT</Text>
              </View>
              <CheckCircle2 color="#34D399" size={16} />
            </View>
            <Text style={styles.directContactTitle}>Send Your CV Directly to Hiring Team</Text>
            <Text style={styles.directContactDesc}>
              This employer accepts direct CV & resume submissions at{' '}
              <Text style={{ color: '#38BDF8', fontWeight: 'bold' }}>{job.contactEmail}</Text>.
            </Text>
            <TouchableOpacity
              style={styles.sendCvDirectBtn}
              onPress={() => {
                const subject = encodeURIComponent(`Job Application: ${job.title} - Remote Job Candidate`);
                const body = encodeURIComponent(
                  `Dear ${job.company} Hiring Team,\n\nI am writing to apply for the ${job.title} position found on Remote Job.\n\nPlease find attached my CV/Portfolio.\n\nBest regards,\nCandidate`
                );
                Linking.openURL(`mailto:${job.contactEmail}?subject=${subject}&body=${body}`).catch(() => {
                  Alert.alert('Email Client Error', `Please send your CV directly to ${job.contactEmail}`);
                });
              }}
              activeOpacity={0.85}
            >
              <Send color="#0F172A" size={16} style={{ marginRight: 6 }} />
              <Text style={styles.sendCvDirectBtnText}>Send CV to {job.contactEmail}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* AI Candidate Match Scoring */}
        <JobMatchScoreBadge
          job={job}
          userTier={userTier}
          onUpgradePress={onUpgradePress || (() => {})}
        />

        {/* Top Sponsored Banner Ad for free users */}
        {!isAdFree && (
          <BannerAdView
            placement="job_details_top"
            onUpgradePress={onUpgradePress}
          />
        )}

        {/* Tech Stack / Tags */}
        {job.tags && job.tags.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Skills & Technologies</Text>
            <View style={styles.tagsContainer}>
              {job.tags.map((tag, i) => (
                <View key={i} style={styles.tagChip}>
                  <Tag color="#38BDF8" size={12} style={{ marginRight: 4 }} />
                  <Text style={styles.tagChipText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* About The Role with In-Between Paragraph Ads */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>About the Role</Text>
          {paragraphs.map((para, idx) => {
            const showParagraphAd = !isAdFree && (idx + 1) % 2 === 0 && idx < paragraphs.length - 1;
            const isNative = (idx + 1) % 4 === 2;

            return (
              <View key={idx} style={{ marginBottom: 10 }}>
                <Text style={styles.descriptionText}>{para}</Text>
                {showParagraphAd && (
                  <View style={{ marginVertical: 8 }}>
                    {isNative ? (
                      <NativeAdCard
                        placement="details_paragraph_native"
                        onUpgradePress={onUpgradePress}
                      />
                    ) : (
                      <BannerAdView
                        placement="details_paragraph_banner"
                        onUpgradePress={onUpgradePress}
                      />
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Mid-Section Native Ad */}
        {!isAdFree && (
          <NativeAdCard
            placement="job_details_middle"
            onUpgradePress={onUpgradePress}
          />
        )}

        {/* Requirements */}
        {job.requirements && job.requirements.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Key Requirements & Qualifications</Text>
            <View style={styles.bulletList}>
              {job.requirements.map((req, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{req}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Pre-Perks Banner Ad */}
        {!isAdFree && (
          <BannerAdView
            placement="job_details_pre_perks"
            onUpgradePress={onUpgradePress}
          />
        )}

        {/* Benefits & Perks */}
        {job.benefits && job.benefits.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Benefits & Perks</Text>
            <View style={styles.bulletList}>
              {job.benefits.map((ben, i) => (
                <View key={i} style={styles.bulletRow}>
                  <CheckCircle2 color="#34D399" size={16} style={{ marginTop: 2 }} />
                  <Text style={styles.perkText}>{ben}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* How to Apply Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Application Options</Text>
          <Text style={styles.applyMethodDesc}>
            You can submit your CV directly through Remote-Job or visit {job.company}'s official careers portal.
          </Text>

          {job.directApplyUrl && (
            <TouchableOpacity
              style={styles.externalLinkBtn}
              onPress={() => {
                if (job.directApplyUrl) {
                  Linking.openURL(job.directApplyUrl).catch(() => {
                    Alert.alert('Unable to Open Link', 'Could not open employer application page.');
                  });
                }
              }}
              activeOpacity={0.8}
            >
              <Globe color="#38BDF8" size={18} style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.externalLinkTitle}>Apply on Company Site</Text>
                <Text style={styles.externalLinkSubtitle} numberOfLines={1}>
                  {job.directApplyUrl}
                </Text>
              </View>
              <ExternalLink color="#38BDF8" size={16} />
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Fixed Sticky Action Footer */}
      <View style={styles.footerBar}>
        {job.directApplyUrl && (
          <TouchableOpacity
            style={styles.siteLinkActionBtn}
            onPress={() => {
              if (job.directApplyUrl) {
                Linking.openURL(job.directApplyUrl).catch(() => {});
              }
            }}
            activeOpacity={0.8}
          >
            <Globe color="#38BDF8" size={15} style={{ marginRight: 6 }} />
            <Text style={styles.siteLinkActionText}>Company Site</Text>
          </TouchableOpacity>
        )}

        {job.isApplied ? (
          <View style={[styles.appliedBtn, { flex: 1, marginLeft: job.directApplyUrl ? 10 : 0 }]}>
            <CheckCircle2 color="#34D399" size={18} style={{ marginRight: 6 }} />
            <Text style={styles.appliedBtnText}>Application Sent</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.applyActionBtn,
              !hasScrolledToBottom && styles.applyActionBtnLocked,
              { flex: 1, marginLeft: job.directApplyUrl ? 10 : 0 },
            ]}
            onPress={handleApplyPress}
            activeOpacity={0.85}
          >
            <Send
              color={hasScrolledToBottom ? '#0F172A' : '#94A3B8'}
              size={16}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.applyActionBtnText,
                !hasScrolledToBottom && styles.applyActionBtnLockedText,
              ]}
            >
              {hasScrolledToBottom ? 'Quick Apply with CV' : 'Scroll Down to Apply'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B1120',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0B1120',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  backIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIconText: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    marginTop: -2,
  },
  backBtnText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  categoryBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  categoryBadgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  heroCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  companyIconBg: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  companyName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: '#34D399',
    fontWeight: '600',
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 26,
    marginBottom: 16,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 6,
    marginBottom: 6,
    gap: 6,
    maxWidth: '100%',
    flexShrink: 1,
  },
  metaBadgeSalary: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  metaBadgeText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 1,
  },
  sectionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 14,
  },
  directContactCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#38BDF8',
    backgroundColor: '#0F172A',
  },
  directContactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  directContactBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  directContactBadgeText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  directContactTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  directContactDesc: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  sendCvDirectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#38BDF8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  sendCvDirectBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tagChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  descriptionText: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 22,
  },
  bulletList: {
    gap: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
    marginTop: 8,
  },
  bulletText: {
    flex: 1,
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 20,
  },
  perkText: {
    flex: 1,
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 20,
  },
  footerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  footerLeft: {
    flex: 1,
  },
  footerSalaryLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  footerSalaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#34D399',
    marginTop: 1,
  },
  applyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#38BDF8',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  applyActionBtnLocked: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  applyActionBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  applyActionBtnLockedText: {
    color: '#94A3B8',
    fontWeight: '600',
  },
  appliedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#34D399',
  },
  appliedBtnText: {
    color: '#34D399',
    fontSize: 14,
    fontWeight: '700',
  },
  applyMethodDesc: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  externalLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 4,
  },
  externalLinkTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  externalLinkSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  siteLinkActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  siteLinkActionText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
});
