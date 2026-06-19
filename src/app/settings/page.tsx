'use client';

import { useState, useEffect } from 'react';
import { Save, Check } from 'lucide-react';
import { getSettings, saveSettings } from '@/lib/supabase';

export default function SettingsPage() {
  const [form, setForm] = useState({ claudeApiKey: '', supabaseUrl: '', supabaseAnonKey: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(getSettings());
  }, []);

  function save() {
    saveSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Settings</h1>
      <p className="text-slate-500 text-sm mb-8">Keys are saved to this browser only — never sent to any server except Anthropic and Supabase directly.</p>

      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-semibold text-slate-700 mb-4">Claude API Key</h2>
          <input
            type="password"
            value={form.claudeApiKey}
            onChange={(e) => setForm({ ...form, claudeApiKey: e.target.value })}
            placeholder="sk-ant-..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <p className="text-xs text-slate-400 mt-2">Get your key from console.anthropic.com</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-semibold text-slate-700 mb-4">Supabase</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Project URL</label>
              <input
                type="text"
                value={form.supabaseUrl}
                onChange={(e) => setForm({ ...form, supabaseUrl: e.target.value })}
                placeholder="https://xxxx.supabase.co"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Publishable Key</label>
              <input
                type="password"
                value={form.supabaseAnonKey}
                onChange={(e) => setForm({ ...form, supabaseAnonKey: e.target.value })}
                placeholder="sb_publishable_..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Project Settings → API Keys in your Supabase dashboard</p>
        </div>

        <button
          onClick={save}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
        >
          {saved ? <><Check size={16} /> Saved!</> : <><Save size={16} /> Save Settings</>}
        </button>
      </div>
    </div>
  );
}
