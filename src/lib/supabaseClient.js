import { createClient } from '@supabase/supabase-js';

const fallbackSupabaseUrl = 'https://cxqbwkxifiyiuncljmzk.supabase.co';
const fallbackPublishableKey = 'sb_publishable_pd-2TyhBqxpb8dejubsxpQ_7QmMoOc-';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || fallbackSupabaseUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || fallbackPublishableKey;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
