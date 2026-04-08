export const quranService = {
  /**
   * Fetch all chapters (surahs)
   */
  async fetchSurahs() {
    try {
      const response = await fetch('https://api.quran.com/api/v4/chapters?language=id');
      const data = await response.json();
      return data.chapters || [];
    } catch (error) {
      console.error('Error in quranService.fetchSurahs:', error);
      throw error;
    }
  },

  /**
   * Fetch full tafsir for a surah from equran.id
   */
  async fetchFullSurahTafsir(surahId) {
    try {
      const response = await fetch(`https://equran.id/api/v2/tafsir/${surahId}`);
      const result = await response.json();

      if (result.code === 200 && result.data && result.data.tafsir) {
        const map = {};
        result.data.tafsir.forEach(t => {
          map[t.ayat] = t.teks;
        });
        return map;
      }
      return {};
    } catch (error) {
      console.error('Error in quranService.fetchFullSurahTafsir:', error);
      throw error;
    }
  },

  /**
   * Fetch single ayah tafsir (Kemenag) from quran.com
   */
  async fetchSingleAyahTafsir(surahId, ayahNumber) {
    try {
      // Resource 164 is Kemenag tafsir
      const resp = await fetch(`https://api.quran.com/api/v4/tafsirs/164/by_ayah/${surahId}:${ayahNumber}`);
      const data = await resp.json();

      if (data.tafsir && data.tafsir.text) {
        // Clean up basic HTML tags
        return data.tafsir.text.replace(/<\/?[^>]+(>|$)/g, "");
      }
      return null;
    } catch (error) {
      console.error('Error in quranService.fetchSingleAyahTafsir:', error);
      throw error;
    }
  }
};
