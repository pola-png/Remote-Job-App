import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {
  ArrowLeft,
  Bell,
  Briefcase,
  Wallet,
  Zap,
  Shield,
  CheckCheck,
  CheckCircle2,
} from '../components/LucideIcons';
import { AppNotification, NotificationService } from '../services/notifications';

interface Props {
  onBack: () => void;
  onNavigateScreen: (screen: 'REMOTE_JOBS' | 'MICRO_JOBS' | 'PAYOUT' | 'POLICY') => void;
}

export const NotificationsScreen: React.FC<Props> = ({
  onBack,
  onNavigateScreen,
}: Props) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    const list = await NotificationService.getNotifications();
    setNotifications(list);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (item: AppNotification) => {
    const updated = await NotificationService.markAsRead(item.id);
    setNotifications(updated);

    if (item.targetScreen) {
      onNavigateScreen(item.targetScreen);
    }
  };

  const handleMarkAllRead = async () => {
    const updated = await NotificationService.markAllAsRead();
    setNotifications(updated);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'JOB_ALERT':
        return <Briefcase color="#38BDF8" size={20} />;
      case 'PAYOUT_UPDATE':
        return <Wallet color="#FBBF24" size={20} />;
      case 'TASK_CREDIT':
        return <Zap color="#34D399" size={20} />;
      default:
        return <Shield color="#A78BFA" size={20} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft color="#F8FAFC" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllRead} style={styles.readAllBtn}>
          <CheckCheck color="#38BDF8" size={20} />
        </TouchableOpacity>
      </View>

      <FlatList<AppNotification>
        data={notifications}
        keyExtractor={(item: AppNotification) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#38BDF8"
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Bell color="#475569" size={48} />
            <Text style={styles.emptyTitle}>No Notifications Yet</Text>
            <Text style={styles.emptyDesc}>
              You'll be alerted here whenever matching remote jobs or payout updates arrive.
            </Text>
          </View>
        }
        renderItem={({ item }: { item: AppNotification }) => (
          <TouchableOpacity
            style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
            onPress={() => handleNotificationPress(item)}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>{getNotificationIcon(item.type)}</View>

            <View style={styles.notifContent}>
              <View style={styles.notifTitleRow}>
                <Text style={styles.notifTitle}>{item.title}</Text>
                {!item.isRead && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.notifBody}>{item.body}</Text>
              <Text style={styles.notifTime}>{item.createdAt}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backBtn: {
    padding: 6,
    backgroundColor: '#1E293B',
    borderRadius: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  readAllBtn: {
    padding: 6,
    backgroundColor: '#1E293B',
    borderRadius: 10,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 16,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  notifCardUnread: {
    borderColor: '#38BDF8',
    backgroundColor: '#0F172A',
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  notifContent: {
    flex: 1,
  },
  notifTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38BDF8',
    marginLeft: 6,
  },
  notifBody: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
    marginBottom: 6,
  },
  notifTime: {
    fontSize: 11,
    color: '#64748B',
  },
});
