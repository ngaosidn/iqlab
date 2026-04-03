import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoMicOutline, IoStopOutline, IoTrashOutline, IoLogoWhatsapp, IoCheckmarkCircleOutline } from 'react-icons/io5';
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

  // Fetch asatid from Supabase
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
      // Clean up when closed
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
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
      alert("Gagal mengakses mikrofon. Pastikan Anda sudah memberikan izin!");
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

  const shareToWhatsapp = async () => {
    if (!audioBlob || !selectedTeacher || !verse) return;
    
    try {
      const file = new File([audioBlob], `setoran-surah-${verse.surahName}-ayat-${verse.ayat}.webm`, { type: 'audio/webm' });
      const textIntro = `Assalamu'alaikum ${selectedTeacher.name},\nBerikut adalah setoran hafalan saya untuk Surah ${verse.surahName} ayat ${verse.ayat}. Mohon koreksinya ya Ustadz/Ustadzah.`;
      
      const shareData = {
        title: `Setoran Hafalan`,
        text: textIntro,
        files: [file]
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        const textMessage = encodeURIComponent(textIntro + "\n\n(Mohon maaf, file audio sedang dikirim secara manual)");
        window.open(`https://wa.me/${selectedTeacher.phone}?text=${textMessage}`, '_blank');
      }
    } catch (err) {
      console.log('Error sharing:', err);
    }
  };

  if (!verse) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 perspective-1000">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, y: '100%', rotateX: 10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, y: '100%', rotateX: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-black border-t border-white/20 sm:border sm:rounded-[3rem] rounded-t-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-md flex flex-col overflow-hidden max-h-[92vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <span className="text-emerald-400">🎙️</span> Setoran Hafalan
              </h3>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-rose-500 hover:text-white transition-all duration-200"
              >
                <IoClose size={20} />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto no-scrollbar pb-10">
              
              {/* STEP 1: Pilih Guru */}
              {step === 'choose_teacher' && (
                <div className="space-y-6 min-h-[400px] flex flex-col">
                  <div className="text-center space-y-2 mb-8 mt-4">
                    <h4 className="text-white font-bold text-xl">Pilih Pembimbing</h4>
                    <p className="text-white/40 text-xs tracking-wide">Pilih Asatidz yang sedang aktif untuk menyetorkan bacaan Anda.</p>
                  </div>

                  {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-6">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 bg-emerald-500/20 blur-xl animate-pulse"></div>
                      </div>
                      <p className="text-emerald-500/40 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Sinkronisasi Data...</p>
                    </div>
                  ) : teachers.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center px-6">
                      <div className="text-center space-y-4 bg-white/[0.02] p-10 rounded-[3rem] border border-white/5 w-full">
                         <div className="text-4xl">📭</div>
                         <p className="text-white/30 text-sm leading-relaxed font-medium">Belum ada ustadz/ustadzah yang tersedia saat ini.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8 pb-10">
                      {teachers.filter(t => t.gender === 'male').length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.3em] mb-4 pl-1">Barisan Ustadz</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {teachers.filter(t => t.gender === 'male').map(t => {
                              const offline = isTeacherOffline(t);
                              return (
                                <button
                                  key={t.id}
                                  disabled={offline}
                                  onClick={() => { setSelectedTeacher(t); setStep('record_audio'); }}
                                  className={`bg-white/[0.03] border border-white/10 rounded-[2rem] p-5 flex flex-col items-center gap-3 transition-all relative overflow-hidden group ${offline ? 'opacity-40 grayscale pointer-events-none' : 'hover:bg-emerald-500/10 hover:border-emerald-500/30 active:scale-95'}`}
                                >
                                  <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                    👳‍♂️
                                  </div>
                                  <div className="text-center">
                                    <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{t.name}</p>
                                    <div className="flex items-center justify-center gap-1.5 mt-1">
                                      <span className={`w-1.5 h-1.5 rounded-full ${offline ? 'bg-white/20' : 'bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20'}`}></span>
                                      <span className={`text-[10px] font-black uppercase tracking-widest ${offline ? 'text-white/20' : 'text-emerald-500/80'}`}>
                                        {offline ? 'Offline' : 'Online'}
                                      </span>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {teachers.filter(t => t.gender === 'female').length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-black text-rose-500/60 uppercase tracking-[0.3em] mb-4 pl-1">Barisan Ustadzah</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {teachers.filter(t => t.gender === 'female').map(t => {
                              const offline = isTeacherOffline(t);
                              return (
                                <button
                                  key={t.id}
                                  disabled={offline}
                                  onClick={() => { setSelectedTeacher(t); setStep('record_audio'); }}
                                  className={`bg-white/[0.03] border border-white/10 rounded-[2rem] p-5 flex flex-col items-center gap-3 transition-all relative overflow-hidden group ${offline ? 'opacity-40 grayscale pointer-events-none' : 'hover:bg-rose-500/10 hover:border-rose-500/30 active:scale-95'}`}
                                >
                                  <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                    🧕
                                  </div>
                                  <div className="text-center">
                                    <p className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">{t.name}</p>
                                    <div className="flex items-center justify-center gap-1.5 mt-1">
                                      <span className={`w-1.5 h-1.5 rounded-full ${offline ? 'bg-white/20' : 'bg-rose-500 animate-pulse ring-4 ring-rose-500/20'}`}></span>
                                      <span className={`text-[10px] font-black uppercase tracking-widest ${offline ? 'text-white/20' : 'text-rose-500/80'}`}>
                                        {offline ? 'Offline' : 'Online'}
                                      </span>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Record Audio */}
              {step === 'record_audio' && selectedTeacher && (
                <div className="flex flex-col h-full space-y-0 relative min-h-[500px]">
                  
                  {/* Top Bar Navigation */}
                  <div className="flex items-center justify-between px-4 pb-6 pt-2">
                    <button 
                      onClick={() => setStep('choose_teacher')}
                      className="bg-white/5 hover:bg-rose-500/20 text-white/60 hover:text-rose-400 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border border-white/5"
                      disabled={isRecording}
                    >
                      <IoClose size={14} /> Batal
                    </button>
                    <div className="flex items-center gap-3 bg-emerald-500/5 py-2 px-4 rounded-full border border-emerald-500/20">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgb(16,185,129)]"></div>
                      <span className="text-[10px] text-white/80 font-bold tracking-tight">{selectedTeacher.name}</span>
                    </div>
                  </div>

                  {/* Teleprompter Area */}
                  <div className="flex-1 overflow-y-auto no-scrollbar pt-10 pb-60 px-6 flex flex-col items-center">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center space-y-12 w-full"
                    >
                      <div className="inline-block">
                         <p className="text-emerald-400/60 text-[10px] font-black uppercase tracking-[0.4em] mb-4">
                           Surah {verse.surahName} : {verse.ayat}
                         </p>
                         <div className="h-px w-12 bg-emerald-500/20 mx-auto"></div>
                      </div>
                      
                      <h2 
                        className="font-uthmanic text-4xl sm:text-5xl text-white leading-[1.6] sm:leading-[1.8] transition-all drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]" 
                        style={{ direction: 'rtl' }}
                      >
                        {verse.teks_arab}
                      </h2>
                    </motion.div>
                  </div>

                  {/* Aesthetic Floating Interface */}
                  <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-8 pointer-events-none">
                    
                    {/* Timer Glassmorphic Capsule */}
                    <motion.div 
                      layout
                      className="bg-white/[0.03] backdrop-blur-3xl px-8 py-3 rounded-full border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-4 pointer-events-auto group overflow-hidden relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      
                      {isRecording ? (
                        <>
                           <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
                              <div className="w-2.5 h-2.5 bg-rose-500 rounded-full shadow-[0_0_15px_rgb(244,63,94)]" />
                           </div>
                           <span className="text-white font-mono text-2xl font-bold tracking-tighter tabular-nums">{formatTime(recordingTime)}</span>
                        </>
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="text-white/20 text-[9px] font-black uppercase tracking-[0.3em] mb-0.5">Ready to Record</span>
                          <span className="text-white/60 text-[11px] font-bold tracking-wide">Sentuh Mikrofon Untuk Mulai</span>
                        </div>
                      )}
                    </motion.div>

                    {/* Pro Recording Button */}
                    <div className="pointer-events-auto relative group">
                      <div className={`absolute inset-0 rounded-full blur-2xl transition-all duration-500 ${isRecording ? 'bg-rose-500/40' : 'bg-emerald-500/20 group-hover:bg-emerald-500/40'}`}></div>
                      
                      {isRecording ? (
                        <motion.button 
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={stopRecording}
                          className="w-24 h-24 bg-rose-500 rounded-full flex items-center justify-center shadow-2xl transition-all relative border-[6px] border-black"
                        >
                          <div className="absolute inset-0 bg-rose-500 rounded-full animate-ping opacity-20 scale-125"></div>
                          <IoStopOutline size={36} className="text-white relative z-10" />
                        </motion.button>
                      ) : (
                        <motion.button 
                          initial={{ scale: 1 }}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={startRecording}
                          className="w-24 h-24 bg-emerald-500 hover:bg-emerald-400 rounded-full flex items-center justify-center shadow-2xl transition-all border-[6px] border-black group/btn"
                        >
                          <IoMicOutline size={40} className="text-white group-hover/btn:scale-110 transition-transform" />
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Review */}
              {step === 'review_audio' && (
                <div className="flex flex-col items-center justify-center h-full space-y-6 pt-10">
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                    <IoCheckmarkCircleOutline size={40} />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold text-white">Rekaman Selesai!</h3>
                    <p className="text-white/50 text-sm">Target Penerima: <span className="font-semibold text-white/80">{selectedTeacher?.name}</span></p>
                  </div>
                  <div className="w-full bg-white/5 p-4 rounded-3xl border border-white/10 mt-4">
                    {audioUrl && (
                       <audio src={audioUrl} controls className="w-full" style={{ filter: 'invert(1) grayscale(1)' }}/>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 w-full mt-4">
                     <button
                       onClick={() => { setStep('record_audio'); setAudioBlob(null); setAudioUrl(null); }}
                       className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 py-4 rounded-2xl transition-all font-semibold"
                     >
                       <IoTrashOutline size={20} />
                       Ulangi
                     </button>
                     <button
                       onClick={shareToWhatsapp}
                       className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl transition-all shadow-[0_0_20px_rgb(16,185,129,0.3)] font-semibold"
                     >
                       <IoLogoWhatsapp size={22} />
                       Kirim WA
                     </button>
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
