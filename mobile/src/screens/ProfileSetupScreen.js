import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { profileService } from '../services/profileService';

const ProfileSetupScreen = ({ onProfileComplete }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    whatsappNumber: '',
    age: '',
    gender: 'Ikhwan',
    address: ''
  });

  const handleSave = async () => {
    // Validasi sederhana
    if (!formData.fullName || !formData.whatsappNumber || !formData.age || !formData.address) {
      Alert.alert('Eitss!', 'Mohon isi semua data ya Kak 😊');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User tidak ditemukan');

      await profileService.createProfile({
        id: user.id,
        ...formData
      });

      Alert.alert('Alhamdulillah!', 'Profil Kakak sudah berhasil disimpan.');
      if (onProfileComplete) onProfileComplete();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Waduh!', 'Gagal menyimpan profil. Coba lagi ya.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Ahlan wa Sahlan!</Text>
            <Text style={styles.subtitle}>Yuk, lengkapi profil Kakak dulu untuk mulai belajar.</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.label}>Nama Lengkap</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Dimas Prass"
              placeholderTextColor="#64748B"
              value={formData.fullName}
              onChangeText={(text) => setFormData({ ...formData, fullName: text })}
            />

            <Text style={styles.label}>Nomor WhatsApp</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: 08123456789"
              placeholderTextColor="#64748B"
              keyboardType="phone-pad"
              value={formData.whatsappNumber}
              onChangeText={(text) => setFormData({ ...formData, whatsappNumber: text })}
            />

            <Text style={styles.label}>Usia</Text>
            <TextInput
              style={styles.input}
              placeholder="Berapa umur Kakak?"
              placeholderTextColor="#64748B"
              keyboardType="numeric"
              value={formData.age}
              onChangeText={(text) => setFormData({ ...formData, age: text })}
            />

            <Text style={styles.label}>Jenis Kelamin</Text>
            <View style={styles.genderContainer}>
              {['Ikhwan', 'Akhwat'].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.genderButton,
                    formData.gender === g && styles.genderButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, gender: g })}
                >
                  <Text style={[
                    styles.genderText,
                    formData.gender === g && styles.genderTextActive
                  ]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Tempat Tinggal</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Alamat singkat Kakak..."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={3}
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Simpan & Lanjut</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    lineHeight: 24,
  },
  formCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    color: '#F8FAFC',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  genderButtonActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  genderText: {
    color: '#94A3B8',
    fontWeight: '600',
  },
  genderTextActive: {
    color: '#38BDF8',
  },
  saveButton: {
    backgroundColor: '#38BDF8',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 32,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProfileSetupScreen;
