import { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import Toast from 'react-native-toast-message';
import { supabase } from '../lib/supabase';
import { authService } from '../services/authService';
import { adminService } from '../services/adminService';

export const useAdmin = (session) => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [totalMurid, setTotalMurid] = useState('...');
  const [totalPengajar, setTotalPengajar] = useState('...');
  
  const [currentAdminView, setCurrentAdminView] = useState('dashboard');
  const [staffRole, setStaffRole] = useState('pengajar');
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffAge, setStaffAge] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffGender, setStaffGender] = useState('Laki-laki');
  const [staffLembaga, setStaffLembaga] = useState('');
  const [isTahseena, setIsTahseena] = useState(true);
  const [searchLembagaText, setSearchLembagaText] = useState('');
  const [showLembagaList, setShowLembagaList] = useState(false);
  const [filterRole, setFilterRole] = useState('semua');
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [staffOldPassword, setStaffOldPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (session?.user?.user_metadata?.role === 'admin' && !hasShownWelcome) {
      setIsAdminLoggedIn(true);
      setHasShownWelcome(true);
      Toast.show({
        type: 'success',
        text1: 'Akses Otomatis! 🔓',
        text2: `Selamat datang kembali, ${session.user.user_metadata.full_name || 'Admin'}.`,
      });
    }
  }, [session, hasShownWelcome]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [isAdminLoggedIn, isSignupMode]);

  const fetchDashboardStats = async () => {
    try {
      const stats = await adminService.getDashboardStats();
      setTotalMurid(stats.totalMurid);
      setTotalPengajar(stats.totalPengajar);
    } catch (error) {
      setTotalMurid('-');
      setTotalPengajar('-');
    }
  };

  useEffect(() => {
    if (isAdminLoggedIn) fetchDashboardStats();
  }, [isAdminLoggedIn]);

  const [manageTab, setManageTab] = useState('form');
  const [staffData, setStaffData] = useState([]);
  const [isFetchingStaff, setIsFetchingStaff] = useState(false);

  const fetchStaffData = async () => {
    setIsFetchingStaff(true);
    try {
      const staff = await adminService.getAllStaff();
      setStaffData(staff);
    } catch (error) { }
    setIsFetchingStaff(false);
  };

  useEffect(() => {
    if (currentAdminView === 'usermanagement' && manageTab === 'list') {
      fetchStaffData();
    }
  }, [currentAdminView, manageTab]);

  const handleDeleteStaff = async (uid) => {
      try {
        await adminService.deleteUser(uid);
        Toast.show({ type: 'success', text1: 'Sistem Terhubung', text2: 'Akun berhasil dihapus secara sistematis.' });
        fetchStaffData();
        fetchDashboardStats();
      } catch (err) {
        Toast.show({ type: 'error', text1: 'Gagal Hapus', text2: err.message });
      }
  };

  const handleIconTap = () => {
    const newCount = tapCount + 1;
    if (newCount >= 3) {
      setIsSignupMode(!isSignupMode);
      setTapCount(0);
      Toast.show({ type: 'info', text1: 'Mode Signup Aktif', text2: 'Silakan gunakan form ini untuk mendaftarkan Staff baru.' });
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
      if (userRole === 'admin') {
        setIsAdminLoggedIn(true);
        Toast.show({
          type: 'success',
          text1: 'Login Berhasil! 🔓',
          text2: `Selamat datang Admin, ${data.user.user_metadata?.full_name || 'Staff'}.`,
        });
      } else {
        await authService.signOut();
        Toast.show({
          type: 'error',
          text1: 'Akses Ditolak! 🛑',
          text2: 'Akun Anda tidak terdaftar sebagai Administrator.',
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
      Toast.show({ type: 'error', text1: 'Data Pelengkap', text2: 'Wajib mengisi Nama, Email, dan Password.' });
      return;
    }

    setIsLoading(true);
    try {
      await authService.signUpWithEmail(email, password, { role: 'admin', full_name: fullName });
      Toast.show({
        type: 'success',
        text1: 'Pendaftaran Berhasil! 📝',
        text2: 'Akun Admin baru telah dibuat dan metadata role telah ditambahkan.',
      });
      setIsSignupMode(false);
      setPassword('');
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Gagal Daftar', text2: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await authService.signOut();
    setIsAdminLoggedIn(false);
    Toast.show({ type: 'info', text1: 'Sesi Berakhir', text2: 'Anda telah logout dari Admin Panel.' });
  };

  const handleSaveStaff = async () => {
    const finalLembaga = isTahseena ? 'Tahseena' : staffLembaga;
    if (!staffName || !staffAge || !staffPhone || (staffRole === 'pengajar' && !isTahseena && !staffLembaga) || (!editingStaffId && (!staffEmail || !staffPassword))) {
      Toast.show({ type: 'error', text1: 'Data Tidak Lengkap', text2: 'Mohon isi semua kolom yang diperlukan.' });
      return;
    }
    setIsLoading(true);
    try {
      if (editingStaffId) {
         await adminService.updateUserMeta(editingStaffId, { full_name: staffName, age: staffAge, phone: staffPhone, gender: staffGender, role: staffRole, lembaga: finalLembaga });
         
         if (staffOldPassword && staffPassword) {
            const passSuccess = await adminService.updateStaffPassword(editingStaffId, staffOldPassword, staffPassword);
            if (!passSuccess) {
                Toast.show({ type: 'error', text1: 'Gagal Ubah Password', text2: 'Password lama tidak cocok atau sistem eror.' });
                setIsLoading(false);
                return;
            }
         }
         Toast.show({ type: 'success', text1: 'Update Sukses! ✏️', text2: staffOldPassword ? `Data staf & password berhasil diperbarui.` : `Data staf berhasil diperbarui.` });
      } else {
         const currentSession = await authService.getSession();
         await authService.signUpWithEmail(staffEmail, staffPassword, { role: staffRole, full_name: staffName, age: staffAge, phone: staffPhone, gender: staffGender, lembaga: finalLembaga });

         if (currentSession) {
            await supabase.auth.setSession({ access_token: currentSession.access_token, refresh_token: currentSession.refresh_token });
         }

         Toast.show({ type: 'success', text1: 'Akun Berhasil Dibuat! 👥', text2: `Akun ${staffRole} baru sukses didaftarkan.` });
      }
      
      setEditingStaffId(null);
      setStaffName('');
      setStaffEmail('');
      setStaffPassword('');
      setStaffAge('');
      setStaffPhone('');
      setStaffLembaga('');
      setIsTahseena(true);
      
      fetchDashboardStats();
      fetchStaffData();
      setManageTab('list');
    } catch (error) {
       Toast.show({ type: 'error', text1: 'Gagal Menyimpan', text2: error.message });
    } finally {
       setIsLoading(false);
    }
  };

  const initiateEditStaff = (staff) => {
     setEditingStaffId(staff.id);
     setStaffRole(staff.role || 'pengajar');
     setStaffName(staff.full_name || '');
     setStaffEmail(staff.email || '');
     setStaffAge(staff.age?.toString() || '');
     setStaffPhone(staff.phone || '');
     setStaffGender(staff.gender || 'Laki-laki');
     if (staff.role === 'admin') {
       setIsTahseena(true);
       setStaffLembaga('');
     } else if (staff.lembaga === 'Tahseena') {
       setIsTahseena(true);
       setStaffLembaga('');
     } else {
       setIsTahseena(false);
       setStaffLembaga(staff.lembaga || '');
       setSearchLembagaText(staff.lembaga || '');
     }
     setStaffPassword('');
     setStaffOldPassword('');
     setManageTab('form');
  };

  return {
    isAdminLoggedIn,
    isSignupMode,
    setIsSignupMode,
    email, setEmail,
    password, setPassword,
    fullName, setFullName,
    isLoading,
    tapCount,
    totalMurid, totalPengajar,
    currentAdminView, setCurrentAdminView,
    staffRole, setStaffRole,
    staffName, setStaffName,
    staffEmail, setStaffEmail,
    staffPassword, setStaffPassword,
    staffAge, setStaffAge,
    staffPhone, setStaffPhone,
    staffGender, setStaffGender,
    staffLembaga, setStaffLembaga,
    isTahseena, setIsTahseena,
    searchLembagaText, setSearchLembagaText,
    showLembagaList, setShowLembagaList,
    filterRole, setFilterRole,
    editingStaffId, setEditingStaffId,
    staffOldPassword, setStaffOldPassword,
    showOldPassword, setShowOldPassword,
    showPassword, setShowPassword,
    fadeAnim, slideAnim,
    manageTab, setManageTab,
    staffData, isFetchingStaff,
    handleDeleteStaff,
    handleIconTap,
    handleLogin,
    handleSignup,
    handleLogout,
    handleSaveStaff,
    initiateEditStaff
  };
};
