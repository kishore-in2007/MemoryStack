import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
export const isSupabaseConfigured = !url.includes('placeholder') && !key.includes('placeholder');
export const supabase = createClient(url, key, { auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } });
