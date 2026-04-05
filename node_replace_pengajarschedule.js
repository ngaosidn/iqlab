const fs = require('fs');

// 1. UPDATE usePengajar.js
let hookContent = fs.readFileSync('mobile/src/hooks/usePengajar.js', 'utf8');

hookContent = hookContent.replace(
  "  const [showNewPassword, setShowNewPassword] = useState(false);",
  `  const [showNewPassword, setShowNewPassword] = useState(false);

  // SCHEDULE STATES
  const [schedules, setSchedules] = useState([]);
  const [jadwalDay, setJadwalDay] = useState('Senin');
  const [jadwalTime, setJadwalTime] = useState('16:00 - 17:30');
  const isTahseenaTeacher = session?.user?.user_metadata?.lembaga === 'Tahseena';`
);

const fetchSchedulesStr = `
  useEffect(() => {
    if (currentTeacherView === 'jadwal' && session?.user?.id) {
       fetchSchedules();
    }
  }, [currentTeacherView, session]);

  const fetchSchedules = async () => {
    if (!session?.user?.id) return;
    try {
      const { data, error } = await supabase.from('teacher_schedules').select('*').eq('teacher_id', session.user.id);
      if (!error && data) setSchedules(data);
    } catch (err) {}
  };

  const handleAddSchedule = async () => {
    if (!isTahseenaTeacher && schedules.length >= 1) {
      Toast.show({ type: 'error', text1: 'Sistem Terkunci 🔒', text2: 'Pengajar Mitra hanya dapat mengisi maksimal 1 jadwal per minggu.' });
      return;
    }
    
    // Cegah duplikat
    const isDuplicate = schedules.find(s => s.day_of_week === jadwalDay && s.time_slot === jadwalTime);
    if (isDuplicate) {
      Toast.show({ type: 'info', text1: 'Jadwal Bentrok', text2: 'Anda sudah mendaftarkan jadwal di waktu tersebut.' });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from('teacher_schedules').insert({
        teacher_id: session.user.id,
        day_of_week: jadwalDay,
        time_slot: jadwalTime
      });
      if (error) throw error;
      Toast.show({ type: 'success', text1: 'Jadwal Aktif!', text2: 'Sesi ketersediaan Anda berhasil ditambahkan.' });
      fetchSchedules();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Gagal Menyimpan', text2: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSchedule = async (id) => {
    try {
      const { error } = await supabase.from('teacher_schedules').delete().eq('id', id);
      if (!error) {
         Toast.show({ type: 'info', text1: 'Terhapus', text2: 'Jadwal Anda telah ditarik.' });
         fetchSchedules();
      }
    } catch (err) {}
  };
`;

hookContent = hookContent.replace("  const handleLogout = async () => {", fetchSchedulesStr + "\n  const handleLogout = async () => {");

hookContent = hookContent.replace(
  "    handleUpdateSettings,",
  `    handleUpdateSettings,
    schedules, isTahseenaTeacher,
    jadwalDay, setJadwalDay,
    jadwalTime, setJadwalTime,
    handleAddSchedule, handleDeleteSchedule,`
);

fs.writeFileSync('mobile/src/hooks/usePengajar.js', hookContent);
console.log('usePengajar updated with schedule logic!');


// 2. UPDATE PengajarScreen.js
let screenContent = fs.readFileSync('mobile/src/screens/PengajarScreen.js', 'utf8');

// Insert hooks values
screenContent = screenContent.replace(
  "    handleUpdateSettings\n  } = usePengajar(session);",
  `    handleUpdateSettings,
    schedules, isTahseenaTeacher,
    jadwalDay, setJadwalDay,
    jadwalTime, setJadwalTime,
    handleAddSchedule, handleDeleteSchedule
  } = usePengajar(session);`
);

