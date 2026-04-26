import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Modal, Dimensions, Animated, Easing } from 'react-native';
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const TeacherLobby = ({ visible, onClose, activeTeachers, joinTeacherClass, session }) => {
  const [showModal, setShowModal] = useState(visible);
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      Animated.spring(animValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8
      }).start();
    } else {
      handleDismiss();
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.timing(animValue, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
      easing: Easing.in(Easing.ease)
    }).start(() => {
      setShowModal(false);
      onClose(); // Panggil callback asli setelah animasi selesai
    });
  };

  if (!showModal && !visible) return null;

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT * 0.8, 0],
  });

  const backdropOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Modal
      visible={showModal}
      transparent={true}
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <View style={styles.lobbyOverlay}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(15, 23, 42, 0.75)', opacity: backdropOpacity }
          ]}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={handleDismiss}
          />
        </Animated.View>

        <Animated.View style={[styles.lobbyContainer, { transform: [{ translateY }] }]}>
          {/* Bottom Sheet Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          <View style={styles.lobbyHeader}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="account-group" size={24} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.lobbyTitle}>Pilih Ustadz/Ustadzah</Text>
                <Text style={styles.lobbySubtitle}>Sesi Live Setoran Bacaan</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleDismiss} style={styles.closeLobbyBtn}>
              <Feather name="x" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoBanner}>
            <Feather name="info" size={14} color="#3b82f6" style={{ marginRight: 8 }} />
            <Text style={styles.infoText}>Batas 4 Murid per Kelas untuk kualitas terbaik ✨</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {activeTeachers.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <MaterialCommunityIcons name="calendar-clock" size={48} color="#cbd5e1" />
                </View>
                <Text style={styles.noTeacherTitle}>Belum Ada Pengajar</Text>
                <Text style={styles.noTeacherText}>
                  Maaf ka, saat ini belum ada pengajar yang standby untuk gender Anda. Silakan cek berkala ya! 😊
                </Text>
              </View>
            ) : (
              activeTeachers.map(teacher => {
                const isFull = teacher.current_students_count >= 4;
                const isPerempuan = session?.user?.user_metadata?.gender === 'Perempuan';

                return (
                  <View key={teacher.id} style={styles.teacherCard}>
                    <View style={styles.teacherInfoRow}>
                      <View style={[styles.avatarContainer, isFull && styles.avatarContainerFull]}>
                        <FontAwesome5
                          name={isPerempuan ? "user-graduate" : "user-tie"}
                          size={20}
                          color={isFull ? "#94a3b8" : "#3b82f6"}
                        />
                      </View>

                      <View style={styles.nameSection}>
                        <Text style={styles.teacherName}>
                          {teacher.teacher_name || (isPerempuan ? 'Ustadzah I-Qlab' : 'Ustadz I-Qlab')}
                        </Text>
                        <View style={styles.statusRow}>
                          <View style={[styles.statusDot, { backgroundColor: isFull ? '#ef4444' : '#10b981' }]} />
                          <Text style={[styles.statusText, { color: isFull ? '#ef4444' : '#10b981' }]}>
                            {isFull ? `Penuh (${teacher.current_students_count}/4)` : `Tersedia (${teacher.current_students_count}/4)`}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        disabled={isFull}
                        onPress={() => joinTeacherClass(teacher)}
                        style={styles.joinBtnWrapper}
                      >
                        <LinearGradient
                          colors={isFull ? ['#e2e8f0', '#cbd5e1'] : ['#3b82f6', '#2563eb']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.btnJoinLobby}
                        >
                          <Text style={[styles.btnJoinLobbyText, isFull && { color: '#94a3b8' }]}>
                            {isFull ? 'Penuh' : 'Masuk'}
                          </Text>
                          {!isFull && <Feather name="arrow-right" size={14} color="white" style={{ marginLeft: 4 }} />}
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  lobbyOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end'
  },
  dismissArea: {
    flex: 1,
  },
  lobbyContainer: {
    backgroundColor: '#ffffff',
    maxHeight: SCREEN_HEIGHT * 0.85,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    width: '100%',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#e2e8f0',
  },
  lobbyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lobbyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  lobbySubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 1,
  },
  closeLobbyBtn: {
    width: 36,
    height: 36,
    backgroundColor: '#f1f5f9',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    marginHorizontal: 24,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0f2fe',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '600',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 16
  },
  teacherCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 16,
    // Soft shadow
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  teacherInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarContainerFull: {
    backgroundColor: '#f8fafc',
  },
  nameSection: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  joinBtnWrapper: {
    marginLeft: 12,
  },
  btnJoinLobby: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  btnJoinLobbyText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 14
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  noTeacherTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 8,
  },
  noTeacherText: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
});

export default TeacherLobby;
