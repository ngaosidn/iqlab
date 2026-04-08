import { useState, useEffect, useRef } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Animated, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

import HomeScreen from './src/screens/HomeScreen';
import InteractiveQuranScreen from './src/screens/InteractiveQuranScreen';
import AdminScreen from './src/screens/AdminScreen';
import PengajarScreen from './src/screens/PengajarScreen';
import { supabase } from './src/lib/supabase';

const screenWidth = Dimensions.get('window').width;

import { toastConfig } from './src/lib/toastConfig';


export default function App() {
  const [isShowSplash, setIsShowSplash] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('home');
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Sembunyikan Splash Native dengan sedikit jeda agar transisi benar-benar mulus
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let returning = false;

    // Cek apakah web me-redirect balik dengan token login (URL Hash dari Google OAuth)
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.location.hash.includes('access_token')) {
        returning = true;
        setIsShowSplash(false); // Langsung masuk tanpa loading screen tambahan
      }
    }

    if (!returning) {
      // Tunggu 3 detik, lalu langsung potong (cut) ke Halaman Utama tanpa efek fade/putih
      const timer = setTimeout(() => {
        setIsShowSplash(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);

  // --- RENDER CLUSTER ---
  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <StatusBar style="dark" backgroundColor="#ffffff" translucent={false} />
      {isShowSplash ? (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
          <Animated.View style={styles.splashContainer}>

            {/* Background Biru Modern */}
            <LinearGradient
              colors={['#1e3a8a', '#1e3a8a', '#3b82f6']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />

            {/* Konten Tengah */}
            <View style={styles.centerContent}>
              <Image
                source={require('./assets/logo.svg')}
                style={styles.logo}
                contentFit="contain"
                transition={1000}
              />
            </View>

            {/* Footer Copyright */}
            <View style={styles.footer}>
              <Text style={styles.copyrightText}>
                © {new Date().getFullYear()} - Powered by Tahseena
              </Text>
            </View>
          </Animated.View>
        </SafeAreaView>
      ) : currentScreen === 'interactive' ? (
        <InteractiveQuranScreen 
          session={session} 
          onBack={() => setCurrentScreen('home')} 
        />
      ) : currentScreen === 'admin' ? (
        <AdminScreen 
          session={session} 
          onBack={() => setCurrentScreen('home')} 
        />
      ) : currentScreen === 'pengajar' ? (
        <PengajarScreen 
          session={session} 
          onBack={() => setCurrentScreen('home')} 
        />
      ) : (
        <HomeScreen 
          session={session} 
          onNavigate={(screen) => setCurrentScreen(screen)} 
        />
      )}

      {/* Global Toast Component */}
      <Toast config={toastConfig} />
    </SafeAreaProvider>
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
