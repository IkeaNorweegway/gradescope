'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Camera, Upload, Sparkles, Save, RotateCcw, Award, AlertCircle, Brain, CheckCircle } from 'lucide-react';
import { getSupabaseClient, getSettings } from '@/lib/supabase';
import type { Student, Assignment, Class, CriterionScore } from '@/lib/types';

type Step = 'select' | 'photo' | 'marking' | 'review' | 'saved';

interface MarkResult {
  rubric_scores: CriterionScore[];
  grade: number;
  percentage: number;
  ai_feedback: string;
  conceptual_notes: string;
  strengths: string;
  areas_for_improvement: string;
}

function gradeColor(pct: number) {
  if (pct >= 86) return 'text-green-700 bg-green-100 border-green-300';
  if (pct >= 73) return 'text-blue-700 bg-blue-100 border-blue-300';
  if (pct >= 60) return 'text-yellow-700 bg-yellow-100 border-yellow-300';
  return 'text-red-700 bg-red-100 border-red-300';
}

function gradeLetter(pct: number) {
  if (pct >= 86) return 'A';
  if (pct >= 73) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
}

export default function MarkPage() {
  const [step, setStep] = useState<Step>('select');
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [filterClass, setFilterClass] = useState('');
  const [imageBase64, setImageBase64] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageMediaType, setImageMediaType] = useState<string>('image/jpeg');
  const [marking, setMarking] = useState(false);
  const [result, setResult] = useState<MarkResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const sb = getSupabaseClient();
    if (!sb) return;
    const [{ data: studs }, { data: assigns }, { data: cls }] = await Promise.all([
      sb.from('students').select('*, class:classes(*)').order('last_name'),
      sb.from('assignments').select('*').order('title'),
      sb.from('classes').select('*').order('name'),
    ]);
    setStudents(studs || []);
    setAssignments(assigns || []);
    setClasses(cls || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleFile(file: File) {
    setImageMediaType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      // Strip data URL prefix to get raw base64
      setImageBase64(dataUrl.split(',')[1]);
      setStep('photo');
    };
    reader.readAsDataURL(file);
  }

  async function runMarking() {
    if (!selectedStudent || !selectedAssignment || !imageBase64) return;
    setMarking(true);
    setError('');
    const { claudeApiKey } = getSettings();
    if (!claudeApiKey) {
      setError('No Claude API key. Go to Settings to add one.');
      setMarking(false);
      return;
    }

    try {
      const res = await fetch('/api/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeApiKey,
        },
        body: JSON.stringify({
          imageBase64,
          imageMediaType,
          studentName: `${selectedStudent.first_name} ${selectedStudent.last_name}`,
          assignment: {
            title: selectedAssignment.title,
            subject: selectedAssignment.subject,
            description: selectedAssignment.description,
            rubric: selectedAssignment.rubric,
            max_marks: selectedAssignment.max_marks,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Marking failed');
      }

      const data = await res.json();
      setResult(data);
      setStep('review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setMarking(false);
    }
  }

  async function saveResult() {
    if (!result || !selectedStudent || !selectedAssignment) return;
    setSaving(true);
    const sb = getSupabaseClient();
    if (!sb) { setSaving(false); return; }
    await sb.from('submissions').insert({
      student_id: selectedStudent.id,
      assignment_id: selectedAssignment.id,
      grade: result.grade,
      percentage: result.percentage,
      rubric_scores: result.rubric_scores,
      ai_feedback: result.ai_feedback,
      conceptual_notes: result.conceptual_notes,
      strengths: result.strengths,
      areas_for_improvement: result.areas_for_improvement,
    });
    setSaving(false);
    setStep('saved');
  }

  function reset() {
    setStep('select');
    setSelectedStudent(null);
    setSelectedAssignment(null);
    setImageBase64('');
    setImagePreview('');
    setResult(null);
    setError('');
  }

  const filteredStudents = filterClass
    ? students.filter((s) => s.class_id === filterClass)
    : students;

  // ── Step: Saved ──────────────────────────────────────────────────────────────
  if (step === 'saved') {
    return (
      <div className="max-w-lg text-center py-16">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Saved!</h2>
        <p className="text-slate-500 mb-8">
          {selectedStudent?.first_name}&apos;s submission for &quot;{selectedAssignment?.title}&quot; has been saved.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">
            Mark Another
          </button>
          <a
            href={`/students/${selectedStudent?.id}`}
            className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
          >
            View Student
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mark Work</h1>
          <p className="text-slate-500 text-sm mt-0.5">Upload a photo of student work and let Claude mark it</p>
        </div>
        {step !== 'select' && (
          <button onClick={reset} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
            <RotateCcw size={15} /> Start over
          </button>
        )}
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        {(['select', 'photo', 'review'] as const).map((s, i) => {
          const labels = ['Select', 'Photo', 'Review'];
          const stepIdx = ['select', 'photo', 'marking', 'review', 'saved'].indexOf(step);
          const thisIdx = ['select', 'photo', 'review'].indexOf(s);
          const active = stepIdx >= i;
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center text-[10px] font-bold border-current">
                  {i + 1}
                </span>
                {labels[i]}
              </div>
              {i < 2 && <div className={`h-0.5 w-8 rounded-full ${stepIdx > thisIdx ? 'bg-indigo-400' : 'bg-slate-200'}`} />}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Select student + assignment ── */}
      {step === 'select' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="font-semibold text-slate-700 mb-3">Student</h2>
            {classes.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mb-3">
                <button
                  onClick={() => setFilterClass('')}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${!filterClass ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  All
                </button>
                {classes.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setFilterClass(c.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${filterClass === c.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {filteredStudents.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStudent(s)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    selectedStudent?.id === s.id
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-800 font-medium'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-medium">{s.last_name}</span>, {s.first_name}
                  <span className="text-xs text-slate-400 ml-2">{(s.class as Class)?.name}</span>
                </button>
              ))}
              {filteredStudents.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">No students found</p>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="font-semibold text-slate-700 mb-3">Assignment</h2>
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {assignments.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelectedAssignment(a)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    selectedAssignment?.id === a.id
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-800 font-medium'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-medium">{a.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{a.subject} · {a.max_marks} marks</p>
                </button>
              ))}
              {assignments.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">
                  No assignments yet.{' '}
                  <a href="/assignments/new" className="text-indigo-600 underline">Create one</a>
                </p>
              )}
            </div>
          </div>

          <div className="col-span-2 flex justify-end">
            <button
              disabled={!selectedStudent || !selectedAssignment}
              onClick={() => setStep('photo')}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-40"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Photo upload ── */}
      {(step === 'photo' || step === 'marking') && (
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-3 text-sm">
              <p className="font-medium text-slate-700">{selectedStudent?.first_name} {selectedStudent?.last_name}</p>
              <p className="text-slate-400">{selectedAssignment?.title} · {selectedAssignment?.max_marks} marks</p>
            </div>

            {!imagePreview ? (
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center">
                <Camera size={36} className="mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500 mb-4 text-sm">Take a photo or upload from your device</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => cameraRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                  >
                    <Camera size={15} /> Take Photo
                  </button>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
                  >
                    <Upload size={15} /> Upload File
                  </button>
                </div>
                <input
                  ref={cameraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </div>
            ) : (
              <div className="relative">
                <img src={imagePreview} alt="Student work" className="w-full rounded-xl border border-slate-200 object-contain max-h-96" />
                <button
                  onClick={() => { setImagePreview(''); setImageBase64(''); }}
                  className="absolute top-2 right-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50 shadow-sm"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <h2 className="font-semibold text-slate-700 mb-3">Rubric Preview</h2>
              <div className="space-y-2">
                {selectedAssignment?.rubric.map((c) => (
                  <div key={c.id} className="flex justify-between items-start bg-slate-50 rounded-lg px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium text-slate-700">{c.name}</p>
                      {c.description && <p className="text-xs text-slate-400 mt-0.5">{c.description}</p>}
                    </div>
                    <span className="text-slate-400 text-xs ml-3 flex-shrink-0">{c.max_points}pts</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              {error && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}
              <button
                disabled={!imageBase64 || marking}
                onClick={runMarking}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-40 text-base"
              >
                {marking ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Claude is marking...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} /> Mark with AI
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Review & Save ── */}
      {step === 'review' && result && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1">
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 text-sm">
              <p className="font-semibold text-slate-800">{selectedStudent?.first_name} {selectedStudent?.last_name}</p>
              <p className="text-slate-400">{selectedAssignment?.title}</p>
            </div>

            {imagePreview && (
              <img src={imagePreview} alt="Student work" className="w-full rounded-xl border border-slate-200 object-contain max-h-64 mb-4" />
            )}

            <div className={`border rounded-xl p-4 text-center mb-4 ${gradeColor(result.percentage)}`}>
              <p className="text-4xl font-black">{gradeLetter(result.percentage)}</p>
              <p className="text-xl font-bold">{result.grade}/{selectedAssignment?.max_marks}</p>
              <p className="text-sm font-medium">{result.percentage}%</p>
            </div>

            <div className="space-y-2">
              {result.rubric_scores.map((s) => (
                <div key={s.criterion_id} className="bg-white border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-slate-700">{s.criterion_name}</p>
                    <span className="text-xs font-bold text-slate-600">{s.score}/{s.max_points}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-400 rounded-full"
                      style={{ width: `${(s.score / s.max_points) * 100}%` }}
                    />
                  </div>
                  {s.comment && <p className="text-xs text-slate-500 mt-1.5">{s.comment}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-2 space-y-4">
            {result.conceptual_notes && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Brain size={16} className="text-purple-600" />
                  <h3 className="font-semibold text-purple-800 text-sm">Conceptual Understanding</h3>
                </div>
                <textarea
                  value={result.conceptual_notes}
                  onChange={(e) => setResult({ ...result, conceptual_notes: e.target.value })}
                  className="w-full text-sm text-purple-700 bg-transparent border-none outline-none resize-none"
                  rows={4}
                />
              </div>
            )}

            {result.strengths && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award size={16} className="text-green-600" />
                  <h3 className="font-semibold text-green-800 text-sm">Strengths</h3>
                </div>
                <textarea
                  value={result.strengths}
                  onChange={(e) => setResult({ ...result, strengths: e.target.value })}
                  className="w-full text-sm text-green-700 bg-transparent border-none outline-none resize-none"
                  rows={3}
                />
              </div>
            )}

            {result.areas_for_improvement && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={16} className="text-amber-600" />
                  <h3 className="font-semibold text-amber-800 text-sm">Areas to Improve</h3>
                </div>
                <textarea
                  value={result.areas_for_improvement}
                  onChange={(e) => setResult({ ...result, areas_for_improvement: e.target.value })}
                  className="w-full text-sm text-amber-700 bg-transparent border-none outline-none resize-none"
                  rows={3}
                />
              </div>
            )}

            {result.ai_feedback && (
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="font-semibold text-slate-700 text-sm mb-2">Overall Feedback</h3>
                <textarea
                  value={result.ai_feedback}
                  onChange={(e) => setResult({ ...result, ai_feedback: e.target.value })}
                  className="w-full text-sm text-slate-600 bg-transparent border-none outline-none resize-none"
                  rows={3}
                />
              </div>
            )}

            <p className="text-xs text-slate-400">You can edit any feedback above before saving.</p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={saveResult}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save to Student Record'}
              </button>
              <button
                onClick={() => setStep('photo')}
                className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
              >
                Re-mark
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
