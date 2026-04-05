const fs = require('fs');
let content = fs.readFileSync('mobile/src/hooks/usePengajar.js', 'utf8');

content = content.replace(
  "const fadeAnim = useRef(new Animated.Value(0)).current;",
  `const [currentTeacherView, setCurrentTeacherView] = useState('dashboard');
  const [settingsPhone, setSettingsPhone] = useState('');
  const [settingsOldPassword, setSettingsOldPassword] = useState('');
  const [settingsNewPassword, setSettingsNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;`
);

content = content.replace(
  "setTeacherName(session.user.user_metadata.full_name || 'Pengajar');",
  `setTeacherName(session.user.user_metadata.full_name || 'Pengajar');
      setSettingsPhone(session.user.user_metadata.phone || session.user.phone || '');`
);

const newFunction = `  const handleUpdateSettings = async () => {
    setIsLoading(true);
    try {
      const emailObj = session?.user?.email;
      if (!emailObj) throw new Error("Gagal mengidentifikasi sesi Anda.");

      if (settingsNewPassword) {
        if (!settingsOldPassword) throw new Error("Password lama wajib diisi untuk keamanan.");
        
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: emailObj,
          password: settingsOldPassword
        });

        if (signInError) throw new Error("Password lama Anda salah!");

        const { error: passUpdateError } = await supabase.auth.updateUser({
           password: settingsNewPassword
        });
        
        if (passUpdateError) throw passUpdateError;
      }

      if (settingsPhone !== undefined) {
         const { error: metaError } = await supabase.auth.updateUser({
            data: { phone: settingsPhone }
         });
         if (metaError) throw metaError;
      }

      Toast.show({ type: 'success', text1: 'Berhasil 🥳', text2: 'Profil Pengajar telah diperbarui.' });
      setSettingsOldPassword('');
      setSettingsNewPassword('');
      setCurrentTeacherView('dashboard');
      
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Gagal Update', text2: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {`;

content = content.replace("  const handleLogout = async () => {", newFunction);

content = content.replace(
  "return {",
  `return {
    currentTeacherView, setCurrentTeacherView,
    settingsPhone, setSettingsPhone,
    settingsOldPassword, setSettingsOldPassword,
    settingsNewPassword, setSettingsNewPassword,
    showOldPassword, setShowOldPassword,
    showNewPassword, setShowNewPassword,
    handleUpdateSettings,`
);

fs.writeFileSync('mobile/src/hooks/usePengajar.js', content);
console.log('usePengajar updated with settings state/functions!');
