import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getStorageKey = (userId) => `@iqlab_bookmarks_${userId || 'guest'}`;

export const bookmarkService = {
  // 1. Fetch Bookmarks (Cloud + Local Cache)
  async fetchBookmarks(userId) {
    const key = getStorageKey(userId);
    try {
      // Load local cache first
      const localData = await AsyncStorage.getItem(key);
      const localBookmarks = localData ? JSON.parse(localData) : [];

      if (!userId) return localBookmarks;

      // Fetch from Supabase
      const { data: cloudData, error } = await supabase
        .from('bookmarks')
        .select('surah_id, ayah_number, surah_name')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Update local cache with cloud data
      await AsyncStorage.setItem(key, JSON.stringify(cloudData));
      return cloudData;
    } catch (error) {
      console.error('fetchBookmarks Error:', error.message);
      // Fallback to local if error
      const localData = await AsyncStorage.getItem(key);
      return localData ? JSON.parse(localData) : [];
    }
  },

  // 2. Toggle Bookmark (Add/Remove)
  async toggleBookmark(userId, verseData) {
    const { surah_id, ayah_number, surah_name } = verseData;
    const key = getStorageKey(userId);

    try {
      // Get current local data
      const localData = await AsyncStorage.getItem(key);
      let bookmarks = localData ? JSON.parse(localData) : [];

      const exists = bookmarks.find(b => b.surah_id === surah_id && b.ayah_number === ayah_number);

      if (exists) {
        // REMOVE
        bookmarks = bookmarks.filter(b => !(b.surah_id === surah_id && b.ayah_number === ayah_number));
        
        if (userId) {
          await supabase
            .from('bookmarks')
            .delete()
            .eq('user_id', userId)
            .eq('surah_id', surah_id)
            .eq('ayah_number', ayah_number);
        }
      } else {
        // ADD
        const newEntry = { surah_id, ayah_number, surah_name };
        bookmarks = [newEntry, ...bookmarks];

        if (userId) {
          await supabase
            .from('bookmarks')
            .insert({
              user_id: userId,
              surah_id,
              ayah_number,
              surah_name
            });
        }
      }

      // Update local cache
      await AsyncStorage.setItem(key, JSON.stringify(bookmarks));
      return bookmarks;
    } catch (error) {
      console.error('toggleBookmark Error:', error.message);
      throw error;
    }
  }
};
