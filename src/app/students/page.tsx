'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Users, Trash2, ChevronRight, Upload, X, Check } from 'lucide-react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import type { Student, Class } from '@/lib/types';

type ParsedStudent = { first_name: string; last_name: string; student_code: string };

function parseNames(raw: string, existingCount: number): ParsedStudent[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, i) => {
      let first = '';
      let last = '';
      if (line.includes(',')) {
        const [l, f] = line.split(',').map((s) => s.trim());
        first = f || '';
        last = l || '';
      } else {
        const parts = line.split(/\s+/);
        first = parts[0] || '';
        last = parts.slice(1).join(' ') || '';
      }
      const code = `S${String(existingCount + i + 1).padStart(2, '0')}`;
      return { first_name: first, last_name: last, student_code: code };
    })
    .filter((s) => s.first_name || s.last_name);
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', class_id: '' });
  const [saving, setSaving] = useState(false);
  const [filterClass, setFilterClass] = useState('');

  // bulk state
  const [bulkText, setBulkText] = useState('');
  const [bulkClass, setBulkClass] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkDone, setBulkDone] = useState(false);

  const load = useCallback(async () => {
    const sb = getSupabaseClient();
    if (!sb) { setLoading(false); return; }
    const [{ data: studs }, { data: cls }] = await Promise.all([
      sb.from('students').select('*, class:classes(*)').order('last_name'),
      sb.from('classes').select('*').order('name'),
    ]);
    setStudents(studs || []);
    setClasses(cls || []);
    if (cls && cls.length > 0) {
      setForm((f) => ({ ...f, class_id: f.class_id || cls[0].id }));
      setBulkClass((b) => b || cls[0].id);
    }
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  async function create() {
    if (!form.first_name.trim() || !form.last_name.trim()) return;
    setSaving(true);
    const sb = getSupabaseClient();
    if (!sb) { setSaving(false); return; }
    const classStudents = students.filter((s) => s.class_id === (form.class_id || null));
    const code = `S${String(classStudents.length + 1).padStart(2, '0')}`;
    await sb.from('students').insert({
      first_name: form.first_name,
      last_name: form.last_name,
      class_id: form.class_id || null,
      student_code: code,
    });
    setForm({ first_name: '', last_name: '', class_id: form.class_id });
    setShowForm(false);
    setSaving(false);
    load();
  }

  async function bulkImport() {
    const classStudents = students.filter((s) => s.class_id === bulkClass);
    const parsed = parseNames(bulkText, classStudents.length);
    if (parsed.length === 0) return;
    setBulkSaving(true);
    const sb = getSupabaseClient();
    if (!sb) { setBulkSaving(false); return; }
    await sb.from('students').insert(
      parsed.map((p) => ({ ...p, class_id: bulkClass || null }))
    );
    setBulkSaving(false);
    setBulkDone(true);
    setBulkText('');
    load();
    setTimeout(() => { setBulkDone(false); setShowBulk(false); }, 1200);
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Remove ${name}? Their submissions will remain but be unlinked.`)) return;
    const sb = getSupabaseClient();
    if (!sb) return;
    await sb.from('students').delete().eq('id', id);
    load();
  }

  const filtered = filterClass ? students.filter((s) => s.class_id === filterClass) : students;
  const classStudentsForBulk = students.filter((s) => s.class_id === bulkClass);
  const preview = bulkText.trim() ? parseNames(bulkText, classStudentsForBulk.length) : [];

  if (loading) return <div className="text-slate-500">Loading...</div>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <p className="text-slate-500 text-sm mt-0.5">{filtered.length} student{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowBulk(true); setShowForm(false); }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200"
          >
            <Upload size={16} /> Bulk Import
          </button>
          <button
            onClick={() => { setShowForm(true); setShowBulk(false); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            <Plus size={16} /> Add Student
          </button>
        </div>
      </div>

      {classes.length > 0 && (
        <div className="flex gap-2 mb-5 flex-wrap">
          <button
            onClick={() => setFilterClass('')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!filterClass ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            All
          </button>
          {classes.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilterClass(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterClass === c.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Bulk import panel */}
      {showBulk && (
        <div className="mb-6 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Bulk Import Students</h2>
            <button onClick={() => setShowBulk(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-600 mb-1">Class</label>
            <select
              value={bulkClass}
              onChange={(e) => setBulkClass(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">— No class —</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Paste names — one per line
            </label>
            <p className="text-xs text-slate-400 mb-2">
              Accepted formats: <code className="bg-slate-50 px-1 rounded">First Last</code> or <code className="bg-slate-50 px-1 rounded">Last, First</code>
            </p>
            <textarea
              autoFocus
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={8}
              placeholder={`Emma Johnson\nLiam Smith\nOlivia Brown\nor\nJohnson, Emma\nSmith, Liam`}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono resize-none"
            />
          </div>

          {preview.length > 0 && (
            <div className="mb-4 border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Preview — {preview.length} student{preview.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {preview.map((p, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                    <span className="text-slate-800">{p.first_name} {p.last_name}</span>
                    <span className="text-xs font-mono bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-semibold">{p.student_code}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={bulkImport}
              disabled={bulkSaving || bulkDone || preview.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {bulkDone ? <><Check size={15} /> Imported!</> : bulkSaving ? 'Importing...' : `Import ${preview.length} student${preview.length !== 1 ? 's' : ''}`}
            </button>
            <button onClick={() => setShowBulk(false)} className="px-4 py-2 text-slate-600 rounded-lg text-sm hover:bg-slate-100">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Single add form */}
      {showForm && (
        <div className="mb-6 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Add Student</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">First Name</label>
              <input
                autoFocus
                type="text"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Last Name</label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && create()}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Class</label>
              <select
                value={form.class_id}
                onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">— No class —</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={create} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Add Student'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 rounded-lg text-sm hover:bg-slate-100">
              Cancel
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Users size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No students yet</p>
          <p className="text-sm">Add students individually or bulk import a class list</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <Link
              key={s.id}
              href={`/students/${s.id}`}
              className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-5 py-4 hover:border-indigo-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                  {s.first_name[0]}{s.last_name[0]}
                </div>
                <div>
                  <p className="font-medium text-slate-800">{s.first_name} {s.last_name}</p>
                  <p className="text-xs text-slate-400">
                    {(s.class as unknown as Class)?.name || 'No class'}
                    {s.student_code && <span className="ml-2 font-mono text-indigo-400">{s.student_code}</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.preventDefault(); remove(s.id, `${s.first_name} ${s.last_name}`); }}
                  className="text-slate-200 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={15} />
                </button>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
