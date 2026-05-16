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

    // Pengecekan profil sudah ditangani di App.js menggunakan tabel 'profiles'
    // Jadi kita tidak perlu lagi mengecek metadata di sini agar tidak terjadi tab-jump.

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
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

  const [announcements, setAnnouncements] = useState([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Heartbeat: Update jam internal setiap 10 detik
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnnouncements = async () => {
    try {
      console.log('Fetching announcements (with 5m buffer)...');
      setIsLoadingAnnouncements(true);
      
      // Ambil yang sudah terbit DAN yang akan terbit dalam 5 menit ke depan
      // (Agar sudah ada di memori HP sebelum waktunya tiba)
      const futureBuffer = new Date(Date.now() + 5 * 60000).toISOString();

      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .or('target_audience.eq.semua,target_audience.eq.iqlab')
        .lte('published_at', futureBuffer)
        .order('published_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setIsLoadingAnnouncements(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    
    const channel = supabase
      .channel('announcements_realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'announcements' }, 
        () => fetchAnnouncements()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter pengumuman yang BENAR-BENAR sudah waktunya tayang (berdasarkan jam HP)
  const visibleAnnouncements = announcements.filter(item => {
    return new Date(item.published_at) <= currentTime;
  });

  const translateX = shimmerValue.interpolate({
    inputRange: [-1, 2],
    outputRange: [-screenWidth, screenWidth * 1.5]
  });

  return {
    checkAuth,
    dotOpacity,
    translateX,
    announcements: visibleAnnouncements, // Kirim yang sudah difilter
    isLoadingAnnouncements,
    refreshAnnouncements: fetchAnnouncements
  };
};
