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

export const NativeAdCard: React.FC<Props> = ({ placement = 'feed_native' }) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adFailed, setAdFailed] = useState(false);
  const activeUnitId = __DEV__ ? TestIds.BANNER : ADMOB_CONFIG.AD_UNITS.BANNER;

  // Strictly avoid mock data or fake ads - if no fill, hide component cleanly
  if (adFailed) {
    return null;
  }

  return (
    <View style={[styles.card, !adLoaded && styles.hiddenCard]}>
      <View style={styles.realAdContainer}>
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
            console.warn('Real Native / MRec Ad failed to load (AdMob + Pangle):', error);
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
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  hiddenCard: {
    height: 0,
    padding: 0,
    marginBottom: 0,
    borderWidth: 0,
    opacity: 0,
  },
  realAdContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 250,
  },
});
