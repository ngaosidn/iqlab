'use client';

import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoDownloadOutline, IoCopyOutline, IoShapesOutline } from 'react-icons/io5';

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  verse: {
    teks_arab: string;
    terjemahan: string;
    ayat: number;
    surahName: string;
    surahNumber: number;
  } | null;
}

const backgrounds = [
  { name: 'Sunset Glow', class: 'bg-gradient-to-br from-orange-400 via-rose-500 to-purple-600' },
  { name: 'Emerald Peace', class: 'bg-gradient-to-br from-emerald-400 via-teal-500 to-indigo-600' },
  { name: 'Midnight Calm', class: 'bg-gradient-to-br from-slate-800 via-slate-900 to-black' },
  { name: 'Ocean Breeze', class: 'bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-700' },
  { name: 'Soft Aurora', class: 'bg-gradient-to-br from-green-300 via-cyan-400 to-blue-600' },
  { name: 'Desert Sand', class: 'bg-gradient-to-br from-yellow-300 via-orange-400 to-red-600' },
  { name: 'Royal Purple', class: 'bg-gradient-to-br from-fuchsia-500 via-purple-600 to-indigo-800' },
  { name: 'Forest Myst', class: 'bg-gradient-to-br from-emerald-700 via-teal-800 to-cyan-900' },
  { name: 'Cherry Blossom', class: 'bg-gradient-to-br from-pink-300 via-rose-400 to-red-400' },
  { name: 'Abyssal Deep', class: 'bg-gradient-to-br from-blue-900 via-indigo-950 to-black' },
];

