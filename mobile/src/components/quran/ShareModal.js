import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, ScrollView, Animated } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { toastConfig } from '../../lib/toastConfig';
import { Image } from 'expo-image';

const { width, height } = Dimensions.get('window');

const backgroundsList = [
  { name: 'Aurora Borealis', colors: ['#4ade80', '#2dd4bf', '#3b82f6', '#8b5cf6'] },
  { name: 'Deep Space', colors: ['#0f172a', '#1e1b4b', '#312e81', '#000000'] },
  { name: 'Sunset Glow', colors: ['#f43f5e', '#fb923c', '#facc15'] },
  { name: 'Cyberpunk', colors: ['#f472b6', '#db2777', '#4c1d95'] },
  { name: 'Oceanic Deep', colors: ['#1d4ed8', '#1e40af', '#1e1b4b'] },
  { name: 'Emerald Forest', colors: ['#059669', '#10b981', '#064e3b'] },
  { name: 'Lux Gold', colors: ['#451a03', '#92400e', '#78350f', '#451a03'] },
  { name: 'Rose Petal', colors: ['#fb7185', '#e11d48', '#881337'] },
  { name: 'Midnight Calm', colors: ['#1e293b', '#0f172a', '#000000'] },
  { name: 'Soft Mint', colors: ['#ecfdf5', '#d1fae5', '#6ee7b7'] },
  { name: 'Peachy', colors: ['#fff7ed', '#ffedd5', '#fed7aa'] },
  { name: 'Iqlab Primary', colors: ['#1d4ed8', '#3b82f6', '#2dd4bf'] }
];

const cardStylesList = [
  { name: 'Luxury Glass', bg: 'rgba(255,255,255,0.12)', border: 'rgba(255,255,255,0.3)', blur: 10 },
  { name: 'Dark Mode', bg: 'rgba(9,9,11,0.7)', border: 'rgba(255,255,255,0.15)' },
  { name: 'Neon Border', bg: 'rgba(0,0,0,0.6)', border: '#3b82f6' },
  { name: 'Classic Gold', bg: 'rgba(255,255,255,0.05)', border: '#fbbf24' },
  { name: 'Translucent White', bg: 'rgba(255,255,255,0.85)', border: 'rgba(255,255,255,1)' },
  { name: 'Coal Black', bg: '#000000', border: '#333333' },
  { name: 'Glass Premium', bg: 'rgba(255,255,255,0.15)', border: 'rgba(255,255,255,0.25)' },
  { name: 'Frosted Crystal', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.3)' }
];

const textColorsOptions = ['#ffffff', '#000000', '#fbbf24', '#38bdf8', '#a78bfa', '#fecdd3', '#86efac'];

const patternsList = [
  { name: 'Polos', id: 'none' },
  { name: 'Bubbles', id: 'bubbles' },
  { name: 'Glassy', id: 'glassy' },
  { name: 'Geometric', id: 'geometric' },
  { name: 'Soft Glow', id: 'glow' }
];

