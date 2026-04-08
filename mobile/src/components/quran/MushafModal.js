import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, Animated, TextInput, Dimensions, Platform, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../../lib/toastConfig';

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList);

const MushafModal = ({
  visible,
  insets,
  panY,
  panResponder,
  selectedSurah,
  versesData,
  modalScrollRef,
  renderVerseItem,
  setModalVisible,
  sound,
  setPlayingAyah,
  isAutoPlay,
  checkAuth,
  setIsAutoPlay,
  mushafType,
  setMushafType,
  expandedTafsir,
  playingAyah,
  isLoggedIn,
  tafsirDataMap,
  userProgress,
  fontSize,
  updateFontSize
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.modalContent, { marginTop: Math.max(insets.top, 40), transform: [{ translateY: panY }] }]}>
          <View style={styles.modalHeader} {...panResponder.panHandlers}>
            <View style={styles.modalDragIndicator}></View>
            <View style={styles.modalHeaderTopRow}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.headerSurahIdBox}><Text style={styles.headerSurahIdText}>{selectedSurah?.id}</Text></View>
                <Text style={styles.headerSurahName}>{selectedSurah?.name_simple}</Text>
                <View style={styles.searchAyahWrapper}>
                  <TextInput
                    style={styles.searchAyahInput}
                    placeholder="Ayat ke-"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    maxLength={3}
                    onChangeText={(text) => {
                      const num = parseInt(text);
                      if (!isNaN(num) && num > 0 && num <= versesData.length) {
                        const targetIndex = num - 1;
                        modalScrollRef.current?.scrollToIndex({
                           index: targetIndex,
                           animated: false,
                           viewPosition: 0
                        });
                        setTimeout(() => {
                          modalScrollRef.current?.scrollToIndex({
                            index: targetIndex,
                            animated: true,
                            viewPosition: 0,
                            viewOffset: 8
                          });
                        }, 300);
                      }
                    }}
                  />
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  if (sound) sound.unloadAsync();
                  setPlayingAyah(null);
                }}
                style={styles.closeBtn}
              >
                <Feather name="x" size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalHeaderBottomRow}>
              <TouchableOpacity
                style={[styles.autoBtn, isAutoPlay && styles.autoBtnActive]}
                onPress={() => checkAuth(() => setIsAutoPlay(!isAutoPlay))}
              >
                <Feather name="refresh-cw" size={12} color={isAutoPlay ? 'white' : '#64748b'} style={{ marginRight: 4 }} />
                <Text style={[styles.autoBtnText, isAutoPlay && styles.autoBtnTextActive]}>AUTO</Text>
              </TouchableOpacity>
              <View style={styles.mushafSwitcher}>
                {['uthmani', 'indopak'].map(type => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => checkAuth(() => setMushafType(type))}
                    style={[styles.mushafOption, mushafType === type && styles.mushafOptionActive]}
                  >
                    <Text style={[styles.mushafOptionText, mushafType === type && styles.mushafOptionTextActive]}>
                      {type === 'uthmani' ? 'Uth' : 'Indp'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.fontSizeControl}>
                <TouchableOpacity onPress={() => updateFontSize(false)} style={styles.fontBtn}>
                  <Text style={styles.fontBtnText}>A-</Text>
                </TouchableOpacity>
                <View style={styles.fontSizeDisplay}>
                  <Text style={styles.fontSizeValue}>{fontSize}</Text>
                </View>
                <TouchableOpacity onPress={() => updateFontSize(true)} style={styles.fontBtn}>
                  <Text style={styles.fontBtnText}>A+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={{ flex: 1, width: '100%' }}>
            {versesData.length === 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={{ marginTop: 10, color: '#64748b', fontSize: 13 }}>Memuat ayat...</Text>
              </View>
            ) : (
              <AnimatedFlashList
                ref={modalScrollRef}
                data={versesData}
                renderItem={renderVerseItem}
                extraData={{
                  expandedTafsir,
                  playingAyah,
                  mushafType,
                  isLoggedIn,
                  tafsirDataMap,
                  unlockedAyah: userProgress?.unlockedAyah,
                  unlockedSurah: userProgress?.unlockedSurah
                }}
                estimatedItemSize={280}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={true}
                keyExtractor={(item) => `${selectedSurah?.id}-${item.ayat}`}
                contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                keyboardShouldPersistTaps="always"
              />
            )}
          </View>
          <View style={[styles.modalFooter, { paddingBottom: Math.max(insets.bottom + 8, 20) }]}>
            <TouchableOpacity style={styles.paginationBtn} onPress={() => modalScrollRef.current?.scrollToIndex({ index: 0, animated: true })}>
              <Feather name="chevron-up" size={14} color="#94a3b8" />
              <Text style={styles.paginationBtnText}>Ke Atas</Text>
            </TouchableOpacity>
            <View style={styles.paginationCenter}><Text style={styles.paginationCenterValue}>{versesData.length} Ayat</Text></View>
            <TouchableOpacity
              style={[styles.paginationBtn, styles.paginationBtnActive]}
              onPress={() => modalScrollRef.current?.scrollToIndex({ index: versesData.length - 1, animated: true })}
            >
              <Text style={styles.paginationBtnTextActive}>Ke Bawah</Text>
              <Feather name="chevron-down" size={14} color="#ffffff" />
            </TouchableOpacity>
          </View>
          <Toast config={toastConfig} />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  modalContent: { flex: 1, backgroundColor: '#e2e8f0', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  modalHeader: { paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#cbd5e1', alignItems: 'center' },
  modalDragIndicator: { width: 40, height: 5, borderRadius: 3, backgroundColor: '#cbd5e1', marginBottom: 12 },
  modalHeaderTopRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  headerSurahIdBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  headerSurahIdText: { fontSize: 15, fontWeight: 'bold', color: '#3b82f6' },
  headerSurahName: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  searchAyahWrapper: { marginLeft: 10, backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 8, height: 30, justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  searchAyahInput: { fontSize: 13, color: '#334155', padding: 0, width: 65, textAlign: 'center' },
  modalHeaderBottomRow: { flexDirection: 'row', justifyContent: 'flex-start', width: '100%', gap: 8, marginTop: 8 },
  autoBtn: { flexDirection: 'row', backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  autoBtnActive: { backgroundColor: '#3b82f6', borderColor: '#2563eb' },
  autoBtnText: { color: '#64748b', fontSize: 10, fontWeight: 'bold' },
  autoBtnTextActive: { color: '#ffffff' },
  mushafSwitcher: { flex: 1, flexDirection: 'row', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 2, gap: 2 },
  mushafOption: { flex: 1, paddingVertical: 5, alignItems: 'center', borderRadius: 8 },
  mushafOptionActive: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  mushafOptionText: { fontSize: 13, fontWeight: 'bold', color: '#64748b' },
  mushafOptionTextActive: { color: '#3b82f6' },
  fontSizeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 2,
    gap: 2,
    width: 100,
  },
  fontBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fontBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#475569',
  },
  fontSizeDisplay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontSizeValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#fecaca' },
  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, paddingHorizontal: 16, backgroundColor: '#f8fafc', borderTopWidth: 1, borderTopColor: '#cbd5e1' },
  paginationBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  paginationBtnText: { fontSize: 13, fontWeight: '600', color: '#94a3b8', marginLeft: 6 },
  paginationBtnActive: { backgroundColor: '#a78bfa', borderColor: '#a78bfa' },
  paginationBtnTextActive: { fontSize: 13, fontWeight: 'bold', color: '#ffffff' },
  paginationCenter: { alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 },
  paginationCenterValue: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
});

export default MushafModal;
