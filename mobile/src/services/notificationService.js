import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Konfigurasi bagaimana notifikasi ditampilkan saat aplikasi terbuka (FOREGROUND)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  /**
   * Meminta izin dan mengambil Expo Push Token
   */
  async registerForPushNotificationsAsync() {
    let token;

    if (!Device.isDevice) {
      console.warn('[Notif] Harus menggunakan perangkat fisik untuk Push Notifications');
      return null;
    }

    // Langkah 1: Buat channel Android DULU sebelum minta izin
    if (Platform.OS === 'android') {
      console.log('[Notif] Membuat Android Notification Channel...');
      await Notifications.setNotificationChannelAsync('default', {
        name: 'I-QLab Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1e3a8a',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
        enableVibrate: true,
        showBadge: true,
      });
      console.log('[Notif] Android channel "default" berhasil dibuat ✅');
    }

    // Langkah 2: Cek & minta izin
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('[Notif] Status izin notifikasi saat ini:', existingStatus);

    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      console.log('[Notif] Meminta izin notifikasi dari user...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.error('[Notif] GAGAL: Izin notifikasi ditolak! Status:', finalStatus);
      return null;
    }
    console.log('[Notif] Izin notifikasi DIBERIKAN ✅');

    // Langkah 3: Dapatkan Expo Push Token
    const projectId = '6e32387f-eeeb-47f4-8134-60f1de798b3d';
    console.log('[Notif] Mengambil Expo Push Token dengan projectId:', projectId);

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      token = tokenData.data;
      console.log('[Notif] Expo Push Token berhasil didapat ✅:', token);
    } catch (e) {
      console.error('[Notif] GAGAL mendapatkan Expo Push Token:', e.message);

      // Fallback: coba native FCM token untuk debugging
      try {
        const nativeTokenData = await Notifications.getDevicePushTokenAsync();
        console.log('[Notif] Native FCM Token (hanya untuk debug):', nativeTokenData?.data);
      } catch (e2) {
        console.error('[Notif] Gagal mendapatkan native token juga:', e2.message);
      }

      return null;
    }

    return token;
  },

  /**
   * Listener saat notifikasi diterima saat aplikasi TERBUKA (Foreground)
   */
  addNotificationReceivedListener(callback) {
    return Notifications.addNotificationReceivedListener(callback);
  },

  /**
   * Listener saat notifikasi diklik oleh user dari tray
   */
  addNotificationResponseReceivedListener(callback) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  },

  removeNotificationSubscription(subscription) {
    Notifications.removeNotificationSubscription(subscription);
  },
};
