import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Briefcase,
  Building,
  MapPin,
  DollarSign,
  Tag,
  FileText,
  X,
  Send,
  Sparkles,
} from './LucideIcons';
import { RemoteJobsService, RemoteJob } from '../services/remoteJobs';
import { NotificationService } from '../services/notifications';

interface Props {
  visible: boolean;
  onClose: () => void;
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

export const PostJobModal: React.FC<Props> = ({
  visible,
  onClose,
  userId,
  onJobPosted,
}) => {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('Remote (Worldwide)');
  const [jobType, setJobType] = useState<'Full-time' | 'Part-time' | 'Contract' | 'Freelance'>('Full-time');
  const [salaryRange, setSalaryRange] = useState('');
  const [category, setCategory] = useState<'DEVELOPMENT' | 'DESIGN' | 'MARKETING' | 'WRITING' | 'SUPPORT' | 'ASSISTANT' | 'DATA'>('DEVELOPMENT');
  const [tagsInput, setTagsInput] = useState('');
  const [description, setDescription] = useState('');
  const [requirementsInput, setRequirementsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          : ['Strong communication and remote work skills.', 'Self-driven with high attention to detail.'],
      benefits: ['100% remote flexibility', 'Competitive salary & growth opportunities'],
      employerUserId: userId,
    });

    setIsSubmitting(false);

    if (res.success) {
      resetForm();
      onClose();
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
    } else {
      Alert.alert('Error', res.message);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <Briefcase color="#38BDF8" size={20} />
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.modalTitle}>Post a Remote Job</Text>
                <Text style={styles.modalSubtitle}>Hire global talent directly</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color="#94A3B8" size={20} />
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
              <Text style={styles.label}>Location / Timezone</Text>
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
              <Text style={styles.label}>Required Skills / Tags (comma separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. React Native, TypeScript, Redux, API"
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
                placeholder="Provide a detailed overview of the role, responsibilities, and team expectations..."
                placeholderTextColor="#64748B"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Requirements */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Key Requirements (one per line)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="• 3+ years experience&#10;• Experience with React Native&#10;• Strong English communication"
                placeholderTextColor="#64748B"
                value={requirementsInput}
                onChangeText={setRequirementsInput}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footerActions}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
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
                  <Text style={styles.submitBtnText}>Publish Job</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '92%',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#334155',
  },
  formScroll: {
    marginTop: 12,
    flex: 1,
  },
  formScrollContent: {
    paddingBottom: 120,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
  },
  chipsScroll: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
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
    paddingVertical: 8,
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
    fontWeight: '500',
  },
  typeBtnTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
});
