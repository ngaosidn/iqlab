import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { Feather, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const ChatBubble = ({ msg, handleOpenSurah, onResume }) => {
  const [showSearchMore, setShowSearchMore] = React.useState(false);

  if (msg.type === 'loading') {
    return (
      <View style={styles.bubbleWrapper}>
        <View style={styles.chatAvatar}><FontAwesome5 name="user-alt" size={14} color="white" /></View>
        <View style={[styles.tutorialCard, { padding: 16, width: 80, alignItems: 'center' }]}><ActivityIndicator size="small" color="#3b82f6" /></View>
      </View>
    );
  }

  if (msg.type === 'user') {
    return (
      <View style={styles.userBubbleWrapper}>
        <View style={styles.userBubble}>
          <Text style={styles.userBubbleText}>{msg.content}</Text>
        </View>
      </View>
    );
  }

  // Bot Guide / Tutorial Card
  if (msg.isGuide) {
    return (
      <View style={styles.bubbleWrapper}>
        <View style={styles.chatAvatar}><FontAwesome5 name="user-alt" size={14} color="white" /></View>
        <View style={styles.tutorialCard}>
          <View style={styles.tutorialHeader}>
            <Text style={styles.sparkleIcon}>✨</Text>
            <Text style={styles.tutorialTitle}>Panduan Interactive Quran</Text>
          </View>
          <Text style={styles.tutorialDesc}>{msg.content}</Text>
          <View style={[styles.guideBox, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
            <View style={styles.guideBoxHeader}>
              <View style={[styles.guideIconContainer, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="book" size={14} color="#3b82f6" />
              </View>
              <Text style={[styles.guideBoxTitle, { color: '#2563eb' }]}>TAMPILKAN SURAH</Text>
            </View>
            <View style={styles.bulletRow}>
              <View style={[styles.bulletDot, { backgroundColor: '#3b82f6' }]} />
              <Text style={styles.bulletText}><Text style={styles.boldText}>Semua Surah:</Text> Ketik [Daftar]</Text>
            </View>
            <View style={styles.bulletRow}>
              <View style={[styles.bulletDot, { backgroundColor: '#3b82f6' }]} />
              <Text style={styles.bulletText}><Text style={styles.boldText}>Cari Surah:</Text> Ketik [Nama/Nomor Surah]</Text>
            </View>
          </View>

          <View style={[styles.guideBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', marginBottom: 0 }]}>
            <View style={styles.guideBoxHeader}>
              <View style={[styles.guideIconContainer, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="search" size={14} color="#16a34a" />
              </View>
              <Text style={[styles.guideBoxTitle, { color: '#15803d' }]}>TAMPILKAN AYAT</Text>
            </View>
            <View style={styles.bulletRow}>
              <View style={[styles.bulletDot, { backgroundColor: '#16a34a' }]} />
              <Text style={styles.bulletText}><Text style={styles.boldText}>Cari Ayat:</Text> Ketik [Nama] [Ayat] (Cth: Yasin 10)</Text>
            </View>
            <View style={styles.bulletRow}>
              <View style={[styles.bulletDot, { backgroundColor: '#16a34a' }]} />
              <Text style={styles.bulletText}><Text style={styles.boldText}>Cari Rentang:</Text> Ketik [Nama] [A-B] (Cth: Yasin 1-5)</Text>
            </View>
            <View style={styles.bulletRow}>
              <View style={[styles.bulletDot, { backgroundColor: '#16a34a' }]} />
              <Text style={styles.bulletText}><Text style={styles.boldText}>Cari Kata:</Text> Ketik [Kata] (Cth: Sabar, Hati)</Text>
            </View>
            <View style={styles.bulletRow}>
              <View style={[styles.bulletDot, { backgroundColor: '#16a34a' }]} />
              <Text style={styles.bulletText}><Text style={styles.boldText}>Cari Acak:</Text> Ketik [Nasihat] / [Acak]</Text>
            </View>
            <View style={styles.bulletRow}>
              <View style={[styles.bulletDot, { backgroundColor: '#16a34a' }]} />
              <Text style={styles.bulletText}><Text style={styles.boldText}>Cari Bookmark:</Text> Ketik [Bookmark] / [Simpanan]</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Surah Card
  if (msg.subType === 'surah_card') {
    return (
      <View style={styles.bubbleWrapper}>
        <View style={styles.chatAvatar}><FontAwesome5 name="user-alt" size={14} color="white" /></View>
        <View style={[styles.botBubble, styles.surahCardContainer]}>
          <LinearGradient
            colors={['#1d4ed8', '#1e3a8a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 20 }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.surahNumberText}>
                  {msg.isRandom ? '✨ Ayat Nasihat | ' : ''}
                  Surah Ke-{msg.surah.id}{msg.targetAyah ? (typeof msg.targetAyah === 'object' ? ` | Ayat ${msg.targetAyah.start}-${msg.targetAyah.end}` : ` | Ayat ${msg.targetAyah}`) : ''}
                </Text>
                <Text style={styles.surahNameLatin}>{msg.surah.name_simple}</Text>
                <Text style={styles.surahMeaning}>"{msg.surah.translated_name.name}"</Text>
              </View>
              <Text style={styles.surahNameArabic}>{msg.surah.name_arabic}</Text>
            </View>
          </LinearGradient>

          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              <View style={styles.surahMetaItem}>
                <Ionicons name="location-outline" size={14} color="#64748b" />
                <Text style={styles.surahMetaText}>
                  {msg.surah.revelation_place === 'makkah' || msg.surah.revelation_place === 'meccan' ? 'Makkiyah' : 'Madaniyah'}
                </Text>
              </View>
              <View style={styles.surahMetaItem}>
                <Ionicons name="list-outline" size={14} color="#64748b" />
                <Text style={styles.surahMetaText}>{msg.surah.verses_count} Ayat</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleOpenSurah(msg.surah, msg.targetAyah)}
              style={styles.readSurahBtn}
            >
              <Ionicons name="book" size={18} color="white" />
              <Text style={styles.readSurahBtnText}>Baca {msg.targetAyah ? (typeof msg.targetAyah === 'object' ? `Ayat ${msg.targetAyah.start}-${msg.targetAyah.end}` : `Ayat ${msg.targetAyah}`) : 'Surah'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Word Search Summary Card
  if (msg.wordSearchSummary) {
    const SURAH_LIMIT = 15;
    const groups = msg.wordSearchSummary.surahGroups;
    const isExpandable = groups.length > SURAH_LIMIT;
    const displayedGroups = showSearchMore ? groups : groups.slice(0, SURAH_LIMIT);

    return (
      <View style={styles.bubbleWrapper}>
        <View style={styles.chatAvatar}><FontAwesome5 name="user-alt" size={14} color="white" /></View>
        <View style={styles.tutorialCard}>
          <View style={styles.tutorialHeader}>
            <Ionicons name="search" size={20} color="#3b82f6" style={{ marginRight: 8 }} />
            <Text style={styles.tutorialTitle}>Hasil Pencarian</Text>
          </View>
          <Text style={styles.botMessageText}>{msg.content}</Text>

          <ScrollView style={[styles.surahListScroll, { maxHeight: 350 }]} nestedScrollEnabled={true}>
            {displayedGroups.map((group, idx) => (
              <View key={idx} style={styles.searchGroupContainer}>
                <View style={styles.searchGroupHeader}>
                  <Text style={styles.searchSurahName}>{group.surah.id}. {group.surah.name_simple}</Text>
                  <View style={styles.searchCountBadge}>
                    <Text style={styles.searchCountText}>{group.count} Ayat{group.totalOccurrences > group.count ? ` (${group.totalOccurrences}x)` : ''}</Text>
                  </View>
                </View>

                <View style={styles.verseChipsContainer}>
                  {group.verses.map((v, vIdx) => (
                    <TouchableOpacity
                      key={vIdx}
                      onPress={() => handleOpenSurah(group.surah, v.ayat)}
                      style={styles.verseChip}
                    >
                      <Text style={styles.verseChipText}>Ayat {v.ayat}{v.occurrences > 1 ? ` (${v.occurrences}x)` : ''}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            {!showSearchMore && isExpandable && (
              <TouchableOpacity
                style={styles.showMoreSearchBtn}
                onPress={() => setShowSearchMore(true)}
              >
                <Text style={styles.showMoreSearchBtnText}>
                  Lihat {groups.length - SURAH_LIMIT} Surah Lainnya...
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    );
  }

  // Bookmarks List Card
  if (msg.bookmarks) {
    return (
      <View style={styles.bubbleWrapper}>
        <View style={styles.chatAvatar}><FontAwesome5 name="user-alt" size={14} color="white" /></View>
        <View style={styles.tutorialCard}>
          <View style={styles.tutorialHeader}>
            <Ionicons name="bookmark" size={20} color="#d97706" style={{ marginRight: 8 }} />
            <Text style={styles.tutorialTitle}>Daftar Ayat Favorit</Text>
          </View>
          <Text style={styles.botMessageText}>{msg.content}</Text>

          <ScrollView style={[styles.surahListScroll, { maxHeight: 350 }]} nestedScrollEnabled={true}>
            {msg.bookmarks.map((bm, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleOpenSurah({ id: bm.surah_id, name_simple: bm.surah_name }, bm.ayah_number)}
                style={styles.bookmarkItem}
              >
                <View style={styles.bookmarkIconBox}>
                  <Ionicons name="bookmark" size={18} color="#d97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bookmarkTitle}>{bm.surah_name}</Text>
                  <Text style={styles.bookmarkSubtitle}>Ayat ke-{bm.ayah_number}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  }

  // Multi-Track Suggestion Card (Two-Track System)
  if (msg.suggestions && msg.suggestions.length > 0) {
    return (
      <View style={styles.bubbleWrapper}>
        <View style={styles.chatAvatar}><FontAwesome5 name="user-alt" size={14} color="white" /></View>
        <View style={styles.tutorialCard}>
          <View style={styles.tutorialHeader}>
            <Ionicons name="sparkles" size={20} color="#a78bfa" style={{ marginRight: 8 }} />
            <Text style={styles.tutorialTitle}>Saran AI 🤖</Text>
          </View>
          <Text style={styles.botMessageText}>{msg.content}</Text>

          <View style={{ marginTop: 16, gap: 10 }}>
            {msg.suggestions.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => onResume(item)}
                activeOpacity={0.8}
                style={styles.suggestionBtnWrapper}
              >
                <LinearGradient
                  colors={item.icon === 'flag' ? ['#f59e0b', '#d97706'] : ['#3b82f6', '#1d4ed8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.suggestionGradient}
                >
                  <View style={styles.suggestionIconContainer}>
                    <Ionicons
                      name={item.icon === 'flag' ? 'flag' : 'footsteps'}
                      size={20}
                      color="white"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.suggestionTitle}>{item.title}</Text>
                    <Text style={styles.suggestionSubtitle}>
                      {item.surah_name} • Ayat {item.ayah_number}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  }

  // Fallback for old single suggestion format (Backward compatibility)
  if (msg.lastReadSuggestion) {
    return (
      <View style={styles.bubbleWrapper}>
        <View style={styles.chatAvatar}><FontAwesome5 name="user-alt" size={14} color="white" /></View>
        <View style={styles.tutorialCard}>
          <View style={styles.tutorialHeader}>
            <Ionicons name="time" size={20} color="#3b82f6" style={{ marginRight: 8 }} />
            <Text style={styles.tutorialTitle}>Lanjut Tadabbur?</Text>
          </View>
          <Text style={styles.botMessageText}>{msg.content}</Text>

          <TouchableOpacity
            onPress={() => onResume(msg.lastReadSuggestion)}
            style={[styles.readSurahBtn, { marginTop: 16, backgroundColor: '#3b82f6' }]}
          >
            <Ionicons name="play" size={18} color="white" />
            <Text style={styles.readSurahBtnText}>{msg.suggestionTitle || 'Lanjutkan Membaca'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Generic Bot Message / List of Surahs
  return (
    <View style={styles.bubbleWrapper}>
      <View style={styles.chatAvatar}><FontAwesome5 name="user-alt" size={14} color="white" /></View>
      <View style={styles.tutorialCard}>
        <Text style={styles.botMessageText}>{msg.content}</Text>
        {msg.surahs && (
          <ScrollView style={styles.surahListScroll} nestedScrollEnabled={true}>
            {msg.surahs.map((surah) => (
              <TouchableOpacity onPress={() => handleOpenSurah(surah)} key={surah.id} style={styles.surahListItem}>
                <View style={styles.surahIdBox}><Text style={styles.surahIdText}>{surah.id}</Text></View>
                <View style={styles.surahNameCol}>
                  <Text style={styles.surahLatinName}>{surah.name_simple}</Text>
                  <Text style={styles.surahMeaningText}>{surah.translated_name?.name || 'Memuat...'}</Text>
                </View>
                <View style={styles.surahMetaCol}>
                  <Text style={styles.surahArabicNameStatic}>{surah.name_arabic}</Text>
                  <Text style={styles.ayahPillText}>{surah.revelation_place?.toLowerCase() === 'makkah' ? 'Makkiyah' : 'Madaniyah'} • {surah.verses_count} AYAT</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bubbleWrapper: { position: 'relative', marginLeft: 15, marginBottom: 20 },
  chatAvatar: { position: 'absolute', left: 0, bottom: -10, width: 32, height: 32, borderRadius: 16, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', zIndex: 50, borderWidth: 2, borderColor: '#ffffff' },
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
  guideIconContainer: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  guideBoxTitle: { fontSize: 14, fontWeight: 'bold' },
  bulletText: { fontSize: 14, color: '#475569', lineHeight: 22, marginBottom: 4, flex: 1 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  bulletDot: { width: 4, height: 4, borderRadius: 2, marginTop: 8, marginRight: 8 },
  boldText: { fontWeight: 'bold', color: '#334155' },
  botBubble: { backgroundColor: 'white', borderRadius: 24, borderBottomLeftRadius: 4, overflow: 'hidden' },
  surahCardContainer: { width: '85%', maxWidth: 320 },
  surahNumberText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 'bold', marginBottom: 2 },
  surahNameLatin: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  surahMeaning: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontStyle: 'italic', marginTop: 2 },
  surahNameArabic: { color: 'white', fontSize: 32, fontWeight: 'bold', fontFamily: Platform.OS === 'android' ? 'serif' : 'System' },
  surahMetaItem: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4 },
  surahMetaText: { fontSize: 12, fontWeight: 'bold', color: '#475569' },
  readSurahBtn: { backgroundColor: '#3b82f6', padding: 14, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
  readSurahBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  surahListScroll: { maxHeight: 400, marginTop: 16 },
  surahListItem: { flexDirection: 'row', backgroundColor: '#ffffff', borderColor: '#f1f5f9', borderWidth: 1.5, borderRadius: 20, padding: 14, alignItems: 'center', marginBottom: 12 },
  surahIdBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', marginRight: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  surahIdText: { fontSize: 16, fontWeight: 'bold', color: '#64748b' },
  surahNameCol: { flex: 1, justifyContent: 'center' },
  surahLatinName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  surahArabicNameStatic: { fontSize: 24, color: '#2563eb', marginBottom: 2 },
  surahMeaningText: { fontSize: 13, color: '#64748b', marginTop: 2, fontWeight: '500' },
  surahMetaCol: { alignItems: 'flex-end', justifyContent: 'center' },
  ayahPillText: { fontSize: 11, fontWeight: 'bold', color: '#64748b' },
  searchGroupContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  searchGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  searchSurahName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155'
  },
  searchCountBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  searchCountText: {
    fontSize: 10,
    color: '#2563eb',
    fontWeight: 'bold'
  },
  verseChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  verseChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10
  },
  verseChipText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500'
  },
  showMoreSearchBtn: {
    backgroundColor: '#eff6ff',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderStyle: 'dashed',
  },
  showMoreSearchBtnText: {
    color: '#3b82f6',
    fontWeight: 'bold',
    fontSize: 13,
  },
  bookmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  bookmarkIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#fffbeb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  bookmarkTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155'
  },
  bookmarkSubtitle: {
    fontSize: 12,
    color: '#64748b'
  },
  suggestionBtnWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  suggestionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  suggestionIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  suggestionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  suggestionSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  }
});

export default ChatBubble;
