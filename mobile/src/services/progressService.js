import { supabase } from '../lib/supabase';

export const progressService = {
  /**
   * Fetch user RPG progress from quran_progress table
   */
  async fetchUserProgress(userId) {
    try {
      const { data, error } = await supabase
        .from('quran_progress')
        .select('*')
        .eq('user_id', userId)
        .order('surah_id', { ascending: false })
        .order('ayah_number', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        const lastRow = data[0];
        let nextSurah = lastRow.surah_id;
        let nextAyah = lastRow.ayah_number;

        if (lastRow.status === 'passed') {
          nextAyah += 1;
        }

        let lockedToday = false;
        if (lastRow.last_assessed_at) {
          const lastDate = new Date(lastRow.last_assessed_at).toDateString();
          const todayDate = new Date().toDateString();
          if (lastDate === todayDate) lockedToday = true;
        }

        return { unlockedSurah: nextSurah, unlockedAyah: nextAyah, isLockedToday: lockedToday };
      }
      
      // Default initial progress
      return { unlockedSurah: 1, unlockedAyah: 1, isLockedToday: false };
    } catch (error) {
      console.error('Error in progressService.fetchUserProgress:', error);
      throw error;
    }
  }
};
