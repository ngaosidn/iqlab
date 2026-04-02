import React from 'react';

export default function AnnouncementPopup() {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="relative bg-white/95 backdrop-blur-xl w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl border border-white/20 animate-in slide-in-from-bottom duration-500 ease-out text-center flex flex-col items-center">
        {/* Decorative Element */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 rounded-full sm:hidden"></div>
        
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center rounded-2xl mb-4 shadow-sm border border-white">
          <span className="text-3xl">🚀</span>
        </div>

        <div className="text-xl font-extrabold text-slate-800 mb-2">Segera Hadir!</div>
        <div className="text-slate-500 text-[13px] leading-relaxed mb-4">
          Kami sedang menyiapkan fitur-fitur keren untuk pengalaman belajar yang luar biasa. Ditunggu ya! ✨
          <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-100/50">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
            </svg>
            Barakallahu fiikum
          </div>
        </div>
      </div>
    </div>
  );
} 