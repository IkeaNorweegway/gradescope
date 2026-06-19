'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, ClipboardList, Trash2, Printer, Download, X, Check, ExternalLink, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import type { Assignment, ManifestAssignment } from '@/lib/types';

const MANIFEST_URL = 'https://ikeanorweegway.github.io/science-6/gradescope-manifest.json';

const subjectColors: Record<string, string> = {
  Science: 'bg-green-100 text-green-700',
  Math: 'bg-blue-100 text-blue-700',
  English: 'bg-purple-100 text-purple-700',
  'Social Studies': 'bg-orange-100 text-orange-700',
  Other: 'bg-slate-100 text-slate-600',
};

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [manifest, setManifest] = useState<ManifestAssignment[] | null>(null);
  const [manifestError, setManifestError] = useState('');
  const [manifestLoading, setManifestLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(0);

  const load = useCallback(async () => {
    const sb = getSupabaseClient();
    if (!sb) { setLoading(false); return; }
    const { data } = await sb.from('assignments').select('*').order('created_at', { ascending: false });
    setAssignments(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function remove(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    const sb = getSupabaseClient();
    if (!sb) return;
    await sb.from('assignments').delete().eq('id', id);
    load();
  }

  async function fetchManifest() {
    setManifestLoading(true);
    setManifestError('');
    try {
      const res = await fetch(MANIFEST_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setManifest((json.assignments || []).filter((m: ManifestAssignment) => m.id && Array.isArray(m.rubric)));
    } catch {
      setManifestError('Could not load the materials manifest. Make sure the classroom site has been deployed with the manifest file.');
    }
    setManifestLoading(false);
  }

  function openImport() {
    setShowImport(true);
    setSelected(new Set());
    setImportDone(0);
    if (!manifest) fetchManifest();
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (!manifest) return;
    const existingUrls = new Set(assignments.map((a) => a.source_url));
    const importable = manifest.filter((m) => !existingUrls.has(m.url));
    setSelected(new Set(importable.map((m) => m.id)));
  }

  async function importSelected() {
    if (!manifest || selected.size === 0) return;
    setImporting(true);
    const sb = getSupabaseClient();
    if (!sb) { setImporting(false); return; }

    const toImport = manifest.filter((m) => selected.has(m.id));
    const rows = toImport.map((m) => ({
      title: m.title,
      subject: m.subject === 'Math' ? 'Math' : 'Science',
      description: m.description,
      rubric: m.rubric.map((c) => ({ ...c, id: crypto.randomUUID() })),
      max_marks: m.rubric.reduce((s, c) => s + c.max_points, 0),
      source_url: m.url,
      class_id: null,
    }));

    await sb.from('assignments').insert(rows);
    setImporting(false);
    setImportDone(rows.length);
    load();
    setTimeout(() => { setShowImport(false); setImportDone(0); setSelected(new Set()); }, 1400);
  }

  const existingUrls = new Set(assignments.map((a) => a.source_url));

  if (loading) return <div className="text-slate-500">Loading...</div>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assignments</h1>
          <p className="text-slate-500 text-sm mt-0.5">{assignments.length} template{assignments.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openImport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200"
          >
            <Download size={16} /> Import from Site
          </button>
          <Link
            href="/assignments/new"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            <Plus size={16} /> New Assignment
          </Link>
        </div>
      </div>

      {/* Import modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <h2 className="font-bold text-slate-900">Import from Classroom Site</h2>
                <p className="text-xs text-slate-500 mt-0.5">Select materials to create as GradeScope assignments</p>
              </div>
              <button onClick={() => setShowImport(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {manifestLoading && (
                <div className="flex items-center gap-2 text-slate-500 py-8 justify-center">
                  <RefreshCw size={16} className="animate-spin" /> Loading manifest...
                </div>
              )}
              {manifestError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
                  <p className="font-medium mb-1">Could not load manifest</p>
                  <p className="text-xs text-red-500">{manifestError}</p>
                  <button onClick={fetchManifest} className="mt-2 text-xs underline">Try again</button>
                </div>
              )}
              {manifest && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-slate-500">{manifest.length} materials available</span>
                    <button onClick={selectAll} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Select all new</button>
                  </div>
                  <div className="space-y-2">
                    {manifest.map((m) => {
                      const alreadyImported = existingUrls.has(m.url);
                      const isSelected = selected.has(m.id);
                      return (
                        <button
                          key={m.id}
                          onClick={() => !alreadyImported && toggleSelect(m.id)}
                          disabled={alreadyImported}
                          className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-all ${
                            alreadyImported
                              ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
                              : isSelected
                              ? 'border-indigo-400 bg-indigo-50'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                            alreadyImported ? 'border-slate-300 bg-slate-100' :
                            isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'
                          }`}>
                            {(isSelected || alreadyImported) && <Check size={12} className="text-white" strokeWidth={3} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm text-slate-800">{m.title}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${subjectColors[m.subject] || subjectColors.Other}`}>
                                {m.subject}
                              </span>
                              {alreadyImported && <span className="text-xs text-slate-400 italic">already imported</span>}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{m.description}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {m.rubric.length} criteria · {m.rubric.reduce((s, c) => s + c.max_points, 0)} marks · Gr. {m.grade_level}
                            </p>
                          </div>
                          <a
                            href={`https://ikeanorweegway.github.io/science-6${m.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-slate-300 hover:text-indigo-500 p-1 flex-shrink-0"
                            title="Preview material"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                {selected.size > 0 ? `${selected.size} selected` : 'None selected'}
              </span>
              <div className="flex gap-2">
                <button onClick={() => setShowImport(false)} className="px-4 py-2 text-slate-600 rounded-lg text-sm hover:bg-slate-100">
                  Cancel
                </button>
                <button
                  onClick={importSelected}
                  disabled={importing || importDone > 0 || selected.size === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {importDone > 0
                    ? <><Check size={15} /> Imported {importDone}!</>
                    : importing
                    ? 'Importing...'
                    : `Import ${selected.size} assignment${selected.size !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <ClipboardList size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No assignments yet</p>
          <p className="text-sm">Import from your classroom site or create a new assignment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <div key={a.id} className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-start justify-between group">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ClipboardList size={18} className="text-slate-500" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{a.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${subjectColors[a.subject] || subjectColors.Other}`}>
                      {a.subject}
                    </span>
                    <span className="text-xs text-slate-400">{a.max_marks} marks · {a.rubric?.length || 0} criteria</span>
                    {a.source_url && (
                      <a
                        href={`https://ikeanorweegway.github.io/science-6${a.source_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-400 hover:text-indigo-600 flex items-center gap-0.5"
                      >
                        <ExternalLink size={11} /> material
                      </a>
                    )}
                  </div>
                  {a.description && <p className="text-sm text-slate-500 mt-1 line-clamp-1">{a.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 mt-0.5">
                <Link
                  href={`/assignments/${a.id}/template`}
                  className="text-slate-300 hover:text-indigo-500 transition-colors p-1"
                  title="Print answer sheet"
                >
                  <Printer size={16} />
                </Link>
                <button
                  onClick={() => remove(a.id, a.title)}
                  className="text-slate-300 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
