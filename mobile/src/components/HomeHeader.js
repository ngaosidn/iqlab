import React from 'react';
import { StyleSheet, Text, View, Animated, Platform, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Svg, { Defs, Pattern, Circle, Rect } from 'react-native-svg';

const HomeHeader = ({ 
  translateX, 
  onLogoLongPress, 
  title = "Quran Friendly, Tajwid Easy ✨", 
  subtitle = "BACA, TADABBUR DAN TAJWID INTERACTIVE 🚀",
  rightContent,
  showLogo = true
}) => {
  return (
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

        {/* Top Row: Logo & Right Content */}
        <View style={styles.headerTopRow}>
          {showLogo && (
            <TouchableOpacity 
              activeOpacity={0.8} 
              onLongPress={onLogoLongPress}
              delayLongPress={3000}
            >
              <Image
                source={require('../../assets/logo.svg')}
                style={styles.logo}
                contentFit="contain"
              />
            </TouchableOpacity>
          )}
          {rightContent && (
            <View style={styles.rightContentContainer}>
              {rightContent}
            </View>
          )}
        </View>

        {/* Texts */}
        <View style={styles.textContainer}>
          <Text style={styles.titleText}>{title}</Text>
          <Text style={styles.subtitleText}>{subtitle}</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    // Hilangkan padding samping agar full layar
  },
  headerGradient: {
    padding: 24,
    paddingTop: Platform.OS === 'android' ? 50 : 30, // Geser padding atas ke dalam gradient
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden', // Pastikan konten di dalamnya (titik-titik) tidak keluar batas
    // Efek modern glow
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rightContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textContainer: {
    marginTop: 24,
  },
  logo: {
    width: 140,
    height: 48,
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
});

export default HomeHeader;
