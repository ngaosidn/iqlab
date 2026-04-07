import React, { useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, Platform, Animated, Dimensions, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Keyboard, LayoutAnimation, ActivityIndicator, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Feather, FontAwesome5, Ionicons } from '@expo/vector-icons';
import HomeHeader from '../components/HomeHeader';
import Toast from 'react-native-toast-message';
import { FlashList } from '@shopify/flash-list';

// Menggunakan Animated component untuk FlashList
const AnimatedFlashList = Animated.createAnimatedComponent(FlashList);

// Hooks & Components
import { useInteractiveQuran } from '../hooks/useInteractiveQuran';
import VerseItem from '../components/VerseItem';
import JitsiWebView from '../components/JitsiWebView';

export default function InteractiveQuranScreen({ onBack, session }) {
    const insets = useSafeAreaInsets();
    const screenWidth = Dimensions.get('window').width;
    const isLoggedIn = !!session?.user;

    // Destructure with default values to prevent ReferenceError if hook return is partial
    const quranHook = useInteractiveQuran(onBack, session);
    const {
        fontsLoaded = false,
        translateX = new Animated.Value(0),
        scrollViewRef,
        modalScrollRef,
        input = '',
        setInput,
        messages = [],
        setMessages,
        isLoading = false,
        modalVisible = false,
        setModalVisible,
        selectedSurah = null,
        versesData = [],
        mushafType = 'uthmani',
        setMushafType,
        expandedTafsir = null,
        tafsirDataMap = {},
        playingAyah = null,
        isAutoPlay = false,
        setIsAutoPlay,
        currentPage = 1,
        setCurrentPage,
        versesPerPage = 10,
        panY = new Animated.Value(0),
        panResponder = { panHandlers: {} },
        handleSend,
        handleOpenSurah,
        handlePlayAyah,
        handlePageChange,
        toggleTafsir,
        sound,
        setSound,
        setPlayingAyah,
        userProgress,
        lobbyVisible,
        setLobbyVisible,
        activeTeachers,
        fetchActiveTeachers,
        joinTeacherClass,
        inClassUrl,
        setInClassUrl,
        handleOpenLobby
    } = quranHook;

    const checkAuth = (onSuccess) => {
        if (isLoggedIn) {
            onSuccess();
        } else {
            Toast.show({
                type: 'info',
                text1: 'Eits, Login dulu! 🛑',
                text2: 'Fitur ini perlu login biar makin berkah. 😊',
                position: 'bottom',
                bottomOffset: 90,
            });
        }
    };

    // AUTO SCROLL LOGIC (Optimized for FlashList)
    useEffect(() => {
        if (playingAyah && isAutoPlay && modalScrollRef?.current) {
            const indexInPage = playingAyah - 1; // Karena memuat semua ayat langsung

            if (indexInPage >= 0 && indexInPage < versesData.length) {
                modalScrollRef.current.scrollToIndex({
                    index: indexInPage,
                    animated: true,
                    viewPosition: 0,
                    viewOffset: 0
                });
            }
        }
    }, [playingAyah, isAutoPlay, versesData.length]);

    const renderVerseItem = useCallback(({ item: verse }) => {
        const isActiveAyah = selectedSurah?.id === userProgress.unlockedSurah && verse.ayat === userProgress.unlockedAyah;
        const isPassedAyah = selectedSurah?.id < userProgress.unlockedSurah || (selectedSurah?.id === userProgress.unlockedSurah && verse.ayat < userProgress.unlockedAyah);
        const isLocked = !isActiveAyah && !isPassedAyah;

        return (
            <VerseItem
                verse={verse}
                surahId={selectedSurah?.id}
                isPlaying={playingAyah === verse.ayat}
                isExpanded={expandedTafsir === verse.ayat}
                onPlay={handlePlayAyah}
                onToggleTafsir={toggleTafsir}
                tafsirText={tafsirDataMap[verse.ayat]}
                fontFamily={
                    mushafType === 'uthmani' ? 'Uthmanic-Neo-Color' :
                        mushafType === 'kemenag' ? 'LPMQ-Isep-Misbah' : 'Indopak-Font'
                }
                onAuthRestricted={checkAuth}
                isLoggedIn={isLoggedIn}
                isInteractiveActive={isActiveAyah}
                isPassed={isPassedAyah}
                isLocked={isLocked}
                onSend={() => checkAuth(() => handleOpenLobby(selectedSurah?.id, verse.ayat))}
            />
        );
    }, [selectedSurah?.id, playingAyah, expandedTafsir, tafsirDataMap, handlePlayAyah, toggleTafsir, mushafType, isLoggedIn, userProgress, handleOpenLobby]);

    if (!fontsLoaded) return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color="#3b82f6" />
        </View>
    );

    if (inClassUrl) {
        const currentSchedule = activeTeachers.find(t => t.meeting_link === inClassUrl);
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a', paddingBottom: 0 }}>
                <JitsiWebView
                    url={inClassUrl}
                    onLeave={() => {
                        setInClassUrl(null);
                        setLobbyVisible(true);
                    }}
                    isTeacher={false}
                    scheduleId={currentSchedule?.id || null}
                    session={session}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
            <StatusBar style="light" />
            <View style={styles.container}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={0}
                    enabled={Platform.OS === 'ios'}
                >
                    <HomeHeader 
                        translateX={translateX}
                        title="Ahlan Bikum! 👋"
                        subtitle="MAU BACA DAN TADABBUR AYAT APA HARI INI? ✨"
                        rightContent={
                            <>
                                <TouchableOpacity style={styles.iconBtn}><Feather name="download" size={18} color="white" /></TouchableOpacity>
                                <TouchableOpacity style={styles.iconBtn} onPress={onBack}><Feather name="arrow-left" size={20} color="white" /></TouchableOpacity>
                            </>
                        }
                    />

                    <ScrollView
                        ref={scrollViewRef}
                        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                        style={{ flex: 1 }}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                    >
                        {messages.map((msg, index) => {
                            if (msg.type === 'user') {
                                return (
                                    <View key={index} style={styles.userBubbleWrapper}>
                                        <View style={styles.userBubble}><Text style={styles.userBubbleText}>{msg.content}</Text></View>
                                    </View>
                                );
                            } else {
                                return (
                                    <View key={index} style={styles.bubbleWrapper}>
                                        <View style={styles.chatAvatar}><FontAwesome5 name="user-alt" size={14} color="white" /></View>
                                        {msg.isGuide ? (
                                            <View style={styles.tutorialCard}>
                                                <View style={styles.tutorialHeader}><Text style={styles.sparkleIcon}>✨</Text><Text style={styles.tutorialTitle}>Panduan Interactive Quran</Text></View>
                                                <Text style={styles.tutorialDesc}>{msg.content}</Text>
                                                <View style={[styles.guideBox, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                                                    <View style={styles.guideBoxHeader}><View style={[styles.guideIconContainer, { backgroundColor: '#dbeafe' }]}><Ionicons name="book" size={14} color="#3b82f6" /></View><Text style={[styles.guideBoxTitle, { color: '#2563eb' }]}>TAMPILKAN SURAH</Text></View>
                                                    <View style={styles.bulletRow}><View style={[styles.bulletDot, { backgroundColor: '#3b82f6' }]} /><Text style={styles.bulletText}><Text style={styles.boldText}>Semua Surah:</Text> Ketik [Daftar]</Text></View>
                                                </View>
                                            </View>
                                        ) : (
                                            <View style={styles.tutorialCard}>
                                                <Text style={styles.botMessageText}>{msg.content}</Text>
                                                {msg.surahs && (
                                                    <ScrollView style={{ maxHeight: 400, marginTop: 16 }} nestedScrollEnabled={true}>
                                                        {msg.surahs.map((surah) => (
                                                            <TouchableOpacity onPress={() => handleOpenSurah(surah)} key={surah.id} style={styles.surahCard}>
                                                                <View style={styles.surahIdBox}><Text style={styles.surahIdText}>{surah.id}</Text></View>
                                                                <View style={styles.surahNameCol}>
                                                                    <Text style={styles.surahLatinName}>{surah.name_simple}</Text>
                                                                    <Text style={styles.surahMeaningText}>{surah.translated_name?.name || 'Memuat...'}</Text>
                                                                </View>
                                                                <View style={styles.surahMetaCol}>
                                                                    <Text style={styles.surahArabicName}>{surah.name_arabic}</Text>
                                                                    <Text style={styles.ayahPillText}>{surah.revelation_place?.toLowerCase() === 'makkah' ? 'Makkiyah' : 'Madaniyah'} • {surah.verses_count} AYAT</Text>
                                                                </View>
                                                            </TouchableOpacity>
                                                        ))}
                                                    </ScrollView>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                );
                            }
                        })}
                        {isLoading && (
                            <View style={styles.bubbleWrapper}>
                                <View style={styles.chatAvatar}><FontAwesome5 name="user-alt" size={14} color="white" /></View>
                                <View style={[styles.tutorialCard, { padding: 16, width: 80, alignItems: 'center' }]}><ActivityIndicator size="small" color="#3b82f6" /></View>
                            </View>
                        )}
                    </ScrollView>

                    <View style={styles.bottomWrapper}>
                        <View style={[styles.chatInputContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                            <TouchableOpacity style={styles.trashBtn} onPress={() => setMessages([{ type: 'bot', isGuide: true, content: "Assalamu'alaikum!..." }])}>
                                <Feather name="trash-2" size={20} color="#94a3b8" />
                            </TouchableOpacity>
                            <View style={styles.textInputWrapper}>
                                <TextInput style={styles.textInput} placeholder="Ketikan Perintah disini" placeholderTextColor="#94a3b8" value={input} onChangeText={setInput} onSubmitEditing={handleSend} returnKeyType="send" />
                            </View>
                            <TouchableOpacity style={[styles.sendBtn, input.trim().length > 0 && styles.sendBtnActive]} onPress={handleSend}>
                                <Text style={[styles.sendBtnText, input.trim().length > 0 && styles.sendBtnTextActive]}>Kirim</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>

                <Modal visible={modalVisible} animationType="slide" transparent={true}>
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
                                                        modalScrollRef.current?.scrollToIndex({ index: num - 1, animated: true });
                                                    }
                                                }}
                                            />
                                        </View>
                                    </View>
                                    <TouchableOpacity onPress={() => { setModalVisible(false); if (sound) sound.unloadAsync(); setPlayingAyah(null); }} style={styles.closeBtn}><Feather name="x" size={18} color="#64748b" /></TouchableOpacity>
                                </View>
                                <View style={styles.modalHeaderBottomRow}>
                                    <TouchableOpacity style={[styles.autoBtn, isAutoPlay && styles.autoBtnActive]} onPress={() => checkAuth(() => setIsAutoPlay(!isAutoPlay))}>
                                        <Feather name="refresh-cw" size={12} color={isAutoPlay ? 'white' : '#64748b'} style={{ marginRight: 4 }} /><Text style={[styles.autoBtnText, isAutoPlay && styles.autoBtnTextActive]}>AUTO</Text>
                                    </TouchableOpacity>
                                    <View style={styles.mushafSwitcher}>
                                        {['uthmani', 'kemenag', 'indopak'].map(type => (
                                            <TouchableOpacity
                                                key={type}
                                                onPress={() => checkAuth(() => setMushafType(type))}
                                                style={[styles.mushafOption, mushafType === type && styles.mushafOptionActive]}
                                            >
                                                <Text style={[styles.mushafOptionText, mushafType === type && styles.mushafOptionTextActive]}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>
                            <View style={{ flex: 1, width: '100%' }}>
                                <AnimatedFlashList
                                    ref={modalScrollRef}
                                    data={versesData}
                                    renderItem={renderVerseItem}
                                    extraData={{ expandedTafsir, playingAyah, mushafType, isLoggedIn, tafsirDataMap }}
                                    estimatedItemSize={250}
                                    keyExtractor={(item) => `verse-${item.ayat}`}
                                    contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
                                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                                    keyboardShouldPersistTaps="always"
                                />
                            </View>
                            <View style={[styles.modalFooter, { paddingBottom: Math.max(insets.bottom + 8, 20) }]}>
                                <TouchableOpacity style={styles.paginationBtn} onPress={() => modalScrollRef.current?.scrollToIndex({ index: 0, animated: true })}>
                                    <Feather name="chevron-up" size={14} color="#94a3b8" /><Text style={styles.paginationBtnText}>Ke Atas</Text>
                                </TouchableOpacity>
                                <View style={styles.paginationCenter}><Text style={styles.paginationCenterValue}>{versesData.length} Ayat</Text></View>
                                <TouchableOpacity style={[styles.paginationBtn, styles.paginationBtnActive]} onPress={() => modalScrollRef.current?.scrollToIndex({ index: versesData.length - 1, animated: true })}>
                                    <Text style={styles.paginationBtnTextActive}>Ke Bawah</Text><Feather name="chevron-down" size={14} color="#ffffff" />
                                </TouchableOpacity>
                            </View>
                        </Animated.View>

                        {/* LOBBY OVERYLAY: Pilih Guru Aktif (Inside Main Modal) */}
                        {lobbyVisible && (
                            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', zIndex: 1000 }]}>
                                <View style={[styles.lobbyContainer, { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]}>
                                    <View style={styles.lobbyHeader}>
                                        <Text style={styles.lobbyTitle}>Pilih Ustadz/Ustadzah</Text>
                                        <TouchableOpacity onPress={() => setLobbyVisible(false)} style={styles.closeLobbyBtn}>
                                            <Feather name="x" size={20} color="#64748b" />
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={styles.lobbySubtitle}>Daftar pengajar yang sedang siaran langsung saat ini (Batas 4 Murid/Kelas):</Text>

                                    <ScrollView contentContainerStyle={{ padding: 16 }}>
                                        {activeTeachers.length === 0 ? (
                                            <Text style={{ textAlign: 'center', color: '#94a3b8', marginVertical: 30 }}>Belum ada pengajar (sesuai gender Anda) yang sedang Online saat ini. Silakan kembali nanti.</Text>
                                        ) : (
                                            activeTeachers.map(teacher => {
                                                const isFull = teacher.current_students_count >= 4;
                                                return (
                                                    <View key={teacher.id} style={styles.teacherLobbyCard}>
                                                        <View style={{ flex: 1 }}>
                                                            <Text style={styles.teacherLobbyName}>{teacher.teacher_name || (session?.user?.user_metadata?.gender === 'Perempuan' ? 'Ustadzah I-Qlab' : 'Ustadz I-Qlab')}</Text>
                                                            <Text style={{ fontSize: 13, color: isFull ? '#ef4444' : '#0d9488', fontWeight: 'bold' }}>
                                                                {isFull ? `Penuh (${teacher.current_students_count}/4)` : `Tersedia (${teacher.current_students_count}/4 Murid)`}
                                                            </Text>
                                                        </View>
                                                        <TouchableOpacity
                                                            disabled={isFull}
                                                            onPress={() => joinTeacherClass(teacher)}
                                                            style={[styles.btnJoinLobby, isFull && { backgroundColor: '#e2e8f0' }]}
                                                        >
                                                            <Text style={[styles.btnJoinLobbyText, isFull && { color: '#94a3b8' }]}>Masuk</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                );
                                            })
                                        )}
                                    </ScrollView>
                                </View>
                            </View>
                        )}

                    </View>
                </Modal>

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    iconBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 20, paddingBottom: 40 },
    userBubbleWrapper: { alignItems: 'flex-end', marginBottom: 20, marginLeft: 60 },
    userBubble: { backgroundColor: '#3b82f6', borderRadius: 20, borderBottomRightRadius: 4, paddingHorizontal: 16, paddingVertical: 12 },
    userBubbleText: { color: '#ffffff', fontSize: 16 },
    tutorialCard: { backgroundColor: '#ffffff', borderRadius: 24, borderBottomLeftRadius: 4, padding: 20, elevation: 3, borderWidth: 1, borderColor: '#f1f5f9', marginLeft: 20 },
    botMessageText: { fontSize: 15, color: '#334155', lineHeight: 22 },
    tutorialHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 12 },
    tutorialTitle: { fontSize: 17, fontWeight: 'bold', color: '#334155' },
    tutorialDesc: { fontSize: 15, color: '#475569', lineHeight: 22, marginBottom: 16 },
    sparkleIcon: { fontSize: 20, marginRight: 8 },
    guideBox: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
    guideBoxHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    guideIconContainer: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10, position: 'relative' },
    iconAccent: { position: 'absolute', width: 4, height: 4, borderRadius: 2, top: 4, right: 4 },
    guideBoxTitle: { fontSize: 14, fontWeight: 'bold' },
    bulletText: { fontSize: 14, color: '#475569', lineHeight: 22, marginBottom: 4, flex: 1 },
    bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
    bulletDot: { width: 4, height: 4, borderRadius: 2, marginTop: 8, marginRight: 8 },
    pill: { backgroundColor: '#ffffff', borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, fontSize: 13, fontWeight: 'bold', overflow: 'hidden' },
    boldText: { fontWeight: 'bold', color: '#334155' },
    bubbleWrapper: { position: 'relative', marginLeft: 15, marginBottom: 20 },
    chatAvatar: { position: 'absolute', left: 0, bottom: -10, width: 32, height: 32, borderRadius: 16, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', zIndex: 50, borderWidth: 2, borderColor: '#ffffff' },
    bottomWrapper: { position: 'relative', backgroundColor: 'transparent', zIndex: 20 },
    chatInputContainer: { backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderTopLeftRadius: 24, borderTopRightRadius: 24, elevation: 10 },
    textInputWrapper: { flex: 1, marginHorizontal: 10 },
    textInput: { height: 48, fontSize: 16, color: '#0f172a' },
    sendBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    sendBtnActive: { backgroundColor: '#3b82f6' },
    sendBtnText: { color: '#94a3b8', fontWeight: 'bold', fontSize: 16 },
    sendBtnTextActive: { color: '#ffffff' },
    surahCard: { flexDirection: 'row', backgroundColor: '#ffffff', borderColor: '#f1f5f9', borderWidth: 1.5, borderRadius: 20, padding: 14, alignItems: 'center', marginBottom: 12 },
    surahIdBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', marginRight: 14, borderWidth: 1, borderColor: '#e2e8f0' },
    surahIdText: { fontSize: 16, fontWeight: 'bold', color: '#64748b' },
    surahNameCol: { flex: 1, justifyContent: 'center' },
    surahLatinName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    surahArabicName: { fontSize: 24, color: '#2563eb', marginBottom: 2, fontFamily: 'Uthmanic-Neo-Color' },
    surahMeaningText: { fontSize: 13, color: '#64748b', marginTop: 2, fontWeight: '500' },
    surahMetaCol: { alignItems: 'flex-end', justifyContent: 'center' },
    ayahPillText: { fontSize: 11, fontWeight: 'bold', color: '#64748b' },
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
    mushafOptionText: { fontSize: 9, fontWeight: 'bold', color: '#64748b' },
    mushafOptionTextActive: { color: '#3b82f6' },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
    modalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, paddingHorizontal: 16, backgroundColor: '#f8fafc', borderTopWidth: 1, borderTopColor: '#cbd5e1' },
    paginationBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    paginationBtnText: { fontSize: 13, fontWeight: '600', color: '#94a3b8', marginLeft: 6 },
    paginationBtnActive: { backgroundColor: '#a78bfa', borderColor: '#a78bfa' },
    paginationBtnTextActive: { fontSize: 13, fontWeight: 'bold', color: '#ffffff' },
    paginationCenter: { alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 },
    paginationCenterValue: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },

    // Lobby Styles
    lobbyContainer: { backgroundColor: '#ffffff', maxHeight: '80%', overflow: 'hidden', borderTopLeftRadius: 24, borderTopRightRadius: 24, width: '100%', elevation: 15 },
    lobbyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    lobbyTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
    closeLobbyBtn: { width: 32, height: 32, backgroundColor: '#f1f5f9', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    lobbySubtitle: { paddingHorizontal: 20, paddingTop: 16, fontSize: 13, color: '#64748b', lineHeight: 20 },
    teacherLobbyCard: { flexDirection: 'row', backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
    teacherLobbyName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 2 },
    btnJoinLobby: { backgroundColor: '#0d9488', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    btnJoinLobbyText: { color: 'white', fontWeight: 'bold', fontSize: 14 }
});