const jadwalView = `
  const JadwalView = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentTeacherView('dashboard')} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#0d9488" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MANAJEMEN JADWAL</Text>
        <View style={styles.profileBadge}>
          <Feather name="calendar" size={16} color="white" />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20, paddingTop: 20 }}>
        
        <View style={{ backgroundColor: isTahseenaTeacher ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)', padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: isTahseenaTeacher ? 'rgba(59, 130, 246, 0.3)' : 'rgba(245, 158, 11, 0.3)', flexDirection: 'row', alignItems: 'center' }}>
           <FontAwesome5 name={isTahseenaTeacher ? "shield-alt" : "info-circle"} size={20} color={isTahseenaTeacher ? "#3b82f6" : "#f59e0b"} style={{ marginRight: 16 }} />
           <View style={{ flex: 1 }}>
              <Text style={{ color: isTahseenaTeacher ? "#3b82f6" : "#f59e0b", fontWeight: 'bold', fontSize: 13, marginBottom: 4 }}>
                 {isTahseenaTeacher ? "Hak Istimewa Tahseena" : "Batas Kuota Mitra"}
              </Text>
              <Text style={{ color: isTahseenaTeacher ? "#60a5fa" : "#fbbf24", fontSize: 12, lineHeight: 18 }}>
                 {isTahseenaTeacher 
                   ? "Sebagai Pengajar Pusat, Anda dapat membuka kuota waktu mengajar sebanyak-banyaknya kapanpun." 
                   : "Sistem hanya mengizinkan pengajar dari lembaga mitra mengisi maksimal 1 jadwal (1x waktu) per minggu."}
              </Text>
           </View>
        </View>

        <Text style={styles.sectionTitle}>Tambah Jadwal Baru</Text>
        
        <View style={styles.inputContainer}>
           <Text style={styles.inputLabel}>Hari Mengajar</Text>
           <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(day => (
                 <TouchableOpacity key={day} onPress={() => setJadwalDay(day)} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: jadwalDay === day ? '#0d9488' : '#1e293b', borderWidth: 1, borderColor: jadwalDay === day ? '#0f766e' : '#334155' }}>
                    <Text style={{ color: jadwalDay === day ? 'white' : '#94a3b8', fontSize: 12, fontWeight: jadwalDay === day ? 'bold' : 'normal' }}>{day}</Text>
                 </TouchableOpacity>
              ))}
           </View>

           <Text style={styles.inputLabel}>Waktu Ketersediaan</Text>
           <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {['08:00 - 10:00', '10:00 - 12:00', '13:00 - 15:00', '16:00 - 17:30', '18:30 - 20:00'].map(waktu => (
                 <TouchableOpacity key={waktu} onPress={() => setJadwalTime(waktu)} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: jadwalTime === waktu ? '#2563eb' : '#1e293b', borderWidth: 1, borderColor: jadwalTime === waktu ? '#1d4ed8' : '#334155' }}>
                    <Text style={{ color: jadwalTime === waktu ? 'white' : '#94a3b8', fontSize: 12, fontWeight: jadwalTime === waktu ? 'bold' : 'normal' }}>{waktu}</Text>
                 </TouchableOpacity>
              ))}
           </View>
        </View>

        <TouchableOpacity 
          style={[styles.loginSubmitBtn, isLoading && { opacity: 0.7 }]} 
          onPress={handleAddSchedule}
          disabled={isLoading}
        >
           {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.loginSubmitText}>Buka Sesi Mengajar</Text>}
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Jadwal Anda Saat Ini ({schedules.length})</Text>
        
        {schedules.length === 0 ? (
           <Text style={{ color: '#64748b', textAlign: 'center', marginTop: 12 }}>Belum ada jadwal ketersediaan.</Text>
        ) : (
           schedules.map((s, idx) => (
              <View key={idx} style={{ backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                 <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(13, 148, 136, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                       <Feather name="clock" size={20} color="#0d9488" />
                    </View>
                    <View>
                       <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16, marginBottom: 2 }}>Hari {s.day_of_week}</Text>
                       <Text style={{ color: '#94a3b8', fontSize: 13 }}>Jam {s.time_slot}</Text>
                    </View>
                 </View>
                 <TouchableOpacity onPress={() => handleDeleteSchedule(s.id)} style={{ padding: 10, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 20 }}>
                    <Feather name="trash-2" size={18} color="#ef4444" />
                 </TouchableOpacity>
              </View>
           ))
        )}

      </ScrollView>
    </View>
  );

  const SettingsView`;

screenContent = screenContent.replace("  const SettingsView", jadwalView);


// Add Jadwal button to DashboardView
const menuJadwal = `
          {/* Class Management */}
          <Text style={styles.sectionTitle}>Manajemen Kelas & Jadwal</Text>

          <TouchableOpacity style={[styles.classItem, { marginBottom: 12 }]} onPress={() => setCurrentTeacherView('jadwal')}>
            <View style={[styles.classIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}><Feather name="calendar" size={24} color="#f59e0b" /></View>
            <View style={styles.classInfo}>
              <Text style={styles.className}>Jadwal Mengajar</Text>
              <Text style={styles.classMembers}>Atur Waktu Ketersediaan</Text>
            </View>
            <View style={styles.classAction}><Feather name="chevron-right" size={20} color="#94a3b8" /></View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.classItem}>
`;

screenContent = screenContent.replace(
`          {/* Class Management */}
          <Text style={styles.sectionTitle}>Manajemen Kelas</Text>
          <TouchableOpacity style={styles.classItem}>`, menuJadwal);


// Update Render Gate
screenContent = screenContent.replace(
  "{isTeacherLoggedIn ? (currentTeacherView === 'dashboard' ? DashboardView() : SettingsView()) : LoginView()}",
  "{isTeacherLoggedIn ? (currentTeacherView === 'dashboard' ? DashboardView() : currentTeacherView === 'jadwal' ? JadwalView() : SettingsView()) : LoginView()}"
);

fs.writeFileSync('mobile/src/screens/PengajarScreen.js', screenContent);
console.log('PengajarScreen updated with JadwalView!');
