import { useState, useEffect, useRef } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Animated, Platform, Dimensions, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const navigationRef = createNavigationContainerRef();

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
const Tab = createBottomTabNavigator();

import HomeScreen from './src/screens/HomeScreen';
import InteractiveQuranScreen from './src/screens/InteractiveQuranScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ContentScreen from './src/screens/ContentScreen';
import AnnouncementDetailScreen from './src/screens/AnnouncementDetailScreen';
import AnimatedTabBar from './src/components/navigation/AnimatedTabBar';
import { supabase } from './src/lib/supabase';
import { databaseService } from './src/services/databaseService';
import { ThemeProvider } from './src/context/ThemeContext';
import { notificationService } from './src/services/notificationService';

function MainTabs({ session }) {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={props => <AnimatedTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Content">
        {props => <ContentScreen {...props} session={session} />}
      </Tab.Screen>
      <Tab.Screen name="Home">
        {props => <HomeScreen {...props} session={session} />}
      </Tab.Screen>
      <Tab.Screen name="Profile">
        {props => <ProfileScreen {...props} session={session} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}


const screenWidth = Dimensions.get('window').width;

import { toastConfig } from './src/lib/toastConfig';


import { profileService } from './src/services/profileService';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';

export default function App() {
  const [isShowSplash, setIsShowSplash] = useState(true);
  const [session, setSession] = useState(null);
  const [isProfileChecking, setIsProfileChecking] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  // --- PUSH NOTIFICATION EFFECT ---
  useEffect(() => {
    if (session?.user && hasProfile) {
      console.log('[App] Initializing Notifications for user:', session.user.id);
      
      // 1. Daftar Token
      notificationService.registerForPushNotificationsAsync().then(token => {
        if (token) {
          console.log('[App] Push Token current:', token);
          profileService.updatePushToken(session.user.id, token)
            .then(() => console.log('[App] Token updated in DB ✅'))
            .catch(err => console.error('[App] Error saving push token:', err));
        } else {
          console.log('[App] No token generated ❌');
        }
      });

      // 2. Handle Pesan Masuk saat Aplikasi Terbuka (Foreground) — tidak perlu Toast
      const foregroundListener = notificationService.addNotificationReceivedListener(notification => {
        console.log('[App] Foreground Notification Received (tidak ditampilkan Toast):', notification.request.content.title);
      });

      // 3. Handle Klik Notifikasi (Saat diklik dari tray)
      const responseListener = notificationService.addNotificationResponseReceivedListener(response => {
        console.log('[App] Notification Response Received:', response);
        const data = response.notification.request.content.data;
        if (data?.announcementId) {
          supabase.from('announcements')
            .select('*')
            .eq('id', data.announcementId)
            .single()
            .then(({ data: announcement }) => {
              if (announcement && navigationRef.isReady()) {
                navigationRef.navigate('AnnouncementDetail', { announcement });
              }
            });
        }
      });

      return () => {
        console.log('[App] Cleaning up Notification listeners');
        notificationService.removeNotificationSubscription(foregroundListener);
        notificationService.removeNotificationSubscription(responseListener);
      };
    }
  }, [session, hasProfile]);

  // Fungsi pengecekan profil
  const checkUserProfile = async (userId) => {
    setIsProfileChecking(true);
    try {
      const profile = await profileService.getProfile(userId);
      setHasProfile(!!profile);
    } catch (error) {
      console.error('Check Profile Error:', error);
      setHasProfile(false);
    } finally {
      setIsProfileChecking(false);
    }
  };

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        checkUserProfile(session.user.id);
      } else {
        setIsProfileChecking(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session?.user) {
        checkUserProfile(session.user.id);
      } else {
        setHasProfile(false);
        setIsProfileChecking(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Initialize & Bootstrap SQLite
    if (Platform.OS !== 'web') {
      databaseService.bootstrap().catch(err => console.log('DB Bootstrap Error:', err));
    }
  }, []);


  useEffect(() => {
    // Sembunyikan Splash Native dengan sedikit jeda
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let returning = false;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.location.hash.includes('access_token')) {
        returning = true;
        setIsShowSplash(false);
      }
    }

    if (!returning) {
      const timer = setTimeout(() => {
        setIsShowSplash(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);

  // --- RENDER CLUSTER ---
  
  // Tampilan Loading saat cek profil
  const renderContent = () => {
    if (isShowSplash || isProfileChecking) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#1e3a8a' }}>
          <Animated.View style={styles.splashContainer}>
            <LinearGradient
              colors={['#1e3a8a', '#1e3a8a', '#3b82f6']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.centerContent}>
              <Image
                source={require('./assets/logo.svg')}
                style={styles.logo}
                contentFit="contain"
                transition={1000}
              />
              {isProfileChecking && (
                <ActivityIndicator size="large" color="#FFFFFF" style={{ marginTop: 20 }} />
              )}
            </View>
          </Animated.View>
        </SafeAreaView>
      );
    }

    // Jika sudah login tapi BELUM punya profil
    if (session && !hasProfile) {
      return (
        <ProfileSetupScreen 
          onProfileComplete={() => setHasProfile(true)} 
        />
      );
    }

    // Alur Normal (Home / Tabs)
    return (
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
          <Stack.Screen name="MainTabs">
            {props => <MainTabs {...props} session={session} />}
          </Stack.Screen>
          <Stack.Screen name="Interactive">
            {props => <InteractiveQuranScreen {...props} session={session} />}
          </Stack.Screen>
          <Stack.Screen name="AnnouncementDetail">
            {props => <AnnouncementDetailScreen {...props} />}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    );
  };

  return (
    <ThemeProvider>
      <SafeAreaProvider style={{ flex: 1, backgroundColor: '#1e3a8a' }}>
        <StatusBar style="light" backgroundColor="#1e3a8a" translucent={false} />
        {renderContent()}
        <Toast config={toastConfig} />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  // Styles Halaman Utama (Splash)
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 180,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
  },
  copyrightText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    letterSpacing: 1,
  },
});
