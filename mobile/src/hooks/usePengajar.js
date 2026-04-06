import { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import Toast from 'react-native-toast-message';
import { supabase } from '../lib/supabase';

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

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // AUTO-LOGIN LOGIC: Jika pengajar sudah login Google di Homescreen dan punya role pengajar
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;

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
        await supabase.auth.signOut();
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'pengajar',
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

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
      const emailObj = session?.user?.email;
      if (!emailObj) throw new Error("Gagal mengidentifikasi sesi Anda.");

      if (settingsNewPassword) {
        if (!settingsOldPassword) throw new Error("Password lama wajib diisi untuk keamanan.");
        
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: emailObj,
          password: settingsOldPassword
        });

        if (signInError) throw new Error("Password lama Anda salah!");

        const { error: passUpdateError } = await supabase.auth.updateUser({
           password: settingsNewPassword
        });
        
        if (passUpdateError) throw passUpdateError;
      }

      if (settingsPhone !== undefined) {
         const { error: metaError } = await supabase.auth.updateUser({
            data: { phone: settingsPhone }
         });
         if (metaError) throw metaError;
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
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();
        const totalCurrentMins = currentHour * 60 + currentMin;

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

                 const startReminderMins = totalStartSlotMins - 3;
                 const endReminderMins = totalEndSlotMins - 5;

                 if (totalCurrentMins >= startReminderMins && totalCurrentMins < endReminderMins) {
                    foundOngoing = s;
                    break;
                 }
              }
           }
        }
        setActiveReminder(foundOngoing);
     };

     evaluateReminder();
     const intervalId = setInterval(evaluateReminder, 10000);
     return () => clearInterval(intervalId);
  }, [schedules]);

  const fetchSchedules = async () => {
    if (!session?.user?.id) return;
    try {
      const { data, error } = await supabase.from('teacher_schedules').select('*').eq('teacher_id', session.user.id);
      if (!error && data) {
         // Auto-Cleanup Link: Hapus link jika kelas sudah selesai > 45 menit atau beda hari
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
                     // Bersihkan di database secara diam-diam
                     await supabase.from('teacher_schedules').update({ meeting_link: null }).eq('id', s.id);
                     return { ...s, meeting_link: null }; // Update state lokal
                  }
               }
            }
            return s;
         }));

         setSchedules(cleanedData);
      }
    } catch (err) {}
  };

  const handleAddSchedule = async () => {
    if (!isTahseenaTeacher && schedules.length >= 1) {
      Toast.show({ type: 'error', text1: 'Sistem Terkunci 🔒', text2: 'Pengajar Mitra hanya dapat mengisi maksimal 1 jadwal per minggu.' });
      return;
    }
    
    // Validasi Waktu
    const timeRegex = /^([01]?[0-9]|2[0-3])\.[0-5][0-9]$/;
    if (!timeRegex.test(jadwalStart) || !timeRegex.test(jadwalEnd)) {
      Toast.show({ type: 'error', text1: 'Format Salah', text2: 'Gunakan pemisah titik (.) bukan titik dua (Contoh: 16.30)' });
      return;
    }

    const [startH, startM] = jadwalStart.split('.').map(Number);
    const [endH, endM] = jadwalEnd.split('.').map(Number);
    const totalStartMins = startH * 60 + startM;
    const totalEndMins = endH * 60 + endM;

    // Batas pengajaran: 00:00 - 23:59 (Bebas 24 Jam)
    if (totalStartMins < 0 || totalEndMins > 24 * 60 || totalStartMins >= totalEndMins) {
      Toast.show({ type: 'error', text1: 'Format Jam Salah', text2: 'Jadwal waktu (Mulai & Selesai) harus logis dan di antara 00.00 hingga 23.59.' });
      return;
    }

    // Durasi terbatas: 25 - 45 menit
    const duration = totalEndMins - totalStartMins;
    if (duration < 25 || duration > 45) {
      Toast.show({ type: 'error', text1: 'Durasi Ditolak', text2: 'Durasi sesi mengajar minimal 25 menit dan maksimal 45 menit.' });
      return;
    }

    const timeSlotFinal = `${jadwalStart} - ${jadwalEnd} WIB`;

    // Cegah duplikat
    const isDuplicate = schedules.find(s => s.day_of_week === jadwalDay && s.time_slot === timeSlotFinal);
    if (isDuplicate) {
      Toast.show({ type: 'info', text1: 'Jadwal Bentrok', text2: 'Anda sudah mendaftarkan jadwal di waktu tersebut.' });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from('teacher_schedules').insert({
        teacher_id: session.user.id,
        day_of_week: jadwalDay,
        time_slot: timeSlotFinal,
        teacher_name: session.user.user_metadata?.full_name || 'Pengajar I-Qlab',
        teacher_gender: session.user.user_metadata?.gender || 'Laki-laki'
      });
      if (error) throw error;
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
      const { error } = await supabase.from('teacher_schedules').delete().eq('id', id);
      if (!error) {
         Toast.show({ type: 'info', text1: 'Terhapus', text2: 'Jadwal Anda telah ditarik.' });
         fetchSchedules();
      }
    } catch (err) {}
  };

  const handleGenerateLink = async (scheduleId) => {
    setIsLoading(true);
    try {
      const randomId = Math.random().toString(36).substring(2, 12);
      // Menggunakan free community server (meet.ffmuc.net) yang TIDAK wajib login Google/FB
      const meetingLink = `https://meet.ffmuc.net/iqlab-${randomId}`;

      const { data, error } = await supabase
        .from('teacher_schedules')
        .update({ meeting_link: meetingLink })
        .eq('id', scheduleId)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Gagal menyimpan ke database (Supabase RLS menolak akses form mu).");

      Toast.show({
        type: 'success',
        text1: 'Link Berhasil Dibuat! 🚀',
        text2: 'Tautan kelas Anda telah terdaftar dan siap digunakan.',
      });
      fetchSchedules();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Gagal Membuat Link', text2: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishMeeting = async (scheduleId) => {
    setIsLoading(true);
    try {
      // 0. Kirim Sinyal BROADCAST (Cepat & Real-time) ke semua murid di ruangan
      const channel = supabase.channel(`room_${scheduleId}`);
      await channel.subscribe(async (status) => {
         if (status === 'SUBSCRIBED') {
            await channel.send({
               type: 'broadcast',
               event: 'FORCE_END_MEETING',
               payload: { msg: 'Teacher ended session' }
            });
            supabase.removeChannel(channel);
         }
      });

      // 1. Bersihkan link di tabel teacher_schedules
      const { error: scheduleError } = await supabase
        .from('teacher_schedules')
        .update({ meeting_link: null, current_students_count: 0 })
        .eq('id', scheduleId);
      
      if (scheduleError) throw scheduleError;

      // 2. Bersihkan seluruh antrian murid di kelas tersebut
      const { error: participantError } = await supabase
        .from('active_class_participants')
        .delete()
        .eq('schedule_id', scheduleId);

      if (participantError) throw participantError;
      
      Toast.show({ 
        type: 'success', 
        text1: 'Sesi Selesai 🏁', 
        text2: 'Kelas telah resmi ditutup dan semua murid dikeluarkan.' 
      });
      
      fetchSchedules(); 
      return true;
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Gagal Menutup Sesi', text2: err.message });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsTeacherLoggedIn(false);
    Toast.show({ type: 'info', text1: 'Sesi Berakhir', text2: 'Anda telah keluar dari Hub Pengajar.' });
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
    email,
    setEmail,
    password,
    setPassword,
    fullName,
    setFullName,
    isLoading,
    teacherName,
    fadeAnim,
    slideAnim,
    handleIconTap,
    handleLogin,
    handleSignup,
    handleLogout
  };
};
