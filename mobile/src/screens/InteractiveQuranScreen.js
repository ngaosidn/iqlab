import React, { useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, Platform, Animated, Dimensions, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Keyboard, LayoutAnimation, ActivityIndicator } from 'react-native';
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

export default function InteractiveQuranScreen({ navigation, session }) {
    const onBack = () => navigation.goBack();
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
        handleOpenLobby,
        fontSize,
        updateFontSize,
        targetScrollAyah,
        setTargetScrollAyah
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
                fontSize={fontSize}
                onSend={() => checkAuth(() => handleOpenLobby(selectedSurah?.id, verse.ayat))}
            />
        );
    }, [selectedSurah?.id, playingAyah, expandedTafsir, tafsirDataMap, handlePlayAyah, toggleTafsir, mushafType, isLoggedIn, userProgress, handleOpenLobby, fontSize]);



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
            <StatusBar style="light" backgroundColor="#1e3a8a" translucent={false} />
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
                        {!fontsLoaded && (
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 }}>
                                <ActivityIndicator size="large" color="#3b82f6" />
                                <Text style={{ color: '#94a3b8', marginTop: 12, fontSize: 13, fontWeight: '600' }}>Menyiapkan Mushaf... ✨</Text>
                            </View>
                        )}

                        {fontsLoaded && messages.map((msg, index) => (
                            <ChatBubble key={index} msg={msg} handleOpenSurah={handleOpenSurah} />
                        ))}

                        {isLoading && (
                            <ChatBubble msg={{ type: 'loading' }} />
                        )}
                    </ScrollView>

                    <View style={styles.bottomWrapper}>
                        <View style={[styles.chatInputContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                            <View style={styles.inputInnerContainer}>
                                <TouchableOpacity
                                    style={styles.attachBtn}
                                    onPress={() => setMessages([{ type: 'bot', isGuide: true, content: "Assalamu'alaikum!..." }])}
                                >
                                    <Feather name="trash-2" size={20} color="#94a3b8" />
                                </TouchableOpacity>

                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Tanya apapun tentang Al-Quran..."
                                    placeholderTextColor="#94a3b8"
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
                />

                <TeacherLobby
                    visible={lobbyVisible}
                    onClose={() => setLobbyVisible(false)}
                    activeTeachers={activeTeachers}
                    joinTeacherClass={joinTeacherClass}
                    session={session}
                />

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    iconBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 20, paddingBottom: 40 },
    newSendBtnActive: {
        backgroundColor: '#3b82f6',
    },
    bottomWrapper: { position: 'relative', backgroundColor: 'transparent', zIndex: 20 },
    chatInputContainer: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    inputInnerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    attachBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: '#0f172a',
        paddingHorizontal: 12,
        paddingVertical: 8,
        minHeight: 40,
        maxHeight: 120,
    },
    newSendBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    newSendBtnActive: {
        backgroundColor: '#3b82f6',
    },
});
