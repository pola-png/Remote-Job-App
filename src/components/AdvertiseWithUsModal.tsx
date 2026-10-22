import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import {
  X,
  Mail,
  Send,
  Sparkles,
  CheckCircle2,
  Globe,
  DollarSign,
  TrendingUp,
} from './LucideIcons';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const TARGET_EMAIL = 'ezekielxap@gmail.com';

const AD_FORMATS = [
  { id: 'BANNER', label: '📌 Feed Banner Ad', desc: 'Anchored and inline display units' },
  { id: 'NATIVE', label: '📰 Native In-Feed Card', desc: 'Blends natively with job listings (High CTR)' },
  { id: 'REWARDED', label: '🎬 Rewarded Sponsor Video', desc: 'Users watch to unlock tasks & job applications' },
  { id: 'APP_OPEN', label: '🚀 App Open / Splash', desc: 'First brand seen upon app launch' },
  { id: 'SPONSORED_JOB', label: '💼 Featured Job Push', desc: 'Pinned job listing with push notification blast' },
];

export const AdvertiseWithUsModal: React.FC<Props> = ({ visible, onClose }: Props) => {
  const [companyName, setCompanyName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('NATIVE');
  const [targetRegion, setTargetRegion] = useState('Worldwide (All Regions)');
  const [budget, setBudget] = useState('');
  const [details, setDetails] = useState('');

  if (!visible) return null;

  const handleSendEmail = async () => {
    if (!companyName.trim() && !contactInfo.trim()) {
      Alert.alert(
        'Missing Information',
        'Please provide at least your Company Name or Contact Info so we can reply to your proposal.'
      );
      return;
    }

    const selectedFormatObj = AD_FORMATS.find((f) => f.id === selectedFormat);
    const subject = encodeURIComponent(
      `In-App Advertising Inquiry: ${companyName.trim() || 'New Advertiser'}`
    );

    const bodyText = `Hello Remote Job Advertising Team,

I am interested in advertising on the Remote Job mobile app.

--- CAMPAIGN DETAILS ---
• Company / Brand: ${companyName.trim() || 'Not specified'}
• Contact Email / Phone: ${contactInfo.trim() || 'Not specified'}
• Preferred Ad Format: ${selectedFormatObj?.label || selectedFormat} (${selectedFormatObj?.desc || ''})
• Target Region / Countries: ${targetRegion.trim() || 'Global'}
• Estimated Budget (USD): ${budget.trim() ? `$${budget.trim()}` : 'Flexible / Open to discussion'}

• Campaign Goals / Notes:
${details.trim() || 'Please send available ad packages and rate card.'}

---
Sent via Remote Job In-App Advertising Portal
Publisher Contact: ${TARGET_EMAIL}`;

    const mailtoUrl = `mailto:${TARGET_EMAIL}?subject=${subject}&body=${encodeURIComponent(
      bodyText
    )}`;

    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        onClose();
      } else {
        // Fallback direct open
        await Linking.openURL(`mailto:${TARGET_EMAIL}`);
        onClose();
      }
    } catch (_) {
      Alert.alert(
        'Direct Email',
        `Could not open email client automatically. Please send your advertising inquiry directly to:\n\n${TARGET_EMAIL}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleDirectEmailClick = async () => {
    const directUrl = `mailto:${TARGET_EMAIL}?subject=${encodeURIComponent(
      'Direct Advertising Inquiry - Remote Job App'
    )}`;
    try {
      await Linking.openURL(directUrl);
      onClose();
    } catch (_) {
      Alert.alert('Contact Email', `Send your proposal to:\n\n${TARGET_EMAIL}`);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <TrendingUp color="#38BDF8" size={20} />
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.title}>Advertise With Us</Text>
                <Text style={styles.subtitle}>Direct In-App Sponsorships & Placements</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X color="#94A3B8" size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Value Proposition Highlights */}
            <View style={styles.highlightsContainer}>
              <View style={styles.highlightPill}>
                <CheckCircle2 color="#34D399" size={14} />
                <Text style={styles.highlightText}>50k+ Active Job Seekers</Text>
              </View>
              <View style={styles.highlightPill}>
                <Globe color="#38BDF8" size={14} />
                <Text style={styles.highlightText}>Target US/UK/Tier 1 or Tier 3</Text>
              </View>
              <View style={styles.highlightPill}>
                <DollarSign color="#FBBF24" size={14} />
                <Text style={styles.highlightText}>High CTR & Direct Conversions</Text>
              </View>
            </View>

            {/* Email Contact Notice */}
            <View style={styles.emailNoticeBox}>
              <Mail color="#38BDF8" size={16} style={{ marginRight: 8 }} />
              <Text style={styles.emailNoticeText}>
                Direct proposals sent to:{' '}
                <Text style={styles.emailNoticeBold}>{TARGET_EMAIL}</Text>
              </Text>
            </View>

            {/* Form Fields */}
            <Text style={styles.sectionHeading}>ADVERTISER INFORMATION</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Company / Brand Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Acme Remote Ltd / Your Brand"
                placeholderTextColor="#64748B"
                value={companyName}
                onChangeText={setCompanyName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Your Contact Email or Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. marketing@company.com or +1..."
                placeholderTextColor="#64748B"
                value={contactInfo}
                onChangeText={setContactInfo}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Format Selector */}
            <Text style={styles.sectionHeading}>SELECT AD FORMAT</Text>
            <View style={styles.formatList}>
              {AD_FORMATS.map((format) => {
                const isSelected = selectedFormat === format.id;
                return (
                  <TouchableOpacity
                    key={format.id}
                    style={[styles.formatOption, isSelected && styles.formatOptionSelected]}
                    onPress={() => setSelectedFormat(format.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.formatRadio}>
                      {isSelected && <View style={styles.formatRadioInner} />}
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.formatLabel, isSelected && styles.formatLabelSelected]}>
                        {format.label}
                      </Text>
                      <Text style={styles.formatDesc}>{format.desc}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Target Region */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Regions / Countries</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. USA, UK, Canada (Tier 1) or Nigeria, India (Tier 3)"
                placeholderTextColor="#64748B"
                value={targetRegion}
                onChangeText={setTargetRegion}
              />
            </View>

            {/* Budget */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Estimated Budget (USD)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 500, 1500, 5000"
                placeholderTextColor="#64748B"
                value={budget}
                onChangeText={setBudget}
                keyboardType="numeric"
              />
            </View>

            {/* Details */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Campaign Goals & Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell us about what you want to promote, timeline, or any specific requirements..."
                placeholderTextColor="#64748B"
                value={details}
                onChangeText={setDetails}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSendEmail}
              activeOpacity={0.85}
            >
              <Send color="#FFFFFF" size={18} style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>Send Advertising Proposal</Text>
            </TouchableOpacity>

            {/* Quick 1-tap Direct Email Button */}
            <TouchableOpacity
              style={styles.directEmailBtn}
              onPress={handleDirectEmailClick}
              activeOpacity={0.8}
            >
              <Mail color="#38BDF8" size={16} style={{ marginRight: 6 }} />
              <Text style={styles.directEmailBtnText}>
                Or email directly: {TARGET_EMAIL}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 17, 32, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    backgroundColor: '#0F172A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
  scrollBody: {
    padding: 20,
  },
  highlightsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  highlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 5,
  },
  highlightText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  emailNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginBottom: 16,
  },
  emailNoticeText: {
    fontSize: 12,
    color: '#94A3B8',
    flex: 1,
  },
  emailNoticeBold: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginTop: 6,
    marginBottom: 10,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  textArea: {
    height: 75,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  formatList: {
    gap: 8,
    marginBottom: 16,
  },
  formatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  formatOptionSelected: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  formatRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38BDF8',
  },
  formatLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  formatLabelSelected: {
    color: '#38BDF8',
  },
  formatDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#38BDF8',
    marginTop: 10,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  directEmailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  directEmailBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
  },
});