export default function ShareModal({ visible, onClose, verse, surahName }) {
  const [selectedBg, setSelectedBg] = useState(0);
  const [selectedStyle, setSelectedStyle] = useState(0);
  const [selectedPattern, setSelectedPattern] = useState('bubbles');
  const [selectedTextColor, setSelectedTextColor] = useState('#ffffff');
  const [activeSlide, setActiveSlide] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const fadeAnim = new Animated.Value(0);
  const viewShotRef = React.useRef();

  useEffect(() => {
    if (visible) {
      setActiveSlide(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, verse]);

  const slides = useMemo(() => {
    if (!verse) return [];

    const chunkText = (text, maxLength) => {
      const words = text.split(' ');
      const chunks = [];
      let currentChunk = '';
      for (const word of words) {
        if (currentChunk.length + word.length + 1 > maxLength) {
          if (currentChunk) chunks.push(currentChunk.trim());
          currentChunk = word;
        } else {
          currentChunk += (currentChunk ? ' ' : '') + word;
        }
      }
      if (currentChunk) chunks.push(currentChunk.trim());
      return chunks;
    };

    if ((verse.teks_arab.length + verse.terjemahan.length) <= 400) {
      return [{ type: 'combined', arabic: verse.teks_arab, translation: verse.terjemahan }];
    } else {
      const arabicChunks = chunkText(verse.teks_arab, 300);
      const translationChunks = chunkText(verse.terjemahan, 400);
      const result = [];
      arabicChunks.forEach((chunk) => result.push({ type: 'arabic', text: chunk }));
      translationChunks.forEach((chunk) => result.push({ type: 'translation', text: chunk }));
      return result;
    }
  }, [verse]);

  if (!verse) return null;

  const handleCopy = () => {
    const textToCopy = `${verse.teks_arab}\n\n"${verse.terjemahan}"\n\n(QS. ${surahName} : ${verse.ayat})`;
    Clipboard.setString(textToCopy);
    Toast.show({
      type: 'success',
      text1: 'Berhasil Disalin! ✨',
      text2: 'Teks ayat telah disalin ke clipboard Anda.',
    });
  };

  const handleShare = async () => {
    try {
      const shareMessage = `${verse.teks_arab}\n\n"${verse.terjemahan}"\n\n(QS. ${surahName} : ${verse.ayat})\n\nDibagikan dari aplikasi Interactive Quran`;
      await Share.share({
        message: shareMessage,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleDownloadPng = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Izin Ditolak', text2: 'Gagal mengakses galeri perangkat.' });
        return;
      }
      setIsCapturing(true);
      // Wait for UI to hide carousel buttons
      setTimeout(async () => {
        try {
          // view-shot scale makes it high resolution
          const uri = await viewShotRef.current.capture();
          await MediaLibrary.saveToLibraryAsync(uri);
          Toast.show({ type: 'success', text1: 'Berhasil Disimpan! 🖼️', text2: 'Kartu ayat tersimpan ke Galeri HP Anda.' });
        } catch (e) {
          console.error(e);
          Toast.show({ type: 'error', text1: 'Gagal Menyimpan', text2: 'Terjadi kegagalan memproses gambar.' });
        } finally {
          setIsCapturing(false);
        }
      }, 200);
    } catch (e) {
      console.error(e);
      Toast.show({ type: 'error', text1: 'Gagal', text2: 'Ada kendala teknis perangkat.' });
      setIsCapturing(false);
    }
  };

  const getArabicFontSize = (text, isSingleMode) => {
    const len = text.length;
    let base = 28;
    if (isSingleMode) {
      if (len > 300) base = 20;
      else if (len > 150) base = 24;
      else base = 28;
    } else {
      if (len > 300) base = 18;
      else if (len > 150) base = 22;
      else base = 24;
    }
    return base;
  };

  const getTranslationFontSize = (text, isSingleMode) => {
    const len = text.length;
    let base = 14;
    if (isSingleMode) {
      if (len > 400) base = 12;
      else if (len > 250) base = 14;
      else base = 16;
    } else {
      if (len > 400) base = 11;
      else if (len > 250) base = 12;
      else base = 13;
    }
    return base;
  };

  const renderPattern = () => {
    switch (selectedPattern) {
      case 'bubbles':
        return (
          <>
            <View style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.12)', transform: [{ scale: 1.5 }] }} />
            <View style={{ position: 'absolute', bottom: -40, left: -40, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.08)', transform: [{ scale: 2 }] }} />
            <View style={{ position: 'absolute', top: '15%', left: '5%', width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.05)' }} />
          </>
        );
      case 'glassy':
        return (
          <>
            <View style={{ position: 'absolute', top: '10%', left: '10%', width: width * 0.5, height: 1, backgroundColor: 'rgba(255,255,255,0.2)', transform: [{ rotate: '45deg' }] }} />
            <View style={{ position: 'absolute', bottom: '10%', right: '10%', width: width * 0.5, height: 1, backgroundColor: 'rgba(255,255,255,0.2)', transform: [{ rotate: '45deg' }] }} />
            <View style={{ position: 'absolute', top: '40%', right: '-10%', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.15)', blur: 20 }} />
          </>
        );
      case 'geometric':
        return (
          <>
            <View style={{ position: 'absolute', top: 20, left: 20, width: 60, height: 60, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', transform: [{ rotate: '15deg' }] }} />
            <View style={{ position: 'absolute', bottom: 40, right: 30, width: 80, height: 80, borderRadius: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
            <View style={{ position: 'absolute', top: '50%', right: '10%', width: 40, height: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', transform: [{ rotate: '45deg' }] }} />
          </>
        );
      case 'glow':
        return (
          <View style={{ position: 'absolute', width: '150%', height: '150%', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 1000, top: '-25%', left: '-25%' }} />
        );
      default:
        return null;
    }
  };

  const currentSlide = slides[activeSlide];
  if (!currentSlide) return null;

  const isSingleMode = currentSlide.type !== 'combined';
  const showArabic = currentSlide.type === 'combined' || currentSlide.type === 'arabic';
  const showTranslation = currentSlide.type === 'combined' || currentSlide.type === 'translation';
  const arabicText = currentSlide.type === 'combined' ? currentSlide.arabic : currentSlide.text;
  const translationText = currentSlide.type === 'combined' ? currentSlide.translation : currentSlide.text;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.modalContent, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Bagikan Ayat ✨</Text>
              <Text style={styles.subtitle}>Desain Premium Iqlab</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} nestedScrollEnabled={true}>
            {/* Visual Preview Container */}
            <View style={styles.previewCardContainer}>
              <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0, result: 'tmpfile' }} style={{ backgroundColor: 'transparent' }}>
                <LinearGradient
                  collapsable={false}
                  colors={backgroundsList[selectedBg].colors}
                  style={styles.previewCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {/* Decorative Abstract Elements */}
                  {renderPattern()}

                  <View style={[
                    styles.innerCard,
                    {
                      backgroundColor: cardStylesList[selectedStyle].bg,
                      borderColor: cardStylesList[selectedStyle].border
                    }
                  ]}>

                    {showArabic && (
                      <Text
                        style={[styles.previewArabic, { color: selectedTextColor, fontSize: getArabicFontSize(arabicText, isSingleMode), lineHeight: getArabicFontSize(arabicText, isSingleMode) * 1.8 }]}
                      >
                        {arabicText}
                      </Text>
                    )}
                    {showArabic && showTranslation && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 18, opacity: 0.8, width: '60%' }}>
                        <View style={{ flex: 1, height: 1, backgroundColor: selectedTextColor, opacity: 0.3 }} />
                        <View style={{ width: 4, height: 4, transform: [{ rotate: '45deg' }], backgroundColor: selectedTextColor, marginHorizontal: 8, opacity: 0.6 }} />
                        <View style={{ width: 6, height: 6, transform: [{ rotate: '45deg' }], backgroundColor: selectedTextColor, opacity: 0.8 }} />
                        <View style={{ width: 4, height: 4, transform: [{ rotate: '45deg' }], backgroundColor: selectedTextColor, marginHorizontal: 8, opacity: 0.6 }} />
                        <View style={{ flex: 1, height: 1, backgroundColor: selectedTextColor, opacity: 0.3 }} />
                      </View>
                    )}

                    {showTranslation && (
                      <Text
                        style={[styles.previewTranslation, { color: selectedTextColor, opacity: 0.9, fontSize: getTranslationFontSize(translationText, isSingleMode), lineHeight: getTranslationFontSize(translationText, isSingleMode) * 1.5 }]}
                      >
                        "{translationText.replace(/<sup[^>]*>.*?<\/sup>/g, '')}"
                      </Text>
                    )}

                    <View style={[styles.footerPreview, { borderTopColor: selectedTextColor === '#000000' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)' }]}>
                      <View style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                        <Image
                          source={require('../../../assets/logo.svg')}
                          style={{ width: 65, height: 22 }}
                          contentFit="contain"
                          tintColor={selectedTextColor}
                        />
                        <Text style={[styles.logoText, { color: selectedTextColor, marginTop: 4, marginLeft: 2 }]}>Interactive Quran</Text>
                      </View>

                      <View style={[styles.surahTag, { backgroundColor: selectedTextColor === '#000000' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.2)' }]}>
                        <Text style={[styles.surahTagText, { color: selectedTextColor }]}>
                          QS. {surahName}:{verse.ayat} {slides.length > 1 ? `(${activeSlide + 1}/${slides.length})` : ''}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Carousel Controls Overlay */}
                  {(slides.length > 1 && !isCapturing) && (
                    <>
                      <TouchableOpacity
                        style={[styles.carouselBtn, styles.carouselBtnLeft, activeSlide === 0 && { opacity: 0 }]}
                        disabled={activeSlide === 0}
                        onPress={() => setActiveSlide(prev => Math.max(0, prev - 1))}
                      >
                        <Feather name="chevron-left" size={18} color="white" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.carouselBtn, styles.carouselBtnRight, activeSlide === slides.length - 1 && { opacity: 0 }]}
                        disabled={activeSlide === slides.length - 1}
                        onPress={() => setActiveSlide(prev => Math.min(slides.length - 1, prev + 1))}
                      >
                        <Feather name="chevron-right" size={18} color="white" />
                      </TouchableOpacity>
                    </>
                  )}
                </LinearGradient>
              </ViewShot>

              {/* Pagination Dots */}
              {slides.length > 1 && (
                <View style={styles.paginationDots}>
                  {slides.map((_, idx) => (
                    <TouchableOpacity key={idx} onPress={() => setActiveSlide(idx)}>
                      <View style={[styles.dot, activeSlide === idx ? styles.dotActive : styles.dotInactive]} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Actions Container */}
            <View style={styles.actionContainer}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleCopy}>
                <View style={[styles.iconContainer, { backgroundColor: '#f0fdf4' }]}>
                  <Feather name="copy" size={20} color="#16a34a" />
                </View>
                <Text style={styles.actionText}>Teks</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
                <View style={[styles.iconContainer, { backgroundColor: '#eff6ff' }]}>
                  <Feather name="share" size={20} color="#2563eb" />
                </View>
                <Text style={styles.actionText}>Kirim</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtnPrimary} onPress={handleDownloadPng} disabled={isCapturing}>
                {isCapturing ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={styles.actionTextPrimary}>Memproses...</Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name="download" size={18} color="white" style={{ marginRight: 6 }} />
                    <Text style={styles.actionTextPrimary}>P N G</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Customizations Controls */}
            <View style={styles.customizationsContainer}>
              <Text style={styles.bgTitle}>Ganti Background</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bgOptions} nestedScrollEnabled={true}>
                {backgroundsList.map((bg, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.bgOptionWrapper, selectedBg === idx && styles.bgOptionWrapperActive]}
                    onPress={() => setSelectedBg(idx)}
                  >
                    <LinearGradient
                      colors={bg.colors}
                      style={styles.bgOptionLinear}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.bgTitle, { marginTop: 16 }]}>Efek Kartu</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bgOptions} nestedScrollEnabled={true}>
                {cardStylesList.map((styleObj, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.styleBtn,
                      selectedStyle === idx && styles.styleBtnActive
                    ]}
                    onPress={() => setSelectedStyle(idx)}
                  >
                    <Text style={[styles.styleBtnText, selectedStyle === idx && styles.styleBtnTextActive]}>{styleObj.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.bgTitle, { marginTop: 20 }]}>Pola Abstract</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.bgOptions, { paddingBottom: 10 }]} nestedScrollEnabled={true}>
                {patternsList.map((pattern, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.styleBtn,
                      selectedPattern === pattern.id && styles.styleBtnActive
                    ]}
                    onPress={() => setSelectedPattern(pattern.id)}
                  >
                    <Text style={[styles.styleBtnText, selectedPattern === pattern.id && styles.styleBtnTextActive]}>{pattern.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.bgTitle, { marginTop: 20 }]}>Warna Teks</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.bgOptions, { paddingBottom: 20, paddingTop: 4 }]} nestedScrollEnabled={true}>
                {textColorsOptions.map((color, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedTextColor === color && styles.colorOptionActive,
                      color === '#ffffff' && { borderWidth: 1, borderColor: '#e2e8f0' }
                    ]}
                    onPress={() => setSelectedTextColor(color)}
                  />
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
      <Toast config={toastConfig} topOffset={40} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    paddingTop: height * 0.12,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  modalContent: {
    height: height * 0.88,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  previewCardContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  previewCard: {
    width: width * 0.9,
    aspectRatio: 0.8,
    borderRadius: 24,
    padding: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    position: 'relative',
  },
  innerCard: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewArabic: {
    fontFamily: 'Uthmanic-Neo-Color',
    textAlign: 'center',
  },
  previewTranslation: {
    fontStyle: 'italic',
    textAlign: 'center',
  },
  footerPreview: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  logoPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logoText: {
    fontSize: 7,
    fontWeight: 'bold',
    opacity: 0.6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  surahTag: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  surahTagText: {
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  carouselBtn: {
    position: 'absolute',
    top: '50%',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -16,
  },
  carouselBtnLeft: {
    left: 8,
  },
  carouselBtnRight: {
    right: 8,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 18,
    backgroundColor: '#3b82f6',
  },
  dotInactive: {
    width: 6,
    backgroundColor: '#cbd5e1',
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  actionBtnPrimary: {
    flex: 1.2,
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  actionTextPrimary: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 1,
  },
  customizationsContainer: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginTop: 10,
  },
  bgTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  bgOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  bgOptionWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  bgOptionWrapperActive: {
    borderColor: '#3b82f6',
  },
  bgOptionLinear: {
    flex: 1,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  styleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  styleBtnActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
  },
  styleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  styleBtnTextActive: {
    color: '#ffffff',
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  colorOptionActive: {
    borderWidth: 3,
    borderColor: '#3b82f6',
  }
});
