import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

const TabIcon = ({ isFocused, iconName }) => {
  const animatedY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animatedY, {
      toValue: isFocused ? -31 : 0, 
      useNativeDriver: true,
      bounciness: 12,
    }).start();
  }, [isFocused]);

  return (
    <Animated.View style={[styles.iconContainer, { transform: [{ translateY: animatedY }] }]}>
      <Feather name={iconName} size={24} color={isFocused ? "white" : "#94a3b8"} />
    </Animated.View>
  );
};

const AnimatedTabBar = ({ state, descriptors, navigation }) => {
  // Inisialisasi posisi awal agar tidak ada glitch
  const tabWidth = (width - 40) / 3;
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

  // Lebar SVG cekungan adalah 140
  // Posisi tengah SVG adalah 70. 
  // Agar tengah SVG sejajar dengan activeTabCenter, geser sebesar: activeTabCenter - (width + 70)
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
    <View style={styles.navWrapper}>
      
      {/* 1. LAYER BACKGROUND (Dibatasi oleh border-radius agar menyerupai pill) */}
      <View style={styles.navBarClipped}>
        <Animated.View style={[styles.slidingBg, { transform: [{ translateX: bgTranslateX }] }]}>
          <View style={[styles.bgFlat, { marginRight: -1 }]} />
          
          {/* Cekungan Mulus (Organic Bézier Curve Dip) yang sangat presisi dengan gambar */}
          <Svg width={140} height={70}>
            <Path 
              d="M 0 0 C 20 0, 40 40, 70 40 C 100 40, 120 0, 140 0 L 140 70 L 0 70 Z" 
              fill="#ffffff" 
            />
          </Svg>
          
          <View style={[styles.bgFlat, { marginLeft: -1 }]} />
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
            if (route.name === 'Bookmark') iconName = 'bookmark';
            if (route.name === 'Profile') iconName = 'user';

            return (
              <TouchableOpacity key={index} activeOpacity={1} onPress={onPress} style={styles.navItem}>
                <TabIcon isFocused={isFocused} iconName={iconName} />
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
    bottom: 24,
    left: 20,
    right: 20,
    height: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
    backgroundColor: 'transparent', // Penting agar shadow tidak kotak
  },
  navBarClipped: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 35,
    overflow: 'hidden',
  },
  slidingBg: {
    flexDirection: 'row',
    position: 'absolute',
    height: 70,
  },
  bgFlat: {
    width: width, 
    height: 70,
    backgroundColor: '#ffffff',
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
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
  }
});

export default AnimatedTabBar;
