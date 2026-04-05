import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = 'https://ctshuzhwchvyjyysfzhr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0c2h1emh3Y2h2eWp5eXNmemhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNDcxNjQsImV4cCI6MjA5MDYyMzE2NH0.OhSbjlY4D9NHYh-OvfNpgU9EHK8Ke6miXm8CQfrGJbE';

const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
};

// WAJIB gunakan AsyncStorage HANYA jika jalan di HP Asli (Bukan Web)
// Jika di Web, biarkan Supabase menggunakan sistem internal defaultnya (termasuk session cookie + localStorage murninya)
// Ini memperbaiki error "OAuth State expired" 100% di web.
if (Platform.OS !== 'web') {
  supabaseOptions.auth.storage = AsyncStorage;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);
