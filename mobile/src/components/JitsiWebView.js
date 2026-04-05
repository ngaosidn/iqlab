import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { supabase } from '../lib/supabase';

export default function JitsiWebView({ url, onLeave, scheduleId, isTeacher }) {
  const [showPanel, setShowPanel] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const meetUrl = url.includes('#') 
    ? url 
    : `${url}#config.disableDeepLinking=true&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false`;

  const injectedStyles = `
    setTimeout(function() {
      var style = document.createElement('style');
      style.innerHTML = \`
        .watermark { display: none !important; }
        .leftwatermark { display: none !important; }
        .watermark-text { display: none !important; }
        .pwa-promo { display: none !important; }
        .deep-linking-mobile { display: none !important; }
        .premeeting-screen { background-color: #0f172a !important; }
      \`;
      document.head.appendChild(style);
    }, 500); 
    true;
  `;

  useEffect(() => {
    if (!isTeacher || !scheduleId) return;

    fetchParticipants();

    const intervalId = setInterval(() => {
       fetchParticipants();
    }, 5000);

    const channel = supabase
      .channel('lobby_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'active_class_participants', filter: `schedule_id=eq.${scheduleId}` }, () => {
         fetchParticipants();
      })
      .subscribe();

    return () => { 
       supabase.removeChannel(channel); 
       clearInterval(intervalId);
    };
  }, [scheduleId, isTeacher]);

  const fetchParticipants = async () => {
     const { data, error } = await supabase.from('active_class_participants').select('*').eq('schedule_id', scheduleId);
     if (!error && data) setParticipants(data);
  };

  const handlePassStudent = async (p) => {
     setIsProcessing(true);
     try {
       await supabase.from('quran_progress')
          .update({ status: 'passed', last_assessed_at: new Date() })
          .eq('user_id', p.student_id)
          .eq('surah_id', p.target_surah_id)
          .eq('ayah_number', p.target_ayah);

       await supabase.from('active_class_participants').delete().eq('id', p.id);
       Toast.show({ type: 'success', text1: 'Lulus ✅', text2: `${p.student_name} telah lulus ayat ${p.target_ayah}!`});
       fetchParticipants();
     } catch (err) {
       Toast.show({ type: 'error', text1: 'Gagal', text2: err.message });
     } finally {
       setIsProcessing(false);
     }
  };

  const handleFailStudent = async (p) => {
     setIsProcessing(true);
     try {
       await supabase.from('quran_progress')
          .update({ last_assessed_at: new Date() })
          .eq('user_id', p.student_id)
          .eq('surah_id', p.target_surah_id)
          .eq('ayah_number', p.target_ayah);

       await supabase.from('active_class_participants').delete().eq('id', p.id);
       Toast.show({ type: 'info', text1: 'Diulang ❌', text2: `${p.student_name} harus mengulang besok.`});
       fetchParticipants();
     } catch (err) {
        Toast.show({ type: 'error', text1: 'Gagal', text2: err.message });
     } finally {
        setIsProcessing(false);
     }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onLeave} style={styles.leaveBtn}>
          <Feather name="arrow-left" size={20} color="#ef4444" />
        </TouchableOpacity>
        <Text style={styles.title}>I-Qlab Live Class</Text>
        
        {isTeacher ? (
           <TouchableOpacity onPress={() => setShowPanel(true)} style={styles.badgeOpen}>
             <Feather name="users" size={14} color="#0ea5e9" style={{marginRight: 6}} />
             <Text style={{color: '#0ea5e9', fontWeight: 'bold', fontSize: 13}}>{participants.length}/4</Text>
           </TouchableOpacity>
        ) : (
           <View style={styles.badge}><Feather name="shield" size={14} color="#10b981" /></View>
        )}
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

      {/* PANEL GURU BOTTOM SHEET */}
      {showPanel && isTeacher && (
        <View style={styles.panelOverlay}>
           <View style={styles.panelContainer}>
              <View style={styles.panelHeader}>
                 <Text style={styles.panelTitle}>Antrean Pemeriksaan ({participants.length}/4)</Text>
                 <TouchableOpacity onPress={() => setShowPanel(false)} style={styles.closePanelBtn}>
                    <Feather name="x" size={20} color="#94a3b8" />
                 </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ padding: 16 }}>
                 {participants.length === 0 ? (
                    <Text style={{ textAlign: 'center', color: '#64748b', marginTop: 20 }}>Belum ada murid di dalam ruangan.</Text>
                 ) : (
                    participants.map(p => (
                       <View key={p.id} style={styles.studentCard}>
                          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
                             <View style={styles.studentAvatar}><FontAwesome5 name="user" size={16} color="#0d9488" /></View>
                             <View>
                                <Text style={styles.studentName}>{p.student_name}</Text>
                                <Text style={styles.studentTarget}>Target: Surah {p.target_surah_id} - Ayat {p.target_ayah}</Text>
                             </View>
                          </View>
                          <View style={styles.actionRow}>
                             <TouchableOpacity onPress={() => handleFailStudent(p)} disabled={isProcessing} style={styles.btnReulang}>
                                <Text style={styles.btnReulangText}>Ulangi</Text>
                             </TouchableOpacity>
                             <TouchableOpacity onPress={() => handlePassStudent(p)} disabled={isProcessing} style={styles.btnLulus}>
                                <Text style={styles.btnLulusText}>Luluskan</Text>
                             </TouchableOpacity>
                          </View>
                       </View>
                    ))
                 )}
              </ScrollView>
           </View>
        </View>
      )}
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
  leaveBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(239,68,68,0.15)', justifyContent: 'center', alignItems: 'center' },
  badge: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(16, 185, 129, 0.1)', justifyContent: 'center', alignItems: 'center' },
  badgeOpen: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(14, 165, 233, 0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(14, 165, 233, 0.3)' },
  webview: { flex: 1, backgroundColor: '#0f172a' },
  
  panelOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', zIndex: 100 },
  panelContainer: { backgroundColor: '#f8fafc', borderTopLeftRadius: 24, borderTopRightRadius: 24, minHeight: 300, maxHeight: '60%' },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  panelTitle: { color: '#0f172a', fontSize: 18, fontWeight: 'bold' },
  closePanelBtn: { width: 32, height: 32, backgroundColor: '#e2e8f0', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  
  studentCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', elevation: 2 },
  studentAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(13, 148, 136, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  studentName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  studentTarget: { fontSize: 13, color: '#64748b', marginTop: 2, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  btnReulang: { flex: 1, backgroundColor: '#fef2f2', paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#fca5a5' },
  btnReulangText: { color: '#ef4444', fontWeight: 'bold' },
  btnLulus: { flex: 1, backgroundColor: '#10b981', paddingVertical: 10, borderRadius: 12, alignItems: 'center', elevation: 2 },
  btnLulusText: { color: 'white', fontWeight: 'bold' }
});
