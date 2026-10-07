import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Sparkles, ArrowRight, X } from './LucideIcons';
import { AppUpdateInfo, AppUpdateService } from '../services/appUpdate';

interface Props {
  updateInfo: AppUpdateInfo | null;
  visible: boolean;
  onDismiss: () => void;
}

export const AppUpdateModal: React.FC<Props> = ({
  updateInfo,
  visible,
  onDismiss,
}: Props) => {
  if (!updateInfo || !visible) return null;

  const handleUpdate = async () => {
    await AppUpdateService.startDirectInAppUpdate('IMMEDIATE');
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {!updateInfo.isForceUpdate && (
            <TouchableOpacity style={styles.closeBtn} onPress={onDismiss}>
              <X color="#94A3B8" size={20} />
            </TouchableOpacity>
          )}

          <View style={styles.iconCircle}>
            <Sparkles color="#38BDF8" size={28} />
          </View>

          <Text style={styles.title}>Update Available</Text>
          <Text style={styles.subtitle}>
            A newer version (v{updateInfo.latestVersion}) is ready to install from Google Play.
          </Text>

          {updateInfo.releaseNotes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>WHAT'S NEW</Text>
              <Text style={styles.notesText}>{updateInfo.releaseNotes}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate} activeOpacity={0.85}>
            <Text style={styles.updateBtnText}>Update Now In-App</Text>
            <ArrowRight color="#FFFFFF" size={16} style={{ marginLeft: 6 }} />
          </TouchableOpacity>

          {!updateInfo.isForceUpdate && (
            <TouchableOpacity style={styles.laterBtn} onPress={onDismiss}>
              <Text style={styles.laterBtnText}>Maybe Later</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  notesContainer: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 17,
  },
  updateBtn: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  updateBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  laterBtn: {
    marginTop: 12,
    paddingVertical: 6,
  },
  laterBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
});
