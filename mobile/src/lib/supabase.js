import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const SecureStoreAdapter = {
  getItem: (key) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key, value) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key) => {
    SecureStore.deleteItemAsync(key);
  },
};

const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
};

// Gunakan SecureStore untuk HP Asli agar terenkripsi (Android Keystore / iOS Keychain)
// Jika di Web, biarkan Supabase menggunakan sistem internal defaultnya.
if (Platform.OS !== 'web') {
  supabaseOptions.auth.storage = SecureStoreAdapter;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);

