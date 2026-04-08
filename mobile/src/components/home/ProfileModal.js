import React from 'react';
import { StyleSheet, Text, View, Modal, TextInput, TouchableOpacity } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../../lib/toastConfig';

const ProfileModal = ({ visible, session, age, setAge, gender, setGender, saveProfileData }) => {
  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>Lengkapi Profil Kamu</Text>
          <Text style={styles.modalDesc}>Sebelum lanjut, kasih tau kita dulu ya biar pembelajarannya sesuai dengan kamu!</Text>

          {/* Informasi Akun Google Terhubung */}
          {session?.user && (
            <View style={styles.googleInfoContainer}>
              <View style={styles.infoRow}>
                <Feather name="user" size={16} color="#64748b" />
                <Text style={styles.infoText}>{session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Nama Tidak Tersedia'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Feather name="mail" size={16} color="#64748b" />
                <Text style={styles.infoText}>{session.user.email || 'Email Tidak Tersedia'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Feather name="phone" size={16} color="#64748b" />
                <Text style={styles.infoText}>{session.user.phone || session.user.user_metadata?.phone || 'No. HP Tidak Terdaftar di Google'}</Text>
              </View>
            </View>
          )}

          <Text style={styles.label}>Berapa Usia Kamu?</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: 25"
            keyboardType="number-pad"
            value={age}
            onChangeText={setAge}
          />

          <Text style={styles.label}>Jenis Kelamin</Text>
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[styles.genderBtn, gender === 'Laki-laki' && styles.genderBtnActive]}
              onPress={() => setGender('Laki-laki')}
            >
              <FontAwesome5 name="male" size={24} color={gender === 'Laki-laki' ? 'white' : '#64748b'} />
              <Text style={[styles.genderText, gender === 'Laki-laki' && styles.genderTextActive]}>Laki-laki</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.genderBtn, gender === 'Perempuan' && styles.genderBtnActive]}
              onPress={() => setGender('Perempuan')}
            >
              <FontAwesome5 name="female" size={24} color={gender === 'Perempuan' ? 'white' : '#64748b'} />
              <Text style={[styles.genderText, gender === 'Perempuan' && styles.genderTextActive]}>Perempuan</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={saveProfileData}>
            <Text style={styles.saveBtnText}>Simpan Data</Text>
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
  modalBox: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  googleInfoContainer: {
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 15,
    color: '#334155',
    fontWeight: '600',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f1f5f9',
    padding: 14,
    borderRadius: 12,
    fontSize: 18,
    color: '#0f172a',
  },
  genderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  genderBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  genderBtnActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
  },
  genderText: {
    marginTop: 8,
    fontWeight: 'bold',
    color: '#64748b',
  },
  genderTextActive: {
    color: 'white',
  },
  saveBtn: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default ProfileModal;
