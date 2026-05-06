import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as WebBrowser from 'expo-web-browser';
import { StatusBar } from 'expo-status-bar';

import { profileService } from '../services/profileService';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/authService';

const ProfileScreen = ({ navigation, session }) => {
  const { isDarkMode, setIsDarkMode } = useTheme();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    fullName: '',
    whatsappNumber: '',
    age: '',
    gender: '',
    address: ''
  });

  const theme = isDarkMode ? {
    bgFull: '#0f172a',
    topBarBg: '#0f172a',
    textMain: '#f8fafc',
    textSub: '#94a3b8',
    cardBg: '#1e293b',
    cardBorder: '#334155',
    inputBg: '#1e293b',
    border: '#334155',
    iconEmptyBg: '#334155',
    actionIconBgRed: 'rgba(225, 29, 72, 0.2)',
    actionIconBgGreen: 'rgba(22, 163, 74, 0.2)',
    toggleBg: '#1e293b',
    toggleBorder: 'transparent',
    accent: '#38bdf8',
    inputInner: '#0f172a',
  } : {
    bgFull: '#f1f5f9',
    topBarBg: '#f1f5f9',
    textMain: '#0f172a',
    textSub: '#64748b',
    cardBg: '#f8fafc',
    cardBorder: '#e2e8f0',
    inputBg: '#f1f5f9',
    border: '#f1f5f9',
    iconEmptyBg: '#f1f5f9',
    actionIconBgRed: '#fff1f2',
    actionIconBgGreen: '#f0fdf4',
    toggleBg: '#f8fafc',
    toggleBorder: 'transparent',
    accent: '#0284c7',
    inputInner: '#f1f5f9',
  };

  // Load profile from database
  useEffect(() => {
    if (session?.user) {
      loadProfile();
    }
  }, [session]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await profileService.getProfile(session.user.id);
      setProfile(data);
      if (data) {
        setEditData({
          fullName: data.full_name,
          whatsappNumber: data.whatsapp_number,
          age: data.age?.toString(),
          gender: data.gender,
          address: data.address
        });
      }
    } catch (error) {
      console.error('Load Profile Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await profileService.updateProfile(session.user.id, editData);
      Toast.show({ type: 'success', text1: 'Berhasil!', text2: 'Profil Anda telah diperbarui.' });
      setIsEditing(false);
      loadProfile();
    } catch (error) {
      Alert.alert('Error', 'Gagal memperbarui profil.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    try {
      if (session) {
        await authService.signOut();
        navigation.navigate('Home');
      } else {
        await authService.signInWithGoogle();
      }
    } catch (error) {
      console.log('Auth Error:', error.message);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgFull }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: theme.topBarBg }]}>
        <Text style={[styles.headerTitle, { color: theme.textMain }]}>Profil Saya</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {session && (
            <TouchableOpacity 
              style={[styles.editToggleButton, { backgroundColor: isEditing ? '#ef4444' : theme.accent }]} 
              onPress={() => setIsEditing(!isEditing)}
            >
              <Feather name={isEditing ? "x" : "edit-2"} size={18} color="#FFF" />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.darkModeToggle, { backgroundColor: theme.toggleBg, borderColor: theme.toggleBorder }]} 
            onPress={() => setIsDarkMode(!isDarkMode)}
            activeOpacity={0.7}
          >
            <Feather name={isDarkMode ? "sun" : "moon"} size={22} color={isDarkMode ? "#eab308" : "#64748b"} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {session ? (
          <View>
            {/* Header Profile Card */}
            <View style={[styles.mainProfileCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.accent }]}>
                <Text style={styles.avatarText}>
                  {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <Text style={[styles.profileName, { color: theme.textMain }]}>{profile?.full_name || 'Memuat...'}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{profile?.role || 'user_iqlab'}</Text>
              </View>
            </View>

            {/* Info Details Section */}
            <View style={styles.infoSection}>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                 <Text style={[styles.sectionTitle, { color: theme.textMain, marginBottom: 0 }]}>
                   {isEditing ? 'Edit Data Profil' : 'Informasi Detail'}
                 </Text>
                 {isEditing && (
                   <TouchableOpacity style={styles.smallSaveBtn} onPress={handleUpdate} disabled={loading}>
                     {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.smallSaveBtnText}>Simpan</Text>}
                   </TouchableOpacity>
                 )}
               </View>
               
               <View style={[styles.detailCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                 {isEditing ? (
                   <View style={{ padding: 16, gap: 16 }}>
                      <EditInput label="Nama Lengkap" value={editData.fullName} onChange={(t) => setEditData({...editData, fullName: t})} theme={theme} icon="user" />
                      <EditInput label="WhatsApp" value={editData.whatsappNumber} onChange={(t) => setEditData({...editData, whatsappNumber: t})} theme={theme} icon="phone" keyboardType="phone-pad" />
                      <EditInput label="Usia" value={editData.age} onChange={(t) => setEditData({...editData, age: t})} theme={theme} icon="calendar" keyboardType="numeric" />
                      
                      <View>
                        <Text style={[styles.editLabel, { color: theme.textSub }]}>Jenis Kelamin</Text>
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                          {['Ikhwan', 'Akhwat'].map(g => (
                            <TouchableOpacity 
                              key={g} 
                              onPress={() => setEditData({...editData, gender: g})}
                              style={[styles.miniGenderBtn, { backgroundColor: theme.inputInner, borderColor: theme.border }, editData.gender === g && { borderColor: theme.accent, backgroundColor: theme.accent + '20' }]}
                            >
                              <Text style={{ color: editData.gender === g ? theme.accent : theme.textSub, fontWeight: '700' }}>{g}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      <EditInput label="Alamat" value={editData.address} onChange={(t) => setEditData({...editData, address: t})} theme={theme} icon="map-pin" multiline />
                   </View>
                 ) : (
                   <>
                     <DetailItem icon="mail" label="Email" value={session.user.email} theme={theme} />
                     <DetailItem icon="phone" label="WhatsApp" value={profile?.whatsapp_number || '-'} theme={theme} />
                     <DetailItem icon="user" label="Jenis Kelamin" value={profile?.gender || '-'} theme={theme} />
                     <DetailItem icon="calendar" label="Usia" value={profile?.age ? `${profile.age} Tahun` : '-'} theme={theme} />
                     <DetailItem icon="map-pin" label="Alamat" value={profile?.address || '-'} theme={theme} last />
                   </>
                 )}
               </View>
            </View>

          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={[styles.guestIconBox, { backgroundColor: theme.iconEmptyBg }]}>
              <Feather name="user-x" size={40} color={theme.textSub} />
            </View>
            <Text style={[styles.guestTitle, { color: theme.textMain }]}>Belum Masuk Akun</Text>
            <Text style={[styles.modalDesc, { color: theme.textSub }]}>Silakan daftar atau masuk untuk menyimpan progres belajar kamu dan mengakses fitur premium.</Text>
          </View>
        )}

        {/* Menu Aksi Tambahan */}
        <View style={styles.actionMenuContainer}>
          <Text style={[styles.sectionTitle, { color: theme.textMain }]}>Akses Cepat</Text>
          
          <TouchableOpacity 
            style={[styles.actionItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]} 
            activeOpacity={0.7} 
            onPress={handleAuth}
          >
            <View style={[styles.actionIconBox, { backgroundColor: session ? theme.actionIconBgRed : theme.actionIconBgGreen }]}>
              <Feather name={session ? "log-out" : "user-plus"} size={18} color={session ? "#e11d48" : "#16a34a"} />
            </View>
            <Text style={[styles.actionText, { color: theme.textMain }, session && { color: '#e11d48' }]}>
              {session ? "Keluar Akun" : "Daftar / Masuk Akun"}
            </Text>
            <Feather name="chevron-right" size={18} color={theme.textSub} />
          </TouchableOpacity>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

// Komponen Input untuk Mode Edit
const EditInput = ({ label, value, onChange, theme, icon, keyboardType = 'default', multiline = false }) => (
  <View>
    <Text style={[styles.editLabel, { color: theme.textSub }]}>{label}</Text>
    <View style={[styles.editInputWrapper, { backgroundColor: theme.inputInner, borderColor: theme.border }]}>
      <Feather name={icon} size={16} color={theme.accent} style={{ marginRight: 12 }} />
      <TextInput
        style={[styles.editInput, { color: theme.textMain }]}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholderTextColor={theme.textSub}
      />
    </View>
  </View>
);

// Komponen Bantuan untuk Item Detail
const DetailItem = ({ icon, label, value, theme, last }) => (
  <View style={[styles.detailItem, !last && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
    <View style={[styles.detailIconBox, { backgroundColor: theme.bgFull }]}>
      <Feather name={icon} size={18} color={theme.accent} />
    </View>
    <View style={styles.detailContent}>
      <Text style={[styles.detailLabel, { color: theme.textSub }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: theme.textMain }]}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  editToggleButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkModeToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 80,
  },
  mainProfileCard: {
    padding: 30,
    borderRadius: 28,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  roleText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    marginLeft: 4,
  },
  smallSaveBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  smallSaveBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  detailCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  detailIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  editLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 1,
  },
  editInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 2,
  },
  editInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  miniGenderBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  guestIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  guestTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
  },
  modalDesc: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  actionMenuContainer: {
    marginTop: 40,
    marginBottom: 20,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ProfileScreen;
