'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

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
  const [splashState, setSplashState] = useState<'visible' | 'fading' | 'hidden'>('visible');

  useEffect(() => {
    // Show splash for 1.8 seconds perfectly
    const fadeTimer = setTimeout(() => {
      setSplashState('fading');
    }, 1800);
    
    // Completely hide and unmount after 2.3 seconds
    const hideTimer = setTimeout(() => {
      setSplashState('hidden');
    }, 2300); 

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

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

    return () => {
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
      window.removeEventListener('resize', checkPWAInstallation);
    };
  }, []);

  return (
    <>
      {splashState !== 'hidden' && (
        <div className={`hidden [@media(display-mode:standalone)]:flex fixed inset-0 z-[999] flex-col items-center justify-center bg-gradient-to-br from-[#020617]/95 via-[#1e3a8a]/85 to-[#0f172a]/95 backdrop-blur-xl transition-opacity duration-500 ease-in-out ${splashState === 'fading' ? 'opacity-0' : 'opacity-100'} select-none`}>
          {/* Subtle glow behind logo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-blue-500/20 rounded-full blur-[80px] animate-pulse"></div>
          
          <div className="relative z-10 -mt-10">
            <Image 
              src="/logo.svg" 
              alt="I-Qlab Logo" 
              width={200} 
              height={80} 
              className="drop-shadow-[0_0_20px_rgba(37,99,235,0.4)] brightness-110"
              priority 
            />
          </div>
          
          {/* Splash Footer */}
          <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center opacity-90 animate-in slide-in-from-bottom-5 fade-in duration-700">
            <div className="flex justify-center items-center gap-1.5 font-poppins bg-white/5 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/10 shadow-2xl">
              <span className="text-xl leading-none text-white/80">&copy;</span>
              <span className="text-[13px] font-medium tracking-wide text-blue-100/90">{new Date().getFullYear()}</span>
              <span className="mx-1 h-3.5 w-[1px] bg-white/20"></span>
              <span className="font-bold text-white tracking-widest uppercase text-[11px] mt-0.5">by Tahseena</span>
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
} 