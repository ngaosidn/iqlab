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
import AdminHubModal from '../components/home/AdminHubModal';

const SLIDER_DATA = [
  {
    id: '1',
    title: 'Pembaruan I-QLab v2.0',
    desc: 'Nikmati antarmuka baru yang lebih elegan dan super cepat!',
    image: 'https://images.unsplash.com/photo-1609599006353-e629aaab31f5?q=80&w=800&auto=format&fit=crop',
    icon: 'zap'
  },
  {
    id: '2',
    title: 'Kajian Rutin Mingguan',
    desc: 'Setiap Jumat Ba\'da Maghrib. Jangan sampai terlewat!',
    image: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?q=80&w=800&auto=format&fit=crop',
    icon: 'users'
  },
  {
    id: '3',
    title: 'Fitur Quran Interaktif',
    desc: 'Baca, dengar, dan pelajari makna ayat dengan lebih mudah.',
    image: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?q=80&w=800&auto=format&fit=crop',
    icon: 'book-open'
  }
];

export default function HomeScreen({ navigation, session }) {
  const insets = useSafeAreaInsets();

  const onNavigate = (screen) => {
    if (screen === 'interactive') navigation.navigate('Interactive');
    else if (screen === 'admin') navigation.navigate('Admin');
    else if (screen === 'pengajar') navigation.navigate('Pengajar');
    else if (screen === 'profile') navigation.navigate('Profile');
    else navigation.navigate('Home');
  };

  const {
    showAdminHub,
    setShowAdminHub,
    checkAuth,
    dotOpacity,
  } = useHome(session, onNavigate);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        
        {/* MODERN GEOMETRIC BACKGROUND */}
        <LinearGradient 
          colors={['#ffffff', '#f8fafc']} 
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

          {/* SLIDER INFORMASI TERBARU */}
          <View style={styles.sliderContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={Dimensions.get('window').width - 40 + 14} 
              decelerationRate="fast"
              contentContainerStyle={styles.sliderContent}
            >
              {SLIDER_DATA.map((item, index) => {
                const isLast = index === SLIDER_DATA.length - 1;
                return (
                  <TouchableOpacity 
                    key={item.id} 
                    activeOpacity={0.9} 
                    style={[styles.sliderCard, { marginRight: isLast ? 0 : 14 }]}
                  >
                    {/* Gambar Background High-Res */}
                    <Image 
                      source={{ uri: item.image }} 
                      style={StyleSheet.absoluteFill} 
                      contentFit="cover" 
                      transition={500} 
                    />
                    
                    {/* Gradient Overlay Gelap agar teks tetap terbaca jelas */}
                    <LinearGradient 
                      colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)']} 
                      style={StyleSheet.absoluteFill} 
                    />
                    
                    <View style={styles.sliderCardContent}>
                      <View style={[styles.sliderIconBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                        <Feather name={item.icon} size={22} color="#ffffff" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 16 }}>
                        <View style={[styles.sliderBadge, { backgroundColor: '#4f46e5' }]}>
                          <Text style={styles.sliderBadgeText}>Terbaru</Text>
                        </View>
                        <Text style={styles.sliderTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.sliderDesc} numberOfLines={2}>{item.desc}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* PEMBATAS ELEGAN (Fading Gradient Divider) */}
          <View style={styles.sectionDividerContainer}>
            <LinearGradient 
              colors={['rgba(79, 70, 229, 0)', 'rgba(79, 70, 229, 0.25)', 'rgba(79, 70, 229, 0)']} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 0 }} 
              style={styles.sectionDivider} 
            />
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

            </View>
          </View>

        </ScrollView>



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
    backgroundColor: '#f8fafc',
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
  sliderContainer: {
    marginHorizontal: -20, // Tarik keluar dari padding container agar bisa swipe off-screen
    marginBottom: 24,
  },
  sliderContent: {
    paddingHorizontal: 20,
  },
  sliderCard: {
    width: Dimensions.get('window').width - 40,
    height: 140,
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'center',
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  sliderCardDeco: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  sliderCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sliderBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  sliderBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sliderTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  sliderDesc: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 18,
  },
  sectionDividerContainer: {
    marginBottom: 24,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionDivider: {
    height: 2,
    width: '70%',
    borderRadius: 1,
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

});
