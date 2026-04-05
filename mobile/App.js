import { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Animated, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import InteractiveQuranScreen from './src/screens/InteractiveQuranScreen';
import AdminScreen from './src/screens/AdminScreen';
import PengajarScreen from './src/screens/PengajarScreen';
import { supabase } from './src/lib/supabase';

const screenWidth = Dimensions.get('window').width;

const CustomToastLayout = ({ text1, text2, type, icon }) => {
  const slideAnim = useRef(new Animated.Value(screenWidth)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 20,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  const backgroundColor = 
    type === 'success' ? 'rgba(16, 185, 129, 0.95)' :
    type === 'error' ? 'rgba(239, 68, 68, 0.95)' :
    'rgba(30, 58, 138, 0.95)';

  return (
    <Animated.View style={[styles.customToast, { backgroundColor, transform: [{ translateX: slideAnim }] }]}>
      <View style={styles.toastIconBox}>
         <Feather name={icon} size={28} color="white" />
      </View>
      <View style={styles.toastContent}>
        <Text style={styles.toastText1}>{text1}</Text>
        {text2 && <Text style={styles.toastText2}>{text2}</Text>}
      </View>
    </Animated.View>
  );
};

const toastConfig = {
  success: (props) => (
    <CustomToastLayout {...props} type="success" icon="check-circle" />
  ),
  error: (props) => (
    <CustomToastLayout {...props} type="error" icon="alert-circle" />
  ),
  info: (props) => (
    <CustomToastLayout {...props} type="info" icon="info" />
  )
};

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
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
      <StatusBar style="light" backgroundColor="#0f172a" translucent={false} />
      {isShowSplash ? (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
          <Animated.View style={styles.splashContainer}>

            {/* Background Biru Modern */}
            <LinearGradient
              colors={['#0f172a', '#1e3a8a', '#3b82f6']}
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
                © {new Date().getFullYear()} - by Tahseena
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
  customToast: {
    flexDirection: 'row',
    width: screenWidth * 0.9,
    padding: 20,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    marginHorizontal: 20,
  },
  toastIconBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  toastContent: {
    flex: 1,
  },
  toastText1: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  toastText2: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
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
