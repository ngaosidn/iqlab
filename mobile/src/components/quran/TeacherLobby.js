import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';

const TeacherLobby = ({ visible, onClose, activeTeachers, joinTeacherClass, session }) => {
  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, styles.lobbyOverlay]}>
      <View style={styles.lobbyContainer}>
        <View style={styles.lobbyHeader}>
          <Text style={styles.lobbyTitle}>Pilih Ustadz/Ustadzah</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeLobbyBtn}>
            <Feather name="x" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
        <Text style={styles.lobbySubtitle}>Daftar pengajar yang sedang siaran langsung saat ini (Batas 4 Murid/Kelas):</Text>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {activeTeachers.length === 0 ? (
            <Text style={styles.noTeacherText}>
              Belum ada pengajar (sesuai gender Anda) yang sedang Online saat ini. Silakan kembali nanti.
            </Text>
          ) : (
            activeTeachers.map(teacher => {
              const isFull = teacher.current_students_count >= 4;
              return (
                <View key={teacher.id} style={styles.teacherLobbyCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.teacherLobbyName}>
                      {teacher.teacher_name || (session?.user?.user_metadata?.gender === 'Perempuan' ? 'Ustadzah I-Qlab' : 'Ustadz I-Qlab')}
                    </Text>
                    <Text style={{ fontSize: 13, color: isFull ? '#ef4444' : '#0d9488', fontWeight: 'bold' }}>
                      {isFull ? `Penuh (${teacher.current_students_count}/4)` : `Tersedia (${teacher.current_students_count}/4 Murid)`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    disabled={isFull}
                    onPress={() => joinTeacherClass(teacher)}
                    style={[styles.btnJoinLobby, isFull && { backgroundColor: '#e2e8f0' }]}
                  >
                    <Text style={[styles.btnJoinLobbyText, isFull && { color: '#94a3b8' }]}>Masuk</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  lobbyOverlay: { backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', zIndex: 1000 },
  lobbyContainer: { backgroundColor: '#ffffff', maxHeight: '80%', overflow: 'hidden', borderTopLeftRadius: 24, borderTopRightRadius: 24, width: '100%', elevation: 15 },
  lobbyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  lobbyTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  closeLobbyBtn: { width: 32, height: 32, backgroundColor: '#f1f5f9', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  lobbySubtitle: { paddingHorizontal: 20, paddingTop: 16, fontSize: 13, color: '#64748b', lineHeight: 20 },
  noTeacherText: { textAlign: 'center', color: '#94a3b8', marginVertical: 30 },
  teacherLobbyCard: { flexDirection: 'row', backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  teacherLobbyName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 2 },
  btnJoinLobby: { backgroundColor: '#0d9488', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  btnJoinLobbyText: { color: 'white', fontWeight: 'bold', fontSize: 14 }
});

export default TeacherLobby;
