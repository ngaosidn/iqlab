import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Animated, Dimensions, Keyboard, LayoutAnimation, PanResponder, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { quranService } from '../services/quranService';
import { teacherService } from '../services/teacherService';
import { progressService } from '../services/progressService';
import { bookmarkService } from '../services/bookmarkService';
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
  const [targetScrollAyah, setTargetScrollAyah] = useState(null);

  // RPG Progression & Lobby State
  const [userProgress, setUserProgress] = useState({ unlockedSurah: 1, unlockedAyah: 1, isLockedToday: false });
  const [lobbyVisible, setLobbyVisible] = useState(false);
  const [activeTeachers, setActiveTeachers] = useState([]);
  const [targetSubmit, setTargetSubmit] = useState(null);
  const [inClassUrl, setInClassUrl] = useState(null);
  const [searchHighlight, setSearchHighlight] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [readingCheckpoint, setReadingCheckpoint] = useState(null);
  
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
        const [surahs, bms, checkpoint] = await Promise.all([
          quranService.fetchSurahs(),
          bookmarkService.fetchBookmarks(session?.user?.id),
          progressService.fetchCheckpoint(session?.user?.id)
        ]);
        
        setAllSurahs(surahs);
        if (bms) setBookmarks(bms);
        if (checkpoint) setReadingCheckpoint(checkpoint);

        // Proactive AI Suggestion (Priority to Checkpoint)
        const lastReadFallback = await progressService.fetchLastRead();
        const activeSuggestion = checkpoint || lastReadFallback;

        if (activeSuggestion) {
          setTimeout(() => {
            setMessages(prev => {
              if (prev.some(m => m.lastReadSuggestion)) return prev;
              
              const isFromPin = !!checkpoint;
              const title = isFromPin ? "Lanjutkan Penanda 🚩" : "Terakhir Dibuka ⏳";
              const content = isFromPin 
                ? `Assalamu'alaikum! Anda punya penanda di Surah ${checkpoint.surah_name} ayat ${checkpoint.ayah_number}. Lanjut dari sini?`
                : `Assalamu'alaikum! Terakhir Anda membuka Surah ${lastReadFallback.surah_name} ayat ${lastReadFallback.ayah_number}. Ingin lanjut?`;

              return [...prev, {
                type: 'bot',
                content: content,
                lastReadSuggestion: activeSuggestion,
                suggestionTitle: title
              }];
            });
          }, 1500);
        }

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

  const toggleBookmark = async (verse) => {
    try {
      const sName = allSurahs.find(s => s.id === (verse.surah_id || selectedSurah?.id))?.name_simple;
      const verseData = {
        surah_id: verse.surah_id || selectedSurah?.id,
        ayah_number: verse.ayat,
        surah_name: sName || `Surah ${verse.surah_id || selectedSurah?.id}`
      };
      
      const updated = await bookmarkService.toggleBookmark(session?.user?.id, verseData);
      setBookmarks(updated);
    } catch (err) {
      console.error('Toggle Bookmark error:', err);
      Alert.alert('Gagal', 'Terjadi kesalahan saat menyimpan bookmark.');
    }
  };

  const toggleCheckpoint = async (verse) => {
    try {
      const sName = allSurahs.find(s => s.id === (verse.surah_id || selectedSurah?.id))?.name_simple;
      const data = {
        surah_id: verse.surah_id || selectedSurah?.id,
        ayah_number: verse.ayat,
        surah_name: sName || `Surah ${verse.surah_id || selectedSurah?.id}`
      };
      
      const newCheckpoint = await progressService.saveCheckpoint(session?.user?.id, data);
      setReadingCheckpoint(newCheckpoint);
      
      const { default: Toast } = require('react-native-toast-message');
      Toast.show({
        type: 'success',
        text1: 'Penanda Disimpan 🚩',
        text2: `Berhasil menandai ${data.surah_name} ayat ${data.ayah_number}.`,
        position: 'bottom',
        bottomOffset: 90
      });
    } catch (err) {
      console.error('Toggle Checkpoint error:', err);
    }
  };

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
      const lowerTextRaw = userText.toLowerCase().trim();
      const rangeMatch = lowerTextRaw.match(/^(.*?)\s+(\d+)\s*(?:sampai|-|s\/d|sd|s\.d|to)\s*(\d+)$/);
      const singleMatch = lowerTextRaw.match(/^(.*?)\s+(\d+)$/);
      const isRandomCmd = ['nasihat', 'nasehat', 'random', 'acak', 'random ayat', 'acak ayat'].includes(lowerTextRaw);
      const isBookmarkCmd = ['bookmark', 'bookmarks', 'simpanan', 'koleksi', 'save'].includes(lowerTextRaw);

      if (isBookmarkCmd) {
        if (bookmarks.length === 0) {
          setMessages(prev => [...prev, { 
            type: 'bot', 
            content: '📭 Belum ada ayat favorit yang disimpan. Klik ikon bookmark di Mushaf untuk menyimpan ayat!' 
          }]);
        } else {
          setMessages(prev => [...prev, { 
            type: 'bot', 
            content: `📚 Kamu punya ${bookmarks.length} ayat pilihan yang tersimpan:`,
            bookmarks: bookmarks // We'll handle this in ChatBubble
          }]);
        }
        setIsLoading(false);
        return;
      }

      if (isRandomCmd) {
        quranService.getRandomAyah(mushafType).then(randomAyah => {
          if (randomAyah) {
            const surahObj = allSurahs.find(s => s.id === randomAyah.surah_id);
            setMessages(prev => [...prev, {
              type: 'bot',
              subType: 'surah_card',
              surah: { 
                ...surahObj, 
                id: randomAyah.surah_id, 
                name_simple: surahObj ? surahObj.name_simple : `Surah ${randomAyah.surah_id}` 
              },
              targetAyah: randomAyah.ayat,
              isRandom: true
            }]);
          } else {
             setMessages(prev => [...prev, { type: 'bot', content: 'Gagal mengambil ayat nasihat. Coba lagi.' }]);
          }
          setIsLoading(false);
        }).catch(err => {
          setMessages(prev => [...prev, { type: 'bot', content: 'Gagal mengambil ayat nasihat. Coba lagi.' }]);
          setIsLoading(false);
        });
        return; // Exit early as we're handling async here
      }

      let searchSurahQuery = lowerTextRaw.replace(/\s+/g, '');
      let searchAyah = null;

      if (rangeMatch) {
        searchSurahQuery = rangeMatch[1].replace(/\s+/g, '');
        const a1 = parseInt(rangeMatch[2], 10);
        const a2 = parseInt(rangeMatch[3], 10);
        searchAyah = { start: Math.min(a1, a2), end: Math.max(a1, a2) };
      } else if (singleMatch) {
        searchSurahQuery = singleMatch[1].replace(/\s+/g, '');
        searchAyah = parseInt(singleMatch[2], 10);
      }

      const foundSurah = allSurahs.find(s => {
        const latin = s.name_simple.toLowerCase().replace(/[-\s]/g, '');
        const id = String(s.id);
        return latin.includes(searchSurahQuery) || id === searchSurahQuery;
      });

      if (lowerTextRaw === 'daftar' || lowerTextRaw === 'list') {
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
        setSearchHighlight(null);
        setMessages(prev => [...prev, {
          type: 'bot',
          subType: 'surah_card',
          surah: foundSurah,
          targetAyah: searchAyah
        }]);
      } else {
        // Fallback: Indonesian Translation Search
        const wordSearchMatch = userText.match(/^(?:cari|search)\s+(.+)$/i);
        const searchKeyword = wordSearchMatch ? wordSearchMatch[1].trim() : (userText.length > 3 ? userText : null);
        
        if (searchKeyword) {
          setSearchHighlight(searchKeyword);
          quranService.searchByTranslation(searchKeyword, mushafType).then(results => {
            if (results && results.length > 0) {
              const surahGroups = results.reduce((acc, result) => {
                const surahId = result.surah_id;
                if (!acc[surahId]) {
                  const sInfo = allSurahs.find(s => s.id === surahId);
                  acc[surahId] = {
                    surah: sInfo || { id: surahId, name_simple: `Surah ${surahId}` },
                    count: 0,
                    verses: []
                  };
                }
                acc[surahId].count++;
                acc[surahId].verses.push(result);
                return acc;
              }, {});

              const finalGroups = Object.values(surahGroups).sort((a, b) => a.surah.id - b.surah.id);

              setMessages(prev => [...prev, {
                type: 'bot',
                content: `🔍 Ditemukan ${results.length} ayat yang mengandung kata "${searchKeyword}":`,
                wordSearchSummary: {
                  word: searchKeyword,
                  count: results.length,
                  surahGroups: finalGroups
                }
              }]);
            } else {
              setMessages(prev => [...prev, {
                type: 'bot',
                content: `❌ Tidak ditemukan ayat yang mengandung kata "${searchKeyword}". Coba kata kunci lain.`
              }]);
            }
            setIsLoading(false);
          }).catch(err => {
            setMessages(prev => [...prev, { type: 'bot', content: 'Terjadi kesalahan saat mencari. Coba lagi.' }]);
            setIsLoading(false);
          });
          return;
        }

        setMessages(prev => [...prev, {
          type: 'bot',
          content: '❌ Surah tidak ditemukan. Coba ketik nama surah (misal: Al Baqarah) atau nomor surah (misal: 1).'
        }]);
      }
      setIsLoading(false);
    }, 600);
  };

  const handleOpenSurah = async (surah, targetAyah = null) => {
    // Save as Last Read
    if (surah && surah.id) {
      const curAyah = typeof targetAyah === 'number' ? targetAyah : (targetAyah?.start || 1);
      progressService.saveLastRead(session?.user?.id, {
        surah_id: surah.id,
        ayah_number: curAyah,
        surah_name: surah.name_simple
      });
    }
    
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

      if (targetAyah) {
        setTargetScrollAyah(targetAyah);
      } else {
        setTargetScrollAyah(null);
      }

      // Beri jeda sangat singkat agar animasi modal tidak terganggu
      setTimeout(() => {
        if (targetAyah) {
          if (typeof targetAyah === 'object') {
            setVersesData(data.filter(v => v.ayat >= targetAyah.start && v.ayat <= targetAyah.end));
          } else {
            setVersesData(data.filter(v => v.ayat === targetAyah));
          }
        } else {
          setVersesData(data);
        }
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
        if (targetScrollAyah) {
            if (typeof targetScrollAyah === 'object') {
                setVersesData(data.filter(v => v.ayat >= targetScrollAyah.start && v.ayat <= targetScrollAyah.end));
            } else {
                setVersesData(data.filter(v => v.ayat === targetScrollAyah));
            }
        } else {
            setVersesData(data);
        }
      }
    };
    refreshVerses();
  }, [mushafType, modalVisible, selectedSurah, targetScrollAyah]);


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

  const handleResumeReading = (lastRead) => {
    const surahObj = allSurahs.find(s => s.id === lastRead.surah_id);
    if (surahObj) {
      handleOpenSurah(surahObj, { 
        start: lastRead.ayah_number, 
        end: surahObj.verses_count 
      });
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
    updateFontSize,
    targetScrollAyah,
    setTargetScrollAyah,
    searchHighlight,
    bookmarks,
    toggleBookmark,
    handleResumeReading,
    readingCheckpoint,
    toggleCheckpoint
  };
};
