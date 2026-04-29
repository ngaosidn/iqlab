import { useState, useEffect, useRef } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Animated, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
const Tab = createBottomTabNavigator();

import HomeScreen from './src/screens/HomeScreen';
import InteractiveQuranScreen from './src/screens/InteractiveQuranScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import BookmarkScreen from './src/screens/BookmarkScreen';
import AnimatedTabBar from './src/components/navigation/AnimatedTabBar';
import { supabase } from './src/lib/supabase';
import { databaseService } from './src/services/databaseService';
import { ThemeProvider } from './src/context/ThemeContext';

function MainTabs({ session }) {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={props => <AnimatedTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Bookmark">
        {props => <BookmarkScreen {...props} session={session} />}
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


export default function App() {
  const [isShowSplash, setIsShowSplash] = useState(true);
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
    // Initialize & Bootstrap SQLite
    if (Platform.OS !== 'web') {
      databaseService.bootstrap().catch(err => console.log('DB Bootstrap Error:', err));
    }
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
    <ThemeProvider>
      <SafeAreaProvider style={{ flex: 1, backgroundColor: '#1e3a8a' }}>
        <StatusBar style="light" backgroundColor="#1e3a8a" translucent={false} />
      {isShowSplash ? (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#1e3a8a' }}>
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
      ) : (
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
            <Stack.Screen name="MainTabs">
              {props => <MainTabs {...props} session={session} />}
            </Stack.Screen>
            <Stack.Screen name="Interactive">
              {props => <InteractiveQuranScreen {...props} session={session} />}
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      )}

      {/* Global Toast Component */}
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
