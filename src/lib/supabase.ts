import { createClient } from '@supabase/supabase-js';

export function getSupabaseClient() {
  if (typeof window === 'undefined') return null;
  const url = localStorage.getItem('gs_supabase_url') || '';
  const key = localStorage.getItem('gs_supabase_key') || '';
  if (!url || !key) return null;
  return createClient(url, key);
}

export function getSettings() {
  if (typeof window === 'undefined') return { claudeApiKey: '', supabaseUrl: '', supabaseAnonKey: '' };
  return {
    claudeApiKey: localStorage.getItem('gs_claude_key') || '',
    supabaseUrl: localStorage.getItem('gs_supabase_url') || '',
    supabaseAnonKey: localStorage.getItem('gs_supabase_key') || '',
  };
}

export function saveSettings(settings: { claudeApiKey: string; supabaseUrl: string; supabaseAnonKey: string }) {
  localStorage.setItem('gs_claude_key', settings.claudeApiKey);
  localStorage.setItem('gs_supabase_url', settings.supabaseUrl);
  localStorage.setItem('gs_supabase_key', settings.supabaseAnonKey);
}
