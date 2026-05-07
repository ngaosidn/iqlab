"use client";

import { AuthProvider } from "@refinedev/core";
import { supabaseClient } from "@/lib/supabaseClient";

export const authProvider: AuthProvider = {
  login: async ({ email, password }: any) => {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error,
      };
    }

    if (data?.user) {
      // Verifikasi role admin
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError || profile?.role !== 'admin') {
        // Logout langsung jika bukan admin
        await supabaseClient.auth.signOut();
        return {
          success: false,
          error: {
            name: "Akses Ditolak",
            message: "Akun Anda tidak memiliki hak akses administrator.",
          },
        };
      }

      return {
        success: true,
        redirectTo: "/",
      };
    }

    return {
      success: false,
      error: {
        name: "LoginError",
        message: "Email atau kata sandi salah.",
      },
    };
  },
  logout: async () => {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      return {
        success: false,
        error,
      };
    }

    return {
      success: true,
      redirectTo: "/login",
    };
  },
  check: async () => {
    const { data } = await supabaseClient.auth.getSession();
    const { session } = data;

    if (!session) {
      return {
        authenticated: false,
        redirectTo: "/login",
        logout: true,
      };
    }

    // Pastikan session yang aktif benar-benar milik admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return {
        authenticated: false,
        redirectTo: "/login",
        logout: true,
      };
    }

    return {
      authenticated: true,
    };
  },
  getPermissions: async () => {
    const { data } = await supabaseClient.auth.getUser();

    if (data?.user) {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();
      return profile?.role || null;
    }

    return null;
  },
  getIdentity: async () => {
    const { data } = await supabaseClient.auth.getUser();

    if (data?.user) {
      return {
        ...data.user,
        name: data.user.email,
      };
    }

    return null;
  },
  onError: async (error: any) => {
    if (error?.code === "PGRST301" || error?.code === "401") {
      return {
        logout: true,
      };
    }

    return { error };
  },
};
