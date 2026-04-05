const fs = require('fs');
let content = fs.readFileSync('mobile/src/screens/AdminScreen.js', 'utf8');
const lines = content.split(/\r?\n/);

let startIdx = -1;
let endIdx = -1;
for(let i = 0; i < lines.length; i++){
    if(lines[i].includes('export default function AdminScreen')) startIdx = i;
    if(lines[i].includes('const UserManagementView = () => (')) endIdx = i;
}

const newLogic = \import { useAdmin } from '../hooks/useAdmin';

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
\;

if (startIdx !== -1 && endIdx !== -1) {
   lines.splice(startIdx, endIdx - startIdx);
   lines.splice(startIdx, 0, newLogic);
   fs.writeFileSync('mobile/src/screens/AdminScreen.js', lines.join('\n'));
   console.log('Replaced from line ' + startIdx + ' to ' + endIdx);
} else {
   console.log('Could not find boundaries.');
}

