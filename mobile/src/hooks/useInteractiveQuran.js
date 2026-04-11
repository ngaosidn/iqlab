import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Animated, Dimensions, Keyboard, LayoutAnimation, PanResponder, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { quranService } from '../services/quranService';
import { teacherService } from '../services/teacherService';
import { progressService } from '../services/progressService';
import { supabase as supabaseClient } from '../lib/supabase';


export const useInteractiveQuran = (onBack, session) => {
  const [fontsLoaded] = useFonts({
    'Uthmanic-Neo-Color': require('../../assets/fonts/Uthmanic-Neo-Color.ttf'),
    'LPMQ-Isep-Misbah': require('../../assets/fonts/LPMQ-Isep-Misbah.ttf'),
    'Indopak-Font': require('../../assets/fonts/Indopak-Font.ttf'),
  });

  const shimmerValue = useRef(new Animated.Value(-1)).current;
  const screenWidth = Dimensions.get('window').width;
  const scrollViewRef = useRef(null);
  const modalScrollRef = useRef(null);

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      isGuide: true,
      content: `Assalamu'alaikum! Silakan ketik perintah di bawah ini untuk berinteraksi:`
    }
  ]);
  const [allSurahs, setAllSurahs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [versesData, setVersesData] = useState([]);
  const [mushafType, setMushafType] = useState('uthmani');
  const [expandedTafsir, setExpandedTafsir] = useState(null);
  const [tafsirDataMap, setTafsirDataMap] = useState({});
  const [sound, setSound] = useState(null);
  const [playingAyah, setPlayingAyah] = useState(null);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const isAutoPlayRef = useRef(isAutoPlay);
  const [currentPage, setCurrentPage] = useState(1);
  const [versesPerPage] = useState(10);

  const [fontSize, setFontSize] = useState(30);

  // RPG Progression & Lobby State
  const [userProgress, setUserProgress] = useState({ unlockedSurah: 1, unlockedAyah: 1, isLockedToday: false });
  const [lobbyVisible, setLobbyVisible] = useState(false);
  const [activeTeachers, setActiveTeachers] = useState([]);
  const [targetSubmit, setTargetSubmit] = useState(null);
  const [inClassUrl, setInClassUrl] = useState(null);
  
  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSize = await AsyncStorage.getItem('quran_font_size');
        if (savedSize) setFontSize(parseInt(savedSize));
      } catch (e) {}
    };
    loadSettings();
  }, []);

  const updateFontSize = async (increment) => {
    const newSize = Math.max(16, Math.min(60, fontSize + (increment ? 2 : -2)));
    setFontSize(newSize);
    try {
      await AsyncStorage.setItem('quran_font_size', newSize.toString());
    } catch (e) {}
  };

  useEffect(() => {
    isAutoPlayRef.current = isAutoPlay;
  }, [isAutoPlay]);

  const panY = useRef(new Animated.Value(0)).current;

  const resetModalPosition = useCallback(() => {
    Animated.timing(panY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [panY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 0.8) {
          Animated.timing(panY, {
            toValue: Dimensions.get('window').height,
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            setModalVisible(false);
            if (sound) { sound.unloadAsync(); setSound(null); }
            setPlayingAyah(null);
            setTimeout(() => panY.setValue(0), 100);
          });
        } else {
          resetModalPosition();
        }
      },
    })
  ).current;

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

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
  }, []);

  useEffect(() => {
    const initData = async () => {
      try {
        const surahs = await quranService.fetchSurahs();
        setAllSurahs(surahs);

        if (session?.user?.id) {
          const progress = await progressService.fetchUserProgress(session.user.id);
          setUserProgress(progress);
        }
      } catch (error) {
        console.error('Error initializing Quran data:', error);
      }
    };
    initData();
  }, [session]);

  const fetchUserProgress = async () => {
    if (!session?.user?.id) return;
    try {
      const progress = await progressService.fetchUserProgress(session.user.id);
      setUserProgress(progress);
    } catch (err) { }
  };

  const handleOpenLobby = async (surahId, ayahNumber) => {
    if (userProgress.isLockedToday) {
      Toast.show({ type: 'error', text1: 'Limit Habis 🛑', text2: 'Anda sudah menghabiskan kuota 1 ayat hari ini. Ulangi besok.' });
      return;
    }

    setTargetSubmit({ surahId, ayahNumber });
    setLobbyVisible(true);
    fetchActiveTeachers();
  };

  const fetchActiveTeachers = async () => {
    if (!session?.user) return;
    try {
      const myGender = session.user.user_metadata?.gender || 'Laki-laki';
      const teachers = await teacherService.fetchActiveTeachers(myGender);
      setActiveTeachers(teachers);
    } catch (err) { }
  };

  // Real-time listener untuk Lobby (Agar saat ustadz Power Off, di murid langsung hilang)
  useEffect(() => {
    if (lobbyVisible && session?.user) {
      // 1. Fetch langsung saat lobby terbuka
      fetchActiveTeachers();

      // 2. Listen ke perubahan real-time
      const channel = supabaseClient
        .channel('lobby_realtime')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'teacher_schedules' 
        }, (payload) => {
          console.log("Realtime Lobby Update:", payload.eventType);
          fetchActiveTeachers();
        })
        .subscribe();

      return () => {
        supabaseClient.removeChannel(channel);
      };
    }
  }, [lobbyVisible, session?.user]);

  const joinTeacherClass = async (schedule) => {
    try {
      setIsLoading(true);
      const userGender = session.user.user_metadata?.gender || 'Laki-laki';
      const userName = session.user.user_metadata?.full_name || 'Murid Hamba Allah';

      if (!supabaseClient) {
        throw new Error("Supabase client is not initialized");
      }

      // 1. CEK APAKAH KITA SUDAH ADA DI DAFTAR (Antisipasi Re-join)
      const { data: existing, error: checkError } = await supabaseClient
        .from('active_class_participants')
        .select('id')
        .eq('schedule_id', schedule.id)
        .eq('student_id', session.user.id)
        .limit(1);

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        console.log("ℹ️ Student already in class, re-joining...");
        setLobbyVisible(false);
        setInClassUrl(schedule.meeting_link);
        return;
      }

      // 2. CEK KUOTA (Hanya jika murid baru)
      if (schedule.current_students_count >= 4) {
        Toast.show({ type: 'error', text1: 'Penuh 🔒', text2: 'Kursi ustadz ini sedang penuh (4/4). Tunggu sebentar.' });
        return;
      }

      // 3. INSERT PESERTA
      await teacherService.joinClass({
        scheduleId: schedule.id,
        studentId: session.user.id,
        studentName: userName,
        studentGender: userGender,
        targetSurahId: targetSubmit.surahId,
        targetAyah: targetSubmit.ayahNumber
      });

      // 4. INCREMENT COUNT DI JADWAL
      const newCount = (schedule.current_students_count || 0) + 1;
      const { error: updateError } = await supabaseClient
        .from('teacher_schedules')
        .update({ current_students_count: newCount })
        .eq('id', schedule.id);

      if (updateError) throw updateError;

      setLobbyVisible(false);
      setInClassUrl(schedule.meeting_link);
    } catch (err) {
      console.error("Error joining class details:", err);
      Toast.show({ type: 'error', text1: 'Gagal Masuk', text2: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  const translateX = shimmerValue.interpolate({
    inputRange: [-1, 2],
    outputRange: [-screenWidth, screenWidth * 1.5]
  });

  const handleSend = () => {
    const userText = input.trim();
    if (!userText) return;

    Keyboard.dismiss();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    setInput('');
    setMessages(prev => [...prev, { type: 'user', content: userText }]);
    setIsLoading(true);

    setTimeout(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      const lowerText = userText.toLowerCase().replace(/\s+/g, '');

      const foundSurah = allSurahs.find(s => {
        const latin = s.name_simple.toLowerCase().replace(/[-\s]/g, '');
        const id = String(s.id);
        return latin.includes(lowerText) || id === lowerText;
      });

      if (lowerText === 'daftar' || lowerText === 'list') {
        if (allSurahs.length > 0) {
          setMessages(prev => [...prev, {
            type: 'bot',
            content: 'Berikut adalah daftar seluruh surah:',
            surahs: allSurahs
          }]);
        } else {
          setMessages(prev => [...prev, {
            type: 'bot',
            content: 'Maaf, data surah masih memuat, silakan coba sebentar lagi.'
          }]);
        }
      } else if (foundSurah) {
        setMessages(prev => [...prev, {
          type: 'bot',
          subType: 'surah_card',
          surah: foundSurah
        }]);
      } else {
        setMessages(prev => [...prev, {
          type: 'bot',
          content: '❌ Surah tidak ditemukan. Coba ketik nama surah (misal: Al Baqarah) atau nomor surah (misal: 1).'
        }]);
      }
      setIsLoading(false);
    }, 600);
  };

  const handleOpenSurah = async (surah) => {
    panY.setValue(0);
    setCurrentPage(1);
    setSelectedSurah(surah);
    setExpandedTafsir(null);
    setTafsirDataMap({});

    // Langsung buka modal agar terasa instan
    setModalVisible(true);
    setVersesData([]);

    try {
      const surahNomor = surah.id || surah.nomor;
      const data = await quranService.getSurahVerses(surahNomor, mushafType);

      // Beri jeda sangat singkat agar animasi modal tidak terganggu
      setTimeout(() => {
        setVersesData(data);
      }, 50);


      // Background fetch full surah tafsir
      quranService.fetchFullSurahTafsir(surahNomor).then(map => {
        setTafsirDataMap(prev => ({ ...prev, ...map }));
      }).catch(err => console.log('Background Tafsir fetch error:', err.message));

    } catch (error) {
      console.error('Error opening surah:', error);
      Alert.alert('Gagal', 'Gagal memuat ayat surah');
    }
  };

  const toggleTafsir = async (ayahNumber) => {
    if (expandedTafsir === ayahNumber) {
      setExpandedTafsir(null);
    } else {
      setExpandedTafsir(ayahNumber);

      if (!selectedSurah) return;

      if (!tafsirDataMap[ayahNumber]) {
        try {
          const surahId = selectedSurah.nomor || selectedSurah.id;
          if (!surahId) return;
          const cleanText = await quranService.fetchSingleAyahTafsir(surahId, ayahNumber);
          if (cleanText) {
            setTafsirDataMap(prev => ({
              ...prev,
              [ayahNumber]: cleanText
            }));
          }
        } catch (e) {
          console.log('Single ayah fetch failed:', e.message);
        }
      }
    }
  };

  useEffect(() => {
    const refreshVerses = async () => {
      if (modalVisible && selectedSurah) {
        const data = await quranService.getSurahVerses(selectedSurah.id, mushafType);
        setVersesData(data);
      }
    };
    refreshVerses();
  }, [mushafType, modalVisible, selectedSurah]);


  // Ref untuk versesData guna menghindari stale closure di callback audio
  const versesDataRef = useRef([]);
  useEffect(() => {
    versesDataRef.current = versesData;
  }, [versesData]);

  const handlePlayAyah = async (surahId, ayahNumber) => {
    try {
      // 1. Bersihkan audio yang sedang berjalan dengan aman
      if (sound) {
        setPlayingAyah(null);
        try {
          // Berhenti dulu baru unload untuk kestabilan di Android
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch (e) {
          console.log('Audio reset cleanup:', e.message);
        }
        setSound(null);
        
        // Jika klik tombol yang sama (Toggle Off), stop di sini
        if (playingAyah === ayahNumber) return;
      }

      setPlayingAyah(ayahNumber);

      const pad = (num, size) => String(num).padStart(size, '0');
      // Menggunakan Alafasy 128kbps untuk kualitas lebih baik
      const url = `https://everyayah.com/data/Alafasy_128kbps/${pad(surahId, 3)}${pad(ayahNumber, 3)}.mp3`;

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: url },
        { 
          shouldPlay: true, 
          progressUpdateIntervalMillis: 1000 // Interval lebih santai
        }
      );

      setSound(newSound);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) {
          if (status.error) {
            console.warn(`Audio error @ ${surahId}:${ayahNumber}:`, status.error);
            handleAudioError(surahId, ayahNumber);
          }
          return;
        }

        if (status.didJustFinish) {
          setPlayingAyah(null);
          if (isAutoPlayRef.current) {
            autoPlayNext(surahId, ayahNumber);
          }
        }
      });
    } catch (e) { 
      console.error('Initial Load Error:', e.message);
      handleAudioError(surahId, ayahNumber);
    }
  };

  const handleAudioError = (surahId, ayahNumber) => {
    setPlayingAyah(null);
    if (isAutoPlayRef.current) {
      // Jika error, lompat ke ayat berikutnya setelah 1 detik
      setTimeout(() => autoPlayNext(surahId, ayahNumber), 1000);
    }
  };

  const autoPlayNext = (surahId, currentAyah) => {
    const data = versesDataRef.current;
    const currentIndex = data.findIndex(v => v.ayat === currentAyah);
    
    if (currentIndex !== -1 && currentIndex < data.length - 1) {
      const nextAyah = data[currentIndex + 1];
      // Jeda 600ms sebagai "napas" antar ayat
      setTimeout(() => {
        handlePlayAyah(surahId, nextAyah.ayat);
      }, 600);
    } else {
      setIsAutoPlay(false);
      setPlayingAyah(null);
    }
  };

  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
    if (modalScrollRef.current) {
      modalScrollRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [modalScrollRef]);

  return {
    fontsLoaded,
    translateX,
    scrollViewRef,
    modalScrollRef,
    input,
    setInput,
    messages,
    setMessages,
    isLoading,
    modalVisible,
    setModalVisible,
    selectedSurah,
    versesData,
    mushafType,
    setMushafType,
    expandedTafsir,
    tafsirDataMap,
    playingAyah,
    isAutoPlay,
    setIsAutoPlay,
    currentPage,
    setCurrentPage,
    versesPerPage,
    panY,
    panResponder,
    handleSend,
    handleOpenSurah,
    handlePlayAyah,
    handlePageChange,
    toggleTafsir,
    sound,
    setSound,
    setPlayingAyah,
    userProgress,
    lobbyVisible,
    setLobbyVisible,
    activeTeachers,
    fetchActiveTeachers,
    joinTeacherClass,
    inClassUrl,
    setInClassUrl,
    handleOpenLobby,
    fontSize,
    updateFontSize
  };
};
