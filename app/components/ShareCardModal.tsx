/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoDownloadOutline, IoCopyOutline, IoShapesOutline, IoLayersOutline, IoChevronBack, IoChevronForward, IoImageOutline, IoColorPaletteOutline, IoTextOutline } from 'react-icons/io5';

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
  { name: 'Golden Hour', class: 'bg-gradient-to-br from-amber-200 via-orange-400 to-rose-600' },
  { name: 'Cosmic Night', class: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-black' },
  { name: 'Mint Frost', class: 'bg-gradient-to-br from-teal-100 via-emerald-300 to-green-500' },
  { name: 'Berry Glaze', class: 'bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600' },
  { name: 'Slate Matte', class: 'bg-gradient-to-br from-gray-700 via-gray-900 to-black' },
  { name: 'Oceanic Depth', class: 'bg-gradient-to-br from-cyan-600 via-blue-800 to-gray-900' },
  { name: 'Lavender Dream', class: 'bg-gradient-to-br from-purple-300 via-fuchsia-400 to-pink-500' },
  { name: 'Warm Velvet', class: 'bg-gradient-to-br from-red-600 via-rose-800 to-black' },
  { name: 'Earthy Vibe', class: 'bg-gradient-to-br from-stone-500 via-amber-700 to-stone-900' },
  { name: 'Monochrome', class: 'bg-gradient-to-br from-neutral-400 via-neutral-600 to-neutral-900' }
];

const cardStyles = [
  { 
    name: 'Glass Premium', 
    panelClass: 'bg-white/15 backdrop-blur-3xl border-white/25', 
    patternClass: "bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]"
  },
  { 
    name: 'Dark Cinematic', 
    panelClass: 'bg-black/40 backdrop-blur-2xl border-white/10', 
    patternClass: "bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.15]"
  },
  { 
    name: 'Frosted Crystal', 
    panelClass: 'bg-white/5 backdrop-blur-3xl border-white/30', 
    patternClass: "bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05]"
  },
  { 
    name: 'Milky Glow', 
    panelClass: 'bg-white/25 backdrop-blur-xl border-white/40', 
    patternClass: "bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-[0.06]"
  },
  { 
    name: 'Midnight Ash', 
    panelClass: 'bg-stone-900/60 backdrop-blur-3xl border-stone-400/20', 
    patternClass: "bg-[url('https://www.transparenttextures.com/patterns/woven-light.png')] opacity-[0.04]"
  },
  { 
    name: 'Clean Minimal', 
    panelClass: 'bg-white/10 backdrop-blur-sm border-white/20', 
    patternClass: "hidden"
  },
  { 
    name: 'Flat Dark', 
    panelClass: 'bg-zinc-950 border-transparent shadow-none', 
    patternClass: "hidden"
  },
  { 
    name: 'Flat Primary', 
    panelClass: 'bg-emerald-700 border-transparent shadow-none', 
    patternClass: "hidden"
  },
  { 
    name: 'Outline Minimal', 
    panelClass: 'bg-black/40 backdrop-blur-sm border-2 border-white/30 shadow-none', 
    patternClass: "hidden"
  },
  { 
    name: 'Minimal Solid', 
    panelClass: 'bg-[#18181b] border-white/10', 
    patternClass: "hidden"
  }
];

type SlideData = 
  | { type: 'combined', arabic: string, translation: string }
  | { type: 'arabic', text: string }
  | { type: 'translation', text: string };

