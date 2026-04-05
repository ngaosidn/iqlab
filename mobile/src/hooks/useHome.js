import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Platform, Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../lib/supabase';

export const useHome = (session, onNavigate) => {
  const shimmerValue = useRef(new Animated.Value(-1)).current;
  const dotOpacity = useRef(new Animated.Value(1)).current;
  const screenWidth = Dimensions.get('window').width;

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAdminHub, setShowAdminHub] = useState(false);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const paramString = window.location.search || window.location.hash.substring(1).replace('?', '&');
      if (paramString) {
        const params = new URLSearchParams(paramString);
        const errorDesc = params.get('error_description');
        if (errorDesc) {
          setTimeout(() => {
            Toast.show({
              type: 'error',
              text1: 'Gagal Menyambungkan',
              text2: 'Mohon klik tombol Login Google sekali lagi.',
              position: 'bottom',
              bottomOffset: 90,
            });
          }, 1000);
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    }

    checkProfile(session?.user);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      checkProfile(newSession?.user);

      if (event === 'SIGNED_IN') {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.history.replaceState(null, '', window.location.pathname);
        }

        setTimeout(() => {
          Toast.show({
            type: 'success',
            text1: 'Berhasil Login! 🎉',
            text2: 'Selamat datang di I-Qlab',
            position: 'bottom',
            bottomOffset: 90,
          });
        }, 1000);
      } else if (event === 'SIGNED_OUT') {
        Toast.show({
          type: 'info',
          text1: 'Berhasil Logout',
          text2: 'Semoga belajarmu berkah, sampai jumpa lagi!',
          position: 'bottom',
          bottomOffset: 90,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [session]);

  const checkProfile = (user) => {
    if (user) {
      if (user.user_metadata?.role === 'admin' || user.user_metadata?.role === 'pengajar') {
         setShowProfileModal(false);
         return;
      }
      if (!user.user_metadata?.age || !user.user_metadata?.gender) {
        setShowProfileModal(true);
      } else {
        setShowProfileModal(false);
      }
    } else {
      setShowProfileModal(false);
    }
  };

  const checkAuth = (onSuccess) => {
    if (session?.user) {
      onSuccess();
    } else {
      Toast.show({
        type: 'info',
        text1: 'Eits, Login dulu! 🛑',
        text2: 'Fitur ini hanya untuk member lho! 😊',
        position: 'bottom',
        bottomOffset: 90,
      });
    }
  };

  const handleAuth = async () => {
    if (session) {
      await supabase.auth.signOut();
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.history.replaceState(null, '', window.location.pathname);
      }
    } else {
      const redirectUrl = makeRedirectUri({
        preferLocalhost: false,
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: Platform.OS !== 'web',
        }
      });

      if (error) {
        if (Platform.OS === 'web') alert(error.message);
        return;
      }

      if (Platform.OS !== 'web' && data?.url) {
        const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

        if (res.type === 'success' && res.url) {
          const match = res.url.match(/(?:#|\?)(.*)/);
          if (match && match[1]) {
            const urlParams = new URLSearchParams(match[1].replace('?', '&'));
            const access_token = urlParams.get('access_token');
            const refresh_token = urlParams.get('refresh_token');

            if (access_token && refresh_token) {
              await supabase.auth.setSession({ access_token, refresh_token });
            } else if (urlParams.get('error_description')) {
              Alert.alert('Gagal', decodeURIComponent(urlParams.get('error_description').replace(/\+/g, ' ')));
            }
          }
        }
      }
    }
  };

  const saveProfileData = async () => {
    if (!age || !gender) {
      Toast.show({
        type: 'error',
        text1: 'Data Belum Lengkap',
        text2: 'Tolong pilih Usia dan Jenis Kelamin dulu ya.',
        position: 'bottom',
        bottomOffset: 90,
      });
      return;
    }

    const { error } = await supabase.auth.updateUser({
      data: { age: age, gender: gender }
    });

    if (error) {
      Toast.show({ type: 'error', text1: 'Gagal Menyimpan', text2: error.message, position: 'bottom', bottomOffset: 90 });
    } else {
      setShowProfileModal(false);
      Toast.show({ type: 'success', text1: 'Profil Tersimpan!', text2: 'Terima kasih, data kamu sudah masuk.', position: 'bottom', bottomOffset: 90 });
    }
  };

  useEffect(() => {
    Animated.sequence([
      Animated.timing(shimmerValue, {
        toValue: 2,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(shimmerValue, {
        toValue: -1,
        duration: 0,
        useNativeDriver: true,
      })
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(dotOpacity, { toValue: 0.1, duration: 900, useNativeDriver: true }),
        Animated.timing(dotOpacity, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmerValue]);

  const translateX = shimmerValue.interpolate({
    inputRange: [-1, 2],
    outputRange: [-screenWidth, screenWidth * 1.5]
  });

  return {
    showProfileModal,
    setShowProfileModal,
    showAdminHub,
    setShowAdminHub,
    age, setAge,
    gender, setGender,
    checkAuth,
    handleAuth,
    saveProfileData,
    dotOpacity,
    translateX
  };
};
