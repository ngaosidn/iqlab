require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { fs } = require('fs');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://xxx.supabase.co'; // wait I need the real .env!
