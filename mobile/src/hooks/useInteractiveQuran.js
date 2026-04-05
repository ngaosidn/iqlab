import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Platform, Animated, Dimensions, Keyboard, LayoutAnimation, PanResponder } from 'react-native';
import { Audio } from 'expo-av';
import { useFonts } from 'expo-font';
import Toast from 'react-native-toast-message';
import { supabase } from '../lib/supabase';
import verseUthmani from '../../assets/data/verse.json';
import verseKemenag from '../../assets/data/kemenag.json';
import verseIndopak from '../../assets/data/indopak.json';

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
  const [mushafType, setMushafType] = useState('uthmani'); // 'uthmani', 'kemenag', 'indopak'
  const [expandedTafsir, setExpandedTafsir] = useState(null);
  const [tafsirDataMap, setTafsirDataMap] = useState({});
  const [sound, setSound] = useState(null);
  const [playingAyah, setPlayingAyah] = useState(null);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const isAutoPlayRef = useRef(isAutoPlay);
  const [currentPage, setCurrentPage] = useState(1);
  const [versesPerPage] = useState(10);

  // RPG Progression & Lobby State
  const [userProgress, setUserProgress] = useState({ unlockedSurah: 1, unlockedAyah: 1, isLockedToday: false });
  const [lobbyVisible, setLobbyVisible] = useState(false);
  const [activeTeachers, setActiveTeachers] = useState([]);
  const [targetSubmit, setTargetSubmit] = useState(null); // {surahId, ayahNumber}
  const [inClassUrl, setInClassUrl] = useState(null);
  
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
            if(sound) { sound.unloadAsync(); setSound(null); }
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
  }, [shimmerValue]);

  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const response = await fetch('https://api.quran.com/api/v4/chapters?language=id');
        const data = await response.json();
        setAllSurahs(data.chapters);
      } catch (error) {
        console.error('Error fetching surahs:', error);
      }
    };
    fetchSurahs();
    fetchUserProgress();
  }, [session]);

  const fetchUserProgress = async () => {
     if (!session?.user?.id) return;
     try {
       // Cari log progress terakhir
       const { data, error } = await supabase
         .from('quran_progress')
         .select('*')
         .eq('user_id', session.user.id)
         .order('surah_id', { ascending: false })
         .order('ayah_number', { ascending: false })
         .limit(1);
         
       if (!error && data && data.length > 0) {
         const lastRow = data[0];
         let nextSurah = lastRow.surah_id;
         let nextAyah = lastRow.ayah_number;
         
         if (lastRow.status === 'passed') {
           nextAyah += 1; // Simplifikasi (harusnya ngecek max ayat per surah, tp gpp)
         }

         // Cek apakah hari ini sudah submit (last_assessed_at hitung berdasarkan kalender)
         let lockedToday = false;
         if (lastRow.last_assessed_at) {
             const lastDate = new Date(lastRow.last_assessed_at).toDateString();
             const todayDate = new Date().toDateString();
             if (lastDate === todayDate) lockedToday = true;
         }

         setUserProgress({ unlockedSurah: nextSurah, unlockedAyah: nextAyah, isLockedToday: lockedToday });
       }
     } catch (err) {}
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
        // Ambil guru yang meeting_link nya tidak null (sedang broadcast)
        const myGender = session.user.user_metadata?.gender || 'Laki-laki'; // default jika blm set
        
        const { data, error } = await supabase
           .from('teacher_schedules')
           .select('*')
           .not('meeting_link', 'is', null)
           .eq('teacher_gender', myGender); // Saringan Anti-Ikhtilat
           
        if (!error && data) {
           setActiveTeachers(data);
        }
     } catch (err) {}
  };

  const joinTeacherClass = async (schedule) => {
     if (schedule.current_students_count >= 4) {
        Toast.show({ type: 'error', text1: 'Penuh 🔒', text2: 'Kursi ustadz ini sedang penuh (4/4). Tunggu sebentar.' });
        return;
     }

     // Insert ke tabel antrean
     try {
       const userGender = session.user.user_metadata?.gender || 'Laki-laki';
       const userName = session.user.user_metadata?.full_name || 'Murid Hamba Allah';

       const { error } = await supabase.from('active_class_participants').insert({
          schedule_id: schedule.id,
          student_id: session.user.id,
          student_name: userName,
          student_gender: userGender,
          target_surah_id: targetSubmit.surahId,
          target_ayah: targetSubmit.ayahNumber
       });

       if (error) throw error;
       
       // Berhasil daftar kursi, langsung teleport masuk Jitsi!
       setLobbyVisible(false);
       setInClassUrl(schedule.meeting_link);
       
     } catch (err) {
       Toast.show({ type: 'error', text1: 'Gagal Masuk', text2: err.message });
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
      const lowerText = userText.toLowerCase();
      
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
      } else {
         setMessages(prev => [...prev, {
          type: 'bot',
          content: '❌ Maaf, saya belum mengerti perintah Anda. Silakan ketik "daftar" untuk melihat surah.'
        }]);
      }
      setIsLoading(false);
    }, 600);
  };

  const handleOpenSurah = (surah) => {
    panY.setValue(0);
    setCurrentPage(1);
    setSelectedSurah(surah);
    setExpandedTafsir(null);
    setTafsirDataMap({});
    
    const activeJson = mushafType === 'uthmani' ? verseUthmani : 
                       mushafType === 'kemenag' ? verseKemenag : verseIndopak;
                       
    const data = activeJson[surah.id]?.ayat || [];
    setVersesData(data);
    setModalVisible(true);

    fetch(`https://equran.id/api/v2/tafsir/${surah.id}`)
      .then(r => r.json())
      .then(res => {
         const tafsirs = res.data?.tafsir || [];
         const map = {};
         tafsirs.forEach(t => { map[t.ayat] = t.teks; });
         setTafsirDataMap(map);
      })
      .catch(err => console.error('Tafsir fetch error', err));
  };

  // Sync verses when mushafType changes
  useEffect(() => {
    if (modalVisible && selectedSurah) {
      const activeJson = mushafType === 'uthmani' ? verseUthmani : 
                         mushafType === 'kemenag' ? verseKemenag : verseIndopak;
      const data = activeJson[selectedSurah.id]?.ayat || [];
      setVersesData(data);
    }
  }, [mushafType, modalVisible, selectedSurah]);

  const handlePlayAyah = async (surahId, ayahNumber) => {
    try {
      if (sound && playingAyah === ayahNumber) {
        await sound.pauseAsync();
        setPlayingAyah(null);
        return;
      }
      if (sound) await sound.unloadAsync();
      
      const pad = (num, size) => String(num).padStart(size, '0');
      const url = `https://everyayah.com/data/Alafasy_64kbps/${pad(surahId, 3)}${pad(ayahNumber, 3)}.mp3`;
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: url }, 
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setPlayingAyah(ayahNumber);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayingAyah(null);
          
          if (isAutoPlayRef.current) {
            // Find next ayah in current surah data
            const currentIndex = versesData.findIndex(v => v.ayat === ayahNumber);
            if (currentIndex !== -1 && currentIndex < versesData.length - 1) {
              const nextAyah = versesData[currentIndex + 1];
              
              // Handle Pagination switch if needed
              const nextAyahPage = Math.ceil((currentIndex + 2) / versesPerPage);
              if (nextAyahPage > currentPage) {
                setCurrentPage(nextAyahPage);
              }
              
              // Delay a bit for natural transition
              setTimeout(() => {
                handlePlayAyah(surahId, nextAyah.ayat);
              }, 600);
            } else {
              setIsAutoPlay(false); // End of surah
            }
          }
        }
      });
    } catch (e) { console.error('Audio play error', e); }
  };

  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
    // Scroll ke atas otomatis
    if (modalScrollRef.current) {
      modalScrollRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [modalScrollRef]);

  const toggleTafsir = useCallback((ayah) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedTafsir(prev => prev === ayah ? null : ayah);
  }, []);

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
    handleOpenLobby
  };
};
