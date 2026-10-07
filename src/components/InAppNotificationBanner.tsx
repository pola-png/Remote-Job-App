import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Bell, Sparkles, Briefcase, CheckCircle2, X } from './LucideIcons';
import { AppNotification } from '../services/notifications';

interface Props {
  notification: AppNotification | null;
  onPress: (notification: AppNotification) => void;
  onDismiss: () => void;
}

export const InAppNotificationBanner: React.FC<Props> = ({
  notification,
  onPress,
  onDismiss,
}: Props) => {
  const slideAnim = React.useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (notification) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }).start();

      const timer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [notification]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onDismiss());
  };

  if (!notification) return null;

  return (
    <Animated.View
      style={[
        styles.bannerContainer,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.bannerContent}
        onPress={() => {
          onPress(notification);
          handleClose();
        }}
        activeOpacity={0.9}
      >
        <View style={styles.iconBg}>
          {notification.type === 'TASK_CREDIT' ? (
            <Sparkles color="#34D399" size={20} />
          ) : notification.type === 'JOB_ALERT' ? (
            <Briefcase color="#38BDF8" size={20} />
          ) : (
            <Bell color="#FBBF24" size={20} />
          )}
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {notification.body}
          </Text>
        </View>

        <TouchableOpacity style={styles.dismissBtn} onPress={handleClose}>
          <X color="#94A3B8" size={16} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  body: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 16,
  },
  dismissBtn: {
    padding: 4,
    marginLeft: 8,
  },
});
