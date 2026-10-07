import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from 'react-native';
import {
  Briefcase,
  Building,
  MapPin,
  DollarSign,
  Tag,
  FileText,
  ArrowLeft,
  X,
  Send,
  Sparkles,
} from '../components/LucideIcons';
import { RemoteJobsService, RemoteJob } from '../services/remoteJobs';
import { NotificationService } from '../services/notifications';

interface Props {
  onBack: () => void;
  userId: string;
  onJobPosted?: (job: RemoteJob) => void;
}

const CATEGORY_OPTIONS: Array<{
  id: 'DEVELOPMENT' | 'DESIGN' | 'MARKETING' | 'WRITING' | 'SUPPORT' | 'ASSISTANT' | 'DATA';
  label: string;
}> = [
  { id: 'DEVELOPMENT', label: '💻 Dev & Tech' },
  { id: 'DESIGN', label: '🎨 Design' },
  { id: 'WRITING', label: '✍️ Writing' },
  { id: 'SUPPORT', label: '🎧 Support' },
  { id: 'ASSISTANT', label: '📋 Assistant' },
  { id: 'DATA', label: '📊 Data Entry' },
  { id: 'MARKETING', label: '🚀 Marketing' },
];

const JOB_TYPES: Array<'Full-time' | 'Part-time' | 'Contract' | 'Freelance'> = [
  'Full-time',
  'Part-time',
  'Contract',
  'Freelance',
];

export const PostJobScreen: React.FC<Props> = ({ onBack, userId, onJobPosted }) => {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('Remote (Worldwide)');
  const [jobType, setJobType] = useState<'Full-time' | 'Part-time' | 'Contract' | 'Freelance'>('Full-time');
  const [salaryRange, setSalaryRange] = useState('');
  const [category, setCategory] = useState<'DEVELOPMENT' | 'DESIGN' | 'MARKETING' | 'WRITING' | 'SUPPORT' | 'ASSISTANT' | 'DATA'>('DEVELOPMENT');
  const [tagsInput, setTagsInput] = useState('');
  const [description, setDescription] = useState('');
  const [requirementsInput, setRequirementsInput] = useState('');
  const [benefitsInput, setBenefitsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleHardwareBack = () => {
      onBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
    return () => sub.remove();
  }, [onBack]);

  const resetForm = () => {
    setTitle('');
    setCompany('');
    setLocation('Remote (Worldwide)');
    setJobType('Full-time');
    setSalaryRange('');
    setCategory('DEVELOPMENT');
    setTagsInput('');
    setDescription('');
    setRequirementsInput('');
    setBenefitsInput('');
  };

  const handlePostJob = async () => {
    if (!title.trim() || !company.trim() || !description.trim()) {
      Alert.alert('Required Fields', 'Please fill in Job Title, Company Name, and Description.');
      return;
    }

    setIsSubmitting(true);
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const requirements = requirementsInput
      .split('\n')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    const benefits = benefitsInput
      .split('\n')
      .map((b) => b.trim())
      .filter((b) => b.length > 0);

    const res = await RemoteJobsService.postRemoteJob({
      title,
      company,
      location,
      jobType,
      salaryRange: salaryRange || '$ Competitive',
      category,
      tags: tags.length > 0 ? tags : ['Remote', category.toLowerCase()],
      description,
      requirements:
        requirements.length > 0
          ? requirements
          : ['Strong communication and remote collaboration skills.', 'Self-driven with high attention to detail.'],
      benefits:
        benefits.length > 0
          ? benefits
          : ['100% remote flexibility', 'Competitive salary & growth opportunities'],
      employerUserId: userId,
    });

    setIsSubmitting(false);

    if (res.success) {
      resetForm();
      Alert.alert('🎉 Job Published Live!', res.message);
      NotificationService.triggerInAppNotification(
        '💼 Job Position Posted',
        `"${title}" at ${company} is now live and accepting applications!`,
        'JOB_ALERT',
        'REMOTE_JOBS'
      );
      if (res.job && onJobPosted) {
        onJobPosted(res.job);
      }
      onBack();
    } else {
      Alert.alert('Error', res.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Top Navigation Bar with Back & Cancel Buttons */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft color="#F8FAFC" size={18} />
          <Text style={styles.backBtnLabel}>Back</Text>
        </TouchableOpacity>

        <View style={styles.topBarTitleWrapper}>
          <Text style={styles.topBarTitle}>Post a Remote Job</Text>
          <Text style={styles.topBarSubtitle}>Publish open roles to global candidates</Text>
        </View>

        <TouchableOpacity onPress={onBack} style={styles.cancelBtn} activeOpacity={0.7}>
          <X color="#94A3B8" size={18} />
          <Text style={styles.cancelBtnLabel}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        {/* Job Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Job Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Senior Mobile App Developer"
            placeholderTextColor="#64748B"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Company Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Company / Employer Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Acme Tech Solutions"
            placeholderTextColor="#64748B"
            value={company}
            onChangeText={setCompany}
          />
        </View>

        {/* Category Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {CATEGORY_OPTIONS.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Job Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Employment Type</Text>
          <View style={styles.typeRow}>
            {JOB_TYPES.map((type) => {
              const isSelected = jobType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeBtn, isSelected && styles.typeBtnActive]}
                  onPress={() => setJobType(type)}
                >
                  <Text style={[styles.typeBtnText, isSelected && styles.typeBtnTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Salary Range */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Salary / Compensation</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. $60,000 - $85,000 / yr or $30 - $45 / hr"
            placeholderTextColor="#64748B"
            value={salaryRange}
            onChangeText={setSalaryRange}
          />
        </View>

        {/* Location */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location / Timezone Eligibility</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Remote (Worldwide) or Remote (US/EU)"
            placeholderTextColor="#64748B"
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* Skills / Tags */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Required Skills & Tags (comma separated)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. React Native, TypeScript, Redux, Node.js"
            placeholderTextColor="#64748B"
            value={tagsInput}
            onChangeText={setTagsInput}
          />
        </View>

        {/* Job Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Job Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Provide a detailed overview of the role, key responsibilities, and team workflow..."
            placeholderTextColor="#64748B"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        {/* Key Requirements */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Key Requirements (one per line)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="• 3+ years experience with React Native&#10;• Strong English communication&#10;• Independent ownership"
            placeholderTextColor="#64748B"
            value={requirementsInput}
            onChangeText={setRequirementsInput}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Benefits & Perks */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Benefits & Perks (one per line)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="• 100% remote flexibility&#10;• Learning and home office stipend&#10;• Health & wellness allowance"
            placeholderTextColor="#64748B"
            value={benefitsInput}
            onChangeText={setBenefitsInput}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View style={styles.footerActions}>
        <TouchableOpacity onPress={onBack} style={styles.footerCancelBtn}>
          <Text style={styles.footerCancelBtnText}>Back to Feeds</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePostJob}
          disabled={isSubmitting}
          style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#0F172A" size="small" />
          ) : (
            <>
              <Sparkles color="#0F172A" size={16} style={{ marginRight: 6 }} />
              <Text style={styles.submitBtnText}>Publish Job Live</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    gap: 4,
  },
  backBtnLabel: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    gap: 4,
  },
  cancelBtnLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  topBarTitleWrapper: {
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  topBarSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  formScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  formScrollContent: {
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  textArea: {
    minHeight: 90,
  },
  chipsScroll: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  chipText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  chipTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  typeBtnText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  typeBtnTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  footerCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
});
