import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Linking,
} from 'react-native';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';
import { Sparkles, ExternalLink, ShieldCheck, Globe } from './LucideIcons';
import { ADMOB_CONFIG } from '../config/admob';

interface Props {
  placement?: string;
  onUpgradePress?: () => void;
}

const NATIVE_SPONSORS = [
  {
    company: 'Vercel Platform',
    headline: 'Deploy High-Speed Web Apps & APIs Globally with Zero Setup',
    body: 'Instant preview deployments, automated global CDN caching, and serverless edge computing.',
    badge: 'SPONSORED',
    cta: 'Learn More',
    url: 'https://vercel.com',
    tags: ['Cloud', 'DevOps', 'Serverless'],
  },
  {
    company: 'Deel Global HR',
    headline: 'Hire & Pay Contractors and Employees in 150+ Countries',
    body: 'Automate contracts, local compliance, tax forms, and fast multi-currency bank payouts.',
    badge: 'SPONSORED',
    cta: 'Learn More',
    url: 'https://www.deel.com',
    tags: ['Remote HR', 'Global Payroll', 'Compliance'],
  },
  {
    company: 'NordVPN Protection',
    headline: 'High-Speed Dedicated IP & Threat Protection for Remote Work',
    body: 'Safeguard your development environments, API connections, and remote workflows securely.',
    badge: 'SPONSORED',
    cta: 'Learn More',
    url: 'https://nordvpn.com',
    tags: ['Security', 'VPN', 'Privacy'],
  },
  {
    company: 'Linear Software',
    headline: 'The Purpose-Built System for Modern High-Performing Teams',
    body: 'Streamline project management, sprints, tasks, and issues with keyboard-first speed.',
    badge: 'SPONSORED',
    cta: 'Learn More',
    url: 'https://linear.app',
    tags: ['Productivity', 'Agile', 'Team Work'],
  },
];

export const NativeAdCard: React.FC<Props> = ({ placement = 'feed_native', onUpgradePress }) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const activeUnitId = __DEV__ ? TestIds.BANNER : ADMOB_CONFIG.AD_UNITS.BANNER;
  const [adFailed, setAdFailed] = useState(false);

  const sponsorIndex = Math.floor(Date.now() / 120000) % NATIVE_SPONSORS.length;
  const current = NATIVE_SPONSORS[sponsorIndex];

  const handlePress = () => {
    Linking.openURL(current.url).catch(() => {});
  };

  return (
    <View style={styles.card}>
      {/* Real Google Mobile Ads Native / Medium Rectangle Ad */}
      {!adFailed && (
        <View style={styles.realAdContainer}>
          <BannerAd
            unitId={activeUnitId}
            size={BannerAdSize.MEDIUM_RECTANGLE}
            requestOptions={{
              requestNonPersonalizedAdsOnly: false,
            }}
            onAdLoaded={() => setAdLoaded(true)}
            onAdFailedToLoad={(error) => {
              setAdFailed(true);
            }}
          />
        </View>
      )}

      {/* Clean Sponsored Partner Spotlight if Native unit is loading or pending */}
      {(!adLoaded || adFailed) && (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
          {/* Top row */}
          <View style={styles.cardTop}>
            <View style={styles.logoBadge}>
              <Sparkles color="#38BDF8" size={20} />
            </View>

            <View style={styles.headerTitles}>
              <Text style={styles.companyName}>{current.company}</Text>
              <View style={styles.sponsoredRow}>
                <View style={styles.sponsoredBadge}>
                  <Text style={styles.sponsoredBadgeText}>SPONSORED</Text>
                </View>
                <ShieldCheck color="#34D399" size={13} style={{ marginLeft: 4 }} />
              </View>
            </View>

            <View style={styles.learnMoreChip}>
              <Text style={styles.learnMoreChipText}>Learn More</Text>
              <ExternalLink color="#38BDF8" size={11} style={{ marginLeft: 3 }} />
            </View>
          </View>

          {/* Main Headline */}
          <Text style={styles.headline} numberOfLines={2}>
            {current.headline}
          </Text>

          {/* Body text */}
          <Text style={styles.bodyText} numberOfLines={2}>
            {current.body}
          </Text>

          {/* Tags row */}
          <View style={styles.tagsRow}>
            {current.tags.map((tag, idx) => (
              <View key={idx} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          {/* Bottom CTA Bar */}
          <View style={styles.cardFooter}>
            <View style={styles.verifiedPartner}>
              <Globe color="#64748B" size={13} />
              <Text style={styles.verifiedPartnerText}>Verified Partner</Text>
            </View>

            <View style={styles.actionBtn}>
              <Text style={styles.actionBtnText}>{current.cta}</Text>
              <ExternalLink color="#0F172A" size={12} style={{ marginLeft: 4 }} />
            </View>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    borderTopWidth: 2,
    borderTopColor: '#38BDF8',
    overflow: 'hidden',
  },
  realAdContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    minHeight: 250,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  headerTitles: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  companyName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  sponsoredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  sponsoredBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  sponsoredBadgeText: {
    color: '#38BDF8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  learnMoreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  learnMoreChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },
  headline: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 20,
    marginBottom: 6,
  },
  bodyText: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  verifiedPartner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedPartnerText: {
    color: '#64748B',
    fontSize: 11,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38BDF8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '800',
  },
});
