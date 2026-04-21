import { Platform } from 'react-native';
import { databaseService } from './databaseService';

// Hanya import JSON di web untuk menghemat size APK & RAM di Mobile
const JSON_DATA = Platform.OS === 'web' ? {
  uthmani: require('../../assets/data/verse.json'),
  indopak: require('../../assets/data/indopak.json')
} : null;

export const quranService = {
  async fetchSurahs() {
    try {
      const response = await fetch('https://api.quran.com/api/v4/chapters?language=id');
      const data = await response.json();
      return data.chapters || [];
    } catch (error) {
      console.error('Error fetchSurahs:', error);
      return [];
    }
  },

  async getSurahVerses(surahId, mushafType = 'uthmani') {
    if (Platform.OS === 'web') {
      return JSON_DATA[mushafType]?.[surahId]?.ayat || [];
    }

    try {
      // 1. Prioritas Utama: SQLite (Sangat Cepat & Modern)
      const verses = await databaseService.getVerses(surahId, mushafType);
      
      if (verses && verses.length > 0) {
        console.log(`🔌 Mode: SQLite (Memuat Surah ${surahId} - ${mushafType})`);
        return verses;
      }

      // 2. Fallback jika SQLite kosong (biasanya di Web)
      if (JSON_DATA) {
        console.log(`📂 Mode: JSON Fallback (Memuat Surah ${surahId} - ${mushafType})`);
        const source = JSON_DATA[mushafType];
        return source?.[surahId]?.ayat || [];
      }
      
      return [];
    } catch (error) {
      console.log('Error fetching verses:', error.message);
      if (JSON_DATA) {
        const source = JSON_DATA[mushafType];
        return source?.[surahId]?.ayat || [];
      }
      return [];
    }
  },

  async fetchFullSurahTafsir(surahId) {
    try {
      const response = await fetch(`https://equran.id/api/v2/tafsir/${surahId}`);
      const result = await response.json();
      if (result.code === 200 && result.data && result.data.tafsir) {
        const map = {};
        result.data.tafsir.forEach(t => { map[t.ayat] = t.teks; });
        return map;
      }
      return {};
    } catch (error) { return {}; }
  },

  async fetchSingleAyahTafsir(surahId, ayahNumber) {
    try {
      const resp = await fetch(`https://api.quran.com/api/v4/tafsirs/164/by_ayah/${surahId}:${ayahNumber}`);
      const data = await resp.json();
      if (data.tafsir && data.tafsir.text) {
        return data.tafsir.text.replace(/<\/?[^>]+(>|$)/g, "");
      }
      return null;
    } catch (error) { return null; }
  },

  async getSingleAyah(surahId, ayahNumber, mushafType = 'uthmani') {
    if (Platform.OS === 'web') {
      return JSON_DATA[mushafType]?.[surahId]?.ayat?.find(v => v.ayat === ayahNumber) || null;
    }

    try {
      const ayah = await databaseService.getSingleAyah(surahId, ayahNumber, mushafType);
      if (ayah) return ayah;

      if (JSON_DATA) {
        const source = JSON_DATA[mushafType];
        return source?.[surahId]?.ayat?.find(v => v.ayat === ayahNumber) || null;
      }
      return null;
    } catch (error) {
      console.log('Error getSingleAyah:', error.message);
      return null;
    }
  },

  async getRandomAyah(mushafType = 'uthmani') {
    try {
      return await databaseService.getRandomAyah(mushafType);
    } catch (e) {
      console.error('Error getRandomAyah:', e);
      return null;
    }
  },

  async searchByTranslation(keyword, mushafType = 'uthmani') {
    try {
      return await databaseService.searchByTranslation(keyword, mushafType);
    } catch (e) {
      console.error('Error searchByTranslation:', e);
      return [];
    }
  }
};
