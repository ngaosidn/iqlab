/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import React from 'react';
import ShareCardModal from './ShareCardModal';
import { createClient } from '@/lib/supabase';
import { FcGoogle } from 'react-icons/fc';

interface Verse {
  ayat: number;
  teks_arab: string;
  terjemahan: string;
}

interface VerseListProps {
  surahNumber: number;
  onClose: () => void;
  startAyat?: number;
  endAyat?: number;
}

type MushafSource = 'verse' | 'kemenag' | 'indopak';

interface InteractiveTarget {
  word: string;
  popup_key: string;
  audio_url?: string;
  image_url?: string;
  explanation?: string;
}

interface InteractiveRule {
  surah: number;
  ayat: number;
  mushaf: MushafSource | 'all';
  targets: InteractiveTarget[];
  title?: string;
}

interface WarnaRule {
  surah: number;
  ayat: number;
  green_word: string[] | string;
  red_word: string[] | string;
  /** 1-based index of which match to underline (RTL scan order = dari kanan ke kiri string JS = index awal lebih kecil). Omit = heuristic / all matches. */
  green_occurrence?: number | number[];
  red_occurrence?: number | number[];
}

interface PopupContent {
  title?: string;
  audio_url?: string;
  image_url?: string;
  video_url?: string;
  explanation?: string;
}

const VERSES_PER_PAGE = 10;

