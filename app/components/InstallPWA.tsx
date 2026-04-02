'use client';

import { useState, useEffect } from 'react';

// Extended Navigator interface for iOS PWA detection
interface ExtendedNavigator extends Navigator {
  standalone?: boolean;
}

// Window interface extension for PWA functions
interface ExtendedWindow extends Window {
  showPreCacheDialog?: () => void;
  MSStream?: unknown;
}

// BeforeInstallPromptEvent interface
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);

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
      
      setIsPWAInstalled(isStandalone || isIOSPWA || isInPWA);
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

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
      window.removeEventListener('resize', checkPWAInstallation);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleClick = async () => {
    if (isPWAInstalled) {
      // If PWA is already installed, show precaching dialog
      const extendedWindow = window as unknown as ExtendedWindow;
      if (typeof window !== 'undefined' && typeof extendedWindow.showPreCacheDialog === 'function') {
        extendedWindow.showPreCacheDialog();
      }
      return;
    }

    if (!deferredPrompt) {
      return;
    }

    // Show install prompt
    deferredPrompt.prompt();

    // Wait for user choice
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      // The PWA will be installed, and the display-mode change event will trigger
      // which will update isPWAInstalled state
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
  };

  return (
    <button
      onClick={handleClick}
      className="bg-white/15 backdrop-blur-md border border-white/20 text-white px-4 py-2.5 text-sm font-semibold rounded-2xl shadow-lg hover:bg-white/25 active:scale-[0.98] transition-all flex items-center gap-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
      {isPWAInstalled ? 'Unduh Offline' : 'Install App'}
    </button>
  );
} 