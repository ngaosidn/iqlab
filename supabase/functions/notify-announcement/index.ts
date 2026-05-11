// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Menerima Payload:", JSON.stringify(payload, null, 2));
    
    const { record } = payload;
    if (!record) {
      console.error("Error: Record tidak ditemukan dalam payload");
      return new Response(JSON.stringify({ error: "No record found" }), { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 1. Inisialisasi Supabase Admin (Gunakan Service Role Key agar aman)
    // @ts-ignore
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    // @ts-ignore
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    console.log("Inisialisasi Client untuk URL:", supabaseUrl);

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Error: SUPABASE_URL atau SERVICE_ROLE_KEY belum diset di Secrets!");
      return new Response(JSON.stringify({ error: "Missing env vars" }), { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Ambil semua token yang ada di tabel profiles
    console.log("Mencari token untuk audience:", record.target_audience);
    
    let query = supabaseAdmin
      .from('profiles')
      .select('expo_push_token')
      .not('expo_push_token', 'is', null);

    if (record.target_audience === 'iqlab') {
      query = query.eq('role', 'user_iqlab');
    }

    const { data: profiles, error: dbError } = await query;

    if (dbError) {
      console.error("Database Error:", dbError);
      return new Response(JSON.stringify({ error: dbError.message }), { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const tokens = profiles?.map((p: any) => p.expo_push_token).filter((t: any) => t) || [];
    console.log(`Ditemukan ${tokens.length} token untuk dikirim.`);
    console.log("Token list:", JSON.stringify(tokens));

    if (tokens.length === 0) {
      console.log("Pengiriman dibatalkan karena tidak ada token.");
      return new Response(JSON.stringify({ message: "No tokens found", tokens_count: 0 }), { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 3. Siapkan Pesan Notifikasi
    const messages = tokens.map((token: string) => ({
      to: token,
      sound: 'default',
      title: record.title || "Pengumuman Baru! 📣",
      body: record.summary || "Ada informasi baru untuk Anda. Klik untuk melihat detail.",
      data: { announcementId: record.id },
      priority: 'high',
      channelId: 'default',
      experienceId: '@didimdim/iqlab-mobile',
      projectId: '6e32387f-eeeb-47f4-8134-60f1de798b3d',
    }));

    console.log("Mengirim pesan ke Expo:", JSON.stringify(messages, null, 2));

    // 4. Kirim ke Expo API
    console.log("Mengirim ke Expo Push API...");
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    console.log("Hasil dari Expo:", JSON.stringify(result, null, 2));

    // 5. Update status di database agar tidak dikirim ulang
    const { error: updateError } = await supabaseAdmin
      .from('announcements')
      .update({ notification_sent: true })
      .eq('id', record.id);

    if (updateError) {
      console.error("Gagal update status notification_sent:", updateError);
    } else {
      console.log("Status notification_sent berhasil diupdate ke TRUE.");
    }

    return new Response(JSON.stringify({ result, tokens_count: tokens.length }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200 
    });

  } catch (error: any) {
    console.error("CATASTROPHIC ERROR:", error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500 
    });
  }
})
