import { useHome } from '../hooks/useHome';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Platform, Animated, Dimensions, ScrollView, TouchableOpacity, LayoutAnimation } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';

// Import New Modular Components
import ProfileModal from '../components/home/ProfileModal';
import AdminHubModal from '../components/home/AdminHubModal';

WebBrowser.maybeCompleteAuthSession();

export default function HomeScreen({ navigation, session }) {
  const insets = useSafeAreaInsets();

  const onNavigate = (screen) => {
    if (screen === 'interactive') navigation.navigate('Interactive');
    else if (screen === 'admin') navigation.navigate('Admin');
    else if (screen === 'pengajar') navigation.navigate('Pengajar');
    else navigation.navigate('Home');
  };

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
  } = useHome(session, onNavigate);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        
        {/* MODERN GEOMETRIC BACKGROUND */}
        <LinearGradient 
          colors={['#f8fafc', '#ffffff']} 
          style={StyleSheet.absoluteFill} 
        />
        
        {/* Subtle Dotted Pattern Overlay */}
        <View style={styles.gridOverlay}>
          {/* Kita simulasikan titik-titik dengan loop kecil atau grid style */}
          {[...Array(10)].map((_, i) => (
            <View key={i} style={styles.gridRowLine} />
          ))}
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10 }]}
        >
          
          {/* HEADER SECTION - CLEAN MINIMALIST */}
          <View style={styles.topBarSection}>
            <View>
              <Text style={styles.greetingText}>Ahlan wa Sahlan! 👋</Text>
              <Text style={styles.appNameText}>Mau belajar apa hari ini?</Text>
            </View>
          </View>

          {/* MAIN BENTO GRID - COMPACT */}
          <View style={styles.bentoGrid}>
            
            {/* 1. Interactive Quran - WIDE CARD (Matching Doa-doa Pilihan) */}
            <TouchableOpacity 
              style={styles.cardWide} 
              activeOpacity={0.9} 
              onPress={() => onNavigate && onNavigate('interactive')}
            >
              <LinearGradient 
                colors={['#1e40af', '#3b82f6']} 
                style={StyleSheet.absoluteFill} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 0 }} 
              />
              <View style={styles.cardRowContent}>
                <View style={styles.iconBoxMain}>
                  <Feather name="book-open" size={20} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitleLarge}>Interactive Quran</Text>
                  <Text style={styles.cardDescLight}>Baca, Tadabbur & Dengar</Text>
                </View>
                <Feather name="chevron-right" size={20} color="white" />
              </View>
            </TouchableOpacity>

            <View style={styles.gridRow}>
              {/* 2. Al Ma'tsurat */}
              <TouchableOpacity 
                style={styles.cardHalf} 
                activeOpacity={0.9}
                onPress={() => checkAuth(() => console.log('Al Matsurat'))}
              >
                <LinearGradient colors={['#ea580c', '#fb923c']} style={StyleSheet.absoluteFill} />
                <View style={styles.iconBoxSmall}>
                  <Feather name="sun" size={20} color="white" />
                </View>
                <Text style={styles.cardTitleMedium}>Al Ma'tsurat</Text>
                <Text style={styles.cardDescSmall}>Zikir Pagi & Petang</Text>
              </TouchableOpacity>

              {/* 3. Hadist Harian */}
              <TouchableOpacity 
                style={styles.cardHalf} 
                activeOpacity={0.9}
                onPress={() => checkAuth(() => console.log('Hadist'))}
              >
                <LinearGradient colors={['#059669', '#34d399']} style={StyleSheet.absoluteFill} />
                <View style={styles.iconBoxSmall}>
                  <Feather name="feather" size={20} color="white" />
                </View>
                <Text style={styles.cardTitleMedium}>Hadist</Text>
                <Text style={styles.cardDescSmall}>Inspirasi setiap hari</Text>
              </TouchableOpacity>
            </View>

            {/* 4. Doa-doa Pilihan */}
            <TouchableOpacity 
              style={styles.cardWide} 
              activeOpacity={0.9}
              onPress={() => checkAuth(() => console.log('Doa'))}
            >
              <LinearGradient 
                colors={['#7c3aed', '#a78bfa']} 
                style={StyleSheet.absoluteFill} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 0 }} 
              />
              <View style={styles.cardRowContent}>
                <View style={styles.iconBoxMain}>
                  <FontAwesome5 name="hands" size={18} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitleLarge}>Doa-doa Pilihan</Text>
                  <Text style={styles.cardDescLight}>Kumpulan doa mustajab</Text>
                </View>
                <Feather name="chevron-right" size={20} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          {/* SECONDARY ACTIONS - MODERN LIST STYLE */}
          <View style={styles.otherSection}>
            <Text style={styles.subSectionTitle}>Pengaturan & Info</Text>
            <View style={styles.otherMenuContainer}>
              
              <TouchableOpacity style={styles.otherMenuItem} activeOpacity={0.6}>
                <View style={[styles.otherIconBox, { backgroundColor: '#eef2ff' }]}>
                  <Feather name="info" size={18} color="#6366f1" />
                </View>
                <Text style={styles.otherMenuText}>Tentang I-QLab</Text>
                <Feather name="chevron-right" size={16} color="#cbd5e1" />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.otherMenuItem} activeOpacity={0.6}>
                <View style={[styles.otherIconBox, { backgroundColor: '#fdf2f8' }]}>
                  <FontAwesome5 name="hand-holding-heart" size={16} color="#db2777" />
                </View>
                <Text style={styles.otherMenuText}>Infaq & Dukungan</Text>
                <Feather name="chevron-right" size={16} color="#cbd5e1" />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.otherMenuItem} activeOpacity={0.6} onPress={handleAuth}>
                <View style={[styles.otherIconBox, { backgroundColor: session ? '#fff1f2' : '#f0fdf4' }]}>
                  <Feather name={session ? "log-out" : "user-plus"} size={18} color={session ? "#e11d48" : "#16a34a"} />
                </View>
                <Text style={[styles.otherMenuText, session && { color: '#e11d48' }]}>
                  {session ? "Keluar Akun" : "Daftar / Masuk Akun"}
                </Text>
                <Feather name="chevron-right" size={16} color="#cbd5e1" />
              </TouchableOpacity>

            </View>
          </View>

        </ScrollView>

        {/* FLOATING BOTTOM NAVIGATION */}
        <View style={styles.navWrapper}>
          <View style={styles.navBarFloating}>
            
            <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
              <View style={styles.raisedIconContainer}>
                <LinearGradient 
                  colors={['#4f46e5', '#3b82f6']} 
                  style={styles.raisedIcon}
                >
                  <Feather name="home" size={22} color="white" />
                </LinearGradient>
              </View>
              <Text style={[styles.navText, { color: '#4f46e5', marginTop: 25 }]}>Beranda</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.navItem} 
              activeOpacity={0.7}
              onPress={() => WebBrowser.openBrowserAsync('https://tahseena.com')}
            >
              <Feather name="globe" size={20} color="#94a3b8" />
              <Text style={styles.navText}>Website</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.navItem} 
              activeOpacity={0.7}
              onPress={() => setShowProfileModal(true)}
            >
              <Feather name="user" size={20} color="#94a3b8" />
              <Text style={styles.navText}>Profil</Text>
            </TouchableOpacity>
            
          </View>
        </View>

        <ProfileModal
          visible={showProfileModal}
          session={session}
          age={age} setAge={setAge}
          gender={gender} setGender={setGender}
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
    backgroundColor: '#ffffff',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    paddingTop: 50,
  },
  gridRowLine: {
    height: 1,
    width: '150%',
    backgroundColor: '#3b82f6',
    opacity: 0.02,
    marginBottom: 80,
    transform: [{ rotate: '-15deg' }, { translateX: -50 }],
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 130, 
  },
  topBarSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1e293b',
    letterSpacing: -1,
  },
  appNameText: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  bentoGrid: {
    gap: 14,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 14,
  },
  cardHalf: {
    flex: 1,
    height: 140,
    borderRadius: 28,
    padding: 18,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  cardWide: {
    height: 90,
    borderRadius: 24,
    padding: 18,
    overflow: 'hidden',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  iconBoxMain: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxSmall: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 18,
    left: 18,
  },
  cardTitleLarge: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  cardTitleMedium: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  cardDescLight: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  cardDescSmall: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 3,
  },
  cardRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    zIndex: 1,
  },
  otherSection: {
    marginTop: 24,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 14,
    paddingLeft: 4,
  },
  otherMenuContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  otherMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 14,
  },
  otherIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otherMenuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 12,
  },
  navWrapper: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  navBarFloating: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    width: '100%',
    height: 70,
    borderRadius: 35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 25,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  raisedIconContainer: {
    position: 'absolute',
    top: -35, // Elevate it!
    alignItems: 'center',
    justifyContent: 'center',
  },
  raisedIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  navText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
  },
});
