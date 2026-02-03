import { createClient } from '@supabase/supabase-js'

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate if the URL is real, otherwise use a safe placeholder to prevent startup crash
const supabaseUrl = (envUrl && envUrl.startsWith('http'))
    ? envUrl
    : 'https://placeholder.supabase.co';

const supabaseAnonKey = (envKey && envKey.length > 0)
    ? envKey
    : 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
