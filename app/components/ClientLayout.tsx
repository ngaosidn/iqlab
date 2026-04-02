'use client';

import { useEffect } from 'react';

// Extended Navigator interface for iOS PWA detection
interface ExtendedNavigator extends Navigator {
  standalone?: boolean;
}

// Window interface extension for PWA functions
interface ExtendedWindow extends Window {
  MSStream?: unknown;
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Check if app is running as PWA
    const checkPWAInstallation = () => {
      // Check for Android PWA
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      
      // Check for iOS PWA
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as ExtendedWindow).MSStream;
      const isIOSPWA = isIOS && (navigator as ExtendedNavigator).standalone;
      
      // Check for other PWA indicators
      const isInPWA = window.matchMedia('(display-mode: fullscreen)').matches || 
                     window.matchMedia('(display-mode: minimal-ui)').matches;
      
      // Store PWA status in localStorage for other components to use
      localStorage.setItem('isPWA', String(isStandalone || isIOSPWA || isInPWA));
    };

    // Initial check
    checkPWAInstallation();

    // Listen for display mode changes (PWA installation)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => {
      checkPWAInstallation();
    };
    
    mediaQuery.addEventListener('change', handleDisplayModeChange);
    window.addEventListener('resize', checkPWAInstallation);

    // Intercept fetch global untuk melayani dari cache jika tersedia
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = args[0] instanceof Request ? args[0].url : typeof args[0] === 'string' ? args[0] : '';
      if (url && (url.includes('/data/') || url.includes('/api/v2/tafsir/') || url.includes('/api/v4/chapters'))) {
        try {
          const cache = await caches.open('quran-data-cache-v1');
          const cachedResponse = await cache.match(url);
          if (cachedResponse) {
            console.log(`⚡ [Cache Hit] Serving ${url} super-fast from Local Cache!`);
            // Clone response supaya bisa dibaca berkali-kali jika diperlukan
            return cachedResponse.clone();
          }
        } catch (e) {
          console.warn("Fetch interceptor error:", e);
        }
      }
      return originalFetch(...args);
    };

    return () => {
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
      window.removeEventListener('resize', checkPWAInstallation);
      window.fetch = originalFetch; // Kembalikan ke fungsi asli
    };
  }, []);

  return (
    <>
      {children}
    </>
  );
} 