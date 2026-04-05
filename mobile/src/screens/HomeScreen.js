import { useHome } from '../hooks/useHome';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Platform, Animated, Dimensions, ScrollView, TouchableOpacity, Modal, TextInput, Alert, LayoutAnimation } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Svg, { Defs, Pattern, Circle, Rect } from 'react-native-svg';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../lib/supabase';

// Harus dipanggil sekali di tingkat global (untuk support Web dan handle penutupan tab)
WebBrowser.maybeCompleteAuthSession();
export default function HomeScreen({ onNavigate, session }) {
  const insets = useSafeAreaInsets();
  
  const {
    showProfileModal,
    setShowProfileModal,
    showAdminHub,
    setShowAdminHub,
    age, setAge,
    gender, setGender,
    checkAuth,
    handleAuth,
    saveProfileData,
    dotOpacity,
    translateX
  } = useHome(session, onNavigate);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={styles.container}>

      {/* Header Card */}
      <View style={styles.headerWrapper}>
        <LinearGradient
          colors={['#1d4ed8', '#1e3a8a']} // Gradient biru dari terang ke gelap
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Pattern Titik-Titik (Dotted Overlay) */}
          <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }]}>
            <Svg width="100%" height="100%">
              <Defs>
                <Pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                  <Circle cx="2" cy="2" r="1.5" fill="rgba(255,255,255,0.15)" />
                </Pattern>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#dots)" />
            </Svg>
          </View>

          {/* Efek Cahaya Mengkilap (Shimmer) */}
          <Animated.View style={[
            StyleSheet.absoluteFill,
            {
              width: 150,
              height: '180%',
              top: '-40%',
              transform: [
                { translateX: translateX },
                { rotate: '30deg' } // Kemiringan cahaya
              ]
            }
          ]}>
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1 }}
            />
          </Animated.View>

          {/* Logo (Tanpa Kotak) - Hidden Trigger */}
          <TouchableOpacity 
            activeOpacity={0.8} 
            onLongPress={() => {
              setShowAdminHub(true);
            }}
            delayLongPress={3000}
          >
            <Image
              source={require('../../assets/logo.svg')}
              style={styles.logo}
              contentFit="contain"
            />
          </TouchableOpacity>

          {/* Texts */}
          <Text style={styles.titleText}>Quran Friendly, Tajwid Easy ✨</Text>
          <Text style={styles.subtitleText}>BACA, TADABBUR DAN TAJWID INTERACTIVE 🚀</Text>
        </LinearGradient>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* MENU CARD */}
        <View style={styles.cardContainer}>
          {/* Main Card Content */}
          <View style={styles.menuCard}>
            <Text style={styles.helloText}>Ahlan Bikum! 👋</Text>
            <Text style={styles.subtitleMenuText}>PILIH MENU UTAMA ANDA :</Text>

            {/* Menu Buttons */}
            <TouchableOpacity style={styles.menuBtn} activeOpacity={0.8} onPress={() => onNavigate && onNavigate('interactive')}>
              <LinearGradient colors={['#4f46e5', '#3b82f6']} style={StyleSheet.absoluteFill} borderRadius={16} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              <View style={styles.menuIconBox}><Feather name="book-open" size={20} color="white" /></View>
              <Text style={styles.menuBtnText}>Interactive Quran</Text>
              <Feather name="chevron-right" size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuBtn} 
              activeOpacity={0.8} 
              onPress={() => checkAuth(() => console.log('Tajwid Interactive'))}
            >
              <LinearGradient colors={['#b91c1c', '#d946ef', '#9333ea']} locations={[0, 0.1, 1]} style={StyleSheet.absoluteFill} borderRadius={16} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              <View style={styles.menuIconBox}><FontAwesome5 name="graduation-cap" size={16} color="white" /></View>
              <Text style={styles.menuBtnText}>Tajwid Interactive</Text>
              <Feather name="chevron-right" size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuBtn} 
              activeOpacity={0.8}
              onPress={() => checkAuth(() => console.log('Hadist'))}
            >
              <LinearGradient colors={['#059669', '#10b981']} style={StyleSheet.absoluteFill} borderRadius={16} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              <View style={styles.menuIconBox}><Feather name="book" size={20} color="white" /></View>
              <Text style={styles.menuBtnText}>Hadist</Text>
              <Feather name="chevron-right" size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuBtn} 
              activeOpacity={0.8}
              onPress={() => checkAuth(() => console.log('Fiqih'))}
            >
              <LinearGradient colors={['#d97706', '#ea580c']} style={StyleSheet.absoluteFill} borderRadius={16} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              <View style={styles.menuIconBox}><FontAwesome5 name="building" size={18} color="white" /></View>
              <Text style={styles.menuBtnText}>Fiqih 4 Madzhab</Text>
              <Feather name="chevron-right" size={20} color="white" />
            </TouchableOpacity>


            {/* Small Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtnYellow}>
                <Feather name="heart" size={16} color="#d97706" />
                <Text style={styles.actionBtnTextYellow}>Gratitude</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtnPink}>
                <FontAwesome5 name="coins" size={14} color="#be123c" />
                <Text style={styles.actionBtnTextPink}>Support Kami</Text>
              </TouchableOpacity>
            </View>

            {/* Google Login / Logout Button */}
            <TouchableOpacity style={styles.googleBtn} onPress={handleAuth}>
              {session ? (
                <>
                  <Feather name="log-out" size={18} color="#ef4444" />
                  <Text style={[styles.googleBtnText, { color: '#ef4444' }]}>Logout</Text>
                </>
              ) : (
                <>
                  <FontAwesome5 name="google" size={18} color="#ea4335" />
                  <Text style={styles.googleBtnText}>Login via Google</Text>
                </>
              )}
            </TouchableOpacity>

          </View>

          {/* Floating Avatar User (Blue Circle on left edge) */}
          <View style={styles.floatingAvatar}>
            <FontAwesome5 name="user-alt" size={18} color="white" />
          </View>
        </View>

      </ScrollView>

      {/* BOTTOM FOOTER */}
      <View style={[styles.bottomFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.statusPill}>
          <Animated.View style={[styles.statusDot, { opacity: dotOpacity }]} />
          <Text style={styles.statusText}>SIAP UNTUK BELAJAR</Text>
        </View>
        <Text style={styles.footerCopyright}>© 2026 - by Tahseena</Text>
      </View>


      {/* MODAL LENGKAPI PROFIL */}
      <Modal visible={showProfileModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Lengkapi Profil Kamu</Text>
            <Text style={styles.modalDesc}>Sebelum lanjut, kasih tau kita dulu ya biar pembelajarannya sesuai dengan kamu!</Text>

            {/* Informasi Akun Google Terhubung */}
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
                  <Text style={styles.infoText}>{session.user.phone || session.user.user_metadata?.phone || 'No. HP Tidak Terdaftar di Google'}</Text>
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
        </View>
      </Modal>

      {/* MODAL INTERNAL ACCESS HUB (HIDDEN GESTURE) */}
      <Modal
        visible={showAdminHub}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAdminHub(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{flex: 1}} activeOpacity={1} onPress={() => setShowAdminHub(false)} />
          <View style={styles.adminModalContent}>
             <View style={styles.modalDragIndicator} />
             
             <View style={styles.adminModalHeader}>
                <View style={styles.adminIconCircle}>
                   <Feather name="shield" size={24} color="#fbbf24" />
                </View>
                <Text style={styles.adminModalTitle}>Internal Access Hub</Text>
                <Text style={styles.adminModalSubtitle}>Halaman akses terbatas untuk tim I-Qlab.</Text>
             </View>

             <View style={styles.adminHubGrid}>
                <TouchableOpacity 
                  style={styles.adminHubCard} 
                  onPress={() => {
                    setShowAdminHub(false);
                    setTimeout(() => onNavigate('admin'), 300);
                  }}
                >
                   <LinearGradient colors={['#1e293b', '#0f172a']} style={StyleSheet.absoluteFill} borderRadius={20} />
                   <View style={styles.adminHubCardIcon}><Feather name="lock" size={20} color="#fbbf24" /></View>
                   <Text style={styles.adminHubCardText}>Admin Area</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.adminHubCard} 
                  onPress={() => {
                    setShowAdminHub(false);
                    setTimeout(() => onNavigate('pengajar'), 300);
                  }}
                >
                   <LinearGradient colors={['#0f766e', '#134e4a']} style={StyleSheet.absoluteFill} borderRadius={20} />
                   <View style={styles.adminHubCardIcon}><Feather name="book-open" size={20} color="white" /></View>
                   <Text style={styles.adminHubCardText}>Pengajar Hub</Text>
                </TouchableOpacity>
             </View>

             <TouchableOpacity 
               style={styles.closeAdminBtn} 
               onPress={() => setShowAdminHub(false)}
             >
                <Text style={styles.closeAdminBtnText}>Kembali</Text>
             </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9', // Warna body background sedikit abu-abu muda
  },
  headerWrapper: {
    // Hilangkan padding samping agar full layar
  },
  headerGradient: {
    padding: 24,
    paddingTop: Platform.OS === 'android' ? 50 : 30, // Geser padding atas ke dalam gradient
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden', // Pastikan konten di dalamnya (titik-titik) tidak keluar batas
    // Efek modern glow (optional/dapat disesuaikan)
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  logo: {
    width: 140,
    height: 48,
    marginBottom: 20, // Tambah jarak bawah sedikit karena box hilang
  },
  titleText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitleText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 32, // Tambah jarak atas biar tidak mepet
  },
  cardContainer: {
    position: 'relative',
  },
  menuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    borderLeftWidth: 5,
    borderLeftColor: '#3b82f6',
    // Shadow ringan
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  helloText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitleMenuText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 20,
  },
  menuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  menuIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuBtnText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
  },
  actionBtnYellow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: '48%',
    justifyContent: 'center',
  },
  actionBtnTextYellow: {
    color: '#d97706',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  actionBtnPink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fce7f3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: '48%',
    justifyContent: 'center',
  },
  actionBtnTextPink: {
    color: '#be123c',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 14,
    borderRadius: 16,
  },
  googleBtnText: {
    marginLeft: 10,
    color: '#334155',
    fontSize: 17,
    fontWeight: 'bold',
  },
  floatingAvatar: {
    position: 'absolute',
    left: -15, // Supaya menonjol keluar dari sisi kiri card
    bottom: 40,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563eb', // Lingkaran biru
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#f1f5f9', // Pinggiran abu sesuai body
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  bottomFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10, // Shadow di atas
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
    marginRight: 6,
  },
  statusText: {
    color: '#16a34a',
    fontSize: 13,
    fontWeight: 'bold',
  },
  footerCopyright: {
    color: '#475569',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  googleInfoContainer: {
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 15,
    color: '#334155',
    fontWeight: '600',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f1f5f9',
    padding: 14,
    borderRadius: 12,
    fontSize: 18,
    color: '#0f172a',
  },
  genderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  genderBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 16,
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
    marginTop: 8,
    fontWeight: 'bold',
    color: '#64748b',
  },
  genderTextActive: {
    color: 'white',
  },
  saveBtn: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  adminModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    width: '100%',
  },
  adminModalHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  adminIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  adminModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  adminModalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  adminHubGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 30,
  },
  adminHubCard: {
    flex: 1,
    height: 120,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  adminHubCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  adminHubCardText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeAdminBtn: {
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  closeAdminBtnText: {
    color: '#64748b',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
