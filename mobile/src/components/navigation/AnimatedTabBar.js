import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const TabIcon = ({ isFocused, iconName, label }) => {
  const { isDarkMode } = useTheme();
  const animatedY = useRef(new Animated.Value(isFocused ? -26 : 0)).current;
  const textOpacity = useRef(new Animated.Value(isFocused ? 0 : 1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(animatedY, {
        toValue: isFocused ? -26 : 0, 
        useNativeDriver: true,
        bounciness: 12,
      }),
      Animated.timing(textOpacity, {
        toValue: isFocused ? 0 : 1,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start();
  }, [isFocused]);

  return (
    <View style={styles.navItemInner}>
      <Animated.View style={[styles.iconContainer, { transform: [{ translateY: animatedY }] }]}>
        <Feather name={iconName} size={22} color={isFocused ? "white" : (isDarkMode ? "#94a3b8" : "#64748b")} />
      </Animated.View>
      <Animated.Text style={[styles.navText, { opacity: textOpacity, color: isDarkMode ? '#94a3b8' : '#64748b' }]}>
        {label}
      </Animated.Text>
    </View>
  );
};

const AnimatedTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useTheme();
  const safeBottom = insets.bottom > 0 ? insets.bottom : 10;
  
  // Inisialisasi posisi awal agar tidak ada glitch
  const tabWidth = width / 3; // Karena sekarang full width (docked ke edge layar)
  const initialCenter = state.index * tabWidth + (tabWidth / 2);
  const activeTabCenter = useRef(new Animated.Value(initialCenter)).current;

  useEffect(() => {
    const tabCenter = state.index * tabWidth + (tabWidth / 2);
    Animated.spring(activeTabCenter, {
      toValue: tabCenter,
      useNativeDriver: true,
      bounciness: 12, // Pantulan halus yang elegan
    }).start();
  }, [state.index, tabWidth]);

  // Ukuran untuk SVG tunggal tanpa jahitan
  const svgWidth = width * 2 + 140; 
  const dipCenter = width + 70;

  // Path tunggal untuk keseluruhan bar navigasi (sisi kiri rata, cekungan tengah, sisi kanan rata)
  const pathData = `
    M 0 0 
    L ${dipCenter - 70} 0 
    C ${dipCenter - 50} 0, ${dipCenter - 30} 40, ${dipCenter} 40 
    C ${dipCenter + 30} 40, ${dipCenter + 50} 0, ${dipCenter + 70} 0 
    L ${svgWidth} 0 
    L ${svgWidth} 200 
    L 0 200 Z
  `;

  // Agar tengah SVG sejajar dengan activeTabCenter
  const bgTranslateX = activeTabCenter.interpolate({
    inputRange: [0, 1000],
    outputRange: [-(width + 70), -(width + 70) + 1000]
  });

  // Lebar kontainer elemen melayang adalah 140
  // Posisi tengahnya adalah 70.
  // Geser sebesar: activeTabCenter - 70
  const elementsTranslateX = activeTabCenter.interpolate({
    inputRange: [0, 1000],
    outputRange: [-70, -70 + 1000]
  });

  return (
    <View style={[styles.navWrapper, { height: 70 + safeBottom }]}>
      
      {/* 1. LAYER BACKGROUND SOLID (Satu Path Mulus) */}
      <View style={styles.navBarClipped}>
        <Animated.View style={[styles.slidingBg, { transform: [{ translateX: bgTranslateX }] }]}>
          <Svg width={svgWidth} height={70 + safeBottom}>
            {/* Solid Shape dengan garis tepi biru bercahaya */}
            <Path 
              d={pathData} 
              fill={isDarkMode ? "#1e293b" : "#ffffff"} 
              stroke={isDarkMode ? "rgba(99, 102, 241, 0.3)" : "rgba(79, 70, 229, 0.4)"} 
              strokeWidth={1.5} 
            />
          </Svg>
        </Animated.View>
      </View>

      {/* 2. LAYER FOREGROUND (Lingkaran Melayang & Ikon) */}
      <View style={styles.navBarOverlay}>
        
        {/* Lingkaran dan Titik Melayang */}
        <Animated.View style={[styles.slidingElements, { transform: [{ translateX: elementsTranslateX }] }]}>
          <View style={styles.floatingCircle} />
          <View style={styles.bottomDot} />
        </Animated.View>

        {/* Tombol Navigasi (Hanya Ikon, tanpa teks, persis seperti referensi foto baru) */}
        <View style={styles.buttonsContainer}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
            };

            let iconName = 'home';
            let label = 'Beranda';
            if (route.name === 'Bookmark') { iconName = 'bookmark'; label = 'Tersimpan'; }
            if (route.name === 'Profile') { iconName = 'user'; label = 'Profil'; }

            return (
              <TouchableOpacity key={index} activeOpacity={1} onPress={onPress} style={styles.navItem}>
                <TabIcon isFocused={isFocused} iconName={iconName} label={label} />
              </TouchableOpacity>
            );
          })}
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent', 
  },
  navBarClipped: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  slidingBg: {
    flexDirection: 'row',
    position: 'absolute',
    height: 70,
  },
  navBarOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  slidingElements: {
    position: 'absolute',
    width: 140, 
    height: 70,
    alignItems: 'center',
  },
  floatingCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4f46e5', // Warna Indigo sesuai Light Theme saat ini
    position: 'absolute',
    top: -24, // Melayang tinggi, dengan jarak gap transparan yang elegan ke bawah cekungan
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8, // Berfungsi sempurna karena memiliki warna background solid
  },
  bottomDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4f46e5',
    position: 'absolute',
    top: 46, // Titik duduk manis di sela-sela bawah cekungan
  },
  buttonsContainer: {
    flexDirection: 'row',
    height: 70,
  },
  navItem: {
    flex: 1,
    height: '100%',
  },
  navItemInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    marginTop: -12, // Angkat sedikit saat inactive agar ada ruang untuk teks di bawah
  },
  navText: {
    position: 'absolute',
    bottom: 12,
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  }
});

export default AnimatedTabBar;
