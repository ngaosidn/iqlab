import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoMicOutline, IoStopOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';
import { createClient } from '@/lib/supabase';

interface Teacher {
  id: string;
  name: string;
  gender: 'male' | 'female';
  phone: string;
  active_days: string[];
  start_hour: string;
  end_hour: string;
  is_active: boolean;
}

const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export interface SetoranModalProps {
  isOpen: boolean;
  onClose: () => void;
  verse: {
    surahName: string;
    surahNumber: number;
    ayat: number;
    teks_arab: string;
    terjemahan: string;
  } | null;
}

type Step = 'choose_teacher' | 'record_audio' | 'review_audio';

export default function SetoranModal({ isOpen, onClose, verse }: SetoranModalProps) {
  const supabase = createClient();
  const [step, setStep] = useState<Step>('choose_teacher');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Audio state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stopRecordingCleanup = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      const fetchTeachers = async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from('asatid')
          .select('*')
          .eq('is_active', true);
        if (!error && data) setTeachers(data);
        setLoading(false);
      };
      fetchTeachers();
    } else {
      stopRecordingCleanup();
      setStep('choose_teacher');
      setSelectedTeacher(null);
      setAudioBlob(null);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
    }
  }, [isOpen, audioUrl, stopRecordingCleanup, supabase]);

  const startRecording = async () => {
    try {
      let stream;
      try {
        // High quality audio constraints
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          } 
        });
      } catch (e) {
        console.error("Mic Access Denied:", e);
        alert("Akses Mikrofon Ditolak. Harap aktifkan izin mikrofon di pengaturan browser/HP Anda.");
        return;
      }

      const mediaRecorder = new MediaRecorder(stream, {
        audioBitsPerSecond: 128000 // 128kbps for clear voice
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Mic Error: ", err);
      alert("Gagal memulai rekaman.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setStep('review_audio');
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const isTeacherOffline = (t: Teacher) => {
    const now = new Date();
    const dayName = INDO_DAYS[now.getDay()];
    if (!t.active_days.includes(dayName)) return true;
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    if (currentTime < t.start_hour || currentTime > t.end_hour) return true;
    return false;
  };

  const handleSelectTeacher = async (t: Teacher) => {
    setSelectedTeacher(t);
    setStep('record_audio');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
    } catch (e) {
      console.log("Mic warm up failed:", e);
    }
  };

  const shareToWhatsapp = async () => {
    if (!audioBlob || !selectedTeacher || !verse) return;
    try {
      const file = new File([audioBlob], `setoran-${verse.surahName}-${verse.ayat}.webm`, { type: 'audio/webm' });
      const textIntro = `Assalamu'alaikum ${selectedTeacher.name},\nBerikut setoran hafalan Surah ${verse.surahName} ayat ${verse.ayat}.`;
      const shareData = { title: `Setoran`, text: textIntro, files: [file] };
      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        window.open(`https://wa.me/${selectedTeacher.phone}?text=${encodeURIComponent(textIntro)}`, '_blank');
      }
    } catch (err) { console.log('Error sharing:', err); }
  };

  if (!verse) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="relative bg-black border-t border-white/10 sm:border sm:rounded-[3rem] rounded-t-[3rem] shadow-2xl w-full max-w-md flex flex-col overflow-hidden h-[90vh]"
          >
            {/* Header - Fixed */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5 z-[30]">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <span className="text-emerald-400">🎙️</span> Setoran Baca Ayat
              </h3>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white hover:bg-rose-500 transition-all active:scale-90"
              >
                <IoClose size={24} />
              </button>
            </div>

            {/* Dynamic Content Area */}
            <div className="relative flex-1 flex flex-col overflow-hidden">
              
              {/* STEP 1: Choose Teacher - Scrollable */}
              {step === 'choose_teacher' && (
                <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-20">
                  <div className="text-center space-y-2">
                    <h4 className="text-white font-bold text-xl">Pilih Pembimbing</h4>
                    <p className="text-white/40 text-xs">Pilih Asatidz yang sedang aktif.</p>
                  </div>

                  {loading ? (
                    <div className="py-20 flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <div className="space-y-10">
                      {['male', 'female'].map(gender => {
                        const filtered = teachers.filter(t => t.gender === gender);
                        if (filtered.length === 0) return null;
                        return (
                          <div key={gender}>
                            <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4 pl-1">
                              {gender === 'male' ? 'Ustadz' : 'Ustadzah'}
                            </h4>
                            <div className="grid grid-cols-1 gap-4">
                              {filtered.map(t => {
                                const offline = isTeacherOffline(t);
                                return (
                                  <button
                                    key={t.id}
                                    disabled={offline}
                                    onClick={() => handleSelectTeacher(t)}
                                    className={`bg-white/[0.03] border border-white/5 rounded-[2rem] p-5 flex items-center gap-4 transition-all relative overflow-hidden group ${offline ? 'opacity-30' : 'hover:bg-emerald-500/10 active:scale-95'}`}
                                  >
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-3xl">
                                      {gender === 'male' ? '👳‍♂️' : '🧕'}
                                    </div>
                                    <div className="flex-1 text-left">
                                      <p className="text-white font-bold">{t.name}</p>
                                      <span className={`text-[10px] font-black uppercase ${offline ? 'text-white/20' : 'text-emerald-500'}`}>
                                        {offline ? 'Offline' : 'Online'}
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Record Audio - Teks Scrollable, Controls Fixed */}
              {step === 'record_audio' && selectedTeacher && (
                <div className="flex-1 flex flex-col relative h-full overflow-hidden">
                  
                  {/* Batal Button - Fixed Top */}
                  <div className="p-4 z-[40]">
                    <button onClick={() => setStep('choose_teacher')} className="bg-white/5 px-4 py-2 rounded-full text-[10px] text-white/60 font-black uppercase border border-white/5">
                       <IoClose className="inline mr-1" /> Batal
                    </button>
                  </div>

                  {/* Teleprompter Teks - Scrollable Middle */}
                  <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-4 pb-64 flex flex-col items-center">
                    <div className="text-center space-y-10 w-full">
                       <p className="text-emerald-400/40 text-[10px] font-black uppercase tracking-[0.4em]">
                         QS. {verse.surahName} : {verse.ayat}
                       </p>
                       <h2 className="font-uthmanic text-5xl sm:text-6xl text-white leading-[1.8] text-center" style={{ direction: 'rtl' }}>
                         {verse.teks_arab}
                       </h2>
                    </div>
                  </div>

                  {/* Controls - Fixed Absolute with High z-index and Proper Click Area */}
                  <div className="absolute inset-x-0 bottom-0 py-10 flex flex-col items-center gap-8 bg-gradient-to-t from-black via-black/80 to-transparent z-[50]">
                    
                    {/* Timer */}
                    <div className="bg-black/90 backdrop-blur-xl px-6 py-2 rounded-full border border-white/10 shadow-2xl flex items-center gap-3">
                      {isRecording ? (
                        <>
                           <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_10px_rgb(244,63,94)]" />
                           <span className="text-white font-mono text-xl sm:text-2xl font-bold tabular-nums">{formatTime(recordingTime)}</span>
                        </>
                      ) : (
                        <div className="text-center">
                           <span className="text-white/40 text-[8px] font-black uppercase block">Ready</span>
                           <span className="text-white/80 text-xs font-bold">Siap Merekam</span>
                        </div>
                      )}
                    </div>

                    {/* Mic Button - Smaller & Responsive */}
                    <button 
                      onClick={(e) => {
                         e.stopPropagation();
                         if (isRecording) {
                           stopRecording();
                         } else {
                           startRecording();
                         }
                      }}
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-3xl transition-all relative border-[4px] border-black active:scale-95 cursor-pointer ${isRecording ? 'bg-rose-500' : 'bg-emerald-500'}`}
                      style={{ cursor: 'pointer' }}
                    >
                      {isRecording ? (
                        <IoStopOutline size={28} className="text-white sm:size-[36px]" />
                      ) : (
                        <IoMicOutline size={32} className="text-white sm:size-[40px]" />
                      )}
                      
                      <div className={`absolute -inset-2 rounded-full blur-xl -z-10 opacity-30 ${isRecording ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Review */}
              {step === 'review_audio' && (
                <div className="flex-1 overflow-y-auto p-10 flex flex-col items-center justify-center space-y-8 no-scrollbar">
                  <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400">
                    <IoCheckmarkCircleOutline size={56} />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold text-white">Selesai Berdoa!</h3>
                    <p className="text-white/40 text-sm italic">Kepada: {selectedTeacher?.name}</p>
                  </div>
                  {audioUrl && <audio src={audioUrl} controls className="w-full" style={{ filter: 'invert(1) grayscale(1)' }}/>}
                  <div className="grid grid-cols-2 gap-4 w-full">
                     <button onClick={() => { setStep('record_audio'); setAudioBlob(null); setAudioUrl(null); }} className="bg-white/5 py-5 rounded-3xl text-white font-bold active:scale-95">Ulangi</button>
                     <button onClick={shareToWhatsapp} className="bg-emerald-500 py-5 rounded-3xl text-white font-bold active:scale-95">Kirim WA</button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
