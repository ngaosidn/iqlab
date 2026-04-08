import { supabase } from '../lib/supabase';

export const adminService = {
  /**
   * Fetch aggregate stats for admin dashboard via RPC
   */
  async getDashboardStats() {
    const { data, error } = await supabase.rpc('get_dashboard_stats');
    if (error) throw error;
    return {
      totalMurid: data?.total_murid?.toString() || '0',
      totalPengajar: data?.total_pengajar?.toString() || '0'
    };
  },

  /**
   * Fetch all staff (admins and teachers) via RPC
   */
  async getAllStaff() {
    const { data, error } = await supabase.rpc('get_all_staff');
    if (error) throw error;
    return data || [];
  },

  /**
   * Delete user by ID via RPC
   */
  async deleteUser(userId) {
    const { error } = await supabase.rpc('delete_user_by_id', { user_id: userId });
    if (error) throw error;
  },

  /**
   * Update user metadata via RPC
   */
  async updateUserMeta(uid, payload) {
    const { error } = await supabase.rpc('update_user_meta', {
      uid: uid,
      payload: payload
    });
    if (error) throw error;
  },

  /**
   * Update staff password via RPC
   */
  async updateStaffPassword(uid, oldPass, newPass) {
    const { data, error } = await supabase.rpc('update_staff_password', {
      target_uid: uid,
      old_pass: oldPass,
      new_pass: newPass
    });
    if (error) throw error;
    return data;
  }
};
