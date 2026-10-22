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

export const NativeAdCard: React.FC<Props> = ({ placement = 'feed_native' }) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adFailed, setAdFailed] = useState(false);

  const isTier3 = AdTierService.isTier3();

  // If ad failed to fill, collapse completely to 0 space
  if (adFailed) {
    return null;
  }

  // Tier 3: InMobi Native MRec (Strictly Zero AdMob calls)
  if (isTier3) {
    const inMobiPlacement = INMOBI_CONFIG.PLACEMENTS.NATIVE || '10000844853';
    return (
      <View style={adLoaded ? styles.card : styles.collapsed}>
        <View style={adLoaded ? styles.realAdContainer : styles.hiddenAd}>
          <InMobiBannerView
            placementId={inMobiPlacement}
            width={300}
            height={250}
            onAdLoaded={() => {
              setAdLoaded(true);
              setAdFailed(false);
            }}
            onAdFailedToLoad={(err) => {
              console.log('[InMobi] Native ad failed to load, collapsing space:', err);
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
    <View style={adLoaded ? styles.card : styles.collapsed}>
      <View style={adLoaded ? styles.realAdContainer : styles.hiddenAd}>
        <BannerAd
          unitId={activeUnitId}
          size={BannerAdSize.MEDIUM_RECTANGLE}
          requestOptions={{
            requestNonPersonalizedAdsOnly: false,
          }}
          onAdLoaded={() => {
            setAdLoaded(true);
            setAdFailed(false);
          }}
          onAdFailedToLoad={(error) => {
            console.log('[AdMob] Native ad failed to load, collapsing space:', error);
            setAdFailed(true);
            setAdLoaded(false);
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
  realAdContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 250,
  },
});
