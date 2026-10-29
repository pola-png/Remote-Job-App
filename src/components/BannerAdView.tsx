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

  // If ad failed to fill, collapse completely to 0 space
  if (adFailed) {
    return null;
  }

  // Tier 3: InMobi Banner (Strictly Zero AdMob calls)
  if (isTier3) {
    const inMobiPlacement = INMOBI_CONFIG.PLACEMENTS.BANNER || '10000844850';
    return (
      <View style={adLoaded ? styles.container : styles.offscreenHidden}>
        <InMobiBannerView
          placementId={inMobiPlacement}
          width={320}
          height={50}
          onAdLoaded={() => {
            console.log('[InMobi] Banner ad loaded, expanding space');
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
    );
  }

  // Tier 1 & 2: AdMob + Pangle
  if (!AdTierService.isAdMobAllowedSync()) {
    return null;
  }

  const activeUnitId = __DEV__ ? TestIds.BANNER : ADMOB_CONFIG.AD_UNITS.BANNER;

  return (
    <View style={adLoaded ? styles.container : styles.offscreenHidden}>
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
  offscreenHidden: {
    position: 'absolute',
    left: -9999,
    top: -9999,
    width: 320,
    height: 50,
    opacity: 0,
    overflow: 'hidden',
  },
});
