import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function JitsiWebView({ url, onLeave }) {
  // Tambahkan parameter untuk mematikan instruksi unduh aplikasi Jitsi dan watermark rahasia
  const meetUrl = url.includes('#') 
    ? url 
    : `${url}#config.disableDeepLinking=true&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false`;

  // Suntik JavaScript dan CSS untuk "Membajak" tampilan Jitsi
  // Kita hilangkan semua logo dan elemen branding milik Jitsi
  const injectedStyles = `
    setTimeout(function() {
      var style = document.createElement('style');
      style.innerHTML = \`
        /* Hilangkan logo Jitsi di pojok kiri atas */
        .watermark { display: none !important; }
        .leftwatermark { display: none !important; }
        
        /* Hilangkan tulisan Powered by */
        .watermark-text { display: none !important; }
        
        /* Hilangkan layer promo mobile app */
        .pwa-promo { display: none !important; }
        .deep-linking-mobile { display: none !important; }
        
        /* Kustomisasi warna background menjadi hijau teal I-Qlab */
        .premeeting-screen { background-color: #0f172a !important; }
      \`;
      document.head.appendChild(style);
    }, 500); // Trigger inject sesaat sesudah memuat
    true;
  `;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onLeave} style={styles.leaveBtn}>
          <Feather name="arrow-left" size={20} color="#ef4444" />
          <Text style={styles.leaveText}>Akhiri Kelas</Text>
        </TouchableOpacity>
        <Text style={styles.title}>I-Qlab Live Class</Text>
        <View style={styles.badge}><Feather name="shield" size={14} color="#10b981" /></View>
      </View>
      
      <WebView
        source={{ uri: meetUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        injectedJavaScript={injectedStyles}
        originWhitelist={['*']}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155'
  },
  title: { color: 'white', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  leaveBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.15)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  leaveText: { color: '#ef4444', fontWeight: 'bold', marginLeft: 8, fontSize: 13 },
  badge: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(16, 185, 129, 0.1)', justifyContent: 'center', alignItems: 'center' },
  webview: { flex: 1, backgroundColor: '#0f172a' }
});
