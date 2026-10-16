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

interface Props {
  placement?: string;
  onUpgradePress?: () => void;
}

export const BannerAdView: React.FC<Props> = ({ placement = 'feed_inline' }) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adFailed, setAdFailed] = useState(false);
  const activeUnitId = __DEV__ ? TestIds.BANNER : ADMOB_CONFIG.AD_UNITS.BANNER;

  // Never render fake ads or mock data if ad failed to fill
  if (adFailed) {
    return null;
  }

  return (
    <View style={[styles.container, !adLoaded && styles.hiddenContainer]}>
      <View style={styles.adMobBannerContainer}>
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
            console.warn('Real Banner Ad failed to load (AdMob + Pangle):', error);
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
  hiddenContainer: {
    height: 0,
    padding: 0,
    marginVertical: 0,
    borderWidth: 0,
    opacity: 0,
  },
  adMobBannerContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
