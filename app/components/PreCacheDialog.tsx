'use client';

interface PreCacheDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDownloading: boolean;
  progress: number;
}

export default function PreCacheDialog({
  isOpen,
  onClose,
  onConfirm,
  isDownloading,
  progress
}: PreCacheDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="relative bg-white/95 backdrop-blur-xl w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl border border-white/20 animate-in slide-in-from-bottom duration-500 ease-out text-center flex flex-col items-center">
        {/* Decorative Element */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 rounded-full sm:hidden"></div>

        <div className="w-16 h-16 bg-gradient-to-tr from-blue-100 to-indigo-100 flex items-center justify-center rounded-2xl mb-4 shadow-sm border border-white">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-8 h-8 text-indigo-600 ${isDownloading ? 'animate-bounce' : ''}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        </div>

        <h3 className="text-xl font-extrabold mb-2 text-slate-800">
          Pre-cache Aplikasi
        </h3>
        
        <p className="text-[13px] text-slate-500 mb-6 leading-relaxed">
          {isDownloading 
            ? 'Mengunduh konten untuk penggunaan offline. Mohon tunggu sebentar...' 
            : 'Unduh aset aplikasi sekarang untuk akses lebih cepat dan penggunaan tanpa internet?'}
        </p>
        
        {isDownloading ? (
          <div className="w-full space-y-3">
            <div className="w-full bg-slate-100/80 rounded-full h-3 overflow-hidden shadow-inner flex">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300 relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MENGUNDUH</span>
              <span className="text-sm font-extrabold text-blue-600">
                {progress}%
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 w-full">
            <button
              className="w-full px-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-[0_4px_15px_rgb(79,70,229,0.25)] hover:shadow-[0_6px_20px_rgb(79,70,229,0.4)] hover:-translate-y-0.5 transition-all duration-300"
              onClick={onConfirm}
            >
              Unduh Sekarang
            </button>
            <button
              className="w-full px-4 py-3.5 bg-slate-50 text-slate-600 rounded-xl font-bold shadow-sm border border-slate-200 hover:bg-slate-100 transition-all duration-300"
              onClick={onClose}
            >
              Nanti Saja
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 