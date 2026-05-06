import { Platform, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { supabase } from '../lib/supabase';

export const authService = {
  /**
   * Google OAuth Sign In
   * Mendukung Native (GoogleSignin) dan Fallback (Browser)
   */
  async signInWithGoogle() {
    try {
      const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

      GoogleSignin.configure({
        webClientId: webClientId,
        offlineAccess: true,
        forceCodeForRefreshToken: true,
      });

      if (Platform.OS !== 'web') {
        try {
          await GoogleSignin.hasPlayServices();
          const userInfo = await GoogleSignin.signIn();
          
          if (userInfo.idToken) {
            const { data, error } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: userInfo.idToken,
            });
            if (error) throw error;
            return data;
          }
        } catch (nativeError) {
          // Jika gagal (misal: di Expo Go), lanjut ke Browser Flow di bawah
        }
      }

      // 2. BROWSER FLOW (Fallback untuk Web atau jika Native gagal)
      const redirectUrl = makeRedirectUri({
        preferLocalhost: false,
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: Platform.OS !== 'web',
        }
      });

      if (error) throw error;

      if (Platform.OS !== 'web' && data?.url) {
        const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

        if (res.type === 'success' && res.url) {
          const match = res.url.match(/(?:#|\?)(.*)/);
          if (match && match[1]) {
            const urlParams = new URLSearchParams(match[1].replace('?', '&'));
            const access_token = urlParams.get('access_token');
            const refresh_token = urlParams.get('refresh_token');

            if (access_token && refresh_token) {
              return await supabase.auth.setSession({ access_token, refresh_token });
            }
          }
        }
      }
      return data;
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      Alert.alert('Gagal Login', error.message || 'Terjadi kesalahan saat menyambungkan ke Google.');
      throw error;
    }
  },


  async signInWithEmail(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signUpWithEmail(email, password, metadata) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async updateUserMetadata(payload) {
    const { data, error } = await supabase.auth.updateUser({
      data: payload
    });
    if (error) throw error;
    return data;
  },

  async updatePassword(password) {
    const { data, error } = await supabase.auth.updateUser({
      password
    });
    if (error) throw error;
    return data;
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }
};
