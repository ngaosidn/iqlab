import React, { useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, Platform, Animated, Dimensions, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Keyboard, LayoutAnimation, ActivityIndicator, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import HomeHeader from '../components/HomeHeader';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../lib/toastConfig';

// Hooks & Components
import { useInteractiveQuran } from '../hooks/useInteractiveQuran';
import VerseItem from '../components/VerseItem';
import JitsiWebView from '../components/JitsiWebView';

// New Modular Components
import ChatBubble from '../components/quran/ChatBubble';
import MushafModal from '../components/quran/MushafModal';
import TeacherLobby from '../components/quran/TeacherLobby';
import ShareModal from '../components/quran/ShareModal';

export default function InteractiveQuranScreen({ navigation, session }) {
    const onBack = () => navigation.goBack();
    const insets = useSafeAreaInsets();
    const screenWidth = Dimensions.get('window').width;
    const isLoggedIn = !!session?.user;

    const quranHook = useInteractiveQuran(onBack, session);

    // Pulse animation for loading text
    const loadingPulseAnim = React.useRef(new Animated.Value(0.4)).current;

    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(loadingPulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(loadingPulseAnim, {
                    toValue: 0.4,
                    duration: 1000,
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, []);

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
        handleOpenLobby,
        fontSize,
        updateFontSize,
        targetScrollAyah,
        setTargetScrollAyah,
        bookmarks,
        toggleBookmark,
        handleResumeReading,
        readingCheckpoint,
        toggleCheckpoint,
        handleClearHistory,
        onAutoHistoryUpdate,
        isListening,
        toggleListening,
        voicePulseAnim,
        activeSurahUsers,
        versePresenceMap
    } = quranHook;

    const [shareModalVisible, setShareModalVisible] = React.useState(false);
    const [sharingVerse, setSharingVerse] = React.useState(null);

    const handleShareVerse = React.useCallback((verse) => {
        setSharingVerse(verse);
        setShareModalVisible(true);
    }, []);

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
                fontSize={fontSize}
                onSend={() => checkAuth(() => handleOpenLobby(selectedSurah?.id, verse.ayat))}
                onShare={() => checkAuth(() => handleShareVerse(verse))}
                highlightKeyword={quranHook.searchHighlight}
                onBookmark={() => toggleBookmark(verse)}
                isBookmarked={bookmarks.some(b => b.surah_id === (selectedSurah?.id) && b.ayah_number === verse.ayat)}
                onCheckpoint={() => toggleCheckpoint(verse)}
                isCheckpoint={readingCheckpoint?.surah_id === (selectedSurah?.id) && readingCheckpoint?.ayah_number === verse.ayat}
                onVerseTouch={() => onAutoHistoryUpdate(verse)}
                othersCount={versePresenceMap[verse.ayat] || 0}
            />
        );
    }, [selectedSurah?.id, playingAyah, expandedTafsir, tafsirDataMap, handlePlayAyah, toggleTafsir, mushafType, isLoggedIn, userProgress, handleOpenLobby, fontSize, handleShareVerse, quranHook.searchHighlight, toggleBookmark, bookmarks, toggleCheckpoint, readingCheckpoint]);



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
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
            <StatusBar style="dark" backgroundColor="#ffffff" translucent={false} />
            <View style={styles.container}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={0}
                    enabled={Platform.OS === 'ios'}
                >
                    {/* MODERN LIGHT HEADER */}
                    <View style={styles.modernHeader}>
                        <TouchableOpacity style={styles.backBtnLight} onPress={onBack}>
                            <Feather name="arrow-left" size={22} color="#1e293b" />
                        </TouchableOpacity>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.headerTitleLight}>Ahlan Bikum! 👋</Text>
                            <View style={styles.statusPill}>
                                <View style={styles.statusDot} />
                                <Text style={styles.headerSubtitleLight}>Tadabbur Bersama AI</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.iconBtnLight} onPress={handleClearHistory}>
                            <Feather name="trash-2" size={18} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>

                    <View style={{ flex: 1 }}>
                        {(messages.length === 0 || !fontsLoaded) && (
                            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                                <LinearGradient
                                    colors={['rgba(59, 130, 246, 0.1)', 'transparent']}
                                    style={{ width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}
                                >
                                    <ActivityIndicator size="large" color="#3b82f6" />
                                </LinearGradient>
                                <Animated.Text style={{
                                    color: '#94a3b8',
                                    fontSize: 15,
                                    fontWeight: '600',
                                    opacity: loadingPulseAnim,
                                    letterSpacing: 0.5
                                }}>
                                    Tunggu sebentar... ✨
                                </Animated.Text>
                                <Text style={{ color: '#64748b', fontSize: 12, marginTop: 8 }}>Menyiapkan pengalaman tadabbur Sahabat</Text>
                            </View>
                        )}
                        <FlatList
                            ref={scrollViewRef}
                            data={messages}
                            keyExtractor={(item, index) => String(index)}
                            renderItem={({ item: msg }) => (
                                <ChatBubble
                                    msg={msg}
                                    handleOpenSurah={handleOpenSurah}
                                    onResume={handleResumeReading}
                                />
                            )}
                            ListFooterComponent={isLoading ? <ChatBubble msg={{ type: 'loading' }} /> : null}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scrollContent}
                            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                            onLayout={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode="on-drag"
                        />
                    </View>

                    {/* FLOATING INPUT DOCK */}
                    <View style={styles.bottomWrapper}>
                        <View style={[styles.floatingInputDock, { marginBottom: Math.max(insets.bottom, 16) }]}>
                            <TouchableOpacity
                                style={styles.attachBtn}
                                onPress={handleClearHistory}
                            >
                                <Feather name="trash-2" size={20} color="#94a3b8" />
                            </TouchableOpacity>

                            <Animated.View style={{ transform: [{ scale: voicePulseAnim }] }}>
                                <TouchableOpacity
                                    style={[styles.voiceBtn, isListening && styles.voiceBtnActive]}
                                    onPress={toggleListening}
                                >
                                    <Feather name={isListening ? "mic" : "mic"} size={20} color={isListening ? "#ef4444" : "#64748b"} />
                                </TouchableOpacity>
                            </Animated.View>

                            <TextInput
                                style={styles.textInput}
                                placeholder={isListening ? "Mendengarkan..." : "Tanya apapun tentang Al-Quran..."}
                                placeholderTextColor={isListening ? "#ef4444" : "#94a3b8"}
                                value={input}
                                onChangeText={setInput}
                                onSubmitEditing={handleSend}
                                returnKeyType="send"
                                multiline={true}
                            />

                            <TouchableOpacity
                                style={[styles.newSendBtn, input.trim().length > 0 && styles.newSendBtnActive]}
                                onPress={handleSend}
                                disabled={input.trim().length === 0}
                            >
                                <Feather name="arrow-up" size={18} color={input.trim().length > 0 ? "white" : "#94a3b8"} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>

                <MushafModal
                    visible={modalVisible}
                    insets={insets}
                    panY={panY}
                    panResponder={panResponder}
                    selectedSurah={selectedSurah}
                    versesData={versesData}
                    modalScrollRef={modalScrollRef}
                    renderVerseItem={renderVerseItem}
                    setModalVisible={setModalVisible}
                    sound={sound}
                    setPlayingAyah={setPlayingAyah}
                    isAutoPlay={isAutoPlay}
                    checkAuth={checkAuth}
                    setIsAutoPlay={setIsAutoPlay}
                    mushafType={mushafType}
                    setMushafType={setMushafType}
                    expandedTafsir={expandedTafsir}
                    playingAyah={playingAyah}
                    isLoggedIn={isLoggedIn}
                    tafsirDataMap={tafsirDataMap}
                    userProgress={userProgress}
                    fontSize={fontSize}
                    updateFontSize={updateFontSize}
                    targetScrollAyah={targetScrollAyah}
                    setTargetScrollAyah={setTargetScrollAyah}
                    searchHighlight={quranHook.searchHighlight}
                    onShare={handleShareVerse}
                    bookmarks={bookmarks}
                    toggleBookmark={toggleBookmark}
                    readingCheckpoint={readingCheckpoint}
                    toggleCheckpoint={toggleCheckpoint}
                    onAutoHistoryUpdate={onAutoHistoryUpdate}
                    activeSurahUsers={activeSurahUsers}
                    versePresenceMap={versePresenceMap}
                />

                <TeacherLobby
                    visible={lobbyVisible}
                    onClose={() => setLobbyVisible(false)}
                    activeTeachers={activeTeachers}
                    joinTeacherClass={joinTeacherClass}
                    session={session}
                />

                <ShareModal
                    visible={shareModalVisible}
                    onClose={() => setShareModalVisible(false)}
                    verse={sharingVerse}
                    surahName={selectedSurah?.name_simple || ''}
                />

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    
    // Modern Header Styles
    modernHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        zIndex: 10,
    },
    backBtnLight: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center'
    },
    headerTextContainer: {
        flex: 1,
        marginLeft: 16,
    },
    headerTitleLight: {
        fontSize: 18, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3
    },
    statusPill: {
        flexDirection: 'row', alignItems: 'center', marginTop: 2
    },
    statusDot: {
        width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981', marginRight: 6
    },
    headerSubtitleLight: {
        fontSize: 12, fontWeight: '600', color: '#64748b'
    },
    iconBtnLight: {
        width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center'
    },

    scrollContent: { padding: 20, paddingBottom: 100 },
    
    // Floating Input Dock
    bottomWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, zIndex: 20, backgroundColor: 'transparent' },
    floatingInputDock: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 30,
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 15,
        elevation: 10,
    },
    attachBtn: {
        width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', display: 'none' // Hidden to clean up since trash is in header
    },
    voiceBtn: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', marginRight: 8
    },
    voiceBtnActive: {
        backgroundColor: '#fee2e2',
    },
    textInput: {
        flex: 1,
        fontSize: 15,
        color: '#0f172a',
        paddingHorizontal: 8,
        paddingVertical: 10,
        minHeight: 40,
        maxHeight: 120,
    },
    newSendBtn: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginLeft: 8
    },
    newSendBtnActive: {
        backgroundColor: '#3b82f6',
    },
});
