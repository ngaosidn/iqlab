import { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import Toast from 'react-native-toast-message';
import { supabase } from '../lib/supabase';
import { authService } from '../services/authService';
import { teacherService } from '../services/teacherService';

export const usePengajar = (session) => {
  const [isTeacherLoggedIn, setIsTeacherLoggedIn] = useState(false);
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [teacherName, setTeacherName] = useState('Ustadz/ah');
  const [tapCount, setTapCount] = useState(0);

  const [currentTeacherView, setCurrentTeacherView] = useState('dashboard');
  const [settingsPhone, setSettingsPhone] = useState('');
  const [settingsOldPassword, setSettingsOldPassword] = useState('');
  const [settingsNewPassword, setSettingsNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // SCHEDULE STATES
  const [schedules, setSchedules] = useState([]);
  const [jadwalDay, setJadwalDay] = useState('Senin');
  const [jadwalStart, setJadwalStart] = useState('');
  const [jadwalEnd, setJadwalEnd] = useState('');
  const isTahseenaTeacher = session?.user?.user_metadata?.lembaga === 'Tahseena';
  const [activeReminder, setActiveReminder] = useState(null);
  const [manuallyFinishedIds, setManuallyFinishedIds] = useState([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (session?.user?.user_metadata?.role === 'pengajar') {
      setTeacherName(session.user.user_metadata.full_name || 'Pengajar');
      setSettingsPhone(session.user.user_metadata.phone || session.user.phone || '');
      setIsTeacherLoggedIn(true);
      Toast.show({
        type: 'success',
        text1: 'Akses Otomatis! 🎓',
        text2: `Selamat datang kembali, ${session.user.user_metadata.full_name || 'Ustadz/ah'}.`,
      });
    }
  }, [session]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [isTeacherLoggedIn, isSignupMode]);

  const handleIconTap = () => {
    const newCount = tapCount + 1;
    if (newCount >= 3) {
      setIsSignupMode(!isSignupMode);
      setTapCount(0);
      Toast.show({ type: 'info', text1: 'Mode Daftar Pengajar', text2: 'Gunakan form ini untuk mendaftarkan Ustadz/ah baru.' });
    } else {
      setTapCount(newCount);
      setTimeout(() => setTapCount(0), 3000);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({ type: 'error', text1: 'Lengkapi Data', text2: 'Email dan Password wajib diisi.' });
      return;
    }

    setIsLoading(true);
    try {
      const data = await authService.signInWithEmail(email, password);
      const userRole = data.user.user_metadata?.role;
      if (userRole === 'pengajar') {
        setTeacherName(data.user.user_metadata?.full_name || 'Ustadz/ah');
        setIsTeacherLoggedIn(true);
        Toast.show({
          type: 'success',
          text1: 'Selamat Datang, Pengajar! 🎓',
          text2: `Selamat bertugas, ${data.user.user_metadata?.full_name || 'Ustadz/ah'}.`,
        });
      } else {
        await authService.signOut();
        Toast.show({
          type: 'error',
          text1: 'Akses Ditolak! 🛑',
          text2: 'Akun Anda tidak terdaftar sebagai Pengajar.',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Gagal Login',
        text2: error.message || 'Cek kembali email dan password Anda.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !fullName) {
      Toast.show({ type: 'error', text1: 'Data Kurang', text2: 'Nama, Email, dan Password wajib diisi.' });
      return;
    }

    setIsLoading(true);
    try {
      await authService.signUpWithEmail(email, password, { role: 'pengajar', full_name: fullName });
      Toast.show({
        type: 'success',
        text1: 'Pendaftaran Berhasil! ✨',
        text2: 'Akun Pengajar telah dibuat. Silakan login (sesudah konfirmasi jika aktif).',
      });
      setIsSignupMode(false);
      setPassword('');
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Gagal Mendaftar', text2: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    setIsLoading(true);
    try {
      if (settingsNewPassword) {
        if (!settingsOldPassword) throw new Error("Password lama wajib diisi untuk keamanan.");
        const emailObj = session?.user?.email;
        await authService.signInWithEmail(emailObj, settingsOldPassword);
        await authService.updatePassword(settingsNewPassword);
      }

      if (settingsPhone !== undefined) {
        await authService.updateUserMetadata({ phone: settingsPhone });
      }

      Toast.show({ type: 'success', text1: 'Berhasil 🥳', text2: 'Profil Pengajar telah diperbarui.' });
      setSettingsOldPassword('');
      setSettingsNewPassword('');
      setCurrentTeacherView('dashboard');
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Gagal Update', text2: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isTeacherLoggedIn && session?.user?.id) {
      fetchSchedules();
    }
  }, [isTeacherLoggedIn, session]);

  useEffect(() => {
    if (!schedules || schedules.length === 0) {
      setActiveReminder(null);
      return;
    }

    const evaluateReminder = () => {
      const now = new Date();
      const dayMap = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const currentDay = dayMap[now.getDay()];
      const totalCurrentMins = now.getHours() * 60 + now.getMinutes();

      let foundOngoing = null;
      for (let s of schedules) {
        if (s.day_of_week === currentDay) {
          const timeMatch = s.time_slot.match(/^(\d{2})\.(\d{2})\s-\s(\d{2})\.(\d{2})/);
          if (timeMatch) {
            const startH = parseInt(timeMatch[1], 10);
            const startM = parseInt(timeMatch[2], 10);
            const endH = parseInt(timeMatch[3], 10);
            const endM = parseInt(timeMatch[4], 10);
            const totalStartSlotMins = startH * 60 + startM;
            const totalEndSlotMins = endH * 60 + endM;

            if (totalCurrentMins >= (totalStartSlotMins - 3) && totalCurrentMins < totalEndSlotMins) {
              if (!manuallyFinishedIds.includes(s.id)) {
                foundOngoing = s;
                break;
              }
            }
          }
        }
      }
      setActiveReminder(foundOngoing);
    };

    evaluateReminder();
    const intervalId = setInterval(evaluateReminder, 10000);
    return () => clearInterval(intervalId);
  }, [schedules, manuallyFinishedIds]);

  const fetchSchedules = async () => {
    if (!session?.user?.id) return;
    try {
      const data = await teacherService.fetchTeacherSchedules(session.user.id);
      const now = new Date();
      const dayMap = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const currentDay = dayMap[now.getDay()];
      const currentMins = now.getHours() * 60 + now.getMinutes();

      const cleanedData = await Promise.all(data.map(async (s) => {
        if (s.meeting_link) {
          const timeMatch = s.time_slot.match(/^(\d{2})\.(\d{2})\s-\s(\d{2})\.(\d{2})/);
          if (timeMatch) {
            const endH = parseInt(timeMatch[3], 10);
            const endM = parseInt(timeMatch[4], 10);
            const totalEndMins = endH * 60 + endM;
            const isExpiredToday = (s.day_of_week === currentDay && currentMins >= (totalEndMins + 45));
            const isOldDay = (s.day_of_week !== currentDay);
            if (isExpiredToday || isOldDay) {
              await supabase.from('teacher_schedules').update({ meeting_link: null }).eq('id', s.id);
              return { ...s, meeting_link: null };
            }
          }
        }
        return s;
      }));
      setSchedules(cleanedData);
    } catch (err) { }
  };

  const handleAddSchedule = async () => {
    if (!isTahseenaTeacher && schedules.length >= 1) {
      Toast.show({ type: 'error', text1: 'Sistem Terkunci 🔒', text2: 'Pengajar Mitra hanya dapat mengisi maksimal 1 jadwal per minggu.' });
      return;
    }

    const timeRegex = /^([01]?[0-9]|2[0-3])\.[0-5][0-9]$/;
    if (!timeRegex.test(jadwalStart) || !timeRegex.test(jadwalEnd)) {
      Toast.show({ type: 'error', text1: 'Format Salah', text2: 'Gunakan pemisah titik (.) bukan titik dua (Contoh: 16.30)' });
      return;
    }

    const [startH, startM] = jadwalStart.split('.').map(Number);
    const [endH, endM] = jadwalEnd.split('.').map(Number);
    const totalStartMins = startH * 60 + startM;
    const totalEndMins = endH * 60 + endM;
    const duration = totalEndMins - totalStartMins;

    if (totalStartMins < 0 || totalEndMins > 24 * 60 || totalStartMins >= totalEndMins || duration < 25 || duration > 45) {
      Toast.show({ type: 'error', text1: 'Format Jam Salah', text2: 'Cek kembali jam mulai/selesai (Min 25m, Max 45m).' });
      return;
    }

    const timeSlotFinal = `${jadwalStart} - ${jadwalEnd} WIB`;
    setIsLoading(true);
    try {
      await teacherService.addSchedule({
        teacher_id: session.user.id,
        day_of_week: jadwalDay,
        time_slot: timeSlotFinal,
        teacher_name: session.user.user_metadata?.full_name || 'Pengajar I-Qlab',
        teacher_gender: session.user.user_metadata?.gender || 'Laki-laki'
      });
      Toast.show({ type: 'success', text1: 'Jadwal Aktif!', text2: 'Sesi ketersediaan Anda berhasil ditambahkan.' });
      setJadwalStart('');
      setJadwalEnd('');
      fetchSchedules();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Gagal Menyimpan', text2: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSchedule = async (id) => {
    try {
      await teacherService.deleteSchedule(id);
      Toast.show({ type: 'info', text1: 'Terhapus', text2: 'Jadwal Anda telah ditarik.' });
      fetchSchedules();
    } catch (err) { }
  };

  const handleGenerateLink = async (scheduleId) => {
    setIsLoading(true);
    try {
      const randomId = Math.random().toString(36).substring(2, 12);
      const meetingLink = `https://meet.ffmuc.net/iqlab-${randomId}`;
      await teacherService.updateScheduleLink(scheduleId, meetingLink);
      Toast.show({ type: 'success', text1: 'Link Berhasil Dibuat! 🚀', text2: 'Tautan kelas Anda telah terdaftar.' });
      fetchSchedules();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Gagal Membuat Link', text2: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishMeeting = async (scheduleId) => {
    if (!scheduleId) return true;
    
    setManuallyFinishedIds(prev => [...prev, scheduleId]);
    setIsLoading(true);
    try {
      await teacherService.finishMeeting(scheduleId);
      // fetchSchedules akan mengupdate UI dashboard
      fetchSchedules();
      return true;
    } catch (err) {
      console.error("handleFinishMeeting Error:", err);
      // Tetap kembalikan true agar WebView tertutup meski DB update gagal (daripada stuck)
      return true; 
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await authService.signOut();
    setIsTeacherLoggedIn(false);
    Toast.show({ type: 'info', text1: 'Sesi Berakhir', text2: 'Anda telah keluar.' });
  };

  return {
    currentTeacherView, setCurrentTeacherView,
    settingsPhone, setSettingsPhone,
    settingsOldPassword, setSettingsOldPassword,
    settingsNewPassword, setSettingsNewPassword,
    showOldPassword, setShowOldPassword,
    showNewPassword, setShowNewPassword,
    handleUpdateSettings,
    schedules, isTahseenaTeacher,
    jadwalDay, setJadwalDay,
    jadwalStart, setJadwalStart,
    jadwalEnd, setJadwalEnd,
    activeReminder,
    handleAddSchedule, handleDeleteSchedule, handleGenerateLink,
    handleFinishMeeting,
    isTeacherLoggedIn,
    isSignupMode,
    setIsSignupMode,
    email, setEmail,
    password, setPassword,
    fullName, setFullName,
    isLoading,
    teacherName,
    fadeAnim, slideAnim,
    handleIconTap,
    handleLogin,
    handleSignup,
    handleLogout
  };
};
