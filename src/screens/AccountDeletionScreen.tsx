import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, Trash2, AlertTriangle } from '../components/LucideIcons';
import { AuthService } from '../services/auth';

interface Props {
  userId?: string;
  onBack: () => void;
  onDeleted: () => void;
}

export const AccountDeletionScreen: React.FC<Props> = ({
  userId,
  onBack,
  onDeleted,
}: Props) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      'Permanent Account Deletion',
      'Are you sure you want to delete your account? All earned balances, task completion history, and personal profile data will be permanently wiped.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Permanently Delete',
          style: 'destructive',
          onPress: async () => {
            if (userId) {
              setIsDeleting(true);
              await AuthService.deleteAccount(userId);
              setIsDeleting(false);
            }
            onDeleted();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft color="#F8FAFC" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Deletion</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconCircle}>
          <Trash2 color="#EF4444" size={32} />
        </View>

        <Text style={styles.title}>Account Deletion & Data Removal</Text>
        <Text style={styles.date}>Permanent and Irreversible</Text>

        <View style={styles.warningBox}>
          <AlertTriangle color="#F59E0B" size={20} style={{ marginRight: 8 }} />
          <Text style={styles.warningText}>
            Deleting your account will erase all active task history and unwithdrawn balances.
          </Text>
        </View>

        <Text style={styles.heading}>What happens when you delete your account:</Text>
        <Text style={styles.paragraph}>
          • Your user profile and authentication session will be removed immediately.{'\n'}
          • Task records, submission logs, and reward history will be cleared.{'\n'}
          • You will be logged out on all devices.
        </Text>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.deleteBtnText}>Permanently Delete My Account</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1120' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 40 },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#450A0A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#F8FAFC', marginBottom: 4 },
  date: { fontSize: 12, color: '#EF4444', fontWeight: '600', marginBottom: 20 },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#451A03',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#78350F',
    marginBottom: 20,
  },
  warningText: { flex: 1, color: '#FDE68A', fontSize: 13, lineHeight: 18 },
  heading: { fontSize: 15, fontWeight: '700', color: '#F1F5F9', marginBottom: 8 },
  paragraph: { fontSize: 14, color: '#CBD5E1', lineHeight: 22, marginBottom: 30 },
  deleteBtn: {
    backgroundColor: '#EF4444',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
