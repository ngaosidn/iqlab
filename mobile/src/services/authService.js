import { Platform, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../lib/supabase';

export const authService = {
  /**
   * Google OAuth Sign In
   * Logic moved from useHome.js
   */
  async signInWithGoogle() {
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

    if (error) {
      if (Platform.OS === 'web') alert(error.message);
      throw error;
    }

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
          } else if (urlParams.get('error_description')) {
            const errorMsg = decodeURIComponent(urlParams.get('error_description').replace(/\+/g, ' '));
            Alert.alert('Gagal', errorMsg);
            throw new Error(errorMsg);
          }
        }
      }
    }
    return data;
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
