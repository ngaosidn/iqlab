import React, { createContext, useState, useContext, useEffect } from 'react';
import { AppState } from 'react-native';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hasManuallyToggled, setHasManuallyToggled] = useState(false);

  useEffect(() => {
    // Fungsi untuk mengecek waktu dan mengatur tema
    const checkTimeAndSetTheme = () => {
      // Jika user sudah pernah menekan tombol toggle secara manual,
      // jangan paksa ubah tema lagi berdasarkan waktu.
      if (!hasManuallyToggled) {
        const currentHour = new Date().getHours();
        // Mode gelap aktif dari jam 18:00 (Malam) sampai jam 05:59 (Pagi)
        const shouldBeDark = currentHour >= 18 || currentHour < 6;
        
        setIsDarkMode(prevMode => {
          if (prevMode !== shouldBeDark) return shouldBeDark;
          return prevMode;
        });
      }
    };

    // Cek langsung saat aplikasi pertama dibuka
    checkTimeAndSetTheme();

    // Cek setiap 1 menit (60000 ms) jika aplikasi dibiarkan menyala terus
    const interval = setInterval(checkTimeAndSetTheme, 60000);

    // Cek SECARA INSTAN setiap kali aplikasi kembali dibuka / pindah dari background
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        checkTimeAndSetTheme();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [hasManuallyToggled]);

  // Bungkus fungsi setIsDarkMode agar kita bisa melacak 
  // kapan user merubahnya secara manual.
  const handleSetIsDarkMode = (val) => {
    setIsDarkMode(val);
    setHasManuallyToggled(true); // Tandai bahwa user merubahnya secara manual
  };

  const theme = isDarkMode ? {
    bgFull: '#0f172a',
    topBarBg: '#0f172a',
    textMain: '#f8fafc',
    textSub: '#94a3b8',
    cardBg: '#1e293b',
    border: '#334155',
    inputBg: '#1e293b',
    btnBg: '#334155'
  } : {
    bgFull: '#f8fafc',
    topBarBg: '#f1f5f9',
    textMain: '#0f172a',
    textSub: '#64748b',
    cardBg: '#ffffff',
    border: '#e2e8f0',
    inputBg: '#ffffff',
    btnBg: '#f1f5f9'
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode: handleSetIsDarkMode, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
