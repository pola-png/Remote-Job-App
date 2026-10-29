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
  Sparkles,
} from '../components/LucideIcons';
import { AppNotification, NotificationService } from '../services/notifications';

interface Props {
  onBack: () => void;
  onNavigateScreen: (screen: 'REMOTE_JOBS' | 'MICRO_JOBS' | 'PAYOUT' | 'POLICY', taskId?: string) => void;
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
      onNavigateScreen(item.targetScreen, item.taskId);
    }
  };

  const handleMarkAllRead = async () => {
    const updated = await NotificationService.markAllAsRead();
    setNotifications(updated);
  };

  const getNotificationIcon = (type: string, hasReward?: boolean) => {
    if (hasReward) {
      return <Sparkles color="#34D399" size={20} />;
    }
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
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft color="#F8FAFC" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllRead} style={styles.readAllBtn} activeOpacity={0.7}>
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
              You'll be alerted here whenever high-paying tasks, matching remote jobs, or payout updates arrive.
            </Text>
          </View>
        }
        renderItem={({ item }: { item: AppNotification }) => {
          const hasReward = Boolean(item.reward);
          return (
            <TouchableOpacity
              style={[
                styles.notifCard,
                !item.isRead && styles.notifCardUnread,
                hasReward && styles.notifCardReward,
              ]}
              onPress={() => handleNotificationPress(item)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconContainer, hasReward && styles.iconContainerReward]}>
                {getNotificationIcon(item.type, hasReward)}
              </View>

              <View style={styles.notifContent}>
                <View style={styles.notifTitleRow}>
                  <Text style={styles.notifTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {!item.isRead && <View style={styles.unreadDot} />}
                </View>

                <Text style={styles.notifBody}>{item.body}</Text>

                <View style={styles.notifFooter}>
                  <Text style={styles.notifTime}>{item.createdAt}</Text>
                  {hasReward && (
                    <View style={styles.rewardBadge}>
                      <Text style={styles.rewardBadgeText}>{item.reward}</Text>
                    </View>
                  )}
                  {item.targetScreen && (
                    <Text style={styles.tapActionHint}>Tap to view →</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
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
  notifCardReward: {
    borderColor: 'rgba(52, 211, 153, 0.45)',
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
  iconContainerReward: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
  },
  notifContent: {
    flex: 1,
  },
  notifTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    flex: 1,
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38BDF8',
    marginLeft: 8,
    marginTop: 6,
  },
  notifBody: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 8,
  },
  notifFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  notifTime: {
    fontSize: 11,
    color: '#64748B',
  },
  rewardBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: '#34D399',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rewardBadgeText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '800',
  },
  tapActionHint: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
});
