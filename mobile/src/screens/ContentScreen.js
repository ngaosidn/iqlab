import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const DUMMY_REELS = [
  { id: 1, title: 'Keutamaan Membaca Al-Kahfi', views: '12K', duration: '0:59', image: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=400&q=80' },
  { id: 2, title: 'Adab Berdoa Sesuai Sunnah', views: '8.5K', duration: '1:15', image: 'https://images.unsplash.com/photo-1590076215667-875d4ef2d7ad?w=400&q=80' },
  { id: 3, title: 'Sejarah Masjid Nabawi', views: '20K', duration: '0:45', image: 'https://images.unsplash.com/photo-1564352939794-436f4aa4c577?w=400&q=80' },
];

const DUMMY_ARTICLES = [
  { id: 1, title: 'Memahami Makna Sabar dalam Al-Baqarah 153', category: 'Tafsir', readTime: '5 min', image: 'https://images.unsplash.com/photo-1609599006353-e629aaab31ce?w=400&q=80' },
  { id: 2, title: '5 Sunnah Harian yang Sering Terlupakan', category: 'Fikih', readTime: '3 min', image: 'https://images.unsplash.com/photo-1605335962804-0ee216962f3a?w=400&q=80' },
  { id: 3, title: 'Pentingnya Menjaga Lisan Menurut Hadits', category: 'Akhlaq', readTime: '4 min', image: 'https://images.unsplash.com/photo-1598288825227-2e11ee9cc2e4?w=400&q=80' },
];

export default function ContentScreen({ navigation }) {
  const { isDarkMode, setIsDarkMode, theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgFull }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} backgroundColor={theme.topBarBg} translucent={false} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.topBarBg }]}>
        <Text style={[styles.headerTitle, { color: theme.textMain }]}>Eksplorasi Konten</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity 
            style={[styles.darkModeToggle, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc' }]} 
            onPress={() => setIsDarkMode(!isDarkMode)}
            activeOpacity={0.7}
          >
            <Feather name={isDarkMode ? "sun" : "moon"} size={22} color={isDarkMode ? "#eab308" : "#64748b"} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.darkModeToggle, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc' }]}>
            <Feather name="search" size={22} color={isDarkMode ? "#94a3b8" : "#64748b"} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* LIVE YOUTUBE SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textMain }]}>Kajian Langsung</Text>
            <View style={styles.liveBadgeBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
          </View>
          
          <TouchableOpacity activeOpacity={0.9} style={[styles.liveCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <ImageBackground 
              source={{ uri: 'https://images.unsplash.com/photo-1519817914152-2a640166cb83?w=800&q=80' }} 
              style={styles.liveThumbnail}
              imageStyle={{ borderRadius: 16 }}
            >
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.liveGradient}
              >
                <View style={styles.playIconWrapper}>
                  <Ionicons name="play" size={32} color="#fff" />
                </View>
                <View style={styles.liveInfo}>
                  <Text style={styles.liveTitle}>Tadabbur Surat Al-Fatihah Bersama Ustadz Ahmad</Text>
                  <Text style={styles.liveSubtitle}>1,234 sedang menonton • I-QLab Channel</Text>
                </View>
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>
        </View>

        {/* REELS SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textMain }]}>I-QLab Shorts</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reelsScroll}>
            {DUMMY_REELS.map(reel => (
              <TouchableOpacity key={reel.id} activeOpacity={0.9} style={styles.reelCard}>
                <Image source={{ uri: reel.image }} style={styles.reelImage} contentFit="cover" />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.9)']}
                  style={styles.reelGradient}
                >
                  <View style={styles.reelMetaTop}>
                    <View style={styles.reelDurationBadge}>
                      <Ionicons name="time-outline" size={12} color="#fff" style={{marginRight: 4}} />
                      <Text style={styles.reelDurationText}>{reel.duration}</Text>
                    </View>
                  </View>
                  <View style={styles.reelMetaBottom}>
                    <Text style={styles.reelTitle} numberOfLines={2}>{reel.title}</Text>
                    <View style={styles.reelViews}>
                      <Ionicons name="eye-outline" size={14} color="#ccc" style={{marginRight: 4}} />
                      <Text style={styles.reelViewsText}>{reel.views} tayangan</Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ARTICLES SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textMain }]}>Artikel Pilihan</Text>
          </View>
          
          <View style={styles.articlesContainer}>
            {DUMMY_ARTICLES.map(article => (
              <TouchableOpacity key={article.id} activeOpacity={0.8} style={[styles.articleCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Image source={{ uri: article.image }} style={styles.articleImage} contentFit="cover" />
                <View style={styles.articleContent}>
                  <View style={styles.articleTags}>
                    <View style={[styles.articleCategoryBadge, { backgroundColor: theme.btnBg }]}>
                      <Text style={[styles.articleCategoryText, { color: theme.textSub }]}>{article.category}</Text>
                    </View>
                    <View style={styles.articleTimeBadge}>
                      <Feather name="clock" size={12} color={theme.textSub} style={{marginRight: 4}} />
                      <Text style={[styles.articleTimeText, { color: theme.textSub }]}>{article.readTime}</Text>
                    </View>
                  </View>
                  <Text style={[styles.articleTitle, { color: theme.textMain }]} numberOfLines={2}>{article.title}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  darkModeToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
  },
  scrollView: { flex: 1 },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  
  // LIVE YOUTUBE
  liveCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  liveThumbnail: {
    width: '100%',
    height: 200,
    justifyContent: 'flex-end',
  },
  liveGradient: {
    padding: 20,
    height: '100%',
    justifyContent: 'flex-end',
    borderRadius: 16,
  },
  playIconWrapper: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveInfo: {},
  liveTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  liveSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  liveBadgeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444', marginRight: 6,
  },
  liveBadgeText: {
    color: '#ef4444', fontSize: 12, fontWeight: '700',
  },

  // REELS
  reelsScroll: {
    gap: 12,
    paddingRight: 20,
  },
  reelCard: {
    width: 130,
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
  },
  reelImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  reelGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    padding: 12,
  },
  reelMetaTop: {
    alignItems: 'flex-end',
  },
  reelDurationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
  },
  reelDurationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  reelMetaBottom: {},
  reelTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 6,
  },
  reelViews: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reelViewsText: {
    color: '#ccc',
    fontSize: 11,
  },

  // ARTICLES
  articlesContainer: {
    gap: 12,
  },
  articleCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  articleImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  articleContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  articleTags: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  articleCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
  },
  articleCategoryText: {
    fontSize: 10,
    fontWeight: '700',
  },
  articleTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  articleTimeText: {
    fontSize: 11,
  },
  articleTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
});
