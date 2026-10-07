import React from 'react';
import { StyleSheet, Text, View, StyleProp, ViewStyle, TextStyle } from 'react-native';

export interface IconProps {
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

interface GlyphIconOptions {
  symbol: string;
  isSymbolOnly?: boolean;
}

const createGlyphIcon = (options: GlyphIconOptions): React.FC<IconProps> => {
  return ({ size = 20, color = '#FFFFFF', style }) => {
    return (
      <View
        style={[
          styles.container,
          { width: size, height: size },
          style,
        ]}
      >
        <Text
          style={[
            styles.glyph,
            {
              fontSize: size * 0.85,
              lineHeight: size,
              color: color,
            },
          ]}
          allowFontScaling={false}
        >
          {options.symbol}
        </Text>
      </View>
    );
  };
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    textAlign: 'center',
    fontWeight: '700',
  },
});

export const ArrowLeft = createGlyphIcon({ symbol: '‹' });
export const ArrowRight = createGlyphIcon({ symbol: '›' });
export const Briefcase = createGlyphIcon({ symbol: '💼' });
export const Zap = createGlyphIcon({ symbol: '⚡' });
export const Sparkles = createGlyphIcon({ symbol: '✨' });
export const TrendingUp = createGlyphIcon({ symbol: '📈' });
export const ShieldCheck = createGlyphIcon({ symbol: '🛡️' });
export const ShieldAlert = createGlyphIcon({ symbol: '⚠️' });
export const Shield = createGlyphIcon({ symbol: '🛡️' });
export const Globe = createGlyphIcon({ symbol: '🌐' });
export const DollarSign = createGlyphIcon({ symbol: '$' });
export const CreditCard = createGlyphIcon({ symbol: '💳' });
export const Building = createGlyphIcon({ symbol: '🏢' });
export const Smartphone = createGlyphIcon({ symbol: '📱' });
export const Coins = createGlyphIcon({ symbol: '🪙' });
export const Clock = createGlyphIcon({ symbol: '🕒' });
export const CheckCircle2 = createGlyphIcon({ symbol: '✅' });
export const CheckCheck = createGlyphIcon({ symbol: '✓✓' });
export const ExternalLink = createGlyphIcon({ symbol: '↗' });
export const Video = createGlyphIcon({ symbol: '🎥' });
export const FileText = createGlyphIcon({ symbol: '📄' });
export const Lock = createGlyphIcon({ symbol: '🔒' });
export const Mail = createGlyphIcon({ symbol: '✉️' });
export const Eye = createGlyphIcon({ symbol: '👁️' });
export const EyeOff = createGlyphIcon({ symbol: '🙈' });
export const Trash2 = createGlyphIcon({ symbol: '🗑️' });
export const Bell = createGlyphIcon({ symbol: '🔔' });
export const Check = createGlyphIcon({ symbol: '✓' });
export const X = createGlyphIcon({ symbol: '✕' });
export const AlertCircle = createGlyphIcon({ symbol: 'ℹ️' });
export const AlertTriangle = createGlyphIcon({ symbol: '⚠️' });
export const Search = createGlyphIcon({ symbol: '🔍' });
export const Filter = createGlyphIcon({ symbol: '⚙' });
export const ChevronRight = createGlyphIcon({ symbol: '›' });
export const User = createGlyphIcon({ symbol: '👤' });
export const Settings = createGlyphIcon({ symbol: '⚙️' });
export const LogOut = createGlyphIcon({ symbol: '↪' });
export const Send = createGlyphIcon({ symbol: '➤' });
export const Wallet = createGlyphIcon({ symbol: '👛' });
export const Calendar = createGlyphIcon({ symbol: '📅' });
export const History = createGlyphIcon({ symbol: '⏱️' });
export const MapPin = createGlyphIcon({ symbol: '📍' });
export const CheckSquare = createGlyphIcon({ symbol: '☑' });
export const Square = createGlyphIcon({ symbol: '◻' });
export const AtSign = createGlyphIcon({ symbol: '@' });
export const Home = createGlyphIcon({ symbol: '🏠' });
export const PlusCircle = createGlyphIcon({ symbol: '＋' });
export const Plus = createGlyphIcon({ symbol: '+' });
export const Tag = createGlyphIcon({ symbol: '🏷️' });
export const Share2 = createGlyphIcon({ symbol: '↗' });
export const Play = createGlyphIcon({ symbol: '▶' });
export const Award = createGlyphIcon({ symbol: '🏆' });
export const Crown = createGlyphIcon({ symbol: '👑' });
