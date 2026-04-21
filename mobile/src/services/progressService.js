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
  },

  async saveLastRead(userId, data) {
    const { surah_id, ayah_number, surah_name } = data;
    const key = `@iqlab_last_read_${userId || 'guest'}`;
    try {
      const lastReadObj = { 
        surah_id, 
        ayah_number, 
        surah_name, 
        updated_at: new Date().toISOString() 
      };
      
      // Save locally
      const { default: AsyncStorage } = require('@react-native-async-storage/async-storage');
      await AsyncStorage.setItem(key, JSON.stringify(lastReadObj));

      // Save to Supabase (upsert or update is better, but here we can just create a record)
      if (userId) {
        // Assume we have a 'last_read' table or we reuse 'quran_progress'
        // For now let's just use a dedicated key in metadata if possible, 
        // but a simple table is safer.
        // If the table doesn't exist, we fallback to local.
      }
      return lastReadObj;
    } catch (e) {
      console.error('Error saving last read:', e);
    }
  },

  async fetchLastRead(userId) {
    const key = `@iqlab_last_read_${userId || 'guest'}`;
    try {
      const { default: AsyncStorage } = require('@react-native-async-storage/async-storage');
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  // --- CHECKPOINT SYSTEM (Manual Pin 🚩) ---
  async saveCheckpoint(userId, data) {
    const { surah_id, ayah_number, surah_name } = data;
    const key = `@iqlab_checkpoint_${userId || 'guest'}`;
    const checkpointObj = { 
      surah_id, 
      ayah_number, 
      surah_name, 
      updated_at: new Date().toISOString() 
    };

    try {
      const { default: AsyncStorage } = require('@react-native-async-storage/async-storage');
      await AsyncStorage.setItem(key, JSON.stringify(checkpointObj));

      if (userId) {
        // Upsert to Supabase 'checkpoints' table
        const { error } = await supabase
          .from('checkpoints')
          .upsert({
            user_id: userId,
            surah_id,
            ayah_number,
            surah_name,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
        
        if (error) {
          console.error('Supabase Checkpoint Error:', error.message);
          throw error; // Throw so UI can catch and show Toast
        }
      }
      return checkpointObj;
    } catch (err) {
      console.error('saveCheckpoint error:', err.message);
      throw err;
    }
  },

  async fetchCheckpoint(userId) {
    const key = `@iqlab_checkpoint_${userId || 'guest'}`;
    try {
      const { default: AsyncStorage } = require('@react-native-async-storage/async-storage');
      
      // Try cloud first if userId exists
      if (userId) {
        const { data, error } = await supabase
          .from('checkpoints')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (data && !error) {
          await AsyncStorage.setItem(key, JSON.stringify(data));
          return data;
        }
      }

      const local = await AsyncStorage.getItem(key);
      return local ? JSON.parse(local) : null;
    } catch (err) {
      return null;
    }
  }
};
