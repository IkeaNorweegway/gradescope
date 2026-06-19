'use client';

import { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { getSettings, saveSettings } from '@/lib/supabase';

export default function SettingsPage() {
  const [form, setForm] = useState({ claudeApiKey: '', supabaseUrl: '', supabaseAnonKey: '' });
  const [showKeys, setShowKeys] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(getSettings());
  }, []);

  function handleSave() {
    saveSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Settings</h1>
      <p className="text-slate-500 mb-8">Keys are stored only in your browser&apos;s localStorage — never sent to any server except the APIs themselves.</p>

      <div className="space-y-6">
        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Claude API Key</h2>
          <p className="text-sm text-slate-500 mb-4">
            Required for AI marking. Get one at{' '}
            <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
              console.anthropic.com
            </a>
          </p>
          <div className="relative">
            <input
              type={showKeys ? 'text' : 'password'}
              value={form.claudeApiKey}
              onChange={(e) => setForm({ ...form, claudeApiKey: e.target.value })}
              placeholder="sk-ant-..."
              className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              onClick={() => setShowKeys(!showKeys)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showKeys ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Supabase</h2>
          <p className="text-sm text-slate-500 mb-4">
            Required for storing student data. Create a free project at{' '}
            <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
              supabase.com
            </a>{' '}
            — then copy your Project URL and anon key from Settings → API.
          </p>
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
              <label className="block text-xs font-medium text-slate-600 mb-1">Anon Key</label>
              <input
                type={showKeys ? 'text' : 'password'}
                value={form.supabaseAnonKey}
                onChange={(e) => setForm({ ...form, supabaseAnonKey: e.target.value })}
                placeholder="eyJ..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>
        </section>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          {saved ? <CheckCircle size={17} /> : <Save size={17} />}
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