const hexToRgba = (hex: string, alpha: number) => {
  // Add a simple check in case hex is empty or invalid
  if (!hex || !hex.startsWith('#')) return 'transparent';
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function ShareCardModal({ isOpen, onClose, verse }: ShareCardModalProps) {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const [selectedBg, setSelectedBg] = useState(0);
  const [customBgUrl, setCustomBgUrl] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState(0);
  const [customCardColorHex, setCustomCardColorHex] = useState<string>('');
  const [customFontColorHex, setCustomFontColorHex] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  // Reset slide when verse changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveSlide(0);
    }
  }, [isOpen, verse]);

  // Generate slides configuration intelligently chunking text if needed
  const slides = React.useMemo(() => {
    if (!verse) return [];

    const chunkText = (text: string, maxLength: number) => {
      const words = text.split(' ');
      const chunks: string[] = [];
      let currentChunk = '';

      for (const word of words) {
        if (currentChunk.length + word.length + 1 > maxLength) {
          if (currentChunk) chunks.push(currentChunk.trim());
          currentChunk = word;
        } else {
          currentChunk += (currentChunk ? ' ' : '') + word;
        }
      }
      if (currentChunk) chunks.push(currentChunk.trim());
      return chunks;
    };

    if ((verse.teks_arab.length + verse.terjemahan.length) <= 350) {
      return [{ type: 'combined', arabic: verse.teks_arab, translation: verse.terjemahan }] as SlideData[];
    } else {
      // Very long verse! We split Arabic and Translation into multiple chunks
      const arabicChunks = chunkText(verse.teks_arab, 300); // 300 chars is great for readable arabic font
      const translationChunks = chunkText(verse.terjemahan, 400); // 400 chars is great for translation font
      
      const result: SlideData[] = [];
      arabicChunks.forEach((chunk) => result.push({ type: 'arabic', text: chunk }));
      translationChunks.forEach((chunk) => result.push({ type: 'translation', text: chunk }));
      return result;
    }
  }, [verse]);

  if (!verse) return null;

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      // Wait a bit for images/fonts to settle if needed
      await new Promise(resolve => setTimeout(resolve, 300));

      for (let i = 0; i < slides.length; i++) {
        const ref = cardRefs.current[i];
        if (!ref) continue;

        const dataUrl = await toPng(ref, {
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
        const fileNameSuffix = slides.length > 1 ? `_Slide-${i + 1}` : '';
        link.download = `Iqlab-Ayat-${verse.surahNumber}-${verse.ayat}${fileNameSuffix}.png`;
        link.href = dataUrl;
        link.click();

        // Slight delay between downloads to allow browser to process multiple downloads cleanly
        if (i < slides.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }
    } catch (err) {
      console.error('Failed to generate image', err);
      alert('Gagal mendownload gambar. Silakan coba lagi.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getArabicFontSize = (text: string, isPreview: boolean, isSingleMode: boolean) => {
    const len = text.length;
    let base = 90; 
    
    if (isSingleMode) {
      // More space since there is no translation text on this slide
      if (len > 800) base = 42; 
      else if (len > 500) base = 50; 
      else if (len > 300) base = 60;
      else if (len > 150) base = 75;
      else if (len > 80) base = 85;
    } else {
      if (len > 800) base = 32; 
      else if (len > 500) base = 42; 
      else if (len > 300) base = 48;
      else if (len > 150) base = 65;
      else if (len > 80) base = 75;
    }
    
    return isPreview ? `${base * 0.26}px` : `${base}px`;
  };

  const getTranslationFontSize = (text: string, isPreview: boolean, isSingleMode: boolean) => {
    const len = text.length;
    let base = 40; 
    
    if (isSingleMode) {
      base = 44;
      if (len > 1000) base = 24; 
      else if (len > 600) base = 28;
      else if (len > 400) base = 34;
      else if (len > 250) base = 38;
      else if (len > 150) base = 42;
    } else {
      if (len > 1000) base = 15; 
      else if (len > 600) base = 18;
      else if (len > 400) base = 24;
      else if (len > 250) base = 28;
      else if (len > 150) base = 34;
    }
    
    return isPreview ? `${base * 0.26}px` : `${base}px`;
  };

  const renderHiddenCard = (slide: SlideData, index: number, totalSlides: number) => {
    const isSingleMode = slide.type !== 'combined';
    const showArabic = slide.type === 'combined' || slide.type === 'arabic';
    const showTranslation = slide.type === 'combined' || slide.type === 'translation';
    const arabicText = slide.type === 'combined' ? slide.arabic : slide.text;
    const translationText = slide.type === 'combined' ? slide.translation : slide.text;
    const currentStyle = cardStyles[selectedStyle];

    const bgClass = selectedBg === -1 && customBgUrl ? 'bg-black' : backgrounds[selectedBg]?.class || backgrounds[0].class;

    return (
      <div 
        key={index}
        ref={(el) => { cardRefs.current[index] = el; }}
        className={`absolute top-0 left-0 w-[1080px] h-[1350px] ${bgClass} flex flex-col items-center justify-center p-20 text-white`}
        style={{ 
          transform: 'scale(1)', 
          transformOrigin: 'top left',
          ...(selectedBg === -1 && customBgUrl ? {
            backgroundImage: `url(${customBgUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          } : {})
        }}
      >
        <div className={`w-full h-full ${!currentStyle.name.includes('Flat') && !currentStyle.name.includes('Solid') ? 'drop-shadow-[0_35px_35px_rgba(0,0,0,0.4)]' : ''}`}>
          <div 
            className={`w-full h-full ${currentStyle.panelClass} rounded-[100px] border flex flex-col p-16 relative overflow-hidden`}
            style={commonPanelStyle}
          >
            {/* Inner Ornament Line */}
          <div className="absolute inset-[16px] border border-white/20 rounded-[84px] pointer-events-none"></div>
          {/* Noise texture overlay */}
          <div className={`absolute inset-0 pointer-events-none ${currentStyle.patternClass}`}></div>
          
          {/* Content */}
          <div className="flex-1 flex flex-col justify-center items-center gap-8 text-center h-full z-10">
            <div className="w-24 h-1.5 bg-white/30 rounded-full mb-2 shrink-0"></div>
            
            {showArabic && (
              <p 
                className="font-uthmanic mb-4 drop-shadow-lg shrink-0 flex items-center justify-center" 
                style={{ 
                  direction: 'rtl', 
                  fontSize: getArabicFontSize(arabicText!, false, isSingleMode),
                  lineHeight: '1.7',
                  color: customFontColorHex || undefined
                }}
              >
                {arabicText}
              </p>
            )}

            {showTranslation && (
              <p 
                className="font-medium text-white/90 max-w-[900px] shrink-0 flex items-center justify-center"
                style={{ 
                  fontSize: getTranslationFontSize(translationText!, false, isSingleMode),
                  lineHeight: '1.6',
                  color: customFontColorHex || undefined
                }}
              >
                &quot;{translationText}&quot;
              </p>
            )}

            <div className="w-24 h-1.5 bg-white/30 rounded-full mt-2 shrink-0"></div>
          </div>

          {/* Footer / Branding */}
          <div className="flex items-center justify-between w-full pt-8 border-t border-white/20 shrink-0 z-10">
            <div className="flex flex-col items-start gap-1.5 pl-2">
              <img 
                src="/logo.svg" 
                alt="Iqlab Logo" 
                className="h-[55px] w-auto brightness-0 invert opacity-95" 
              />
              <span className="text-[15px] text-white/50 font-bold tracking-[0.3em] leading-none ml-1 uppercase">Interactive Quran</span>
            </div>
            <div className="flex flex-col items-end gap-2 pr-2">
              <span 
                className="text-[24px] font-bold bg-white/20 px-6 py-2.5 rounded-full backdrop-blur-md shadow-inner border border-white/10 uppercase tracking-widest"
                style={{ color: customFontColorHex || undefined }}
              >
                QS. {verse.surahName} : {verse.ayat} {totalSlides > 1 ? `(${index + 1}/${totalSlides})` : ''}
              </span>
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  };

  const currentStyle = cardStyles[selectedStyle];
  const isFlatStyle = currentStyle.name.includes('Flat') || currentStyle.name.includes('Solid');
  const commonPanelStyle: React.CSSProperties = {};
  if (customCardColorHex) {
    commonPanelStyle.backgroundColor = isFlatStyle ? customCardColorHex : hexToRgba(customCardColorHex, 0.4);
  }

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
            <div className="relative flex flex-col items-center bg-black/20 rounded-3xl p-3 sm:p-4 border border-white/5 shadow-inner shrink">
              <div 
                className="w-full aspect-[4/5] max-w-[220px] sm:max-w-[280px] shadow-2xl rounded-2xl overflow-hidden relative shrink-0"
              >
                {/* These are the Actual Image Sources (Hidden but rendered in DOM so html-to-image can process them) */}
                <div className="absolute top-0 left-0 pointer-events-none z-0">
                  {slides.map((slide, idx) => renderHiddenCard(slide, idx, slides.length))}
                </div>

                {/* VISUAL PREVIEW (Fits the modal container correctly) */}
                <div 
                  className={`w-full h-full ${selectedBg === -1 && customBgUrl ? 'bg-black' : backgrounds[selectedBg]?.class || backgrounds[0].class} flex flex-col items-center justify-center p-8 text-white relative z-10 transition-colors duration-500`}
                  style={{
                    ...(selectedBg === -1 && customBgUrl ? {
                      backgroundImage: `url(${customBgUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    } : {})
                  }}
                >
                  <div 
                    className={`w-full h-full ${currentStyle.panelClass} rounded-3xl border shadow-lg flex flex-col p-6 relative overflow-hidden transition-all duration-500`}
                    style={commonPanelStyle}
                  >
                    <div className="absolute inset-[8px] border border-white/20 rounded-[16px] pointer-events-none"></div>
                    <div className={`absolute inset-0 pointer-events-none ${currentStyle.patternClass}`}></div>
                    
                    <div className="flex-1 flex flex-col justify-center items-center gap-4 text-center h-full w-full z-10">
                      {(() => {
                        const slide = slides[activeSlide];
                        if (!slide) return null;
                        
                        const isSingleMode = slide.type !== 'combined';
                        const showArabic = slide.type === 'combined' || slide.type === 'arabic';
                        const showTranslation = slide.type === 'combined' || slide.type === 'translation';
                        const arabicText = slide.type === 'combined' ? slide.arabic : slide.text;
                        const translationText = slide.type === 'combined' ? slide.translation : slide.text;

                        return (
                          <>
                            {showArabic && (
                              <p 
                                className="font-uthmanic shrink-0 flex items-center justify-center w-full" 
                                style={{ 
                                  direction: 'rtl',
                                  fontSize: getArabicFontSize(arabicText!, true, isSingleMode),
                                  lineHeight: '1.6',
                                  maxHeight: isSingleMode ? '90%' : '60%',
                                  color: customFontColorHex || undefined
                                }}
                              >
                                {arabicText}
                              </p>
                            )}
                            {showTranslation && (
                              <p 
                                className="text-white/80 italic shrink-0 flex items-center justify-center w-full"
                                style={{
                                  fontSize: getTranslationFontSize(translationText!, true, isSingleMode),
                                  lineHeight: '1.4',
                                  maxHeight: isSingleMode ? '90%' : '30%',
                                  color: customFontColorHex || undefined
                                }}
                              >
                                &quot;{translationText}&quot;
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <div className="flex items-center justify-between w-full pt-4 border-t border-white/10 mt-auto shrink-0 z-10">
                      <img src="/logo.svg" alt="Logo" className="h-6 w-auto brightness-0 invert" />
                      <span 
                        className="text-[9px] font-bold opacity-60 uppercase tracking-widest bg-white/10 px-2 py-1 rounded-full"
                        style={{ color: customFontColorHex || undefined }}
                      >
                        {slides.length > 1 ? `(${activeSlide + 1}/${slides.length}) ` : ''}QS. {verse.surahName}:{verse.ayat}
                      </span>
                    </div>
                  </div>

                  {/* Carousel Overlay Navigators inside preview */}
                  {slides.length > 1 && (
                    <>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveSlide(Math.max(0, activeSlide - 1)); }}
                        className={`absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full backdrop-blur-sm bg-black/20 text-white/50 border border-white/10 transition-all ${activeSlide === 0 ? 'opacity-0 pointer-events-none' : 'hover:bg-black/40 hover:text-white'}`}
                      >
                        <IoChevronBack size={16} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveSlide(Math.min(slides.length - 1, activeSlide + 1)); }}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full backdrop-blur-sm bg-black/20 text-white/50 border border-white/10 transition-all ${activeSlide === slides.length - 1 ? 'opacity-0 pointer-events-none' : 'hover:bg-black/40 hover:text-white'}`}
                      >
                        <IoChevronForward size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Dots Indicator for UI */}
              {slides.length > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4 mb-1">
                  {slides.map((_, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveSlide(idx)} 
                      className={`h-2 rounded-full transition-all ${activeSlide === idx ? 'w-6 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'}`} 
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-4 w-full">
              <div className="flex flex-col gap-2 w-full min-w-0">
                <label className="text-white/60 text-[10px] font-bold uppercase tracking-widest ml-1 flex items-center gap-2">
                  <IoShapesOutline /> Ganti Background
                </label>
                <div className="flex overflow-x-auto gap-3 mt-1 pb-2 w-full items-center">
                  <label 
                    title="Upload Foto"
                    className={`shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center cursor-pointer border-2 transition-all ${selectedBg === -1 ? 'border-white bg-white/20 scale-110 shadow-lg shadow-white/20' : 'border-white/40 bg-black/20 hover:border-white hover:bg-white/10'}`}
                  >
                    <IoImageOutline size={20} className="text-white" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setCustomBgUrl(reader.result as string);
                            setSelectedBg(-1);
                          };
                          reader.readAsDataURL(file);
                        }
                      }} 
                    />
                  </label>
                  {backgrounds.map((bg, idx) => (
                    <button
                      key={idx}
                      title={bg.name}
                      onClick={() => {
                        setSelectedBg(idx);
                      }}
                      className={`shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl ${bg.class} border-2 transition-all ${selectedBg === idx ? 'border-white scale-110 shadow-lg shadow-white/20' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full min-w-0">
                <label className="text-white/60 text-[10px] font-bold uppercase tracking-widest ml-1 flex items-center gap-2">
                  <IoLayersOutline /> Ganti Efek Kartu
                </label>
                <div className="flex overflow-x-auto gap-3 mt-1 pb-2 w-full">
                  {cardStyles.map((style, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedStyle(idx)}
                      className={`shrink-0 px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap border-2 ${selectedStyle === idx ? 'bg-white/20 border-white text-white shadow-lg' : 'border-white/10 bg-black/20 text-white/60 hover:bg-white/10 hover:text-white'}`}
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full min-w-0">
                <label className="text-white/60 text-[10px] font-bold uppercase tracking-widest ml-1 flex items-center gap-2">
                  <IoColorPaletteOutline /> Warna Efek (Custom)
                </label>
                <div className="flex gap-4 mt-1 pb-2 w-full items-center">
                  <button
                    title="Default Asli"
                    onClick={() => setCustomCardColorHex('')}
                    className={`shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 transition-all flex items-center justify-center ${!customCardColorHex ? 'border-white scale-110 shadow-lg shadow-white/30' : 'border-white/20 opacity-60 hover:opacity-100 hover:scale-105'}`}
                    style={{ background: 'linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.1) 50%)' }}
                  >
                    <span className="text-xs sm:text-sm select-none opacity-50">&times;</span>
                  </button>

                  <div
                    title="Pilih Warna Efek"
                    className={`relative shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full border-[3px] transition-all overflow-hidden ${customCardColorHex ? 'border-white scale-110 shadow-lg shadow-white/30' : 'border-white/20 opacity-60 hover:opacity-100 cursor-pointer'}`}
                  >
                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: customCardColorHex || '#10b981' }}></div>
                    <input 
                      type="color" 
                      value={customCardColorHex || '#10b981'}
                      onChange={(e) => setCustomCardColorHex(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>

                  {customCardColorHex && (
                    <span className="text-xs text-white/80 font-mono tracking-widest bg-black/20 px-3 py-1.5 rounded-xl border border-white/10 uppercase drop-shadow-md">
                      {customCardColorHex}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full min-w-0">
                <label className="text-white/60 text-[10px] font-bold uppercase tracking-widest ml-1 flex items-center gap-2">
                  <IoTextOutline /> Warna Teks
                </label>
                <div className="flex gap-4 mt-1 pb-2 w-full items-center">
                  <button
                    title="Default Putih"
                    onClick={() => setCustomFontColorHex('')}
                    className={`shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 transition-all flex items-center justify-center ${!customFontColorHex ? 'border-white scale-110 shadow-lg shadow-white/30' : 'border-white/20 opacity-60 hover:opacity-100 hover:scale-105'}`}
                    style={{ background: '#ffffff' }}
                  >
                    <span className="text-xs sm:text-sm select-none opacity-50 text-black">&times;</span>
                  </button>

                  <div
                    title="Pilih Warna Teks"
                    className={`relative shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full border-[3px] transition-all overflow-hidden ${customFontColorHex ? 'border-white scale-110 shadow-lg shadow-white/30' : 'border-white/20 opacity-60 hover:opacity-100 cursor-pointer'}`}
                  >
                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: customFontColorHex || '#ffffff' }}></div>
                    <input 
                      type="color" 
                      value={customFontColorHex || '#ffffff'}
                      onChange={(e) => setCustomFontColorHex(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>

                  {customFontColorHex && (
                    <span className="text-xs text-white/80 font-mono tracking-widest bg-black/20 px-3 py-1.5 rounded-xl border border-white/10 uppercase drop-shadow-md">
                      {customFontColorHex}
                    </span>
                  )}
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
                      <span className="text-sm">{slides.length > 1 ? 'Download Semua' : 'Download PNG'}</span>
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
