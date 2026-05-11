// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_RECEIPT_URL = "https://exp.host/--/api/v2/push/getReceipts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Menerima Payload:", JSON.stringify(payload, null, 2));
    
    const { record } = payload;
    if (!record) {
      return new Response(JSON.stringify({ error: "No record found" }), { 
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // @ts-ignore
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    // @ts-ignore
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("FATAL: Missing SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY!");
      return new Response(JSON.stringify({ error: "Missing env vars" }), { 
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // GUARD ATOMIC: Set notification_sent=true DULU, cegah race condition
    // Hanya lanjut jika update berhasil (artinya kita yang pertama)
    if (record.id) {
      const { data: updated, error: guardError } = await supabaseAdmin
        .from('announcements')
        .update({ notification_sent: true })
        .eq('id', record.id)
        .or('notification_sent.is.null,notification_sent.eq.false')
        .select('id');
      
      if (guardError || !updated || updated.length === 0) {
        console.log("⚠️ Notifikasi sudah diklaim oleh panggilan lain — SKIP!", guardError?.message);
        return new Response(JSON.stringify({ message: "Already claimed", skipped: true }), { 
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      console.log("✅ Guard passed — kita yang pertama, lanjut kirim notif");
    }

    // GUARD: Cek apakah published_at sudah lewat
    if (record.published_at) {
      const publishTime = new Date(record.published_at);
      if (publishTime > new Date()) {
        console.log("⏰ Pengumuman dijadwalkan untuk:", record.published_at, "— SKIP, belum waktunya!");
        // Rollback notification_sent agar bisa dikirim nanti oleh cron
        await supabaseAdmin.from('announcements').update({ notification_sent: false }).eq('id', record.id);
        return new Response(JSON.stringify({ message: "Scheduled for future", scheduled: true }), { 
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // 1. Ambil token dari profiles
    console.log("Mencari token untuk audience:", record.target_audience);
    
    let query = supabaseAdmin
      .from('profiles')
      .select('expo_push_token, full_name')
      .not('expo_push_token', 'is', null);

    if (record.target_audience === 'iqlab') {
      query = query.eq('role', 'user_iqlab');
    }
    // NOTE: 'tahseena' juga bisa ditambahkan filter role-nya di sini

    const { data: profiles, error: dbError } = await query;

    if (dbError) {
      console.error("Database Error:", JSON.stringify(dbError));
      return new Response(JSON.stringify({ error: dbError.message }), { 
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log("Profiles ditemukan:", JSON.stringify(profiles));
    
    const tokens = profiles
      ?.map((p: any) => p.expo_push_token)
      .filter((t: any) => t && t.startsWith('ExponentPushToken')) || [];
    
    console.log(`Token valid: ${tokens.length} buah → ${JSON.stringify(tokens)}`);

    if (tokens.length === 0) {
      return new Response(JSON.stringify({ message: "No valid tokens found", profiles_count: profiles?.length || 0 }), { 
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 2. Kirim ke Expo
    const messages = tokens.map((token: string) => ({
      to: token,
      sound: 'default',
      title: record.title || "Pengumuman Baru! 📣",
      body: record.summary || "Ada informasi baru untuk Anda.",
      data: { announcementId: record.id },
      priority: 'high',
      channelId: 'default',
      experienceId: '@didimdim/iqlab-mobile',
    }));

    console.log("Mengirim ke Expo Push API:", JSON.stringify(messages));

    const sendResponse = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(messages),
    });

    const sendResult = await sendResponse.json();
    console.log("Hasil SEND dari Expo:", JSON.stringify(sendResult));

    // 3. Cek Receipts setelah 3 detik (untuk verifikasi FCM delivery)
    const receiptIds = sendResult?.data
      ?.filter((r: any) => r.status === 'ok' && r.id)
      ?.map((r: any) => r.id) || [];
    
    if (receiptIds.length > 0) {
      console.log("Menunggu 3 detik lalu cek receipts...");
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const receiptResponse = await fetch(EXPO_RECEIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ ids: receiptIds }),
      });
      
      const receiptResult = await receiptResponse.json();
      console.log("📬 RECEIPT CHECK (status FCM delivery):", JSON.stringify(receiptResult, null, 2));
      
      // Log jika ada error di receipt
      const receiptData = receiptResult?.data || {};
      for (const [id, receipt] of Object.entries(receiptData)) {
        const r = receipt as any;
        if (r.status === 'error') {
          console.error(`❌ Receipt ERROR untuk ${id}:`, r.message, r.details);
        } else {
          console.log(`✅ Receipt OK untuk ${id}: delivered`);
        }
      }
    }

    // notification_sent sudah di-update di guard atomic di atas

    return new Response(JSON.stringify({ 
      sendResult, 
      tokens_count: tokens.length,
      receipt_ids: receiptIds
    }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" }, 
      status: 200 
    });

  } catch (error: any) {
    console.error("CATASTROPHIC ERROR:", error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 
    });
  }
})
