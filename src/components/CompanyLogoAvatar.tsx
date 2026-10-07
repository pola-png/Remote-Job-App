import React, { useState } from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';

interface Props {
  company: string;
  logoUrl?: string;
  size?: number;
  fontSize?: number;
  borderRadius?: number;
}

const PALETTES = [
  { bg: '#1E3A8A', text: '#BFDBFE' }, // Indigo
  { bg: '#065F46', text: '#A7F3D0' }, // Emerald
  { bg: '#581C87', text: '#E9D5FF' }, // Purple
  { bg: '#7C2D12', text: '#FED7AA' }, // Amber/Bronze
  { bg: '#164E63', text: '#A5F3FC' }, // Cyan
  { bg: '#831843', text: '#FBCFE8' }, // Rose
  { bg: '#1F2937', text: '#E5E7EB' }, // Slate
  { bg: '#134E4A', text: '#99F6E4' }, // Teal
];

function getCompanyInitials(name: string): string {
  if (!name || !name.trim()) return 'RJ';
  const clean = name.trim().replace(/[^a-zA-Z0-9\s]/g, '');
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.substring(0, 2).toUpperCase();
}

function getPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PALETTES.length;
  return PALETTES[index];
}

export const CompanyLogoAvatar: React.FC<Props> = ({
  company,
  logoUrl,
  size = 44,
  fontSize = 15,
  borderRadius = 12,
}) => {
  const [imageError, setImageError] = useState(false);
  const initials = getCompanyInitials(company);
  const palette = getPalette(company || 'Job');

  const showImage = logoUrl && !imageError && (logoUrl.startsWith('http://') || logoUrl.startsWith('https://'));

  if (showImage) {
    return (
      <View style={[styles.container, { width: size, height: size, borderRadius, backgroundColor: '#1E293B' }]}>
        <Image
          source={{ uri: logoUrl }}
          style={{ width: size - 4, height: size - 4, borderRadius: borderRadius - 2 }}
          resizeMode="contain"
          onError={() => setImageError(true)}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: palette.bg,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
        },
      ]}
    >
      <Text style={[styles.initialsText, { fontSize, color: palette.text }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initialsText: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
