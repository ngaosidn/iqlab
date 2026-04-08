import { Platform } from 'react-native';
import { databaseService } from './databaseService';

import verseUthmani from '../../assets/data/verse.json';
import verseIndopak from '../../assets/data/indopak.json';

const JSON_DATA = {
  uthmani: verseUthmani,
  indopak: verseIndopak
};

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
      // 1. Prioritas Utama: SQLite (Sangat Cepat)
      const verses = await databaseService.getVerses(surahId, mushafType);
      
      if (verses && verses.length > 0) {
        console.log(`🔌 Mode: SQLite (Memuat Surah ${surahId} - ${mushafType})`);
        return verses;
      }

      // 2. Prioritas Kedua: JSON Lokal
      console.log(`📂 Mode: JSON Fallback (Memuat Surah ${surahId} - ${mushafType})`);
      const source = mushafType === 'indopak' ? verseIndopak : verseUthmani;
      return source[surahId]?.ayat || [];
    } catch (error) {
      console.log('Safety switch to JSON due to error:', error.message);
      const source = mushafType === 'indopak' ? verseIndopak : verseUthmani;
      return source[surahId]?.ayat || [];
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
  }
};
