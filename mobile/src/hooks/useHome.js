import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { supabase } from '../lib/supabase';
import { authService } from '../services/authService';

export const useHome = (session, onNavigate) => {
  const shimmerValue = useRef(new Animated.Value(-1)).current;
  const dotOpacity = useRef(new Animated.Value(1)).current;
  const screenWidth = Dimensions.get('window').width;

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
      if (!user.user_metadata?.age || !user.user_metadata?.gender) {
        onNavigate('profile');
      }
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
  }, []);

  const translateX = shimmerValue.interpolate({
    inputRange: [-1, 2],
    outputRange: [-screenWidth, screenWidth * 1.5]
  });

  return {
    checkAuth,
    dotOpacity,
    translateX
  };
};
