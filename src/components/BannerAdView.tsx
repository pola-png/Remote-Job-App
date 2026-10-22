import React, { useState } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';
import { ADMOB_CONFIG } from '../config/admob';
import { INMOBI_CONFIG } from '../config/inmobi';
import { AdTierService } from '../services/adTierService';
import { InMobiBannerView } from './InMobiBannerView';

interface Props {
  placement?: string;
  onUpgradePress?: () => void;
}

export const BannerAdView: React.FC<Props> = ({ placement = 'feed_inline' }) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adFailed, setAdFailed] = useState(false);

  const isTier3 = AdTierService.isTier3();

  // If ad failed to fill, collapse completely
  if (adFailed) {
    return null;
  }

  // Tier 3: InMobi Banner (Strictly Zero AdMob calls)
  if (isTier3) {
    const inMobiPlacement = INMOBI_CONFIG.PLACEMENTS.BANNER || '10000844850';
    return (
      <View style={adLoaded ? styles.container : styles.collapsed}>
        <View style={adLoaded ? styles.adMobBannerContainer : styles.hiddenAd}>
          <InMobiBannerView
            placementId={inMobiPlacement}
            width={320}
            height={50}
            onAdLoaded={() => {
              setAdLoaded(true);
              setAdFailed(false);
            }}
            onAdFailedToLoad={(err) => {
              console.log('[InMobi] Banner ad failed to load, collapsing space:', err);
              setAdFailed(true);
              setAdLoaded(false);
            }}
          />
        </View>
      </View>
    );
  }

  // Tier 1 & 2: AdMob + Pangle
  if (!AdTierService.isAdMobAllowedSync()) {
    return null;
  }

  const activeUnitId = __DEV__ ? TestIds.BANNER : ADMOB_CONFIG.AD_UNITS.BANNER;

  return (
    <View style={adLoaded ? styles.container : styles.collapsed}>
      <View style={adLoaded ? styles.adMobBannerContainer : styles.hiddenAd}>
        <BannerAd
          unitId={activeUnitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: false,
          }}
          onAdLoaded={() => {
            setAdLoaded(true);
            setAdFailed(false);
          }}
          onAdFailedToLoad={(error) => {
            console.log('[AdMob] Banner ad failed to load, collapsing space:', error);
            setAdFailed(true);
            setAdLoaded(false);
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 8,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsed: {
    height: 0,
    width: 0,
    padding: 0,
    margin: 0,
    marginVertical: 0,
    borderWidth: 0,
    opacity: 0,
    overflow: 'hidden',
  },
  hiddenAd: {
    height: 0,
    width: 0,
    overflow: 'hidden',
  },
  adMobBannerContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
