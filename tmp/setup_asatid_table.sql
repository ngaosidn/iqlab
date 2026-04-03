-- Script untuk membuat tabel asatid di Supabase
-- Silakan jalankan ini di SQL Editor Supabase Anda

CREATE TABLE IF NOT EXISTS public.asatid (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
    phone TEXT NOT NULL,
    active_days TEXT[] DEFAULT '{}', -- Contoh: {'Senin', 'Selasa', 'Rabu'}
    start_hour TEXT DEFAULT '08:00', -- Format HH:mm
    end_hour TEXT DEFAULT '21:00',   -- Format HH:mm
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Memberikan izin akses (Enable RLS if needed, for now just allow public select)
ALTER TABLE public.asatid ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.asatid
    FOR SELECT USING (true);

-- (Opsional) Polisi untuk insert/update/delete sebaiknya dibatasi ke admin
-- Jika Anda menggunakan Auth Supabase untuk admin, ganti true dengan role check
CREATE POLICY "Allow admin to manage" ON public.asatid
    FOR ALL USING (true); 