export default function ShareCardModal({ isOpen, onClose, verse }: ShareCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [selectedBg, setSelectedBg] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!verse) return null;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setIsGenerating(true);
      // Wait a bit for images/fonts to settle if needed
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        width: 1080,
        height: 1350,
        pixelRatio: 3, // For ~300 DPI high-res export
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        }
      });

      const link = document.createElement('a');
      link.download = `Iqlab-Ayat-${verse.surahNumber}-${verse.ayat}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
      alert('Gagal mendownload gambar. Silakan coba lagi.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getArabicFontSize = (text: string, isPreview: boolean) => {
    const len = text.length;
    let base = 90; // Default size for short verse
    if (len > 800) base = 32; // Sangat panjang
    else if (len > 500) base = 42; 
    else if (len > 300) base = 48;
    else if (len > 150) base = 65;
    else if (len > 80) base = 75;
    
    // Preview is roughly 1/4 the size of the real card (280px vs 1080px base width scale)
    return isPreview ? `${base * 0.26}px` : `${base}px`;
  };

  const getTranslationFontSize = (text: string, isPreview: boolean) => {
    const len = text.length;
    let base = 40; // Default size for short translation
    if (len > 1000) base = 15; // Terjemahan sangat panjang
    else if (len > 600) base = 18;
    else if (len > 400) base = 24;
    else if (len > 250) base = 28;
    else if (len > 150) base = 34;
    
    return isPreview ? `${base * 0.26}px` : `${base}px`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white/10 backdrop-blur-xl border border-white/20 p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-lg flex flex-col gap-4 sm:gap-6 max-h-[95vh] overflow-y-auto scrollbar-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="text-white font-bold text-lg">Bagikan Ayat ✨</h3>
                <p className="text-white/60 text-xs uppercase tracking-wider font-medium">Desain Premium Iqlab</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all border border-white/10"
              >
                <IoClose size={24} />
              </button>
            </div>

            {/* Preview Area (Scaled down for UI) */}
            <div className="relative flex justify-center bg-black/20 rounded-3xl p-3 sm:p-4 overflow-hidden border border-white/5 shadow-inner shrink">
              <div 
                className="w-full aspect-[4/5] max-w-[220px] sm:max-w-[280px] shadow-2xl rounded-2xl overflow-hidden relative shrink-0"
              >
                {/* This is the Actual Image Source (Hidden but rendered) */}
                <div 
                  ref={cardRef}
                  className={`absolute top-0 left-0 w-[1080px] h-[1350px] ${backgrounds[selectedBg].class} flex flex-col items-center justify-center p-20 text-white`}
                  style={{ transform: 'scale(1)', transformOrigin: 'top left' }}
                >
                  {/* Glass Panel */}
                  <div className="w-full h-full bg-white/15 backdrop-blur-3xl rounded-[100px] border border-white/25 shadow-2xl flex flex-col p-16 relative overflow-hidden">
                    {/* Inner Ornament Line */}
                    <div className="absolute inset-[16px] border border-white/20 rounded-[84px] pointer-events-none"></div>
                    {/* Noise texture overlay */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                    
                    {/* Content */}
                    <div className="flex-1 flex flex-col justify-center items-center gap-8 text-center h-full">
                      <div className="w-24 h-1.5 bg-white/30 rounded-full mb-2 shrink-0"></div>
                      
                      {/* Arabic Text (Dynamic Font Size) */}
                      <p 
                        className="font-uthmanic mb-4 drop-shadow-lg shrink-0 flex items-center justify-center" 
                        style={{ 
                          direction: 'rtl', 
                          fontSize: getArabicFontSize(verse.teks_arab, false),
                          lineHeight: '1.7'
                        }}
                      >
                        {verse.teks_arab}
                      </p>

                      {/* Translation (Dynamic Font Size) */}
                      <p 
                        className="font-medium text-white/90 max-w-[900px] shrink-0 flex items-center justify-center"
                        style={{ 
                          fontSize: getTranslationFontSize(verse.terjemahan, false),
                          lineHeight: '1.6'
                        }}
                      >
                        &quot;{verse.terjemahan}&quot;
                      </p>

                      <div className="w-24 h-1.5 bg-white/30 rounded-full mt-2 shrink-0"></div>
                    </div>

                    {/* Footer / Branding */}
                    <div className="flex items-center justify-between w-full pt-8 border-t border-white/20 shrink-0">
                      <div className="flex flex-col items-start gap-1.5 pl-2 z-10">
                        <img 
                          src="/logo.svg" 
                          alt="Iqlab Logo" 
                          className="h-[55px] w-auto brightness-0 invert opacity-95" 
                        />
                        <span className="text-[15px] text-white/50 font-bold tracking-[0.3em] leading-none ml-1 uppercase">Interactive Quran</span>
                      </div>
                      <div className="flex flex-col items-end gap-2 pr-2 z-10">
                        <span className="text-[24px] font-bold bg-white/20 px-6 py-2.5 rounded-full backdrop-blur-md shadow-inner border border-white/10 uppercase tracking-widest">QS. {verse.surahName} : {verse.ayat}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* VISUAL PREVIEW (Same as above but fits the modal) */}
                <div className={`w-full h-full ${backgrounds[selectedBg].class} flex flex-col items-center justify-center p-8 text-white relative z-10`}>
                  <div className="w-full h-full bg-white/15 backdrop-blur-md rounded-3xl border border-white/20 shadow-lg flex flex-col p-6 relative overflow-hidden">
                    {/* Inner Ornament Line UI */}
                    <div className="absolute inset-[8px] border border-white/20 rounded-[16px] pointer-events-none"></div>
                    <div className="flex-1 flex flex-col justify-center items-center gap-4 text-center h-full">
                      <p 
                        className="font-uthmanic shrink-0 flex items-center justify-center w-full" 
                        style={{ 
                          direction: 'rtl',
                          fontSize: getArabicFontSize(verse.teks_arab, true),
                          lineHeight: '1.6',
                          maxHeight: '60%'
                        }}
                      >
                        {verse.teks_arab}
                      </p>
                      <p 
                        className="text-white/80 italic shrink-0 flex items-center justify-center w-full"
                        style={{
                          fontSize: getTranslationFontSize(verse.terjemahan, true),
                          lineHeight: '1.4',
                          maxHeight: '30%'
                        }}
                      >
                        &quot;{verse.terjemahan}&quot;
                      </p>
                    </div>
                    <div className="flex items-center justify-between w-full pt-4 border-t border-white/10 mt-auto shrink-0 z-10">
                      <img src="/logo.svg" alt="Logo" className="h-6 w-auto brightness-0 invert" />
                      <span className="text-[9px] font-bold opacity-60 uppercase tracking-widest bg-white/10 px-2 py-1 rounded-full">QS. {verse.surahName} : {verse.ayat}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-white/60 text-[10px] font-bold uppercase tracking-widest ml-1 flex items-center gap-2">
                  <IoShapesOutline /> Ganti Background
                </label>
                <div className="flex flex-wrap gap-3 mt-1">
                  {backgrounds.map((bg, idx) => (
                    <button
                      key={idx}
                      title={bg.name}
                      onClick={() => setSelectedBg(idx)}
                      className={`shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl ${bg.class} border-2 transition-all ${selectedBg === idx ? 'border-white scale-110 shadow-lg shadow-white/20' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                   className="flex items-center justify-center gap-2 bg-white/10 text-white border border-white/20 p-4 rounded-3xl font-bold hover:bg-white/20 transition-all active:scale-95"
                   onClick={() => {
                     navigator.clipboard.writeText(`${verse.teks_arab}\n\n${verse.terjemahan}\n\n(QS. ${verse.surahName} : ${verse.ayat})`);
                     alert('Teks Berhasil Disalin! ✨');
                   }}
                >
                  <IoCopyOutline size={20} />
                  <span className="text-sm">Copy Teks</span>
                </button>
                <button
                   disabled={isGenerating}
                   onClick={handleDownload}
                   className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-3xl font-bold shadow-xl shadow-blue-500/20 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <IoDownloadOutline size={20} />
                      <span className="text-sm">Download PNG</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
