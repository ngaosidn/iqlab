/**
 * TEST SCRIPT: Cek apakah FCM sudah berhasil setelah tambah IAM role
 * Jalankan: node test-push.js
 */

const TOKEN = 'ExponentPushToken[IdQGFQMXtFETysw0iA9Pta]';

async function main() {
  console.log('=== TEST PUSH NOTIFICATION ===');
  console.log('Token:', TOKEN);
  console.log('Mengirim...\n');

  const sendRes = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify([{
      to: TOKEN,
      sound: 'default',
      title: '✅ FCM Test Berhasil!',
      body: 'Notifikasi sudah berfungsi! ' + new Date().toLocaleTimeString('id-ID'),
      priority: 'high',
      channelId: 'default',
      experienceId: '@didimdim/iqlab-mobile',
    }])
  });

  const sendData = await sendRes.json();
  console.log('Expo response:', JSON.stringify(sendData, null, 2));

  const ids = sendData?.data?.filter(r => r.status === 'ok' && r.id)?.map(r => r.id) || [];
  if (ids.length === 0) {
    console.log('\n❌ Expo langsung tolak pesan!');
    return;
  }

  console.log('\nMenunggu 5 detik untuk cek FCM receipt...');
  await new Promise(r => setTimeout(r, 5000));

  const receiptRes = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ ids })
  });

  const receiptData = await receiptRes.json();
  console.log('\n=== RECEIPT (HASIL FCM AKTUAL) ===');

  for (const [id, r] of Object.entries(receiptData?.data || {})) {
    if (r.status === 'error') {
      console.log('❌ MASIH ERROR:', r.message);
      if (r.details?.fcm?.response) {
        const fcm = JSON.parse(r.details.fcm.response);
        console.log('   FCM Error:', fcm?.error?.message);
      }
    } else {
      console.log('✅ SUKSES! FCM berhasil kirim ke device!');
      console.log('   Cek HP Bos — notif harus sudah muncul!');
      console.log('   (Jika belum muncul: tutup app dulu, atau cek Settings > Notifikasi)');
    }
  }
}

main().catch(console.error);
