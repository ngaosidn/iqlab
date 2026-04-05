import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, Text, View, Platform, Animated, Dimensions, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, ActivityIndicator, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { supabase } from '../lib/supabase';

import { usePengajar } from '../hooks/usePengajar';
import JitsiWebView from '../components/JitsiWebView';

export default function PengajarScreen({ onBack, session }) {
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [meetingUrl, setMeetingUrl] = useState('');

  const {
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
    handleLogout,
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
    handleAddSchedule, handleDeleteSchedule, handleGenerateLink
  } = usePengajar(session);

  const handleEnterClass = async (url) => {
    try {
      setMeetingUrl(url);
      setIsInMeeting(true);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Gagal Membuka', text2: 'Link tidak valid.' });
    }
  };

  const LoginView = () => (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.loginContainer}>
        <TouchableOpacity onPress={onBack} style={styles.backBtnAbsolute}>
           <Feather name="arrow-left" size={24} color="#0d9488" />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleIconTap} activeOpacity={0.8} style={styles.loginIconCircle}>
           <FontAwesome5 name="chalkboard-teacher" size={32} color="white" />
        </TouchableOpacity>
        <Text style={styles.loginTitle}>{isSignupMode ? 'Daftar Pengajar' : 'Hub Pengajar'}</Text>
        <Text style={styles.loginSubtitle}>{isSignupMode ? 'Buat akun guru baru untuk mengakses fitur edukasi I-Qlab.' : 'Masukkan email dan kata sandi pengajar Anda.'}</Text>

        <View style={styles.inputContainer}>
           {isSignupMode && (
             <>
                <Text style={styles.inputLabel}>Nama Lengkap Ustadz/ah</Text>
                <View style={styles.inputBox}>
                  <Feather name="user" size={18} color="#94a3b8" style={{marginRight: 12}} />
                  <TextInput style={styles.input} placeholder="Contoh: Ustadz Ahmad" placeholderTextColor="#94a3b8" value={fullName} onChangeText={setFullName} />
                </View>
             </>
           )}

           <Text style={styles.inputLabel}>Email Pengajar</Text>
           <View style={styles.inputBox}>
              <Feather name="mail" size={18} color="#94a3b8" style={{marginRight: 12}} />
              <TextInput style={styles.input} placeholder="ustadz@iqlab.com" placeholderTextColor="#94a3b8" value={email} onChangeText={setEmail} autoCapitalize="none" />
           </View>

           <Text style={styles.inputLabel}>Password</Text>
           <View style={styles.inputBox}>
              <Feather name="lock" size={18} color="#94a3b8" style={{marginRight: 12}} />
              <TextInput style={styles.input} placeholder="Masukkan Kata Sandi" placeholderTextColor="#94a3b8" secureTextEntry={true} value={password} onChangeText={setPassword} />
           </View>
        </View>

        <TouchableOpacity 
          style={[styles.loginSubmitBtn, isLoading && { opacity: 0.7 }]} 
          onPress={isSignupMode ? handleSignup : handleLogin}
          disabled={isLoading}
        >
           {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.loginSubmitText}>{isSignupMode ? 'Buat Akun Sekarang' : 'Masuk Hub Pengajar'}</Text>}
        </TouchableOpacity>

        {isSignupMode && (
          <TouchableOpacity onPress={() => setIsSignupMode(false)} style={{marginTop: 20}}>
            <Text style={{color: '#64748b', fontSize: 13}}>Batal dan Kembali Login</Text>
          </TouchableOpacity>
        )}

        {!isSignupMode && (
          <View style={styles.oauthDivider}>
             <View style={styles.dividerLine} />
             <Text style={styles.dividerText}>Gunakan Akun Google</Text>
             <View style={styles.dividerLine} />
          </View>
        )}

        {!isSignupMode && (
          <Text style={styles.oauthHint}>Jika Anda Pengajar yang menggunakan login Google, silakan login di halaman utama terlebih dahulu, maka portal ini akan terbuka otomatis.</Text>
        )}

        <Text style={styles.hintText}>Otentikasi aman via Supabase 🛡️</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );



  const JadwalView = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentTeacherView('dashboard')} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#0d9488" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MANAJEMEN JADWAL</Text>
        <View style={styles.profileBadge}>
          <Feather name="calendar" size={16} color="white" />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20, paddingTop: 20 }}>
        
        <View style={{ backgroundColor: isTahseenaTeacher ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)', padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: isTahseenaTeacher ? 'rgba(59, 130, 246, 0.3)' : 'rgba(245, 158, 11, 0.3)', flexDirection: 'row', alignItems: 'center' }}>
           <FontAwesome5 name={isTahseenaTeacher ? "shield-alt" : "info-circle"} size={20} color={isTahseenaTeacher ? "#3b82f6" : "#f59e0b"} style={{ marginRight: 16 }} />
           <View style={{ flex: 1 }}>
              <Text style={{ color: isTahseenaTeacher ? "#3b82f6" : "#f59e0b", fontWeight: 'bold', fontSize: 13, marginBottom: 4 }}>
                 {isTahseenaTeacher ? "Hak Istimewa Tahseena" : "Batas Kuota Mitra"}
              </Text>
              <Text style={{ color: isTahseenaTeacher ? "#60a5fa" : "#fbbf24", fontSize: 12, lineHeight: 18 }}>
                 {isTahseenaTeacher 
                   ? "Sebagai Pengajar Pusat, Anda dapat membuka kuota waktu mengajar sebanyak-banyaknya kapanpun." 
                   : "Sistem hanya mengizinkan pengajar dari lembaga mitra mengisi maksimal 1 jadwal (1x waktu) per minggu."}
              </Text>
           </View>
        </View>

        <Text style={styles.sectionTitle}>Tambah Jadwal Baru</Text>
        
        <View style={styles.inputContainer}>
           <Text style={styles.inputLabel}>Hari Mengajar</Text>
           <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(day => (
                 <TouchableOpacity key={day} onPress={() => setJadwalDay(day)} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: jadwalDay === day ? '#0d9488' : '#1e293b', borderWidth: 1, borderColor: jadwalDay === day ? '#0f766e' : '#334155' }}>
                    <Text style={{ color: jadwalDay === day ? 'white' : '#94a3b8', fontSize: 12, fontWeight: jadwalDay === day ? 'bold' : 'normal' }}>{day}</Text>
                 </TouchableOpacity>
              ))}
           </View>

           <Text style={styles.inputLabel}>Slot Jam Mengajar</Text>
           <Text style={{ color: '#94a3b8', fontSize: 11, marginBottom: 8, marginTop: -6 }}>* Buka jadwal kapanpun (Sistem 24 Jam). Durasi 25 - 45 menit maksimal.</Text>
           <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <View style={[styles.inputBox, { flex: 1, paddingHorizontal: 12 }]}>
                 <Feather name="clock" size={16} color="#64748b" style={{marginRight: 8}} />
                 <TextInput style={[styles.input, { flex: 1, fontSize: 14 }]} placeholder="Mulai (ex: 15.30)" placeholderTextColor="#475569" value={jadwalStart} onChangeText={setJadwalStart} keyboardType="numeric" maxLength={5} />
              </View>
              <View style={{ justifyContent: 'center' }}><Text style={{ color: '#64748b', fontWeight: 'bold' }}>-</Text></View>
              <View style={[styles.inputBox, { flex: 1, paddingHorizontal: 12 }]}>
                 <Feather name="clock" size={16} color="#64748b" style={{marginRight: 8}} />
                 <TextInput style={[styles.input, { flex: 1, fontSize: 14 }]} placeholder="Selesai (ex: 16.15)" placeholderTextColor="#475569" value={jadwalEnd} onChangeText={setJadwalEnd} keyboardType="numeric" maxLength={5} />
              </View>
           </View>
        </View>

        <TouchableOpacity 
          style={[styles.loginSubmitBtn, isLoading && { opacity: 0.7 }]} 
          onPress={handleAddSchedule}
          disabled={isLoading}
        >
           {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.loginSubmitText}>Buka Sesi Mengajar</Text>}
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Jadwal Anda Saat Ini ({schedules.length})</Text>
        
        {schedules.length === 0 ? (
           <Text style={{ color: '#64748b', textAlign: 'center', marginTop: 12 }}>Belum ada jadwal ketersediaan.</Text>
        ) : (
           schedules.map((s, idx) => (
              <View key={idx} style={{ backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                 <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(13, 148, 136, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                       <Feather name="clock" size={20} color="#0d9488" />
                    </View>
                    <View>
                       <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16, marginBottom: 2 }}>Hari {s.day_of_week}</Text>
                       <Text style={{ color: '#94a3b8', fontSize: 13 }}>Jam {s.time_slot}</Text>
                    </View>
                 </View>
                 <TouchableOpacity onPress={() => handleDeleteSchedule(s.id)} style={{ padding: 10, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 20 }}>
                    <Feather name="trash-2" size={18} color="#ef4444" />
                 </TouchableOpacity>
              </View>
           ))
        )}

      </ScrollView>
    </View>
  );

  const SettingsView = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentTeacherView('dashboard')} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#0d9488" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PENGATURAN AKUN</Text>
        <View style={styles.profileBadge}>
          <Feather name="settings" size={16} color="white" />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20, paddingTop: 20 }}>
        
        <Text style={styles.sectionTitle}>Ubah Profil & Kontak</Text>
        <View style={styles.inputContainer}>
           <Text style={styles.inputLabel}>Nomor WhatsApp</Text>
           <View style={styles.inputBox}>
              <Feather name="phone" size={18} color="#94a3b8" style={{marginRight: 12}} />
              <TextInput style={styles.input} placeholder="08xxxxxxxxxx" placeholderTextColor="#94a3b8" value={settingsPhone} onChangeText={setSettingsPhone} keyboardType="phone-pad" />
           </View>
        </View>

        <Text style={[styles.sectionTitle, {marginTop: 10}]}>Ubah Kata Sandi (Opsional)</Text>
        <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: 12, borderRadius: 12, marginBottom: 16 }}>
           <Text style={{ color: '#d97706', fontSize: 12, lineHeight: 18 }}>Biarkan kolom password tetap kosong jika Anda tidak ingin merubahnya.</Text>
        </View>

        <View style={styles.inputContainer}>
           <Text style={styles.inputLabel}>Password Lama</Text>
           <View style={styles.inputBox}>
              <Feather name="key" size={18} color="#94a3b8" style={{marginRight: 12}} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Masukkan Password Saat Ini" placeholderTextColor="#94a3b8" secureTextEntry={!showOldPassword} value={settingsOldPassword} onChangeText={setSettingsOldPassword} />
              <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)}>
                 <Feather name={showOldPassword ? 'eye-off' : 'eye'} size={18} color="#94a3b8" />
              </TouchableOpacity>
           </View>

           <Text style={styles.inputLabel}>Password Baru</Text>
           <View style={styles.inputBox}>
              <Feather name="lock" size={18} color="#94a3b8" style={{marginRight: 12}} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Masukkan Password Baru" placeholderTextColor="#94a3b8" secureTextEntry={!showNewPassword} value={settingsNewPassword} onChangeText={setSettingsNewPassword} />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                 <Feather name={showNewPassword ? 'eye-off' : 'eye'} size={18} color="#94a3b8" />
              </TouchableOpacity>
           </View>
        </View>

        <TouchableOpacity 
          style={[styles.loginSubmitBtn, isLoading && { opacity: 0.7 }]} 
          onPress={handleUpdateSettings}
          disabled={isLoading}
        >
           {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.loginSubmitText}>Simpan Perubahan</Text>}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );

  const DashboardView = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#0d9488" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HUB PENGAJAR</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.profileBadge}>
          <Feather name="log-out" size={16} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20 }}>
          {/* Welcome Teacher */}
          <View style={styles.teacherCard}>
            <LinearGradient colors={['#0d9488', '#14b8a6']} style={StyleSheet.absoluteFill} borderRadius={24} />
            <View style={styles.cardContent}>
              <Text style={styles.cardSmall}>Selamat Mengajar,</Text>
              <Text style={styles.cardName}>{teacherName} 🙏</Text>
              <View style={styles.statusPill}>
                <View style={styles.dot} />
                <Text style={styles.statusText}>Sesi Aktif: 12 Murid Online</Text>
              </View>
            </View>
          </View>

          {/* Dynamic Reminder System */}
          {activeReminder && (
             <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.4)', borderWidth: 1, borderRadius: 20, padding: 18, marginBottom: 24, marginTop: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                   <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(239, 68, 68, 0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <Feather name="video" size={16} color="#ef4444" />
                   </View>
                   <Text style={{ color: '#ef4444', fontWeight: 'bold', fontSize: 16, flex: 1 }}>Sesi Mengajar Dimulai!</Text>
                </View>
                <Text style={{ color: '#fca5a5', fontSize: 13, marginBottom: 16, lineHeight: 20 }}>
                   Jadwal <Text style={{ fontWeight: 'bold' }}>{activeReminder.day_of_week}</Text> jam <Text style={{ fontWeight: 'bold' }}>{activeReminder.time_slot}</Text> Anda telah aktif. Silakan buat tautan kelas untuk murid Anda.
                </Text>
                <TouchableOpacity 
                   onPress={() => activeReminder.meeting_link ? handleEnterClass(activeReminder.meeting_link) : handleGenerateLink(activeReminder.id)}
                   style={{ backgroundColor: activeReminder.meeting_link ? '#2563eb' : '#ef4444', paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                   {isLoading ? (
                     <ActivityIndicator color="white" />
                   ) : (
                     <>
                        <Feather name={activeReminder.meeting_link ? "log-in" : "link-2"} size={16} color="white" style={{ marginRight: 8 }} />
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>{activeReminder.meeting_link ? 'Silakan Masuk 🔥' : 'Buat Link Class'}</Text>
                     </>
                   )}
                </TouchableOpacity>
             </View>
          )}

          {/* Quick Tasks */}
          <Text style={styles.sectionTitle}>Tugas Hari Ini</Text>
          <View style={styles.taskRow}>
            <TouchableOpacity style={styles.taskCard}>
              <View style={[styles.taskIcon, { backgroundColor: '#f0fdfa' }]}><Feather name="edit-3" size={20} color="#0d9488" /></View>
              <Text style={styles.taskCount}>5</Text>
              <Text style={styles.taskLabel}>Setoran Baru</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.taskCard}>
              <View style={[styles.taskIcon, { backgroundColor: '#eff6ff' }]}><Feather name="message-circle" size={20} color="#2563eb" /></View>
              <Text style={styles.taskCount}>3</Text>
              <Text style={styles.taskLabel}>Tanya Jawab</Text>
            </TouchableOpacity>
          </View>



          {/* Class Management */}
          <Text style={styles.sectionTitle}>Manajemen Kelas & Jadwal</Text>

          <TouchableOpacity style={[styles.classItem, { marginBottom: 12 }]} onPress={() => setCurrentTeacherView('jadwal')}>
            <View style={[styles.classIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}><Feather name="calendar" size={24} color="#f59e0b" /></View>
            <View style={styles.classInfo}>
              <Text style={styles.className}>Jadwal Mengajar</Text>
              <Text style={styles.classMembers}>Atur Waktu Ketersediaan</Text>
            </View>
            <View style={styles.classAction}><Feather name="chevron-right" size={20} color="#94a3b8" /></View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.classItem}>

            <View style={styles.classIcon}><MaterialIcons name="groups" size={24} color="#0d9488" /></View>
            <View style={styles.classInfo}>
              <Text style={styles.className}>Kelas Tahsin Dasar</Text>
              <Text style={styles.classMembers}>24 Murid Terdaftar</Text>
            </View>
            <View style={styles.classAction}><Feather name="chevron-right" size={20} color="#94a3b8" /></View>
          </TouchableOpacity>

          {/* Pengaturan Akun */}
          <Text style={styles.sectionTitle}>Pengaturan</Text>
          <TouchableOpacity style={styles.classItem} onPress={() => setCurrentTeacherView('settings')}>
            <View style={[styles.classIcon, { backgroundColor: '#f1f5f9' }]}><Feather name="settings" size={24} color="#64748b" /></View>
            <View style={styles.classInfo}>
              <Text style={styles.className}>Pengaturan Akun</Text>
              <Text style={styles.classMembers}>Ubah Kata Sandi & Profil</Text>
            </View>
            <View style={styles.classAction}><Feather name="chevron-right" size={20} color="#94a3b8" /></View>
          </TouchableOpacity>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      {isInMeeting ? (
        <JitsiWebView 
          url={meetingUrl} 
          onLeave={() => setIsInMeeting(false)} 
        />
      ) : (
        <Animated.View style={[styles.mainWrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
           {isTeacherLoggedIn ? (currentTeacherView === 'dashboard' ? DashboardView() : currentTeacherView === 'jadwal' ? JadwalView() : SettingsView()) : LoginView()}
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  mainWrapper: { flex: 1 },
  
  // Login Styles
  loginContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingTop: 40 },
  backBtnAbsolute: { position: 'absolute', top: 0, left: 24, width: 44, height: 44, borderRadius: 12, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  loginIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#0d9488', justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 5, shadowColor: '#0d9488', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  loginTitle: { color: '#0f172a', fontSize: 26, fontWeight: 'bold', marginBottom: 8 },
  loginSubtitle: { color: '#64748b', fontSize: 14, textAlign: 'center', marginBottom: 30 },
  inputContainer: { width: '100%', marginBottom: 30 },
  inputLabel: { color: '#334155', fontSize: 14, fontWeight: 'bold', marginBottom: 10, marginLeft: 4 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 },
  input: { flex: 1, color: '#0f172a', fontSize: 16 },
  loginSubmitBtn: { width: '100%', height: 56, backgroundColor: '#0d9488', borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#0d9488', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5 },
  loginSubmitText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  hintText: { color: '#cbd5e1', fontSize: 11, marginTop: 20 },

  // OAuth Divider
  oauthDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, width: '100%', opacity: 0.5 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#cbd5e1' },
  dividerText: { color: '#94a3b8', fontSize: 10, marginHorizontal: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  oauthHint: { color: '#94a3b8', fontSize: 11, textAlign: 'center', fontStyle: 'italic', paddingHorizontal: 10 },

  // Header Dashboard
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 'bold', color: '#0d9488', letterSpacing: 2 },
  profileBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0d9488', justifyContent: 'center', alignItems: 'center' },
  
  teacherCard: { padding: 24, marginTop: 20, height: 160, justifyContent: 'center', elevation: 5, shadowColor: '#0d9488', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 },
  cardContent: { zIndex: 10 },
  cardSmall: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 4 },
  cardName: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  statusPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', marginTop: 15 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80', marginRight: 8 },
  statusText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  
  sectionTitle: { color: '#334155', fontSize: 16, fontWeight: 'bold', marginTop: 24, marginBottom: 16 },
  taskRow: { flexDirection: 'row', gap: 15 },
  taskCard: { flex: 1, backgroundColor: '#ffffff', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  taskIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  taskCount: { color: '#0f172a', fontSize: 24, fontWeight: 'bold' },
  taskLabel: { color: '#64748b', fontSize: 12, fontWeight: '500', marginTop: 4 },
  
  classItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  classIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#f0fdfa', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  classInfo: { flex: 1 },
  className: { color: '#0f172a', fontSize: 15, fontWeight: 'bold' },
  classMembers: { color: '#64748b', fontSize: 12, marginTop: 2 },
  classAction: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
});
