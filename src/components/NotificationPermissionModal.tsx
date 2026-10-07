import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { Bell } from './LucideIcons';
import { NotificationService } from '../services/notifications';

interface Props {
  visible: boolean;
  onClose: () => void;
  onGranted: () => void;
}

export const NotificationPermissionModal: React.FC<Props> = ({
  visible,
  onClose,
  onGranted,
}: Props) => {
  const handleAllow = async () => {
    const isGranted = await NotificationService.requestNativeDevicePermission();
    if (isGranted) {
      await NotificationService.triggerInAppNotification(
        '🔔 Notifications Enabled',
        'You will receive instant alerts for new remote jobs and payout updates.',
        'SECURITY'
      );
    }
    onGranted();
    onClose();
  };

  const handleDismiss = async () => {
    await NotificationService.setPermissionGranted(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        {/* Authentic Native Phone Device Permission Card */}
        <View style={styles.deviceDialog}>
          <View style={styles.dialogHeaderIcon}>
            <Bell color="#38BDF8" size={30} />
          </View>

          <Text style={styles.dialogTitle}>
            Allow <Text style={{ fontWeight: '800', color: '#F8FAFC' }}>Remote jobs</Text> to send you notifications?
          </Text>

          <Text style={styles.dialogDescription}>
            Get instant updates on verified remote job opportunities, task earnings, and monthly payout disbursements.
          </Text>

          <View style={styles.dialogDivider} />

          <View style={styles.dialogActions}>
            <TouchableOpacity
              style={styles.denyButton}
              onPress={handleDismiss}
              activeOpacity={0.7}
            >
              <Text style={styles.denyButtonText}>Don't allow</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.allowButton}
              onPress={handleAllow}
              activeOpacity={0.7}
            >
              <Text style={styles.allowButtonText}>Allow</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  deviceDialog: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1E293B',
    borderRadius: 28,
    paddingTop: 26,
    paddingBottom: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  dialogHeaderIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F1F5F9',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 10,
  },
  dialogDescription: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 6,
  },
  dialogDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#334155',
    marginBottom: 16,
  },
  dialogActions: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  denyButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  denyButtonText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  allowButton: {
    backgroundColor: '#38BDF8',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 20,
  },
  allowButtonText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
});
