import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../../lib/toastConfig';

const AdminHubModal = ({ visible, onClose, onNavigate }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={{flex: 1}} activeOpacity={1} onPress={onClose} />
        <View style={styles.adminModalContent}>
          <View style={styles.modalDragIndicator} />
          
          <View style={styles.adminModalHeader}>
            <View style={styles.adminIconCircle}>
              <Feather name="shield" size={24} color="#fbbf24" />
            </View>
            <Text style={styles.adminModalTitle}>Internal Access Hub</Text>
            <Text style={styles.adminModalSubtitle}>Halaman akses terbatas untuk tim I-Qlab.</Text>
          </View>

          <View style={styles.adminHubGrid}>
            <TouchableOpacity 
              style={styles.adminHubCard} 
              onPress={() => {
                onClose();
                setTimeout(() => onNavigate('admin'), 300);
              }}
            >
              <LinearGradient colors={['#1e293b', '#0f172a']} style={StyleSheet.absoluteFill} borderRadius={20} />
              <View style={styles.adminHubCardIcon}><Feather name="lock" size={20} color="#fbbf24" /></View>
              <Text style={styles.adminHubCardText}>Admin Area</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.adminHubCard} 
              onPress={() => {
                onClose();
                setTimeout(() => onNavigate('pengajar'), 300);
              }}
            >
              <LinearGradient colors={['#0f766e', '#134e4a']} style={StyleSheet.absoluteFill} borderRadius={20} />
              <View style={styles.adminHubCardIcon}><Feather name="book-open" size={20} color="white" /></View>
              <Text style={styles.adminHubCardText}>Pengajar Hub</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.closeAdminBtn} 
            onPress={onClose}
          >
            <Text style={styles.closeAdminBtnText}>Kembali</Text>
          </TouchableOpacity>
          <Toast config={toastConfig} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  adminModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    width: '100%',
  },
  modalDragIndicator: { width: 40, height: 5, borderRadius: 3, backgroundColor: '#cbd5e1', marginBottom: 12 },
  adminModalHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  adminIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  adminModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  adminModalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  adminHubGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 30,
  },
  adminHubCard: {
    flex: 1,
    height: 120,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  adminHubCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  adminHubCardText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeAdminBtn: {
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  closeAdminBtnText: {
    color: '#64748b',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AdminHubModal;
