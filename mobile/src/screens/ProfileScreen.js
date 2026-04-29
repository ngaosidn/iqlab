import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as WebBrowser from 'expo-web-browser';
import { StatusBar } from 'expo-status-bar';

import { authService } from '../services/authService';

const ProfileScreen = ({ navigation, session }) => {
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');

  // Load existing data if available
  useEffect(() => {
    if (session?.user?.user_metadata) {
      if (session.user.user_metadata.age) setAge(session.user.user_metadata.age.toString());
      if (session.user.user_metadata.gender) setGender(session.user.user_metadata.gender);
    }
  }, [session]);

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

  const saveProfileData = async () => {
    if (!age || !gender) {
      Toast.show({
        type: 'error',
        text1: 'Data Belum Lengkap',
        text2: 'Tolong pilih Usia dan Jenis Kelamin dulu ya.',
        position: 'bottom',
      });
      return;
    }

    try {
      await authService.updateUserMetadata({ age, gender });
      Toast.show({ type: 'success', text1: 'Profil Tersimpan!', text2: 'Terima kasih, data kamu sudah masuk.', position: 'bottom' });
      navigation.goBack();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Gagal Menyimpan', text2: error.message, position: 'bottom' });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil Pengguna</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {session ? (
          <View>
            <Text style={styles.modalDesc}>Sesuaikan data profilmu agar pengalaman belajar lebih maksimal!</Text>

            {/* Informasi Akun Terhubung */}
            {session?.user && (
              <View style={styles.googleInfoContainer}>
                <View style={styles.infoRow}>
                  <Feather name="user" size={16} color="#64748b" />
                  <Text style={styles.infoText}>{session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Nama Tidak Tersedia'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Feather name="mail" size={16} color="#64748b" />
                  <Text style={styles.infoText}>{session.user.email || 'Email Tidak Tersedia'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Feather name="phone" size={16} color="#64748b" />
                  <Text style={styles.infoText}>{session.user.phone || session.user.user_metadata?.phone || 'No. HP Tidak Terdaftar'}</Text>
                </View>
              </View>
            )}

            <Text style={styles.label}>Berapa Usia Kamu?</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: 25"
              keyboardType="number-pad"
              value={age}
              onChangeText={setAge}
            />

            <Text style={styles.label}>Jenis Kelamin</Text>
            <View style={styles.genderRow}>
              <TouchableOpacity
                style={[styles.genderBtn, gender === 'Laki-laki' && styles.genderBtnActive]}
                onPress={() => setGender('Laki-laki')}
              >
                <FontAwesome5 name="male" size={24} color={gender === 'Laki-laki' ? 'white' : '#64748b'} />
                <Text style={[styles.genderText, gender === 'Laki-laki' && styles.genderTextActive]}>Laki-laki</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.genderBtn, gender === 'Perempuan' && styles.genderBtnActive]}
                onPress={() => setGender('Perempuan')}
              >
                <FontAwesome5 name="female" size={24} color={gender === 'Perempuan' ? 'white' : '#64748b'} />
                <Text style={[styles.genderText, gender === 'Perempuan' && styles.genderTextActive]}>Perempuan</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={saveProfileData}>
              <Text style={styles.saveBtnText}>Simpan Data</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.guestIconBox}>
              <Feather name="user-x" size={40} color="#94a3b8" />
            </View>
            <Text style={styles.guestTitle}>Belum Masuk Akun</Text>
            <Text style={styles.modalDesc}>Silakan daftar atau masuk untuk menyimpan progres belajar kamu dan mengakses fitur premium.</Text>
          </View>
        )}

        {/* Menu Aksi Tambahan */}
        <View style={styles.actionMenuContainer}>
          <Text style={styles.sectionTitle}>Akses Cepat</Text>
          
          <TouchableOpacity style={styles.actionItem} activeOpacity={0.7} onPress={handleAuth}>
            <View style={[styles.actionIconBox, { backgroundColor: session ? '#fff1f2' : '#f0fdf4' }]}>
              <Feather name={session ? "log-out" : "user-plus"} size={18} color={session ? "#e11d48" : "#16a34a"} />
            </View>
            <Text style={[styles.actionText, session && { color: '#e11d48' }]}>
              {session ? "Keluar Akun" : "Daftar / Masuk Akun"}
            </Text>
            <Feather name="chevron-right" size={18} color="#cbd5e1" />
          </TouchableOpacity>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalDesc: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 22,
    textAlign: 'center',
  },
  googleInfoContainer: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 15,
    color: '#334155',
    fontWeight: '600',
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 16,
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '600',
    marginBottom: 16,
  },
  genderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  genderBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  genderBtnActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
  },
  genderText: {
    marginTop: 10,
    fontWeight: 'bold',
    color: '#64748b',
  },
  genderTextActive: {
    color: 'white',
  },
  saveBtn: {
    backgroundColor: '#10b981',
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 32,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  guestIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  actionMenuContainer: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    color: '#1e293b',
  },
});

export default ProfileScreen;
