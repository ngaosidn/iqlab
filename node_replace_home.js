const fs = require('fs');
let content = fs.readFileSync('mobile/src/screens/HomeScreen.js', 'utf8');
const lines = content.split(/\r?\n/);

let startIdx = 17; // Line 18 in 1-based (from 'const shimmerValue')
let endIdx = -1;
for(let i = 0; i < lines.length; i++){
    if(lines[i] === '  return (') {
       endIdx = i;
       break;
    }
}

const newLogic = `  const insets = useSafeAreaInsets();
  
  const {
    showProfileModal,
    setShowProfileModal,
    showAdminHub,
    setShowAdminHub,
    age, setAge,
    gender, setGender,
    checkAuth,
    handleAuth,
    saveProfileData,
    dotOpacity,
    translateX
  } = useHome(session, onNavigate);
`;

if (startIdx !== -1 && endIdx !== -1) {
   lines.splice(startIdx, endIdx - startIdx);
   lines.splice(startIdx, 0, newLogic);
   let result = lines.join('\n');
   result = `import { useHome } from '../hooks/useHome';\n` + result;
   fs.writeFileSync('mobile/src/screens/HomeScreen.js', result);
   console.log('Replaced from line ' + (startIdx+1) + ' to ' + (endIdx+1));
} else {
   console.log('Could not find boundaries.');
}
