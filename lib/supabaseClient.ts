import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL ve Anon Key .env dosyasında tanımlanmalı!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
