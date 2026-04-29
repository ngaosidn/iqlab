import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function BookmarkScreen({ navigation }) {
  const { isDarkMode, setIsDarkMode } = useTheme();

  const theme = isDarkMode ? {
    bgFull: '#0f172a',
    topBarBg: '#0f172a',
    textMain: '#f8fafc',
    textSub: '#94a3b8',
    cardBg: '#1e293b',
    border: '#334155',
    toggleBg: '#1e293b',
    toggleBorder: 'transparent',
  } : {
    bgFull: '#f1f5f9',
    topBarBg: '#f1f5f9',
    textMain: '#1e293b',
    textSub: '#64748b',
    cardBg: '#f8fafc',
    border: '#f1f5f9',
    toggleBg: '#f8fafc',
    toggleBorder: 'transparent',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgFull }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      <View style={[styles.header, { backgroundColor: theme.topBarBg }]}>
        <Text style={[styles.headerTitle, { color: theme.textMain }]}>Tersimpan</Text>
        <TouchableOpacity 
          style={[styles.darkModeToggle, { backgroundColor: theme.toggleBg, borderColor: theme.toggleBorder }]} 
          onPress={() => setIsDarkMode(!isDarkMode)}
          activeOpacity={0.7}
        >
          <Feather name={isDarkMode ? "sun" : "moon"} size={22} color={isDarkMode ? "#eab308" : "#64748b"} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Feather name="bookmark" size={40} color={theme.textSub} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.textMain }]}>Belum ada simpanan</Text>
          <Text style={[styles.emptyDesc, { color: theme.textSub }]}>
            Ayat atau doa yang kamu simpan akan muncul di sini agar mudah dibaca kembali.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.3,
  },
  darkModeToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
});
