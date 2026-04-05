import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, Text, View, Platform, Animated, Dimensions, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { supabase } from '../lib/supabase';
import { useAdmin } from '../hooks/useAdmin';

export default function AdminScreen({ onBack, session }) {
  const {
    isAdminLoggedIn,
    isSignupMode,
    setIsSignupMode,
    email, setEmail,
    password, setPassword,
    fullName, setFullName,
    isLoading,
    tapCount,
    totalMurid, totalPengajar,
    currentAdminView, setCurrentAdminView,
    staffRole, setStaffRole,
    staffName, setStaffName,
    staffEmail, setStaffEmail,
    staffPassword, setStaffPassword,
    staffAge, setStaffAge,
    staffPhone, setStaffPhone,
    staffGender, setStaffGender,
    staffLembaga, setStaffLembaga,
    isTahseena, setIsTahseena,
    searchLembagaText, setSearchLembagaText,
    showLembagaList, setShowLembagaList,
    filterRole, setFilterRole,
    editingStaffId, setEditingStaffId,
    staffOldPassword, setStaffOldPassword,
    showOldPassword, setShowOldPassword,
    showPassword, setShowPassword,
    fadeAnim, slideAnim,
    manageTab, setManageTab,
    staffData, isFetchingStaff,
    handleDeleteStaff,
    handleIconTap,
    handleLogin,
    handleSignup,
    handleLogout,
    handleSaveStaff,
    initiateEditStaff
  } = useAdmin(session);

  const LoginView = () => (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.loginContainer}>
        <TouchableOpacity onPress={onBack} style={styles.backBtnAbsolute}>
           <Feather name="x" size={24} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleIconTap} activeOpacity={0.8} style={styles.loginIconBox}>
           <FontAwesome5 name="shield-alt" size={40} color={isSignupMode ? '#3b82f6' : '#fbbf24'} />
        </TouchableOpacity>
        <Text style={styles.loginTitle}>{isSignupMode ? 'Register Admin' : 'Admin Access'}</Text>
        <Text style={styles.loginSubtitle}>{isSignupMode ? 'Daftarkan administrator baru untuk mengelola sistem I-Qlab.' : 'Masukkan email staff dan password untuk membuka portal.'}</Text>

        <View style={styles.inputContainer}>
           {isSignupMode && (
             <>
               <Text style={styles.inputLabel}>Nama Lengkap</Text>
               <View style={styles.inputBox}>
                  <Feather name="user" size={18} color="#64748b" style={{marginRight: 12}} />
                  <TextInput style={styles.input} placeholder="Nama Admin" placeholderTextColor="#475569" value={fullName} onChangeText={setFullName} />
               </View>
             </>
           )}

           <Text style={styles.inputLabel}>Admin Email</Text>
           <View style={styles.inputBox}>
              <Feather name="mail" size={18} color="#64748b" style={{marginRight: 12}} />
              <TextInput style={styles.input} placeholder="admin@iqlab.com" placeholderTextColor="#475569" value={email} onChangeText={setEmail} autoCapitalize="none" />
           </View>

           <Text style={styles.inputLabel}>Password</Text>
           <View style={styles.inputBox}>
              <Feather name="lock" size={18} color="#64748b" style={{marginRight: 12}} />
              <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="#475569" secureTextEntry={true} value={password} onChangeText={setPassword} />
           </View>
        </View>

        <TouchableOpacity 
          style={[styles.loginSubmitBtn, isLoading && { opacity: 0.7 }]} 
          onPress={isSignupMode ? handleSignup : handleLogin}
          disabled={isLoading}
        >
           <LinearGradient colors={isSignupMode ? ['#3b82f6', '#2563eb'] : ['#fbbf24', '#d97706']} style={StyleSheet.absoluteFill} borderRadius={16} />
           {isLoading ? <ActivityIndicator color={isSignupMode ? "white" : "#0f172a"} /> : <Text style={[styles.loginSubmitText, isSignupMode && { color: 'white' }]}>{isSignupMode ? 'Buat Akun Admin' : 'Login Sekarang'}</Text>}
        </TouchableOpacity>

        {isSignupMode && (
          <TouchableOpacity onPress={() => setIsSignupMode(false)} style={{marginTop: 20}}>
            <Text style={{color: '#64748b', fontSize: 14}}>Kembali ke Login</Text>
          </TouchableOpacity>
        )}

        {!isSignupMode && (
          <View style={styles.oauthDivider}>
             <View style={styles.dividerLine} />
             <Text style={styles.dividerText}>Atau Gunakan Akun Google</Text>
             <View style={styles.dividerLine} />
          </View>
        )}

        {!isSignupMode && (
          <Text style={styles.oauthHint}>Jika Anda sudah login via Google di halaman utama, portal ini akan terbuka otomatis jika akun Anda sudah dipromosikan lewat SQL Editor.</Text>
        )}

        <Text style={styles.hintText}>Sistem keamanan bertenaga Supabase 🛡️</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const UserManagementView = () => (
    <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {
              if (editingStaffId) {
                  setEditingStaffId(null);
                  setManageTab('list');
              } else {
                  setCurrentAdminView('dashboard');
              }
          }} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>MANAJEMEN USER</Text>
            <View style={styles.adminBadge}><Text style={styles.badgeText}>Data Akun</Text></View>
          </View>
          <View style={[styles.profileCircle, { borderColor: '#10b981' }]}>
            <Feather name="user-plus" size={18} color="#10b981" />
          </View>
        </View>
        
        <View style={{ flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 12, padding: 4, marginVertical: 16 }}>
           <TouchableOpacity onPress={() => { setManageTab('list'); setEditingStaffId(null); }} style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: manageTab === 'list' ? '#3b82f6' : 'transparent' }}>
              <Text style={{ color: manageTab === 'list' ? 'white' : '#64748b', fontWeight: 'bold' }}>Data Staff</Text>
           </TouchableOpacity>
           <TouchableOpacity onPress={() => { setManageTab('form'); setEditingStaffId(null); setStaffName(''); setStaffEmail(''); setStaffPassword(''); setStaffAge(''); setStaffPhone(''); }} style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: manageTab === 'form' ? '#10b981' : 'transparent' }}>
              <Text style={{ color: manageTab === 'form' ? 'white' : '#64748b', fontWeight: 'bold' }}>Buat Baru</Text>
           </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
           {manageTab === 'list' ? (
              <View>
                 <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>Tabel Data</Text>
                 </View>
                 
                 <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                    {['semua', 'pengajar', 'admin'].map(f => (
                       <TouchableOpacity key={f} onPress={() => setFilterRole(f)} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: filterRole === f ? '#3b82f6' : '#1e293b', borderWidth: 1, borderColor: '#334155' }}>
                          <Text style={{ color: filterRole === f ? 'white' : '#94a3b8', fontSize: 12, textTransform: 'capitalize', fontWeight: 'bold' }}>{f}</Text>
                       </TouchableOpacity>
                    ))}
                 </View>

                 {isFetchingStaff ? <ActivityIndicator color="#3b82f6" /> : staffData.filter(s => filterRole === 'semua' ? true : s.role === filterRole).map((staff, idx) => (
                    <View key={idx} style={{ backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' }}>
                       <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                             <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: staff.role === 'admin' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                <FontAwesome5 name={staff.role === 'admin' ? 'user-shield' : 'chalkboard-teacher'} size={16} color={staff.role === 'admin' ? '#3b82f6' : '#10b981'} />
                             </View>
                             <View>
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{staff.full_name || 'Tanpa Nama'}</Text>
                                <Text style={{ color: '#64748b', fontSize: 12 }}>{staff.email}</Text>
                             </View>
                          </View>
                          <View style={{ backgroundColor: staff.role === 'admin' ? '#3b82f6' : '#10b981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                             <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>{staff.role}</Text>
                          </View>
                       </View>
                       <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16, paddingLeft: 52 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                             <Feather name="phone" size={12} color="#64748b" style={{ marginRight: 6 }} />
                             <Text style={{ color: '#94a3b8', fontSize: 12 }}>{staff.phone || '-'}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                             <Feather name="user" size={12} color="#64748b" style={{ marginRight: 6 }} />
                             <Text style={{ color: '#94a3b8', fontSize: 12 }}>{staff.gender || '-'} ({staff.age || '-'} th)</Text>
                          </View>
                       </View>
                       {staff.role === 'pengajar' && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingLeft: 52, marginTop: -8 }}>
                             <Feather name="home" size={12} color="#64748b" style={{ marginRight: 6 }} />
                             <Text style={{ color: '#94a3b8', fontSize: 12 }}>{staff.lembaga || 'Lembaga tidak disetel'}</Text>
                          </View>
                       )}
                       <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 12, justifyContent: 'flex-end', gap: 12 }}>
                          <TouchableOpacity onPress={() => initiateEditStaff(staff)} style={{ flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 8 }}>
                             <Feather name="edit-2" size={14} color="#3b82f6" style={{ marginRight: 6 }} />
                             <Text style={{ color: '#3b82f6', fontSize: 12, fontWeight: 'bold' }}>Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteStaff(staff.id)} style={{ flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 8 }}>
                             <Feather name="trash-2" size={14} color="#ef4444" style={{ marginRight: 6 }} />
                             <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: 'bold' }}>Hapus</Text>
                          </TouchableOpacity>
                       </View>
                    </View>
                 ))}
                 {staffData.length === 0 && !isFetchingStaff && (
                    <Text style={{ color: '#64748b', textAlign: 'center', marginTop: 20 }}>Belum ada data staf terdaftar.</Text>
                 )}
              </View>
           ) : (
              <View>
                 <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Pilih Tipe Akun</Text>
           <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
              <TouchableOpacity onPress={() => setStaffRole('pengajar')} style={[styles.roleBtn, staffRole === 'pengajar' && styles.roleBtnActive]}>
                 <FontAwesome5 name="chalkboard-teacher" size={14} color={staffRole === 'pengajar' ? 'white' : '#64748b'} />
                 <Text style={[styles.roleBtnText, staffRole === 'pengajar' && { color: 'white' }]}>Pengajar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStaffRole('admin')} style={[styles.roleBtn, staffRole === 'admin' && styles.roleBtnActive]}>
                 <FontAwesome5 name="user-shield" size={14} color={staffRole === 'admin' ? 'white' : '#64748b'} />
                 <Text style={[styles.roleBtnText, staffRole === 'admin' && { color: 'white' }]}>Admin</Text>
              </TouchableOpacity>
           </View>
           
           <View style={styles.inputContainer}>
               <Text style={styles.inputLabel}>Jenis Kelamin</Text>
               <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                  <TouchableOpacity onPress={() => setStaffGender('Laki-laki')} style={[styles.roleBtn, { height: 48, paddingVertical: 0 }, staffGender === 'Laki-laki' && styles.roleBtnActive]}>
                     <Text style={[styles.roleBtnText, staffGender === 'Laki-laki' && { color: 'white' }]}>Laki-laki</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setStaffGender('Perempuan')} style={[styles.roleBtn, { height: 48, paddingVertical: 0 }, staffGender === 'Perempuan' && styles.roleBtnActive]}>
                     <Text style={[styles.roleBtnText, staffGender === 'Perempuan' && { color: 'white' }]}>Perempuan</Text>
                  </TouchableOpacity>
               </View>

               <Text style={styles.inputLabel}>Nama Lengkap</Text>
               <View style={styles.inputBox}>
                  <Feather name="user" size={18} color="#64748b" style={{marginRight: 12}} />
                  <TextInput style={styles.input} placeholder="Contoh: Ahmad" placeholderTextColor="#475569" value={staffName} onChangeText={setStaffName} />
               </View>

               <Text style={styles.inputLabel}>Usia</Text>
               <View style={styles.inputBox}>
                  <Feather name="calendar" size={18} color="#64748b" style={{marginRight: 12}} />
                  <TextInput style={styles.input} placeholder="Contoh: 25" placeholderTextColor="#475569" value={staffAge} onChangeText={setStaffAge} keyboardType="numeric" />
               </View>

               <Text style={styles.inputLabel}>Nomor WhatsApp</Text>
               <View style={styles.inputBox}>
                  <Feather name="phone" size={18} color="#64748b" style={{marginRight: 12}} />
                  <TextInput style={styles.input} placeholder="08xxxxxxxxxx" placeholderTextColor="#475569" value={staffPhone} onChangeText={setStaffPhone} keyboardType="phone-pad" />
               </View>

               {staffRole === 'pengajar' && (
                  <>
                     <Text style={styles.inputLabel}>Asal Lembaga / Komunitas</Text>

                     <View style={{ flexDirection: 'row', gap: 12, marginBottom: isTahseena ? 16 : 8 }}>
                        <TouchableOpacity onPress={() => setIsTahseena(true)} style={[styles.roleBtn, { height: 48, paddingVertical: 0 }, isTahseena && styles.roleBtnActive]}>
                           <Feather name="check-circle" size={14} color={isTahseena ? 'white' : '#64748b'} />
                           <Text style={[styles.roleBtnText, isTahseena && { color: 'white' }]}>Tahseena (Pusat)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setIsTahseena(false)} style={[styles.roleBtn, { height: 48, paddingVertical: 0 }, !isTahseena && styles.roleBtnActive]}>
                           <Feather name="edit-2" size={14} color={!isTahseena ? 'white' : '#64748b'} />
                           <Text style={[styles.roleBtnText, !isTahseena && { color: 'white' }]}>Lembaga Lain</Text>
                        </TouchableOpacity>
                     </View>

                     {!isTahseena && (
                        <View style={{ marginBottom: 16 }}>
                           <View style={styles.inputBox}>
                              <Feather name="search" size={18} color="#64748b" style={{marginRight: 12}} />
                              <TextInput 
                                 style={styles.input} 
                                 placeholder="Cari & Pilih Lembaga Mitra Anda" 
                                 placeholderTextColor="#475569" 
                                 value={searchLembagaText} 
                                 onChangeText={(txt) => {
                                    setSearchLembagaText(txt);
                                    setShowLembagaList(true);
                                 }} 
                                 onFocus={() => setShowLembagaList(true)}
                              />
                           </View>
                           
                           {showLembagaList && (
                             <View style={{ marginTop: 8, maxHeight: 160, backgroundColor: '#1e293b', borderRadius: 12, borderWidth: 1, borderColor: '#334155', overflow: 'hidden' }}>
                                 <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true}>
                                    {['TPQ At-Taqwa', 'Pesantren Darunnajah', 'Rumah Tahfidz Al-Kahfi', 'LTTQ Fathullah', 'Komunitas Pejuang Subuh', 'Yayasan Al-Huda', 'Ma\'had Al-Jamiah', 'TPA Al-Bariq', 'SDIT Mutiara', 'Islamic Center UI', 'MUI Wilayah'].filter(l => l.toLowerCase().includes(searchLembagaText.toLowerCase())).map((mitra, idx) => (
                                       <TouchableOpacity 
                                          key={idx} 
                                          onPress={() => {
                                              setStaffLembaga(mitra);
                                              setSearchLembagaText(mitra);
                                              setShowLembagaList(false);
                                          }}
                                          style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#0f172a', backgroundColor: staffLembaga === mitra ? 'rgba(59, 130, 246, 0.1)' : 'transparent' }}
                                       >
                                          <Text style={{ color: staffLembaga === mitra ? '#3b82f6' : '#94a3b8', fontSize: 14, fontWeight: staffLembaga === mitra ? 'bold' : 'normal' }}>{mitra}</Text>
                                       </TouchableOpacity>
                                    ))}
                                    {['TPQ At-Taqwa', 'Pesantren Darunnajah', 'Rumah Tahfidz Al-Kahfi', 'LTTQ Fathullah', 'Komunitas Pejuang Subuh', 'Yayasan Al-Huda', 'Ma\'had Al-Jamiah', 'TPA Al-Bariq', 'SDIT Mutiara', 'Islamic Center UI', 'MUI Wilayah'].filter(l => l.toLowerCase().includes(searchLembagaText.toLowerCase())).length === 0 && (
                                       <View style={{ padding: 16 }}><Text style={{ color: '#64748b', fontSize: 12, textAlign: 'center' }}>Lembaga tidak ditemukan.</Text></View>
                                    )}
                                 </ScrollView>
                             </View>
                           )}
                           
                           {staffLembaga !== '' && !showLembagaList && (
                             <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                <Feather name="check-circle" size={14} color="#10b981" style={{ marginRight: 6 }} />
                                <Text style={{ color: '#10b981', fontSize: 12 }}>Terpilih: {staffLembaga}</Text>
                             </View>
                           )}
                        </View>
                     )}
                  </>
               )}

               {!editingStaffId && (
                  <>
                     <Text style={styles.inputLabel}>Email Akses</Text>
                     <View style={styles.inputBox}>
                        <Feather name="mail" size={18} color="#64748b" style={{marginRight: 12}} />
                        <TextInput style={styles.input} placeholder="staff@iqlab.com" placeholderTextColor="#475569" value={staffEmail} onChangeText={setStaffEmail} autoCapitalize="none" keyboardType="email-address" />
                     </View>

                     <Text style={styles.inputLabel}>Password Akun</Text>
                     <View style={styles.inputBox}>
                        <Feather name="lock" size={18} color="#64748b" style={{marginRight: 12}} />
                        <TextInput style={[styles.input, { flex: 1 }]} placeholder="••••••••" placeholderTextColor="#475569" secureTextEntry={!showPassword} value={staffPassword} onChangeText={setStaffPassword} />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                           <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color="#64748b" />
                        </TouchableOpacity>
                     </View>
                  </>
               )}
               
               {editingStaffId && (
                  <>
                     <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: 12, borderRadius: 12, marginBottom: 16, marginTop: 4 }}>
                        <Text style={{ color: '#f59e0b', fontSize: 12, lineHeight: 18 }}>Untuk mengubah password, lengkapi kedua kolom di bawah. Biarkan kosong jika tidak ingin mengubah password.</Text>
                     </View>

                     <Text style={styles.inputLabel}>Password Lama / Saat Ini</Text>
                     <View style={styles.inputBox}>
                        <Feather name="key" size={18} color="#64748b" style={{marginRight: 12}} />
                        <TextInput style={[styles.input, { flex: 1 }]} placeholder="••••••••" placeholderTextColor="#475569" secureTextEntry={!showOldPassword} value={staffOldPassword} onChangeText={setStaffOldPassword} />
                        <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)}>
                           <Feather name={showOldPassword ? 'eye-off' : 'eye'} size={18} color="#64748b" />
                        </TouchableOpacity>
                     </View>

                     <Text style={styles.inputLabel}>Password Baru</Text>
                     <View style={styles.inputBox}>
                        <Feather name="lock" size={18} color="#64748b" style={{marginRight: 12}} />
                        <TextInput style={[styles.input, { flex: 1 }]} placeholder="••••••••" placeholderTextColor="#475569" secureTextEntry={!showPassword} value={staffPassword} onChangeText={setStaffPassword} />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                           <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color="#64748b" />
                        </TouchableOpacity>
                     </View>
                  </>
               )}
           </View>
           
           <TouchableOpacity style={[styles.loginSubmitBtn, isLoading && { opacity: 0.7 }]} onPress={handleSaveStaff} disabled={isLoading}>
              <LinearGradient colors={['#3b82f6', '#2563eb']} style={StyleSheet.absoluteFill} borderRadius={16} />
              {isLoading ? <ActivityIndicator color="white" /> : <Text style={[styles.loginSubmitText, { color: 'white' }]}>{editingStaffId ? 'Simpan Perubahan' : 'Daftarkan Akun'}</Text>}
           </TouchableOpacity>

           {editingStaffId && (
              <TouchableOpacity onPress={() => { setEditingStaffId(null); setManageTab('list'); }} style={{ marginTop: 16, paddingVertical: 12, alignItems: 'center' }}>
                 <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>Batalkan Edit</Text>
              </TouchableOpacity>
           )}
        </View>
        )}
        </ScrollView>
    </View>
  );

  const DashboardView = () => (
    <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>ADMIN PANEL</Text>
            <View style={styles.adminBadge}><Text style={styles.badgeText}>Sistem I-Qlab</Text></View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.profileCircle}>
            <Feather name="log-out" size={16} color="#fbbf24" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Welcome Card */}
          <View style={styles.welcomeCard}>
            <LinearGradient colors={['#1e293b', '#334155']} style={StyleSheet.absoluteFill} borderRadius={24} />
            <View style={styles.welcomeInfo}>
              <Text style={styles.welcomeSmall}>Assalamu'alaikum,</Text>
              <Text style={styles.welcomeName}>{session?.user?.user_metadata?.full_name || 'Admin'} ✨</Text>
              <Text style={styles.welcomeDesc}>Pantau perkembangan dan kelola ekosistem I-Qlab di sini.</Text>
            </View>
          </View>

          {/* Quick Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Feather name="users" size={20} color="#3b82f6" />
              </View>
              <Text style={styles.statValue}>{totalMurid}</Text>
              <Text style={styles.statLabel}>Total Murid</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <FontAwesome5 name="chalkboard-teacher" size={16} color="#10b981" />
              </View>
              <Text style={styles.statValue}>{totalPengajar}</Text>
              <Text style={styles.statLabel}>Total Pengajar</Text>
            </View>
          </View>

          {/* Management Section */}
          <Text style={styles.sectionTitle}>Management Menu</Text>
          
          <TouchableOpacity style={styles.manageBtn} onPress={() => setCurrentAdminView('usermanagement')}>
            <View style={[styles.manageIcon, { backgroundColor: '#059669' }]}><Feather name="user-plus" size={18} color="white" /></View>
            <View style={styles.manageTextContent}>
              <Text style={styles.manageTitle}>Manajemen User</Text>
              <Text style={styles.manageSub}>Pendaftaran Pengajar & Admin</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.manageBtn}>
            <View style={[styles.manageIcon, { backgroundColor: '#1e3a8a' }]}><Feather name="database" size={18} color="white" /></View>
            <View style={styles.manageTextContent}>
              <Text style={styles.manageTitle}>Database Quran</Text>
              <Text style={styles.manageSub}>Kelola Mushaf & Terjemahan</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.manageBtn}>
            <View style={[styles.manageIcon, { backgroundColor: '#7c2d12' }]}><Feather name="settings" size={18} color="white" /></View>
            <View style={styles.manageTextContent}>
              <Text style={styles.manageTitle}>Konfigurasi Server</Text>
              <Text style={styles.manageSub}>Status API & Keamanan</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#64748b" />
          </TouchableOpacity>
        </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0f172a', '#1e293b']} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.mainWrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
         {isAdminLoggedIn 
           ? (currentAdminView === 'usermanagement' ? UserManagementView() : DashboardView()) 
           : LoginView()}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  mainWrapper: { flex: 1, paddingHorizontal: 20 },
  
  // Login Styles
  loginContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  backBtnAbsolute: { position: 'absolute', top: 0, left: 0, width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  loginIconBox: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(255, 255, 255, 0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  loginTitle: { color: 'white', fontSize: 26, fontWeight: 'bold', marginBottom: 8 },
  loginSubtitle: { color: '#64748b', fontSize: 14, textAlign: 'center', marginBottom: 30, paddingHorizontal: 20 },
  inputContainer: { width: '100%', marginBottom: 30 },
  inputLabel: { color: 'white', fontSize: 14, fontWeight: 'bold', marginBottom: 10, marginLeft: 4 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: '#334155', marginBottom: 16 },
  input: { flex: 1, color: 'white', fontSize: 16 },
  loginSubmitBtn: { width: '100%', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 10 },
  loginSubmitText: { color: '#0f172a', fontSize: 16, fontWeight: 'bold' },
  hintText: { color: '#334155', fontSize: 11, marginTop: 20, opacity: 0.5 },

  // OAuth Divider
  oauthDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, width: '100%', opacity: 0.5 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#334155' },
  dividerText: { color: '#64748b', fontSize: 10, marginHorizontal: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  oauthHint: { color: '#475569', fontSize: 11, textAlign: 'center', fontStyle: 'italic', paddingHorizontal: 10 },

  // Header Dashboard
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 20 
  },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  headerTitleBox: { alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 13, fontWeight: 'bold', letterSpacing: 2 },
  adminBadge: { backgroundColor: '#fbbf24', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  badgeText: { color: '#0f172a', fontSize: 9, fontWeight: 'bold' },
  profileCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1e293b', borderWidth: 1.5, borderColor: '#fbbf24', justifyContent: 'center', alignItems: 'center' },
  
  welcomeCard: { padding: 24, marginTop: 10, height: 160, justifyContent: 'center' },
  welcomeInfo: { zIndex: 10 },
  welcomeSmall: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 4 },
  welcomeName: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  welcomeDesc: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 8, lineHeight: 20 },
  
  statsGrid: { flexDirection: 'row', gap: 15, marginTop: 24 },
  statCard: { flex: 1, backgroundColor: '#1e293b', padding: 18, borderRadius: 24, borderWidth: 1, borderColor: '#334155' },
  statIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  statValue: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  
  sectionTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', marginTop: 30, marginBottom: 16 },
  manageBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  manageIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  manageTextContent: { flex: 1 },
  manageTitle: { color: 'white', fontSize: 15, fontWeight: 'bold' },
  manageSub: { color: '#64748b', fontSize: 12, marginTop: 2 },
  roleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b', paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: '#334155', gap: 8 },
  roleBtnActive: { backgroundColor: '#10b981', borderColor: '#059669' },
  roleBtnText: { color: '#64748b', fontSize: 14, fontWeight: 'bold' },
});
