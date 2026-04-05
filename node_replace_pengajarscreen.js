const fs = require('fs');
let content = fs.readFileSync('mobile/src/screens/PengajarScreen.js', 'utf8');

// 1. Add definitions to the hook destructoring:
content = content.replace(
  "    handleLogout\n  } = usePengajar(session);",
  `    handleLogout,
    currentTeacherView, setCurrentTeacherView,
    settingsPhone, setSettingsPhone,
    settingsOldPassword, setSettingsOldPassword,
    settingsNewPassword, setSettingsNewPassword,
    showOldPassword, setShowOldPassword,
    showNewPassword, setShowNewPassword,
    handleUpdateSettings
  } = usePengajar(session);`
);

// 2. Add SettingsView definition string
const settingsView = `
  const SettingsView = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentTeacherView('dashboard')} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#0d9488" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PENGATURAN AKUN</Text>
        <View style={styles.profileBadge}>
          <Feather name="settings" size={16} color="white" />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20, paddingTop: 20 }}>
        
        <Text style={styles.sectionTitle}>Ubah Profil & Kontak</Text>
        <View style={styles.inputContainer}>
           <Text style={styles.inputLabel}>Nomor WhatsApp</Text>
           <View style={styles.inputBox}>
              <Feather name="phone" size={18} color="#94a3b8" style={{marginRight: 12}} />
              <TextInput style={styles.input} placeholder="08xxxxxxxxxx" placeholderTextColor="#94a3b8" value={settingsPhone} onChangeText={setSettingsPhone} keyboardType="phone-pad" />
           </View>
        </View>

        <Text style={[styles.sectionTitle, {marginTop: 10}]}>Ubah Kata Sandi (Opsional)</Text>
        <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: 12, borderRadius: 12, marginBottom: 16 }}>
           <Text style={{ color: '#d97706', fontSize: 12, lineHeight: 18 }}>Biarkan kolom password tetap kosong jika Anda tidak ingin merubahnya.</Text>
        </View>

        <View style={styles.inputContainer}>
           <Text style={styles.inputLabel}>Password Lama</Text>
           <View style={styles.inputBox}>
              <Feather name="key" size={18} color="#94a3b8" style={{marginRight: 12}} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Masukkan Password Saat Ini" placeholderTextColor="#94a3b8" secureTextEntry={!showOldPassword} value={settingsOldPassword} onChangeText={setSettingsOldPassword} />
              <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)}>
                 <Feather name={showOldPassword ? 'eye-off' : 'eye'} size={18} color="#94a3b8" />
              </TouchableOpacity>
           </View>

           <Text style={styles.inputLabel}>Password Baru</Text>
           <View style={styles.inputBox}>
              <Feather name="lock" size={18} color="#94a3b8" style={{marginRight: 12}} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Masukkan Password Baru" placeholderTextColor="#94a3b8" secureTextEntry={!showNewPassword} value={settingsNewPassword} onChangeText={setSettingsNewPassword} />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                 <Feather name={showNewPassword ? 'eye-off' : 'eye'} size={18} color="#94a3b8" />
              </TouchableOpacity>
           </View>
        </View>

        <TouchableOpacity 
          style={[styles.loginSubmitBtn, isLoading && { opacity: 0.7 }]} 
          onPress={handleUpdateSettings}
          disabled={isLoading}
        >
           {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.loginSubmitText}>Simpan Perubahan</Text>}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );

  const DashboardView`;

content = content.replace("  const DashboardView", settingsView);

// 3. Add Settings button to DashboardView
const settingsButton = `
          {/* Class Management */}
          <Text style={styles.sectionTitle}>Manajemen Kelas</Text>
          <TouchableOpacity style={styles.classItem}>
            <View style={styles.classIcon}><MaterialIcons name="groups" size={24} color="#0d9488" /></View>
            <View style={styles.classInfo}>
              <Text style={styles.className}>Kelas Tahsin Dasar</Text>
              <Text style={styles.classMembers}>24 Murid Terdaftar</Text>
            </View>
            <View style={styles.classAction}><Feather name="chevron-right" size={20} color="#94a3b8" /></View>
          </TouchableOpacity>

          {/* Pengaturan Akun */}
          <Text style={styles.sectionTitle}>Pengaturan</Text>
          <TouchableOpacity style={styles.classItem} onPress={() => setCurrentTeacherView('settings')}>
            <View style={[styles.classIcon, { backgroundColor: '#f1f5f9' }]}><Feather name="settings" size={24} color="#64748b" /></View>
            <View style={styles.classInfo}>
              <Text style={styles.className}>Pengaturan Akun</Text>
              <Text style={styles.classMembers}>Ubah Kata Sandi & Profil</Text>
            </View>
            <View style={styles.classAction}><Feather name="chevron-right" size={20} color="#94a3b8" /></View>
          </TouchableOpacity>
      </ScrollView>`;

content = content.replace(
`          {/* Class Management */}
          <Text style={styles.sectionTitle}>Manajemen Kelas</Text>
          <TouchableOpacity style={styles.classItem}>
            <View style={styles.classIcon}><MaterialIcons name="groups" size={24} color="#0d9488" /></View>
            <View style={styles.classInfo}>
              <Text style={styles.className}>Kelas Tahsin Dasar</Text>
              <Text style={styles.classMembers}>24 Murid Terdaftar</Text>
            </View>
            <View style={styles.classAction}><Feather name="chevron-right" size={20} color="#94a3b8" /></View>
          </TouchableOpacity>
      </ScrollView>`, settingsButton);

content = content.replace(
  "{isTeacherLoggedIn ? DashboardView() : LoginView()}",
  "{isTeacherLoggedIn ? (currentTeacherView === 'dashboard' ? DashboardView() : SettingsView()) : LoginView()}"
);

fs.writeFileSync('mobile/src/screens/PengajarScreen.js', content);
console.log('PengajarScreen updated with SettingsView!');
