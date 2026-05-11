import { supabase } from '../lib/supabase';

export const profileService = {
  /**
   * Mengambil data profil berdasarkan User ID
   */
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 adalah error jika data tidak ditemukan
      throw error;
    }
    return data;
  },

  /**
   * Membuat profil baru untuk user I-QLab
   */
  async createProfile(profileData) {
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          id: profileData.id,
          full_name: profileData.fullName,
          whatsapp_number: profileData.whatsappNumber,
          age: parseInt(profileData.age),
          gender: profileData.gender,
          address: profileData.address,
          role: 'user_iqlab' // Dipaksa menjadi user_iqlab di sisi logic
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Memperbarui data profil
   */
  async updateProfile(userId, profileData) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: profileData.fullName,
        whatsapp_number: profileData.whatsappNumber,
        age: parseInt(profileData.age),
        gender: profileData.gender,
        address: profileData.address,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Menyimpan token push notification ke profil
   */
  async updatePushToken(userId, token) {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        expo_push_token: token,
        updated_at: new Date().toISOString() 
      })
      .eq('id', userId);

    if (error) throw error;
    return true;
  }
};
