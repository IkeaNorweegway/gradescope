'use client';

import { useState, useEffect, useCallback } from 'react';
import { use } from 'react';
import { ArrowLeft, TrendingUp, Award, AlertCircle, Brain } from 'lucide-react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import type { Student, Submission, Assignment } from '@/lib/types';

function gradeColor(pct: number) {
  if (pct >= 86) return 'text-green-600 bg-green-50';
  if (pct >= 73) return 'text-blue-600 bg-blue-50';
  if (pct >= 60) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
}

function gradeLetter(pct: number) {
  if (pct >= 86) return 'A';
  if (pct >= 73) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
}

export default function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [student, setStudent] = useState<Student | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const sb = getSupabaseClient();
    if (!sb) { setLoading(false); return; }
    const [{ data: stu }, { data: subs }] = await Promise.all([
      sb.from('students').select('*, class:classes(*)').eq('id', id).single(),
      sb.from('submissions').select('*, assignment:assignments(*)').eq('student_id', id).order('marked_at', { ascending: false }),
    ]);
    setStudent(stu);
    setSubmissions(subs || []);
    if (subs && subs.length > 0) setSelected(subs[0]);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="text-slate-500">Loading...</div>;
  if (!student) return <div className="text-slate-500">Student not found.</div>;

  const avg = submissions.length
    ? Math.round(submissions.reduce((s, sub) => s + sub.percentage, 0) / submissions.length)
    : null;

  return (
    <div className="max-w-4xl">
      <Link href="/students" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <ArrowLeft size={15} /> Back to Students
      </Link>

      <div className="flex items-start gap-5 mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {student.first_name[0]}{student.last_name[0]}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{student.first_name} {student.last_name}</h1>
          <p className="text-slate-500 text-sm">{(student.class as { name: string })?.name || 'No class'}</p>
        </div>
        {avg !== null && (
          <div className={`px-4 py-3 rounded-xl font-bold text-2xl ${gradeColor(avg)}`}>
            {gradeLetter(avg)} <span className="text-lg font-semibold">{avg}%</span>
          </div>
        )}
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <TrendingUp size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No submissions yet</p>
          <p className="text-sm">Mark an assignment for this student to see their progress</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1 space-y-2">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Submissions</h2>
            {submissions.map((sub) => {
              const assignment = sub.assignment as Assignment;
              return (
                <button
                  key={sub.id}
                  onClick={() => setSelected(sub)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                    selected?.id === sub.id
                      ? 'border-indigo-400 bg-indigo-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <p className="font-medium text-slate-800 text-sm truncate">{assignment?.title || 'Assignment'}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-slate-400">{new Date(sub.marked_at).toLocaleDateString()}</span>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${gradeColor(sub.percentage)}`}>
                      {sub.percentage}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="col-span-2 space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="font-bold text-slate-800 text-lg">{(selected.assignment as Assignment)?.title}</h2>
                    <p className="text-sm text-slate-500">{new Date(selected.marked_at).toLocaleDateString('en-CA', { dateStyle: 'long' })}</p>
                  </div>
                  <div className={`text-center px-4 py-2 rounded-xl ${gradeColor(selected.percentage)}`}>
                    <p className="text-2xl font-bold">{gradeLetter(selected.percentage)}</p>
                    <p className="text-sm font-semibold">{selected.grade}/{(selected.assignment as Assignment)?.max_marks} · {selected.percentage}%</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {selected.rubric_scores?.map((s) => (
                    <div key={s.criterion_id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="flex-shrink-0 text-right min-w-[3rem]">
                        <span className="font-bold text-slate-700">{s.score}</span>
                        <span className="text-slate-400 text-xs">/{s.max_points}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{s.criterion_name}</p>
                        {s.comment && <p className="text-xs text-slate-500 mt-0.5">{s.comment}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selected.conceptual_notes && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain size={16} className="text-purple-600" />
                    <h3 className="font-semibold text-purple-800 text-sm">Conceptual Understanding</h3>
                  </div>
                  <p className="text-sm text-purple-700">{selected.conceptual_notes}</p>
                </div>
              )}

              {selected.strengths && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award size={16} className="text-green-600" />
                    <h3 className="font-semibold text-green-800 text-sm">Strengths</h3>
                  </div>
                  <p className="text-sm text-green-700">{selected.strengths}</p>
                </div>
              )}

              {selected.areas_for_improvement && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle size={16} className="text-amber-600" />
                    <h3 className="font-semibold text-amber-800 text-sm">Areas to Improve</h3>
                  </div>
                  <p className="text-sm text-amber-700">{selected.areas_for_improvement}</p>
                </div>
              )}

              {selected.ai_feedback && (
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <h3 className="font-semibold text-slate-700 text-sm mb-2">Overall Feedback</h3>
                  <p className="text-sm text-slate-600">{selected.ai_feedback}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
