import { useHome } from '../hooks/useHome';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Platform, Animated, Dimensions, ScrollView, TouchableOpacity, LayoutAnimation } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import HomeHeader from '../components/HomeHeader';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../lib/supabase';

// Import New Modular Components
import ProfileModal from '../components/home/ProfileModal';
import AdminHubModal from '../components/home/AdminHubModal';

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

      {/* Header Card Component */}
      <HomeHeader 
        translateX={translateX}
        onLogoLongPress={() => setShowAdminHub(true)}
      />

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
        <Text style={styles.footerCopyright}>© 2026 - Powered by Tahseena</Text>
      </View>


      {/* MODAL LENGKAPI PROFIL - MOVED TO COMPONENT */}
      <ProfileModal 
        visible={showProfileModal}
        session={session}
        age={age}
        setAge={setAge}
        gender={gender}
        setGender={setGender}
        saveProfileData={saveProfileData}
      />

        <AdminHubModal 
          visible={showAdminHub}
          onClose={() => setShowAdminHub(false)}
          onNavigate={onNavigate}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9', // Warna body background sedikit abu-abu muda
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
});
