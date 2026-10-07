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
import { Sparkles, ExternalLink, ShieldCheck } from './LucideIcons';
import { ADMOB_CONFIG } from '../config/admob';

interface Props {
  placement?: string;
  onUpgradePress?: () => void;
}

const SPONSORS = [
  {
    title: 'Hire Global Remote Engineers in 48h',
    sponsor: 'Turing Remote Talent',
    cta: 'Explore Engineers',
    url: 'https://www.turing.com',
    tag: 'SPONSOR',
  },
  {
    title: 'Autonomous AI Code Review & Security',
    sponsor: 'CodeRabbit AI',
    cta: 'Try Free Trial',
    url: 'https://coderabbit.ai',
    tag: 'SPONSOR',
  },
  {
    title: 'Zero-Egress Serverless Postgres & Edge DB',
    sponsor: 'Supabase Cloud Platform',
    cta: 'Start Free Tier',
    url: 'https://supabase.com',
    tag: 'SPONSOR',
  },
  {
    title: 'Instant Multi-Currency Payouts for Remote Teams',
    sponsor: 'Wise Business Global',
    cta: 'Get Business Account',
    url: 'https://wise.com',
    tag: 'SPONSOR',
  },
];

export const BannerAdView: React.FC<Props> = ({ placement = 'feed_inline', onUpgradePress }) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const activeUnitId = __DEV__ ? TestIds.BANNER : ADMOB_CONFIG.AD_UNITS.BANNER;
  const [adFailed, setAdFailed] = useState(false);

  // Deterministic sponsor pick based on current minute to rotate
  const sponsorIndex = Math.floor(Date.now() / 60000) % SPONSORS.length;
  const currentSponsor = SPONSORS[sponsorIndex];

  const handlePress = () => {
    Linking.openURL(currentSponsor.url).catch(() => {});
  };

  return (
    <View style={styles.container}>
      {/* Real Google Mobile Ads / LevelPlay Banner Ad */}
      {!adFailed && (
        <View style={styles.adMobBannerContainer}>
          <BannerAd
            unitId={activeUnitId}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
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

      {/* Fallback Direct Sponsor Spotlight if Native Banner is pending or unavailable */}
      {(!adLoaded || adFailed) && (
        <>
          <View style={styles.bannerHeader}>
            <View style={styles.badgeRow}>
              <View style={styles.adBadge}>
                <Text style={styles.adBadgeText}>SPONSORED</Text>
              </View>
              <Text style={styles.sponsorName}>{currentSponsor.sponsor}</Text>
            </View>
            <ShieldCheck color="#34D399" size={14} />
          </View>

          <View style={styles.bannerBody}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.bannerTitle} numberOfLines={2}>
                {currentSponsor.title}
              </Text>
            </View>

            <TouchableOpacity style={styles.ctaBtn} onPress={handlePress} activeOpacity={0.8}>
              <Text style={styles.ctaBtnText}>{currentSponsor.cta}</Text>
              <ExternalLink color="#0F172A" size={12} style={{ marginLeft: 3 }} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderLeftWidth: 3,
    borderLeftColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adMobBannerContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  adBadgeText: {
    color: '#38BDF8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sponsorName: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  bannerBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38BDF8',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    flexShrink: 0,
  },
  ctaBtnText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '800',
  },
});
