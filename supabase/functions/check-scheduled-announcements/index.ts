// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// CRON: Cek pengumuman terjadwal yang waktunya sudah tiba
// Setup di Supabase Dashboard: Cron Schedule → setiap 1 menit
// Schedule: every 1 minute ( */1 * * * * )
serve(async (req: Request) => {
  try {
    // @ts-ignore
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    // @ts-ignore
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Missing env" }), { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date().toISOString();

    // Cari pengumuman yang: published_at <= sekarang DAN notification_sent = false/null
    const { data: dueAnnouncements, error } = await supabaseAdmin
      .from('announcements')
      .select('*')
      .lte('published_at', now)
      .or('notification_sent.is.null,notification_sent.eq.false');

    if (error) {
      console.error("DB Error:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    if (!dueAnnouncements || dueAnnouncements.length === 0) {
      console.log("Tidak ada pengumuman terjadwal yang perlu dikirim.");
      return new Response(JSON.stringify({ message: "No due announcements", count: 0 }), { status: 200 });
    }

    console.log(`Ditemukan ${dueAnnouncements.length} pengumuman yang perlu dikirim!`);

    for (const record of dueAnnouncements) {
      console.log(`Proses: "${record.title}" (published_at: ${record.published_at})`);

      // Klaim dulu (atomic)
      const { data: claimed } = await supabaseAdmin
        .from('announcements')
        .update({ notification_sent: true })
        .eq('id', record.id)
        .or('notification_sent.is.null,notification_sent.eq.false')
        .select('id');

      if (!claimed || claimed.length === 0) {
        console.log(`  → Sudah diklaim, skip.`);
        continue;
      }

      // Ambil token
      let query = supabaseAdmin
        .from('profiles')
        .select('expo_push_token')
        .not('expo_push_token', 'is', null);

      if (record.target_audience === 'iqlab') {
        query = query.eq('role', 'user_iqlab');
      }

      const { data: profiles } = await query;
      const tokens = profiles
        ?.map((p: any) => p.expo_push_token)
        .filter((t: any) => t && t.startsWith('ExponentPushToken')) || [];

      if (tokens.length === 0) {
        console.log(`  → Tidak ada token, skip.`);
        continue;
      }

      // Kirim
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

      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messages),
      });
      const result = await res.json();
      console.log(`  → Terkirim ke ${tokens.length} device:`, JSON.stringify(result));
    }

    return new Response(JSON.stringify({ 
      message: "Done", 
      processed: dueAnnouncements.length 
    }), { status: 200 });

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error?.message }), { status: 500 });
  }
})
