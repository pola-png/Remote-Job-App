import React from 'react';
import { requireNativeComponent, ViewProps, Platform, View, NativeSyntheticEvent } from 'react-native';

interface InMobiBannerNativeProps extends ViewProps {
  placementId: string;
  onAdLoaded?: (event: NativeSyntheticEvent<{ loaded: boolean }>) => void;
  onAdFailedToLoad?: (event: NativeSyntheticEvent<{ error: string }>) => void;
}

const NativeInMobiBanner: any =
  Platform.OS === 'android'
    ? (global as any).__InMobiBannerViewNativeComponent ||
      ((global as any).__InMobiBannerViewNativeComponent =
        requireNativeComponent<InMobiBannerNativeProps>('InMobiBannerView'))
    : null;

interface Props {
  placementId: string;
  width?: number;
  height?: number;
  style?: any;
  onAdLoaded?: () => void;
  onAdFailedToLoad?: (error?: string) => void;
}

export const InMobiBannerView: React.FC<Props> = ({
  placementId,
  width = 300,
  height = 250,
  style,
  onAdLoaded,
  onAdFailedToLoad,
}) => {
  if (Platform.OS !== 'android' || !NativeInMobiBanner) {
    return null;
  }

  return (
    <View style={[{ width, height, alignItems: 'center', justifyContent: 'center' }, style]}>
      <NativeInMobiBanner
        placementId={placementId}
        style={{ width, height }}
        onAdLoaded={() => onAdLoaded?.()}
        onAdFailedToLoad={(e: any) => onAdFailedToLoad?.(e.nativeEvent?.error)}
      />
    </View>
  );
};
