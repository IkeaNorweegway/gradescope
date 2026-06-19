'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, BookOpen, Trash2 } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';
import type { Class } from '@/lib/types';

const SUBJECTS = ['Science', 'Math', 'English', 'Social Studies', 'Other'];
const GRADES = ['Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', grade_level: 'Grade 7', subject: 'Science' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const sb = getSupabaseClient();
    if (!sb) { setLoading(false); return; }
    const { data } = await sb.from('classes').select('*').order('created_at', { ascending: false });
    setClasses(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function create() {
    if (!form.name.trim()) return;
    setSaving(true);
    const sb = getSupabaseClient();
    if (!sb) { setSaving(false); return; }
    await sb.from('classes').insert({ name: form.name, grade_level: form.grade_level, subject: form.subject });
    setForm({ name: '', grade_level: 'Grade 7', subject: 'Science' });
    setShowForm(false);
    setSaving(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm('Delete this class? Students in this class will be unaffected but unlinked.')) return;
    const sb = getSupabaseClient();
    if (!sb) return;
    await sb.from('classes').delete().eq('id', id);
    load();
  }

  if (loading) return <div className="text-slate-500">Loading...</div>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Classes</h1>
          <p className="text-slate-500 text-sm mt-0.5">{classes.length} class{classes.length !== 1 ? 'es' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <Plus size={16} /> New Class
        </button>
      </div>

      {!getSupabaseClient() && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          Supabase is not configured. Go to <a href="/settings" className="underline font-medium">Settings</a> to add your credentials.
        </div>
      )}

      {showForm && (
        <div className="mb-6 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">New Class</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="col-span-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">Class Name</label>
              <input
                autoFocus
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. 7A Science"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Grade Level</label>
              <select
                value={form.grade_level}
                onChange={(e) => setForm({ ...form, grade_level: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {GRADES.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Subject</label>
              <select
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={create} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Create Class'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 rounded-lg text-sm hover:bg-slate-100">
              Cancel
            </button>
          </div>
        </div>
      )}

      {classes.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No classes yet</p>
          <p className="text-sm">Create your first class to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <BookOpen size={18} className="text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{cls.name}</p>
                  <p className="text-sm text-slate-500">{cls.grade_level} · {cls.subject}</p>
                </div>
              </div>
              <button onClick={() => remove(cls.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
