export const firebaseConfig = {
  apiKey: 'AIzaSyA4ZpqQTZMJ5-APa23r41e5M9Kuw2GyLH4',
  authDomain: 'xapzap-34fb4.firebaseapp.com',
  projectId: 'xapzap-34fb4',
  storageBucket: 'xapzap-34fb4.firebasestorage.app',
  messagingSenderId: '741833699111',
  appId: '1:741833699111:android:5f6e675bfdf184c0fc0302',
  databaseURL: 'https://xapzap-34fb4-default-rtdb.firebaseio.com',
};

export const FirebaseService = {
  isInitialized: true,
  getProjectId(): string {
    return firebaseConfig.projectId;
  },
  async logEvent(eventName: string, params?: Record<string, any>): Promise<void> {
    try {
      // Event logging for analytics & task completions
      console.log(`[Firebase Analytics] Event: ${eventName}`, params);
    } catch (_) {}
  },
};