export default function VerseList({ surahNumber, onClose, startAyat, endAyat }: VerseListProps) {
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [isAutoNext, setIsAutoNext] = useState(true);
  const [surahName, setSurahName] = useState<string>("");
  const [showTafsir, setShowTafsir] = useState<{ ayat: number, text: string } | null>(null);
  const [tafsirList, setTafsirList] = useState<Array<{ ayat: number, teks: string }>>([]);
  const [mushafFont, setMushafFont] = useState('');
  const [dataSource, setDataSource] = useState<MushafSource>('verse');
  const [fontClass, setFontClass] = useState('font-uthmanic');
  const [interactiveRules, setInteractiveRules] = useState<InteractiveRule[]>([]);
  const [warnaRules, setWarnaRules] = useState<WarnaRule[]>([]);
  const [ruleAyatMap, setRuleAyatMap] = useState<Record<string, PopupContent>>({});
  const [activePopup, setActivePopup] = useState<{ ayat: number; word: string; popupKey: string } | null>(null);
  const [ahkamPopup, setAhkamPopup] = useState<{ ayat: number } | null>(null);
  const popupAudioRef = useRef<HTMLAudioElement | null>(null);
  const [popupPlaying, setPopupPlaying] = useState(false);
  const [popupCurrentTime, setPopupCurrentTime] = useState(0);
  const [popupDuration, setPopupDuration] = useState(0);

  const [showPopupExplanation, setShowPopupExplanation] = useState(false);
  const [showPopupVideo, setShowPopupVideo] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingVerse, setSharingVerse] = useState<{
    teks_arab: string;
    terjemahan: string;
    ayat: number;
    surahName: string;
    surahNumber: number;
  } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleLogin = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : '',
      },
    });
    if (error) alert('Login Gagal: ' + error.message);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [surahNumber, startAyat, endAyat]);

  // Ganti sumber data & font jika Mushaf Font berubah
  useEffect(() => {
    if (mushafFont === 'Kemenag') {
      setDataSource('kemenag');
      setFontClass('font-nastaleeq');
    } else if (mushafFont === 'Indopak') {
      setDataSource('indopak');
      setFontClass('font-indopak');
    } else {
      setDataSource('verse');
      setFontClass('font-uthmanic');
    }
  }, [mushafFont]);

  useEffect(() => {
    const fetchInteractiveRules = async () => {
      try {
        const res = await fetch('/data/interactive-rules.json');
        if (!res.ok) return;
        const json = await res.json();
        if (Array.isArray(json.rules)) {
          setInteractiveRules(json.rules);
        }
      } catch (e) {
        console.error('Error fetching interactive rules', e);
      }
    };

    fetchInteractiveRules();
  }, []);

  useEffect(() => {
    const fetchRuleAyat = async () => {
      try {
        const res = await fetch('/data/rule-ayat.json');
        if (!res.ok) return;
        const json = await res.json();
        if (Array.isArray(json.rules)) {
          const map: Record<string, PopupContent> = {};
          json.rules.forEach((r: { surah: number; ayat: number } & PopupContent) => {
            const key = `${r.surah}_${r.ayat}`;
            map[key] = {
              title: r.title,
              audio_url: r.audio_url,
              image_url: r.image_url,
              video_url: r.video_url,
              explanation: r.explanation,
            };
          });
          setRuleAyatMap(map);
        }
      } catch (e) {
        console.error('Error fetching rule-ayat', e);
      }
    };
    fetchRuleAyat();
  }, []);

  useEffect(() => {
    const fetchWarnaRules = async () => {
      try {
        const res = await fetch('/data/warna.json', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        if (Array.isArray(json.rules)) {
          setWarnaRules(json.rules);
        }
      } catch (e) {
        console.error('Error fetching warna rules', e);
      }
    };

    fetchWarnaRules();
  }, []);

  const activePopupRule = useMemo(() => {
    if (!activePopup) return null;
    return interactiveRules.find(
      (r) =>
        r.surah === surahNumber &&
        r.ayat === activePopup.ayat &&
        r.targets?.some(
          (t) =>
            t.popup_key === activePopup.popupKey &&
            (t.word === activePopup.word || t.word.split(/\s+/).includes(activePopup.word))
        )
    ) ?? null;
  }, [activePopup, interactiveRules, surahNumber]);

  const activePopupTarget = useMemo(() => {
    if (!activePopup || !activePopupRule) return null;
    return (
      activePopupRule.targets.find(
        (t) =>
          t.popup_key === activePopup.popupKey &&
          (t.word === activePopup.word || t.word.split(/\s+/).includes(activePopup.word))
      ) ?? null
    );
  }, [activePopup, activePopupRule]);

  const ahkamPopupContent = useMemo(() => {
    if (!ahkamPopup) return null;
    return ruleAyatMap[`${surahNumber}_${ahkamPopup.ayat}`] ?? null;
  }, [ahkamPopup, surahNumber, ruleAyatMap]);

  const explanationContent = useMemo(() => {
    if (activePopup && activePopupTarget) return activePopupTarget;
    if (ahkamPopup) return ahkamPopupContent;
    return null;
  }, [activePopup, ahkamPopup, activePopupTarget, ahkamPopupContent]);

  useEffect(() => {
    if (!activePopup && !ahkamPopup) {
      setPopupPlaying(false);
      setPopupCurrentTime(0);
      setPopupDuration(0);
      setShowPopupExplanation(false);
      setShowPopupVideo(false);
      popupAudioRef.current?.pause();
    }
  }, [activePopup, ahkamPopup]);

  useEffect(() => {
    if (showPopupExplanation && (activePopup || ahkamPopup) && popupAudioRef.current) {
      popupAudioRef.current.play();
    }
  }, [showPopupExplanation, activePopup, ahkamPopup]);

  const formatTime = (s: number) => {
    if (!Number.isFinite(s) || s < 0) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const extractYoutubeId = (url: string): string | null => {
    const trimmed = url.trim();
    if (!trimmed) return null;
    // Raw id (11 chars)
    if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
    const m = trimmed.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([A-Za-z0-9_-]{11})/
    );
    return m?.[1] ?? null;
  };

  const getYoutubeEmbedSrc = (url: string): string | null => {
    const id = extractYoutubeId(url);
    if (!id) return null;
    return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
  };

  useEffect(() => {
    const fetchVerses = async () => {
      setLoading(true);
      try {
        // Ambil data ayat dari file lokal JSON sesuai dataSource
        let url = '/data/verse.json';
        if (dataSource === 'kemenag') url = '/data/kemenag.json';
        if (dataSource === 'indopak') url = '/data/indopak.json';
        const response = await fetch(url);
        const data = await response.json();
        const surahData = data[surahNumber];
        if (!surahData) {
          setVerses([]);
          setTotalPages(1);
          return;
        }
        let ayatList = surahData.ayat;
        // Filter berdasarkan range jika ada
        if (startAyat && endAyat) {
          ayatList = ayatList.filter((a: Verse) => a.ayat >= startAyat && a.ayat <= endAyat);
        }
        // Pagination
        setTotalPages(Math.ceil(ayatList.length / VERSES_PER_PAGE));
        setVerses(ayatList);
      } catch (error) {
        console.error('Error fetching verses:', error);
        setVerses([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchVerses();
  }, [surahNumber, currentPage, startAyat, endAyat, dataSource]);

  useEffect(() => {
    const fetchSurahName = async () => {
      try {
        const res = await axios.get(`https://api.quran.com/api/v4/chapters/${surahNumber}?language=id`);
        setSurahName(res.data.chapter.name_simple);
      } catch {
        setSurahName("");
      }
    };
    fetchSurahName();
  }, [surahNumber]);

  useEffect(() => {
    setTafsirList([]);
    if (!surahNumber) return;
    fetch(`https://equran.id/api/v2/tafsir/${surahNumber}`)
      .then(res => res.json())
      .then(data => {
        setTafsirList(data.data.tafsir);
      })
      .catch(() => setTafsirList([]));
  }, [surahNumber]);

  const handlePlay = (verseNumber: number) => {
    if (playingAyah === verseNumber) {
      audioRef.current?.pause();
      setPlayingAyah(null);
    } else {
      function pad(num: number, size: number) {
        let s = String(num);
        while (s.length < size) s = "0" + s;
        return s;
      }
      const surahStr = pad(surahNumber, 3);
      const ayahStr = pad(verseNumber, 3);
      const audioUrl = `https://everyayah.com/data/Alafasy_64kbps/${surahStr}${ayahStr}.mp3`;
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setPlayingAyah(verseNumber);
      }
    }
  };

  const handlePlayNext = () => {
    if (isAutoNext && playingAyah !== null) {
      const nextAyat = playingAyah + 1;
      const nextVerseObj = verses.find(v => v.ayat === nextAyat);

      if (nextVerseObj) {
        function pad(num: number, size: number) {
          let s = String(num);
          while (s.length < size) s = "0" + s;
          return s;
        }
        const surahStr = pad(surahNumber, 3);
        const ayahStr = pad(nextAyat, 3);
        const audioUrl = `https://everyayah.com/data/Alafasy_64kbps/${surahStr}${ayahStr}.mp3`;

        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
          setPlayingAyah(nextAyat);

          // Auto paged if needed
          const nextVerseIndex = verses.findIndex(v => v.ayat === nextAyat);
          if (nextVerseIndex !== -1) {
            const newPage = Math.floor(nextVerseIndex / VERSES_PER_PAGE) + 1;
            if (newPage !== currentPage) {
              setCurrentPage(newPage);
            }
          }
        }
      } else {
        setPlayingAyah(null);
      }
    } else {
      setPlayingAyah(null);
    }
  };

  const renderInteractiveArabic = (
    text: string,
    interactiveTargets: InteractiveTarget[] | null,
    warnaRule: WarnaRule | null,
    ayatNumber: number
  ) => {
    const normalizeWords = (input: string[] | string | undefined) => {
      if (!input) return [];
      if (Array.isArray(input)) return input.filter(Boolean);
      return [input].filter(Boolean);
    };

    const greenWords = normalizeWords(warnaRule?.green_word);
    const redWords = normalizeWords(warnaRule?.red_word);
    const underlineWords = [...greenWords, ...redWords];

    if ((!interactiveTargets || !interactiveTargets.length) && !underlineWords.length) {
      return <span>{text}</span>;
    }

    type Range = { start: number; end: number };
    type TargetRange = Range & { target: InteractiveTarget };
    const normalizeArabicChar = (ch: string) => {
      if (/[أإآٱ]/.test(ch)) return 'ا';
      if (ch === 'ى') return 'ي';
      if (ch === 'ؤ') return 'و';
      if (ch === 'ئ') return 'ي';
      if (ch === 'ة') return 'ه';
      return ch;
    };
    const isSkippedArabicMark = (ch: string) =>
      /[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/.test(ch);
    const buildNormalizedText = (input: string) => {
      let normalized = '';
      const indexMap: number[] = [];
      for (let i = 0; i < input.length; i++) {
        const ch = input[i];
        if (isSkippedArabicMark(ch)) continue;
        normalized += normalizeArabicChar(ch);
        indexMap.push(i);
      }
      return { normalized, indexMap };
    };
    const findRangesFlexible = (baseText: string, word: string): Range[] => {
      const directRanges: Range[] = [];
      let directFrom = 0;
      while (directFrom < baseText.length) {
        const directIdx = baseText.indexOf(word, directFrom);
        if (directIdx === -1) break;
        directRanges.push({ start: directIdx, end: directIdx + word.length });
        directFrom = directIdx + Math.max(1, word.length);
      }
      if (directRanges.length) return directRanges;

      const base = buildNormalizedText(baseText);
      const query = buildNormalizedText(word).normalized;
      if (!query) return [];

      const fallbackRanges: Range[] = [];
      let from = 0;
      while (from < base.normalized.length) {
        const nIdx = base.normalized.indexOf(query, from);
        if (nIdx === -1) break;
        const start = base.indexMap[nIdx];
        const endMapIdx = nIdx + query.length - 1;
        const end = (base.indexMap[endMapIdx] ?? start) + 1;
        fallbackRanges.push({ start, end });
        from = nIdx + Math.max(1, query.length);
      }
      return fallbackRanges;
    };
    const occurrenceForPhrase = (
      occ: number | number[] | undefined,
      phraseIndex: number
    ): number | undefined => {
      if (occ === undefined) return undefined;
      if (Array.isArray(occ)) return occ[phraseIndex];
      return phraseIndex === 0 ? occ : undefined;
    };

    const targetRanges: TargetRange[] = [];
    (interactiveTargets ?? []).forEach((target) => {
      if (!target.word) return;
      const ranges = findRangesFlexible(text, target.word);
      ranges.forEach((r) => targetRanges.push({ start: r.start, end: r.end, target }));
    });

    const redRanges: Range[] = [];
    redWords.forEach((word, i) => {
      const occ = occurrenceForPhrase(warnaRule?.red_occurrence, i);
      if (occ === undefined) {
        redRanges.push(...findRangesFlexible(text, word));
        return;
      }
      const matches = findRangesFlexible(text, word);
      const r = matches[occ - 1];
      if (r) redRanges.push(r);
    });
    const rangeDistance = (a: Range, b: Range) => {
      if (a.end <= b.start) return b.start - a.end;
      if (b.end <= a.start) return a.start - b.end;
      return 0;
    };
    const greenRanges: Range[] = [];
    greenWords.forEach((word, phraseIndex) => {
      const occ = occurrenceForPhrase(warnaRule?.green_occurrence, phraseIndex);
      const matches = findRangesFlexible(text, word);
      if (!matches.length) return;

      if (occ !== undefined) {
        const r = matches[occ - 1];
        if (r) greenRanges.push(r);
        return;
      }

      // Keep as-is for unambiguous cases (single match) or when no red anchor exists.
      if (!redRanges.length || matches.length === 1) {
        greenRanges.push(...matches);
        return;
      }

      // For duplicated green words, prefer match that overlaps red anchor.
      const overlapping = matches.filter((greenRange) =>
        redRanges.some((redRange) => redRange.start < greenRange.end && greenRange.start < redRange.end)
      );
      if (overlapping.length) {
        greenRanges.push(...overlapping);
        return;
      }

      // If no overlap exists, keep the nearest occurrence to red anchor.
      let bestRange = matches[0];
      let bestDistance = Number.POSITIVE_INFINITY;
      matches.forEach((greenRange) => {
        const distanceToClosestRed = redRanges.reduce(
          (min, redRange) => Math.min(min, rangeDistance(greenRange, redRange)),
          Number.POSITIVE_INFINITY
        );
        if (distanceToClosestRed < bestDistance) {
          bestDistance = distanceToClosestRed;
          bestRange = greenRange;
        }
      });
      greenRanges.push(bestRange);
    });
    const breakpoints = new Set<number>([0, text.length]);

    [...targetRanges, ...greenRanges, ...redRanges].forEach((r) => {
      breakpoints.add(r.start);
      breakpoints.add(r.end);
    });

    const sorted = Array.from(breakpoints).sort((a, b) => a - b);
    const elements: React.ReactNode[] = [];

    for (let i = 0; i < sorted.length - 1; i++) {
      const start = sorted[i];
      const end = sorted[i + 1];
      if (end <= start) continue;

      const segmentText = text.slice(start, end);
      if (!segmentText) continue;

      const hasGreen = greenRanges.some((r) => start >= r.start && end <= r.end);
      const hasRed = redRanges.some((r) => start >= r.start && end <= r.end);
      const isInOverlappingRedRange = redRanges.some(
        (redRange) =>
          start >= redRange.start &&
          end <= redRange.end &&
          greenRanges.some(
            (greenRange) => redRange.start < greenRange.end && greenRange.start < redRange.end
          )
      );

      const coveredTargets = targetRanges
        .filter((r) => start >= r.start && end <= r.end)
        .sort((a, b) => (b.end - b.start) - (a.end - a.start));
      const target = coveredTargets[0]?.target ?? null;

      // Use inline + baseline (not inline-block) so Arabic glyphs keep normal kerning/joining at span edges.
      const underlineStyle: React.CSSProperties | undefined = hasGreen || hasRed
        ? hasGreen && hasRed
          ? {
            display: 'inline',
            verticalAlign: 'baseline',
            boxDecorationBreak: 'clone',
            WebkitBoxDecorationBreak: 'clone',
            paddingBottom: '7px',
            backgroundImage:
              'linear-gradient(#ef4444, #ef4444), linear-gradient(#22c55e, #22c55e)',
            backgroundRepeat: 'no-repeat, no-repeat',
            backgroundSize: '100% 2px, 100% 2px',
            backgroundPosition: '0 calc(100% - 7px), 0 calc(100% - 1px)',
          }
          : hasGreen
            ? {
              display: 'inline',
              verticalAlign: 'baseline',
              boxDecorationBreak: 'clone',
              WebkitBoxDecorationBreak: 'clone',
              paddingBottom: '7px',
              backgroundImage: 'linear-gradient(#22c55e, #22c55e)',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '100% 2px',
              backgroundPosition: '0 calc(100% - 1px)',
            }
            : {
              display: 'inline',
              verticalAlign: 'baseline',
              boxDecorationBreak: 'clone',
              WebkitBoxDecorationBreak: 'clone',
              paddingBottom: '7px',
              backgroundImage: 'linear-gradient(#ef4444, #ef4444)',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '100% 2px',
              backgroundPosition: isInOverlappingRedRange
                ? '0 calc(100% - 7px)'
                : '0 calc(100% - 1px)',
            }
        : undefined;

      if (target) {
        elements.push(
          <span
            key={`seg-${start}-${end}`}
            className="relative inline cursor-pointer select-none after:content-[''] after:absolute after:inset-0 after:rounded-sm after:bg-emerald-200/60 after:origin-right after:scale-x-0 after:transition-transform after:duration-300 after:ease-out hover:after:scale-x-100"
            style={underlineStyle}
            onClick={() =>
              setActivePopup({
                ayat: ayatNumber,
                word: target.word,
                popupKey: target.popup_key,
              })
            }
          >
            <span className="relative z-10">{segmentText}</span>
          </span>
        );
      } else {
        elements.push(
          <span key={`seg-${start}-${end}`} style={underlineStyle}>
            {segmentText}
          </span>
        );
      }
    }

    return <>{elements}</>;
  };

  // Modifikasi tampilan verses untuk mendukung pagination dengan range
  const displayedVerses = useMemo(() => {
    if (!verses.length) return [];
    const startIndex = (currentPage - 1) * VERSES_PER_PAGE;
    return verses.slice(startIndex, startIndex + VERSES_PER_PAGE);
  }, [verses, currentPage]);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white/80 backdrop-blur-2xl rounded-[1.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.12)] w-full max-w-2xl max-h-[90vh] flex flex-col border border-white/60 overflow-hidden transform transition-all">
        <div className="p-4 sm:p-5 border-b border-white/40 bg-gradient-to-r from-white/60 to-white/30 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between sm:items-center relative z-10">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight leading-tight flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-100/60 text-blue-700 font-bold text-sm border border-blue-100/30">
              {surahNumber}
            </span>
            <span>{surahName || 'Surah'}</span>
            <span className="text-xs sm:text-sm text-indigo-500 bg-indigo-50/50 px-2 py-0.5 rounded-lg ml-1">
              {startAyat && endAyat && startAyat !== endAyat ? `Ayat ${startAyat}-${endAyat}` : startAyat ? `Ayat ${startAyat}` : 'Semua Ayat'}
            </span>
          </h2>
          <div className="flex items-center justify-end gap-2 mt-1 sm:mt-0">
            {/* Auto Next Toggle */}
            <button
              onClick={() => setIsAutoNext(!isAutoNext)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all duration-300 shadow-sm ${isAutoNext
                  ? 'bg-blue-600 border-blue-500 text-white shadow-blue-200'
                  : 'bg-white/50 border-white text-slate-400 hover:bg-white hover:border-slate-200 opacity-80 hover:opacity-100'
                }`}
              title={isAutoNext ? "Matikan Auto Play" : "Aktifkan Auto Play"}
            >
              <div className={`transition-transform duration-700 ${isAutoNext ? 'rotate-[360deg]' : 'rotate-0'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5 sm:w-4 sm:h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </div>
              <span className="font-bold text-[10px] sm:text-[11px] uppercase tracking-wide whitespace-nowrap">Auto</span>
            </button>

            {/* Mushaf Selector */}
            <label className="flex items-center gap-1.5 sm:gap-2 bg-white/50 backdrop-blur-md px-2.5 sm:px-3 py-1.5 rounded-xl border border-white shadow-sm hover:border-slate-200 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-slate-400 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" />
              </svg>
              <span className="hidden sm:inline font-bold text-slate-600 text-[10px] uppercase tracking-wider">Mushaf</span>
              <select
                className="bg-transparent text-[10px] sm:text-xs font-bold text-blue-600 focus:outline-none focus:ring-0 cursor-pointer max-w-[70px] sm:max-w-none"
                value={mushafFont}
                onChange={e => setMushafFont(e.target.value)}
              >
                <option value="">Uthmanic</option>
                <option value="Madina">Madina</option>
                <option value="Kemenag">Kemenag</option>
                <option value="Indopak">Indopak</option>
              </select>
            </label>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-red-500 bg-white/50 hover:bg-red-50 p-2 rounded-xl transition-all duration-200 shadow-sm border border-white hover:border-red-100"
              aria-label="Tutup"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 scroll-smooth">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col space-y-4 sm:space-y-6">
              {displayedVerses.map((verse) => {
                // Logic khusus Indopak: pisahkan angka Arab di akhir teks_arab
                let arabicText = verse.teks_arab;
                let ayahNumberMark = '';
                let ayahNumberSymbol = '';
                let ayahNumberCircle = '';
                if (mushafFont === 'Indopak') {
                  // Regex: cari satu atau lebih karakter non-huruf Arab di akhir string
                  const match = arabicText.match(/^(.*?)([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]*)([^\u0621-\u064A\u0660-\u0669\u0670-\u06D3\u06FA-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+)$/);
                  if (match) {
                    arabicText = match[1] + match[2];
                    ayahNumberMark = match[3];
                    // Pisahkan simbol di atas bulatan dan angka bulatan
                    // Asumsi: simbol (misal: 'ؔ', 'ۚ', dsb) di awal, angka bulatan (misal: '\uFD3E'-'\uFD3F', '\uFDFD', dsb) di akhir
                    const symbolMatch = ayahNumberMark.match(/^([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]+)?([\uFDFD-\uFDFE\uFD3E-\uFD3F\u06DD\u06DE\u06E9\u06E0-\u06ED\u06F0-\u06F9\u0660-\u0669\u06DF-\u06E8\u06E2-\u06E4\u06E7-\u06E8\u06EA-\u06ED\u06F0-\u06F9\u06DD\u06DE\u06E9\u06E0-\u06ED\u06F0-\u06F9\u0660-\u0669\uFD3E-\uFD3F]+)$/);
                    if (symbolMatch) {
                      ayahNumberSymbol = symbolMatch[1] || '';
                      ayahNumberCircle = symbolMatch[2] || ayahNumberMark;
                    } else {
                      ayahNumberCircle = ayahNumberMark;
                    }
                  } else {
                    // fallback: cari satu atau lebih karakter non-huruf Arab/angka di akhir
                    const fallback = arabicText.match(/^(.*?)([^\u0621-\u064A\u0660-\u0669]+)$/);
                    if (fallback) {
                      arabicText = fallback[1];
                      ayahNumberMark = fallback[2];
                      ayahNumberCircle = ayahNumberMark;
                    }
                  }
                }
                const mushafKey: MushafSource =
                  mushafFont === 'Kemenag'
                    ? 'kemenag'
                    : mushafFont === 'Indopak'
                      ? 'indopak'
                      : 'verse';

                const matchedInteractive = interactiveRules.filter((rule) => {
                  if (rule.surah !== surahNumber || rule.ayat !== verse.ayat) {
                    return false;
                  }
                  if (rule.mushaf === 'all') return true;
                  return rule.mushaf === mushafKey;
                });

                const interactiveTargets: InteractiveTarget[] =
                  matchedInteractive.length > 0
                    ? matchedInteractive.flatMap((r) => r.targets)
                    : [];
                const matchedWarnaRule =
                  warnaRules.find((rule) => rule.surah === surahNumber && rule.ayat === verse.ayat) ?? null;

                return (
                  <div
                    key={verse.ayat}
                    className="bg-white/60 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-white/80 hover:shadow-[0_8px_25px_rgb(59,130,246,0.12)] hover:-translate-y-0.5 hover:border-blue-200/50 flex flex-col gap-3 transition-all duration-300 overflow-hidden relative group"
                  >
                    <div className="absolute -left-4 -top-4 text-[6rem] font-bold text-blue-50/40 opacity-30 group-hover:text-blue-100/50 group-hover:scale-110 transition-all duration-500 pointer-events-none z-0">
                      {verse.ayat}
                    </div>

                    {/* Header Ayat: Pro App Layout */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2 relative z-10 border-b border-slate-100/50 pb-3">
                      {/* Sisi Kiri: Info Utama */}
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
                          <span className="relative inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-white to-blue-50 text-indigo-700 font-extrabold text-[15px] sm:text-base shadow-sm border border-indigo-100/50">
                            {verse.ayat}
                          </span>
                        </div>
                        <div className="flex flex-col mb-0.5">
                          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em]">Ayat Ke</span>
                        </div>

                        {/* Play Button: Primary Action */}
                        <button
                          className="ml-2 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-[0_4px_15px_rgb(79,70,229,0.3)] hover:shadow-[0_6px_20px_rgb(79,70,229,0.4)] hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
                          onClick={() => handlePlay(verse.ayat)}
                          aria-label="Putar Audio"
                        >
                          {playingAyah === verse.ayat ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.25l13.5 6.75-13.5 6.75V5.25z" />
                            </svg>
                          )}
                        </button>
                      </div>

                      {/* Sisi Kanan: Fitur Pendukung */}
                      <div className="flex items-center flex-wrap gap-2">
                        <button
                          className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl border border-amber-100/50 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-400 hover:to-orange-500 hover:border-amber-400 hover:text-white hover:shadow-md transition-all duration-300 text-amber-700 flex items-center justify-center gap-2 shadow-sm text-[11px] sm:text-xs font-bold"
                          onClick={() => {
                            const tafsirAyat = tafsirList.find((t) => t.ayat === verse.ayat);
                            setShowTafsir({
                              ayat: verse.ayat,
                              text: tafsirAyat ? tafsirAyat.teks : 'Tafsir tidak tersedia.'
                            });
                          }}
                          title="Lihat Tafsir"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" />
                          </svg>
                          Tafsir
                        </button>

                        <button
                          className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl border border-emerald-100/50 bg-gradient-to-r from-emerald-50 to-teal-50 transition-all duration-300 text-emerald-700 flex items-center justify-center gap-2 shadow-sm text-[11px] sm:text-xs font-bold whitespace-nowrap ${!isLoggedIn ? 'opacity-60 cursor-not-allowed grayscale' : 'hover:from-emerald-400 hover:to-teal-500 hover:border-emerald-400 hover:text-white hover:shadow-md'}`}
                          onClick={() => {
                            if (!isLoggedIn) {
                              setShowAuthModal(true);
                              return;
                            }
                            setAhkamPopup({ ayat: verse.ayat });
                          }}
                          title="Ahkam Tajwid"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.01 1.912a15.998 15.998 0 01-3.388-1.62m11.125-9.378c.854-.53 1.874-.32 2.476.495.601.816.483 1.969-.328 2.684l-5.63 4.96c-.347.306-.78.473-1.23.473h-.033c-.45 0-.883-.167-1.23-.473l-5.63-4.96c-.811-.715-.929-1.868-.328-2.684.602-.815 1.622-1.025 2.476-.495l4.712 2.923a1.5 1.5 0 001.768 0l4.712-2.923z" />
                          </svg>
                          Tajwid
                        </button>

                        <button
                          className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl border border-blue-100/50 bg-gradient-to-r from-blue-50 to-indigo-50 transition-all duration-300 text-blue-700 flex items-center justify-center gap-2 shadow-sm text-[11px] sm:text-xs font-bold ${!isLoggedIn ? 'opacity-60 cursor-not-allowed grayscale' : 'hover:from-blue-500 hover:to-indigo-600 hover:border-blue-500 hover:text-white hover:shadow-md'}`}
                          onClick={() => {
                            if (!isLoggedIn) {
                              setShowAuthModal(true);
                              return;
                            }
                            setSharingVerse({
                              teks_arab: verse.teks_arab,
                              terjemahan: verse.terjemahan,
                              ayat: verse.ayat,
                              surahName: surahName,
                              surahNumber: surahNumber
                            });
                            setIsShareModalOpen(true);
                          }}
                          title="Bagikan Ayat"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                          </svg>
                          Share
                        </button>

                        <button
                          className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl border border-rose-100/50 bg-gradient-to-r from-rose-50 to-pink-50 transition-all duration-300 text-rose-700 flex items-center justify-center gap-2 shadow-sm text-[11px] sm:text-xs font-bold ${!isLoggedIn ? 'opacity-60 cursor-not-allowed grayscale' : 'hover:from-rose-400 hover:to-pink-500 hover:border-rose-400 hover:text-white hover:shadow-md'}`}
                          onClick={() => {
                            if (!isLoggedIn) {
                              setShowAuthModal(true);
                              return;
                            }
                            alert('Fitur Kirim Ayat saat ini sedang dalam pengembangan!');
                          }}
                          title="Kirim Ayat via Chat"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                          </svg>
                          Kirim
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl sm:text-3xl md:text-4xl leading-loose text-gray-800 ${fontClass}`} style={{ direction: 'rtl', position: 'relative' }}>
                        {mushafFont === 'Indopak' ? (
                          <>
                            <span>
                              {interactiveTargets.length || matchedWarnaRule
                                ? renderInteractiveArabic(arabicText, interactiveTargets, matchedWarnaRule, verse.ayat)
                                : arabicText}
                            </span>
                            <span
                              className="inline-flex flex-col items-center align-middle ml-2"
                              style={{ verticalAlign: 'middle' }}
                            >
                              {ayahNumberSymbol && (
                                <span style={{ fontSize: '0.7em', lineHeight: 1 }}>{ayahNumberSymbol}</span>
                              )}
                              <span>{ayahNumberCircle}</span>
                            </span>
                          </>
                        ) : (
                          <span>
                            {interactiveTargets.length || matchedWarnaRule
                              ? renderInteractiveArabic(verse.teks_arab, interactiveTargets, matchedWarnaRule, verse.ayat)
                              : verse.teks_arab}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="border-t border-gray-100 pt-2 sm:pt-3">
                      <p className="text-gray-600 leading-relaxed text-sm sm:text-base italic">
                        {verse.terjemahan ? verse.terjemahan : 'Terjemahan tidak tersedia'}
                      </p>
                    </div>
                  </div>
                );
              })}
              <audio ref={audioRef} onEnded={handlePlayNext} />
            </div>
          )}
        </div>

        {/* Fixed Footer for Pagination (Modernized) */}
        {!loading && verses.length > 0 && (
          <div className="p-3.5 sm:p-5 border-t border-white/40 bg-white/60 flex items-center justify-between gap-4 shrink-0 transition-all duration-300">
            <button
              className="flex items-center justify-center gap-1.5 px-3.5 sm:px-5 py-2 rounded-xl bg-white text-slate-800 font-bold text-xs sm:text-[13px] shadow-sm border border-slate-200 hover:bg-slate-50 hover:shadow-md hover:border-slate-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed group active:scale-95"
              onClick={() => {
                setCurrentPage((p) => Math.max(1, p - 1));
                const scrollArea = document.querySelector('.overflow-y-auto');
                if (scrollArea) scrollArea.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={currentPage === 1}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              <span>Kembali</span>
            </button>

            <div className="flex flex-col items-center justify-center bg-indigo-50/50 px-4 sm:px-6 py-1.5 rounded-xl border border-indigo-100/50 shadow-sm">
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-0.5">Halaman</span>
              <span className="text-slate-800 font-extrabold text-sm sm:text-[15px] tabular-nums">
                {currentPage} <span className="text-slate-300 font-medium mx-0.5">/</span> {totalPages}
              </span>
            </div>

            <button
              className="flex items-center justify-center gap-1.5 px-3.5 sm:px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs sm:text-[13px] shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 hover:shadow-indigo-600/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed group active:scale-95"
              onClick={() => {
                setCurrentPage((p) => Math.min(totalPages, p + 1));
                const scrollArea = document.querySelector('.overflow-y-auto');
                if (scrollArea) scrollArea.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={currentPage === totalPages}
            >
              <span>Lanjut</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        )}
        {/* Modern Pop up tafsir */}
        {showTafsir && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[100]">
            <div className="bg-white/90 backdrop-blur-2xl rounded-[1.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.12)] w-full max-w-2xl max-h-[90vh] flex flex-col border border-white/60 overflow-hidden transform transition-all relative">
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-white/40 bg-gradient-to-r from-amber-50/80 to-orange-50/80 flex flex-row items-center justify-between relative z-10 shrink-0">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-800 tracking-tight leading-tight flex items-center gap-2">
                  <span className="flex items-center justify-center min-w-[2rem] h-8 px-2 rounded-xl bg-amber-100/60 text-amber-700 font-bold text-sm border border-amber-200/50 shadow-sm">
                    {showTafsir.ayat}
                  </span>
                  <span className="truncate max-w-[200px] sm:max-w-[300px]">Tafsir Surah {surahName}</span>
                </h3>
                <button
                  className="text-slate-400 hover:text-red-500 bg-white/50 hover:bg-red-50 p-2 rounded-xl transition-all duration-200 shadow-sm border border-white hover:border-red-100 flex-shrink-0"
                  onClick={() => setShowTafsir(null)}
                  aria-label="Tutup"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 scroll-smooth bg-slate-50/30 thin-scrollbar">
                <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-white/80 transition-all duration-300">
                  <p className="text-sm sm:text-[15px] font-medium text-slate-700 leading-relaxed whitespace-pre-line text-justify">
                    {showTafsir.text}
                  </p>
                </div>

                {/* Attribution */}
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-100/50">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Sumber Data</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">Kementerian Agama RI</span>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Modern Pop up Ahkam Tajwid (data dari rule-ayat.json) */}
        {ahkamPopup && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[100]">
            <div className="bg-white/90 backdrop-blur-2xl rounded-[1.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.12)] w-full max-w-md max-h-[90vh] flex flex-col border border-white/60 overflow-hidden transform transition-all relative animate-in zoom-in-95 duration-300">
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-white/40 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 flex flex-row items-center justify-between relative z-10 shrink-0">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-800 tracking-tight leading-tight flex items-center gap-2">
                  <span className="flex items-center justify-center min-w-[2rem] h-8 px-2 rounded-xl bg-emerald-100/60 text-emerald-700 font-bold text-sm border border-emerald-200/50 shadow-sm">
                    {ahkamPopup.ayat}
                  </span>
                  <span>Bedah Hukum Tajwid</span>
                </h3>
                <button
                  className="text-slate-400 hover:text-red-500 bg-white/50 hover:bg-red-50 p-2 rounded-xl transition-all duration-200 shadow-sm border border-white hover:border-red-100 flex-shrink-0"
                  onClick={() => setAhkamPopup(null)}
                  aria-label="Tutup"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 scroll-smooth bg-slate-50/30 thin-scrollbar">
                {ahkamPopupContent ? (
                  <>
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-white/80 transition-all duration-300">
                      <h4 className="text-sm font-bold text-emerald-700 mb-3 flex items-center gap-2">
                        <div className="w-1 h-3 bg-emerald-500 rounded-full"></div>
                        Penjelasan Audio
                      </h4>
                      <div className="space-y-4">
                        <audio
                          ref={popupAudioRef}
                          src={ahkamPopupContent.audio_url}
                          onTimeUpdate={(e) => {
                            const el = e.currentTarget;
                            setPopupCurrentTime(el.currentTime);
                            if (Number.isFinite(el.duration) && el.duration > 0) {
                              setPopupDuration(el.duration);
                            }
                          }}
                          onEnded={() => setPopupPlaying(false)}
                          onPlay={() => setPopupPlaying(true)}
                          onPause={() => setPopupPlaying(false)}
                          style={{ display: 'none' }}
                        />

                        <div className="w-full flex flex-col gap-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 p-3.5">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                const el = popupAudioRef.current;
                                if (!el) return;
                                if (popupPlaying) el.pause();
                                else el.play();
                              }}
                              className="flex-shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                            >
                              {popupPlaying ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                  <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0V6a.75.75 0 01.75-.75zm10.5 0a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0V6a.75.75 0 01.75-.75z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                                  <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Durasi</span>
                              <span className="text-sm font-extrabold text-slate-700 tabular-nums">
                                {formatTime(popupCurrentTime)} <span className="text-slate-300 mx-0.5">/</span> {formatTime(popupDuration)}
                              </span>
                            </div>
                          </div>

                          <div
                            className="h-2 rounded-full bg-emerald-100 overflow-hidden cursor-pointer relative"
                            onClick={(e) => {
                              const el = popupAudioRef.current;
                              if (!el || !popupDuration) return;
                              const rect = e.currentTarget.getBoundingClientRect();
                              const x = e.clientX - rect.left;
                              const pct = Math.max(0, Math.min(1, x / rect.width));
                              el.currentTime = pct * popupDuration;
                            }}
                          >
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all duration-150"
                              style={{ width: popupDuration ? `${(popupCurrentTime / popupDuration) * 100}%` : '0%' }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setShowPopupExplanation(true)}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-[11px] font-black uppercase tracking-wider hover:bg-emerald-600 shadow-md shadow-emerald-500/10 active:scale-95 transition-all"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                            Gambar
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowPopupVideo(true)}
                            disabled={!ahkamPopupContent?.video_url}
                            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider shadow-md active:scale-95 transition-all ${ahkamPopupContent?.video_url
                                ? 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-indigo-500/10'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                              }`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347c-.75.412-1.667-.13-1.667-.986V5.653z" />
                            </svg>
                            Video
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4">
                      <h4 className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-widest mb-2">Penjelasan Teks</h4>
                      <p className="text-sm font-medium text-slate-700 leading-relaxed text-justify">
                        {ahkamPopupContent.explanation || "Penjelasan belum diisi di rule-ayat.json untuk ayat ini."}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 text-center animate-pulse">
                    <p className="text-amber-800 font-bold">Popup data belum tersedia.</p>
                    <p className="text-[11px] text-amber-600 mt-2 font-medium">
                      Menunggu sinkronisasi data Surah {surahNumber}, Ayat {ahkamPopup.ayat}.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Modern Pop up interaktif sederhana */}
        {activePopup && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[100] animate-in fade-in duration-300">
            <div className="bg-white/90 backdrop-blur-2xl rounded-[1.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.12)] w-full max-w-md max-h-[90vh] flex flex-col border border-white/60 overflow-hidden transform transition-all relative animate-in zoom-in-95 duration-300">
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-white/40 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 flex flex-row items-center justify-between relative z-10 shrink-0">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-800 tracking-tight leading-tight flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-100/60 text-emerald-700 font-bold text-sm border border-emerald-200/50 shadow-sm shrink-0">
                    {activePopup.ayat}
                  </span>
                  <span className="truncate">{activePopupRule?.title || activePopupTarget?.popup_key || 'Kamus Tajwid'}</span>
                </h3>
                <button
                  className="text-slate-400 hover:text-red-500 bg-white/50 hover:bg-red-50 p-2 rounded-xl transition-all duration-200 shadow-sm border border-white hover:border-red-100 flex-shrink-0"
                  onClick={() => setActivePopup(null)}
                  aria-label="Tutup"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 scroll-smooth bg-slate-50/30 thin-scrollbar">
                {activePopupTarget?.audio_url && (
                  <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-white/80">
                    <h4 className="text-xs font-black text-emerald-700 mb-3 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1 h-3 bg-emerald-500 rounded-full"></div>
                      Contoh Bacaan
                    </h4>

                    <audio
                      ref={popupAudioRef}
                      src={activePopupTarget.audio_url}
                      onTimeUpdate={(e) => {
                        const el = e.currentTarget;
                        setPopupCurrentTime(el.currentTime);
                        if (Number.isFinite(el.duration) && el.duration > 0) {
                          setPopupDuration(el.duration);
                        }
                      }}
                      onEnded={() => setPopupPlaying(false)}
                      onPlay={() => setPopupPlaying(true)}
                      onPause={() => setPopupPlaying(false)}
                      style={{ display: 'none' }}
                    />

                    <div className="w-full flex flex-col gap-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 p-3.5">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const el = popupAudioRef.current;
                            if (!el) return;
                            if (popupPlaying) el.pause();
                            else el.play();
                          }}
                          className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
                        >
                          {popupPlaying ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                              <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0V6a.75.75 0 01.75-.75zm10.5 0a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0V6a.75.75 0 01.75-.75z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 ml-0.5">
                              <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xs font-black text-slate-700 tabular-nums">{formatTime(popupCurrentTime)}</span>
                          <span className="text-[10px] text-slate-300 font-bold">/</span>
                          <span className="text-[10px] font-bold text-slate-400 tabular-nums">{formatTime(popupDuration)}</span>
                        </div>
                      </div>

                      <div className="h-1.5 rounded-full bg-emerald-100 overflow-hidden cursor-pointer relative">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-150"
                          style={{ width: popupDuration ? `${(popupCurrentTime / popupDuration) * 100}%` : '0%' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowPopupExplanation(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/10 active:scale-95 transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    Buka Penjelasan
                  </button>
                </div>

                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4">
                  <h4 className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-widest mb-2">Definisi Hukum</h4>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed text-justify">
                    {activePopupTarget?.explanation || "Penjelasan detail belum tersedia untuk hukum tajwid ini."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Gambar penjelasan full screen */}
        {showPopupExplanation && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300">
            <button
              type="button"
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-gray-800 flex items-center justify-center text-2xl shadow-lg transition-all border border-white/20 hover:scale-105 active:scale-95"
              onClick={(e) => {
                e.stopPropagation();
                setShowPopupExplanation(false);
                setShowPopupVideo(false);
                if (popupAudioRef.current) {
                  popupAudioRef.current.pause();
                  try {
                    popupAudioRef.current.currentTime = 0;
                  } catch {
                    // ignore
                  }
                }
                setPopupPlaying(false);
                setPopupCurrentTime(0);
              }}
              aria-label="Tutup"
            >
              ×
            </button>
            {ahkamPopup && !ahkamPopupContent?.image_url ? (
              <div
                className="max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-amber-800"
                onClick={(e) => e.stopPropagation()}
              >
                Image belum diisi di <code className="bg-amber-100 px-1 rounded">rule-ayat.json</code>.
              </div>
            ) : (
              <img
                src={
                  explanationContent?.image_url ||
                  'https://media3.giphy.com/media/v1.Y2lkPTZjMDliOTUyMzNybzYzemd4c3Z6MDd3OWl3cjIzenQ1MWJ0ZGh2Ym1pNTlvcHdjNSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/NxC8VtyxqhMtpLoEEN/200w.gif'
                }
                alt="Penjelasan"
                className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        )}

        {/* Pop up video penjelasan (YouTube) */}
        {showPopupVideo && ahkamPopupContent?.video_url && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[111] p-4 animate-in fade-in duration-300">
            <button
              type="button"
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-gray-800 flex items-center justify-center text-2xl shadow-lg transition-all border border-white/20 hover:scale-105 active:scale-95"
              onClick={(e) => {
                e.stopPropagation();
                setShowPopupVideo(false);
              }}
              aria-label="Tutup video"
            >
              ×
            </button>
            <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
              <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                <iframe
                  title="Penjelasan Video"
                  src={
                    getYoutubeEmbedSrc(ahkamPopupContent.video_url) ||
                    ahkamPopupContent.video_url
                  }
                  className="absolute inset-0 w-full h-full rounded-xl"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <div className="mt-3 text-center text-sm text-slate-200">
                Penjelasan video (YouTube)
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Auth Required Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
          <div
            className="absolute inset-0"
            onClick={() => setShowAuthModal(false)}
          ></div>
          <div className="relative bg-white/90 backdrop-blur-xl w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl border border-white/20 animate-in slide-in-from-bottom duration-500 ease-out">
            {/* Decorative Element */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 rounded-full sm:hidden"></div>

            <div className="flex flex-col items-center text-center space-y-6 pt-4 sm:pt-0">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-5 rounded-[2rem] shadow-xl shadow-blue-500/20 rotate-3">
                <FcGoogle className="w-10 h-10 brightness-0 invert" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-800 font-poppins tracking-tight">Eits, Login dulu! 🛑</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  Menu ini khusus untuk pengguna terdaftar. Yuk, login sebentar dengan Google untuk akses penuh!
                </p>
              </div>

              <div className="w-full space-y-3">
                <button
                  onClick={() => {
                    setShowAuthModal(false);
                    handleLogin();
                  }}
                  className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white p-4 rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-[0.98] shadow-lg shadow-slate-900/10"
                >
                  <FcGoogle className="w-6 h-6" />
                  <span>Lanjut dengan Google</span>
                </button>

                <button
                  onClick={() => setShowAuthModal(false)}
                  className="w-full p-4 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors uppercase tracking-widest"
                >
                  Nanti Saja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ShareCardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        verse={sharingVerse}
      />
    </div>
  );
}
