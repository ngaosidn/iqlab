import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { supabase } from '../lib/supabase';
import verseData from '../../assets/data/verse.json';

export default function JitsiWebView({ url, onLeave, scheduleId, isTeacher, session }) {
  const [showPanel, setShowPanel] = useState(false);
  const [showMushaf, setShowMushaf] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [myTarget, setMyTarget] = useState(null);
  const [activeId, setActiveId] = useState(scheduleId);
  const [isFinished, setIsFinished] = useState(false);
  const [myParticipantId, setMyParticipantId] = useState(null);

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
    // Audit: Jika scheduleId kosong, cari berdasarkan URL (Fallback)
    const resolveScheduleId = async () => {
       if (!scheduleId && url) {
          const { data, error } = await supabase
             .from('teacher_schedules')
             .select('id')
             .eq('meeting_link', url)
             .limit(1);
          if (!error && data && data.length > 0) {
             setActiveId(data[0].id);
          }
       } else {
          setActiveId(scheduleId);
       }
    };
    resolveScheduleId();
  }, [scheduleId, url]);

  useEffect(() => {
    if (!activeId) return;

    if (isTeacher) {
      fetchParticipants();
      const intervalId = setInterval(() => {
         fetchParticipants();
      }, 5000);

      const channel = supabase
        .channel('lobby_updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'active_class_participants', filter: `schedule_id=eq.${activeId}` }, () => {
           fetchParticipants();
         })
        .subscribe();

      return () => { 
         supabase.removeChannel(channel); 
         clearInterval(intervalId);
      };
    } else {
      fetchMyTarget();
      
      // 1. MONITOR JADWAL: Jika link dihapus (Ustadz klik Power/End Session)
      const scheduleChannel = supabase
        .channel(`room_${activeId}`)
        .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'teacher_schedules', 
            filter: `id=eq.${activeId}` 
        }, (payload) => {
           if (payload.new && payload.new.meeting_link === null) {
              setIsFinished(true);
           }
        })
        .on('broadcast', { event: 'FORCE_END_MEETING' }, () => {
           // CEPAT: Sinyal langsung dari HP Pengajar
           setIsFinished(true);
        })
        .subscribe();

      // 2. MONITOR DIRI SENDIRI: Jika kita dihapus dari antrian (Lulus/Ulangi)
      // Kita butuh ID baris antrian kita dulu
      let participantChannel = null;
      if (myParticipantId) {
          participantChannel = supabase
            .channel(`my_status_${myParticipantId}`)
            .on('postgres_changes', { 
                event: 'DELETE', 
                schema: 'public', 
                table: 'active_class_participants', 
                filter: `id=eq.${myParticipantId}` 
            }, () => {
               setIsFinished(true);
            })
            .subscribe();
      }

      return () => {
         supabase.removeChannel(scheduleChannel);
         if (participantChannel) supabase.removeChannel(participantChannel);
      };
    }
  }, [activeId, isTeacher, session?.user?.id, myParticipantId]);

  const fetchMyTarget = async () => {
    if (!session?.user?.id || !activeId) return;
    try {
      const { data, error } = await supabase
        .from('active_class_participants')
        .select('*')
        .eq('schedule_id', activeId)
        .eq('student_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) return;

      if (data && data.length > 0) {
         const studentData = data[0];
         setMyParticipantId(studentData.id); // Simpan ID antrian kita

         const surahIdStr = String(studentData.target_surah_id);
         const surahObj = verseData[surahIdStr];
         const textObj = surahObj?.ayat?.find(v => v.ayat === studentData.target_ayah);
         
         if (textObj) {
            setMyTarget({ 
              ...studentData, 
              text: textObj.teks_arab, 
              translation: textObj.terjemahan 
            });
         }
      }
    } catch (err) {}
  };

  const fetchParticipants = async () => {
     if (!activeId) return;
     const { data, error } = await supabase.from('active_class_participants').select('*').eq('schedule_id', activeId);
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
       
       // Update count di jadwal (Decrement)
       const { data: scheduleData } = await supabase.from('teacher_schedules').select('current_students_count').eq('id', activeId).single();
       if (scheduleData) {
          const currentCount = scheduleData.current_students_count ?? 0;
          const newCount = Math.max(0, currentCount - 1);
          await supabase.from('teacher_schedules').update({ current_students_count: newCount }).eq('id', activeId);
       }

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

       // Update count di jadwal (Decrement)
       const { data: scheduleData } = await supabase.from('teacher_schedules').select('current_students_count').eq('id', activeId).single();
       if (scheduleData) {
          const currentCount = scheduleData.current_students_count ?? 0;
          const newCount = Math.max(0, currentCount - 1);
          await supabase.from('teacher_schedules').update({ current_students_count: newCount }).eq('id', activeId);
       }

       Toast.show({ type: 'info', text1: 'Diulang ❌', text2: `${p.student_name} harus mengulang besok.`});
       fetchParticipants();
     } catch (err) {
        Toast.show({ type: 'error', text1: 'Gagal', text2: err.message });
     } finally {
        setIsProcessing(false);
     }
  };

  const handleBackPress = async () => {
     if (!isTeacher && myParticipantId && activeId) {
        setIsProcessing(true);
        try {
           // 1. Hapus dari daftar antrean
           await supabase.from('active_class_participants').delete().eq('id', myParticipantId);
           
           // 2. Ambil count terbaru dan kurangi 1
           const { data: scheduleData } = await supabase
              .from('teacher_schedules')
              .select('current_students_count')
              .eq('id', activeId)
              .single();

           if (scheduleData) {
              const currentCount = scheduleData.current_students_count ?? 0;
              const newCount = Math.max(0, currentCount - 1);
              await supabase
                 .from('teacher_schedules')
                 .update({ current_students_count: newCount })
                 .eq('id', activeId);
           }
        } catch (err) {
           console.log('Error leaving class:', err.message);
        } finally {
           setIsProcessing(false);
           onLeave();
        }
     } else {
        onLeave();
     }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={[styles.leaveBtn, isTeacher && { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
          <Feather name={isTeacher ? "power" : "arrow-left"} size={20} color="#ef4444" />
        </TouchableOpacity>
        <Text style={styles.title}>I-Qlab Live Class</Text>
        
        {isTeacher ? (
           <TouchableOpacity onPress={() => setShowPanel(true)} style={styles.badgeOpen}>
             <Feather name="users" size={14} color="#0ea5e9" style={{marginRight: 6}} />
             <Text style={{color: '#0ea5e9', fontWeight: 'bold', fontSize: 13}}>{participants.length}/4</Text>
           </TouchableOpacity>
        ) : (
           <TouchableOpacity onPress={() => setShowMushaf(true)} style={styles.mushafTrigger}>
              <Feather name="book-open" size={14} color="#10b981" style={{marginRight: 6}} />
              <Text style={{color: '#10b981', fontWeight: 'bold', fontSize: 13}}>Mushaf Mini</Text>
           </TouchableOpacity>
        )}
      </View>
      
      {!isFinished ? (
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
      ) : (
          <View style={styles.finishedWrapper}>
             <LinearGradient colors={['#0f172a', '#1e293b']} style={StyleSheet.absoluteFill} />
             <View style={styles.finishCard}>
                <View style={styles.successIcon}><Feather name="check-circle" size={50} color="#10b981" /></View>
                <Text style={styles.finishTitle}>Sesi Selesai ✨</Text>
                <Text style={styles.finishText}>Ustadz/ah telah menutup ruang kelas. Alhamdulillah untuk ilmu hari ini!</Text>
                <TouchableOpacity onPress={onLeave} style={styles.btnDone}>
                   <Text style={[styles.btnLulusText, {fontSize: 16}]}>Kembali ke Beranda</Text>
                </TouchableOpacity>
             </View>
          </View>
      )}

       {/* MODAL MUSHAF MINI UNTUK MURID */}
       <Modal visible={showMushaf} transparent animationType="slide">
          <View style={styles.panelOverlay}>
             <View style={styles.panelContainer}>
                <View style={styles.panelHeader}>
                   <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <View style={styles.mushafIcon}><Feather name="book-open" size={16} color="#0d9488" /></View>
                      <Text style={styles.panelTitle}>Mushaf Mini</Text>
                   </View>
                   <TouchableOpacity onPress={() => setShowMushaf(false)} style={styles.closePanelBtn}>
                      <Feather name="x" size={20} color="#94a3b8" />
                   </TouchableOpacity>
                </View>

                {myTarget ? (
                   <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center' }}>
                      <View style={styles.targetInfoPill}>
                         <Text style={styles.targetInfoText}>Membaca: Surah {myTarget.target_surah_id} - Ayat {myTarget.target_ayah}</Text>
                      </View>
                      <Text style={styles.mainAyatText}>{myTarget.text}</Text>
                      <View style={styles.translationContainer}>
                         <Text style={styles.translationText}>{myTarget.translation?.replace(/<sup[^>]*>.*?<\/sup>/g, '')}</Text>
                      </View>
                      <Text style={styles.mushafTip}>*Bacalah dengan tartil, ustadz sedang menyimak bacaan Anda.</Text>
                   </ScrollView>
                ) : (
                   <View style={{padding: 40, alignItems: 'center'}}>
                      <ActivityIndicator color="#0d9488" />
                      <Text style={{marginTop: 10, color: '#64748b'}}>Memuat target bacaan...</Text>
                      <TouchableOpacity onPress={fetchMyTarget} style={{marginTop: 20, padding: 10, backgroundColor: '#e2e8f0', borderRadius: 8}}>
                         <Text style={{fontSize: 12, color: '#475569'}}>Coba Lagi</Text>
                      </TouchableOpacity>
                   </View>
                )}
             </View>
          </View>
       </Modal>

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
                     <View style={{alignItems: 'center', marginTop: 40}}>
                        <Feather name="coffee" size={40} color="#cbd5e1" />
                        <Text style={{ textAlign: 'center', color: '#64748b', marginTop: 12 }}>Belum ada murid di dalam ruangan. Santai sejenak ustadz.</Text>
                     </View>
                  ) : (
                     participants.map(p => (
                        <View key={p.id} style={styles.studentCard}>
                           <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 16}}>
                              <View style={styles.studentAvatar}><FontAwesome5 name="user-graduate" size={16} color="#0d9488" /></View>
                              <View style={{flex: 1}}>
                                 <Text style={styles.studentName}>{p.student_name}</Text>
                                 <Text style={styles.studentTarget}>Surah {p.target_surah_id} - Ayat {p.target_ayah}</Text>
                              </View>
                              <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>LIVE</Text></View>
                           </View>

                           {/* Preview Ayat buat Guru juga biar ga repot buka mushaf */}
                           <View style={styles.previewBox}>
                              <Text style={styles.previewText} numberOfLines={2}>
                                 {verseData[String(p.target_surah_id)]?.ayat.find(v => v.ayat === p.target_ayah)?.teks_arab}
                              </Text>
                           </View>

                           <View style={styles.actionRow}>
                              <TouchableOpacity onPress={() => handleFailStudent(p)} disabled={isProcessing} style={styles.btnReulang}>
                                 <Feather name="x-circle" size={16} color="#ef4444" style={{marginRight: 6}} />
                                 <Text style={styles.btnReulangText}>Ulangi</Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handlePassStudent(p)} disabled={isProcessing} style={styles.btnLulus}>
                                 <Feather name="check-circle" size={16} color="white" style={{marginRight: 6}} />
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
  badgeOpen: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(14, 165, 233, 0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(14, 165, 233, 0.3)' },
  mushafTrigger: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' },
  webview: { flex: 1, backgroundColor: '#0f172a' },
  
  panelOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', zIndex: 100 },
  panelContainer: { backgroundColor: '#f8fafc', borderTopLeftRadius: 28, borderTopRightRadius: 28, minHeight: 450, maxHeight: '85%', overflow: 'hidden' },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  panelTitle: { color: '#0f172a', fontSize: 18, fontWeight: 'bold' },
  closePanelBtn: { width: 32, height: 32, backgroundColor: '#e2e8f0', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  
  mushafIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(13, 148, 136, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  targetInfoPill: { backgroundColor: '#eff6ff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 24, borderWidth: 1, borderColor: '#bfdbfe' },
  targetInfoText: { color: '#3b82f6', fontWeight: 'bold', fontSize: 13 },
  mainAyatText: { fontSize: 32, textAlign: 'center', color: '#0f172a', fontFamily: 'Uthmanic-Neo-Color', lineHeight: 52, marginBottom: 24 },
  translationContainer: { backgroundColor: '#ffffff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  translationText: { color: '#475569', fontSize: 15, lineHeight: 22, textAlign: 'center', fontStyle: 'italic' },
  mushafTip: { marginTop: 24, color: '#94a3b8', fontSize: 11, textAlign: 'center' },

  studentCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0', elevation: 2 },
  studentAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(13, 148, 136, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  studentName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  studentTarget: { fontSize: 13, color: '#64748b', marginTop: 2, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  btnReulang: { flex: 1, backgroundColor: '#fef2f2', paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#fca5a5', flexDirection: 'row', justifyContent: 'center' },
  btnReulangText: { color: '#ef4444', fontWeight: 'bold' },
  btnLulus: { flex: 1, backgroundColor: '#10b981', paddingVertical: 10, borderRadius: 12, alignItems: 'center', elevation: 2, flexDirection: 'row', justifyContent: 'center' },
  btnLulusText: { color: 'white', fontWeight: 'bold' },

  liveBadge: { backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#ef4444' },
  liveBadgeText: { color: '#ef4444', fontSize: 10, fontWeight: 'bold' },
  previewBox: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 12, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#0d9488' },
  previewText: { fontSize: 18, color: '#0f172a', textAlign: 'right', fontFamily: 'Uthmanic-Neo-Color' },
  
  finishedWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  finishCard: { width: '85%', backgroundColor: 'white', borderRadius: 32, padding: 32, alignItems: 'center', elevation: 20 },
  successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  finishTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
  finishText: { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  btnDone: { backgroundColor: '#10b981', paddingHorizontal: 40, paddingVertical: 16, borderRadius: 20, width: '100%', alignItems: 'center' }
});
