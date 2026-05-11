import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  useWindowDimensions 
} from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import RenderHtml from 'react-native-render-html';
import { useTheme } from '../context/ThemeContext';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AnnouncementDetailScreen({ route, navigation }) {
  const { announcement } = route.params;
  const { theme, isDarkMode } = useTheme();
  const { width } = useWindowDimensions();

  const formattedDate = format(new Date(announcement.published_at), 'EEEE, d MMMM yyyy', { locale: id });

  const tagsStyles = {
    body: {
      color: theme.textMain,
      fontSize: 16,
      lineHeight: 24,
    },
    p: {
      marginBottom: 12,
    },
    strong: {
      fontWeight: 'bold',
      color: isDarkMode ? '#818cf8' : '#4f46e5',
    },
    ul: {
      marginBottom: 12,
    },
    li: {
      marginBottom: 4,
    },
    a: {
      color: '#4f46e5',
      textDecorationLine: 'underline',
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bgFull }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* HEADER IMAGE */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: announcement.image_url }} 
            style={styles.headerImage} 
            contentFit="cover" 
          />
          <LinearGradient 
            colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.7)']} 
            style={StyleSheet.absoluteFill} 
          />
          
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Pengumuman</Text>
            </View>
            <Text style={styles.title}>{announcement.title}</Text>
          </View>
        </View>

        {/* CONTENT SECTION */}
        <View style={[styles.contentCard, { backgroundColor: theme.bgFull }]}>
          <View style={styles.metaRow}>
            <View style={[styles.iconBox, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }]}>
              <Feather name={announcement.icon || 'megaphone'} size={20} color={isDarkMode ? '#818cf8' : '#4f46e5'} />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.dateText, { color: theme.textSub }]}>{formattedDate}</Text>
              <Text style={[styles.targetText, { color: theme.textSub }]}>Untuk: {announcement.target_audience === 'semua' ? 'Semua Pengguna' : 'I-QLab Only'}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          <View style={styles.htmlContainer}>
            <RenderHtml
              contentWidth={width - 48}
              source={{ html: announcement.content || '<p>Tidak ada detail konten.</p>' }}
              tagsStyles={tagsStyles}
            />
          </View>
        </View>
      </ScrollView>

      {/* FLOATING CLOSE BUTTON (OPTIONAL) */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
         <TouchableOpacity 
            style={[styles.closeButton, { backgroundColor: '#4f46e5' }]}
            onPress={() => navigation.goBack()}
         >
            <Text style={styles.closeButtonText}>Selesai Membaca</Text>
         </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: 350,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerContent: {
    position: 'absolute',
    bottom: 30,
    left: 24,
    right: 24,
  },
  badge: {
    backgroundColor: '#4f46e5',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
  },
  contentCard: {
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 500,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  targetText: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 24,
  },
  htmlContainer: {
    paddingBottom: 100,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: 'transparent',
  },
  closeButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
