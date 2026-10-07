import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Sparkles, Lock, CheckCircle2, AlertCircle } from './LucideIcons';
import { SubscriptionTier } from '../services/subscription';
import { RemoteJob } from '../services/remoteJobs';

interface Props {
  job: RemoteJob;
  userTier: SubscriptionTier;
  userSkills?: string[];
  onUpgradePress: () => void;
  compact?: boolean;
}

export const JobMatchScoreBadge: React.FC<Props> = ({
  job,
  userTier,
  userSkills = ['React', 'TypeScript', 'Node.js', 'Remote Work', 'Communication', 'JavaScript'],
  onUpgradePress,
  compact = false,
}) => {
  // Compute match score dynamically
  const jobKeywords = [
    job.title.toLowerCase(),
    job.category.toLowerCase(),
    ...(job.tags || []).map((t) => t.toLowerCase()),
    ...(job.requirements || []).map((r) => r.toLowerCase()),
  ].join(' ');

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  userSkills.forEach((skill) => {
    if (jobKeywords.includes(skill.toLowerCase())) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  const baseScore = 65;
  const matchBonus = Math.min(30, matchedSkills.length * 8);
  const score = Math.min(99, baseScore + matchBonus);

  const getScoreColor = (val: number) => {
    if (val >= 85) return '#34D399'; // Emerald
    if (val >= 75) return '#38BDF8'; // Sky
    return '#FBBF24'; // Amber
  };

  const scoreColor = getScoreColor(score);
  const isPro = userTier === 'PRO';

  if (compact) {
    if (isPro) {
      return (
        <View style={[styles.compactBadge, { borderColor: scoreColor, backgroundColor: `${scoreColor}15` }]}>
          <Sparkles color={scoreColor} size={11} style={{ marginRight: 4 }} />
          <Text style={[styles.compactScoreText, { color: scoreColor }]}>{score}% Match</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.compactLockedBadge}
        onPress={onUpgradePress}
        activeOpacity={0.8}
      >
        <Lock color="#94A3B8" size={10} style={{ marginRight: 3 }} />
        <Text style={styles.compactLockedText}>{score}% Pro Match</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.fullContainer}>
      <View style={styles.headerRow}>
        <View style={[styles.scorePill, { backgroundColor: `${scoreColor}20`, borderColor: scoreColor }]}>
          <Sparkles color={scoreColor} size={14} style={{ marginRight: 5 }} />
          <Text style={[styles.scoreValue, { color: scoreColor }]}>{score}% Match Score</Text>
        </View>
        <Text style={styles.roleMatchTitle}>Candidate Skill Match</Text>
      </View>

      {isPro ? (
        <View style={styles.proInsightsBox}>
          {matchedSkills.length > 0 && (
            <View style={styles.skillSection}>
              <Text style={styles.skillSectionLabel}>Matching Strengths:</Text>
              <View style={styles.skillsRow}>
                {matchedSkills.map((s, i) => (
                  <View key={i} style={styles.matchedSkillPill}>
                    <CheckCircle2 color="#34D399" size={12} style={{ marginRight: 4 }} />
                    <Text style={styles.matchedSkillText}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {missingSkills.length > 0 && (
            <View style={[styles.skillSection, { marginTop: 6 }]}>
              <Text style={styles.skillSectionLabel}>Competitiveness Boost Skills:</Text>
              <View style={styles.skillsRow}>
                {missingSkills.slice(0, 3).map((s, i) => (
                  <View key={i} style={styles.missingSkillPill}>
                    <AlertCircle color="#F59E0B" size={11} style={{ marginRight: 4 }} />
                    <Text style={styles.missingSkillText}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.proUpgradeBanner}>
          <Text style={styles.proUpgradeText}>
            Upgrade to <Text style={{ color: '#38BDF8', fontWeight: '700' }}>Pro</Text> to unlock full skill gap analysis, interview preparedness scores, and get featured to hiring managers.
          </Text>
          <TouchableOpacity
            onPress={onUpgradePress}
            style={styles.unlockProCtaBtn}
            activeOpacity={0.8}
          >
            <Lock color="#0F172A" size={13} style={{ marginRight: 6 }} />
            <Text style={styles.unlockProCtaText}>Unlock Pro Insights</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  compactScoreText: {
    fontSize: 11,
    fontWeight: '700',
  },
  compactLockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  compactLockedText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  fullContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  scoreValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  roleMatchTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  proInsightsBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  skillSection: {},
  skillSectionLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  matchedSkillPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  matchedSkillText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '600',
  },
  missingSkillPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  missingSkillText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '500',
  },
  proUpgradeBanner: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  proUpgradeText: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  unlockProCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  unlockProCtaText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
});
