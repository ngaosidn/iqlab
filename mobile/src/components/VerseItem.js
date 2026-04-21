import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';

const VerseItem = React.memo(({ 
  verse, 
  surahId, 
  isPlaying, 
  isExpanded, 
  onPlay, 
  onToggleTafsir, 
  tafsirText,
  fontFamily,
  onAuthRestricted,
  isLoggedIn,
  isInteractiveActive,
  isPassed,
  isLocked,
  onSend,
  onShare,
  fontSize,
  highlightKeyword,
  onBookmark,
  isBookmarked,
  onCheckpoint,
  isCheckpoint,
  onVerseTouch
}) => {
  const renderHighlightedTranslation = (text, keyword) => {
    if (!text) return null;
    const cleanText = text.replace(/<sup[^>]*>.*?<\/sup>/g, '');
    
    if (!keyword) {
      return <Text style={styles.verseTranslationText}>{cleanText}</Text>;
    }
    
    const parts = cleanText.split(new RegExp(`(${keyword})`, 'gi'));
    
    return (
      <Text style={styles.verseTranslationText}>
        {parts.map((part, index) => 
          part.toLowerCase() === keyword.toLowerCase() ? (
            <Text key={index} style={styles.highlightText}>{part}</Text>
          ) : (
            part
          )
        )}
      </Text>
    );
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.85} 
      onPress={onVerseTouch}
      style={styles.touchWrapper}
    >
      <View style={styles.verseCardModal}>
        <View style={styles.verseCardTop}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <View style={styles.verseNumberBox}><Text style={styles.verseNumberText}>{verse.ayat}</Text></View>
            <View style={styles.actionCircleBtnGroup}>
              <TouchableOpacity onPress={() => onPlay(surahId, verse.ayat)} style={[styles.actionCircleBtn, isPlaying && styles.actionCircleBtnActive]}>
                <FontAwesome5 name={isPlaying ? 'pause' : 'play'} size={12} color={isPlaying ? '#ffffff' : '#3b82f6'} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => onAuthRestricted(onBookmark)} 
                style={[styles.actionCircleBtn, isBookmarked && { backgroundColor: '#fffbeb', borderColor: '#fef3c7' }]}
              >
                <FontAwesome5 name="bookmark" size={11} color={isBookmarked ? '#d97706' : '#64748b'} solid={isBookmarked} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => onAuthRestricted(onCheckpoint)} 
                style={[styles.actionCircleBtn, isCheckpoint && { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}
              >
                <FontAwesome5 name="flag" size={11} color={isCheckpoint ? '#ef4444' : '#64748b'} solid={isCheckpoint} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.verseTagsRow}>
          <TouchableOpacity 
            style={[styles.tafsirTag, isExpanded && { backgroundColor: '#fef3c7', borderColor: '#d97706' }]} 
            onPress={() => onToggleTafsir(verse.ayat)}
            activeOpacity={0.7}
          >
            <Feather name="book-open" size={13} color="#d97706" style={{marginRight: 6}} />
            <Text style={styles.tafsirTagText}>Tafsir</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tagBase, isLoggedIn ? styles.tajwidTagActive : styles.grayTag]} 
            onPress={() => onAuthRestricted(() => console.log('Tajwid'))}
          >
            <Feather name="edit-2" size={13} color={isLoggedIn ? '#9333ea' : '#94a3b8'} style={{marginRight: 6}} />
            <Text style={[styles.tagTextBase, isLoggedIn ? styles.tajwidTagTextActive : styles.grayTagText]}>Tajwid</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tagBase, isLoggedIn ? styles.shareTagActive : styles.grayTag]} 
            onPress={onShare}
          >
            <Feather name="share-2" size={13} color={isLoggedIn ? '#2563eb' : '#94a3b8'} style={{marginRight: 6}} />
            <Text style={[styles.tagTextBase, isLoggedIn ? styles.shareTagTextActive : styles.grayTagText]}>Share</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.tagBase, 
              (isLoggedIn && isInteractiveActive) ? styles.kirimTagActive : 
              (isLoggedIn && isPassed) ? styles.passedTag : 
              styles.grayTag
            ]} 
            onPress={() => onAuthRestricted(onSend)}
            disabled={!isInteractiveActive}
          >
            <Feather 
              name={isPassed ? "check-circle" : isLocked ? "lock" : "send"} 
              size={13} 
              color={(isLoggedIn && isInteractiveActive) ? '#059669' : (isLoggedIn && isPassed) ? '#16a34a' : '#94a3b8'} 
              style={{marginRight: 6}} 
            />
            <Text style={[
              styles.tagTextBase, 
              (isLoggedIn && isInteractiveActive) ? styles.kirimTagTextActive : 
              (isLoggedIn && isPassed) ? styles.passedTagText : 
              styles.grayTagText
            ]}>
               {isPassed ? 'Lulus' : isLocked ? 'Terkunci' : 'Kirim'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.verseTextContainer}>
          <Text style={[
            styles.verseArabicText, 
            { 
              fontFamily: fontFamily || 'Uthmanic-Neo-Color',
              fontSize: fontSize || 30,
              lineHeight: (fontSize || 30) * 1.8
            }
          ]}>
            {verse.teks_arab}
          </Text>
          {renderHighlightedTranslation(verse.terjemahan, highlightKeyword)}
        </View>

        {isExpanded && (
          <View style={styles.tafsirContainer}>
            <Text style={styles.tafsirTitle}>📖 Tafsir Kemenag - Ayat {verse.ayat}</Text>
            <Text style={styles.tafsirBody}>{tafsirText || 'Sedang memuat tafsir, mohon tunggu sebentar...'}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  touchWrapper: {
    width: '100%',
    marginBottom: 12,
  },
  verseCardModal: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  verseCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  verseNumberBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#eff6ff',
  },
  verseNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  actionCircleBtnGroup: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  actionCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eff6ff',
  },
  actionCircleBtnActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
  },
  verseTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  tafsirTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tafsirTagText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#d97706',
  },
  tagBase: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagTextBase: {
    fontSize: 12,
    fontWeight: '600',
  },
  grayTag: {
    backgroundColor: '#f8fafc',
    borderColor: '#f1f5f9',
  },
  grayTagText: {
    color: '#94a3b8',
  },
  tajwidTagActive: {
    backgroundColor: '#faf5ff',
    borderColor: '#e9d5ff',
  },
  tajwidTagTextActive: {
    color: '#9333ea',
  },
  shareTagActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  shareTagTextActive: {
    color: '#2563eb',
  },
  kirimTagActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#d1fae5',
  },
  kirimTagTextActive: {
    color: '#059669',
  },
  passedTag: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  passedTagText: {
    color: '#16a34a',
  },
  verseTextContainer: {
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  verseArabicText: {
    fontSize: 28,
    lineHeight: 52,
    color: '#0f172a',
    textAlign: 'right',
    marginBottom: 16,
  },
  verseTranslationText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#64748b',
    lineHeight: 24,
  },
  tafsirContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  tafsirTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 8,
  },
  tafsirBody: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 24,
  },
  highlightText: {
    backgroundColor: '#fde047',
    color: '#1e3a8a',
    fontWeight: 'bold',
    borderRadius: 4,
    paddingHorizontal: 2,
    overflow: 'hidden',
  }
});

export default VerseItem;
