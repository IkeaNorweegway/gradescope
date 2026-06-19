'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import type { Assignment } from '@/lib/types';

export default function TemplatePage() {
  const { id } = useParams<{ id: string }>();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [copies, setCopies] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const sb = getSupabaseClient();
    if (!sb) { setLoading(false); return; }
    const { data } = await sb.from('assignments').select('*').eq('id', id).single();
    setAssignment(data);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="text-slate-500 p-8">Loading...</div>;
  if (!assignment) return <div className="text-slate-500 p-8">Assignment not found.</div>;

  const sheets = Array.from({ length: copies });

  return (
    <>
      {/* Controls — hidden when printing */}
      <div className="print:hidden max-w-2xl mx-auto p-8">
        <Link href="/assignments" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft size={15} /> Back to Assignments
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">{assignment.title}</h1>
        <p className="text-slate-500 text-sm mb-6">Print answer sheets for students</p>

        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 flex items-center gap-6">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Number of copies</label>
            <input
              type="number"
              min={1}
              max={60}
              value={copies}
              onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 mt-4"
          >
            <Printer size={16} /> Print {copies} sheet{copies !== 1 ? 's' : ''}
          </button>
        </div>

        <p className="text-xs text-slate-400">Preview below. Each student writes their code (e.g. S01) in the box at the top.</p>
      </div>

      {/* Printable sheets */}
      <div className="print:block">
        {sheets.map((_, i) => (
          <Sheet key={i} assignment={assignment} pageBreak={i < sheets.length - 1} />
        ))}
      </div>
    </>
  );
}

function Sheet({ assignment, pageBreak }: { assignment: Assignment; pageBreak: boolean }) {
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

  return (
    <div
      className={`w-[210mm] min-h-[297mm] mx-auto p-[18mm] font-sans text-black bg-white ${pageBreak ? 'print:break-after-page' : ''}`}
      style={{ fontFamily: 'Arial, sans-serif' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-black">
        <div className="flex-1">
          <h1 className="text-xl font-bold leading-tight">{assignment.title}</h1>
          {assignment.description && (
            <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
          )}
          <p className="text-sm mt-1">
            <span className="font-semibold">Subject:</span> {assignment.subject} &nbsp;|&nbsp;
            <span className="font-semibold">Total:</span> {assignment.max_marks} marks
          </p>
        </div>
        <div className="ml-6 flex-shrink-0">
          <div className="text-xs font-semibold text-gray-500 mb-1 text-center">STUDENT CODE</div>
          <div className="w-24 h-12 border-2 border-black rounded flex items-center justify-center text-2xl font-bold tracking-widest text-gray-200 select-none">
            S__
          </div>
        </div>
      </div>

      {/* Date line */}
      <div className="flex gap-8 mb-6 text-sm">
        <span>Date: <span className="inline-block border-b border-black w-32 text-gray-300 text-xs pl-1">{today}</span></span>
        <span>Name (optional): <span className="inline-block border-b border-black w-48">&nbsp;</span></span>
      </div>

      {/* Rubric sections */}
      <div className="space-y-5">
        {assignment.rubric.map((criterion, i) => (
          <div key={criterion.id} className="border border-gray-300 rounded-lg overflow-hidden">
            {/* Criterion header */}
            <div className="flex items-center justify-between bg-gray-100 px-4 py-2 border-b border-gray-300">
              <div>
                <span className="font-bold text-sm">Q{i + 1}. {criterion.name}</span>
                {criterion.description && (
                  <span className="text-xs text-gray-500 ml-2">— {criterion.description}</span>
                )}
              </div>
              <div className="flex-shrink-0 ml-4">
                <span className="text-xs font-semibold text-gray-500">SCORE</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-10 h-7 border border-gray-400 rounded bg-white" />
                  <span className="text-sm font-semibold">/ {criterion.max_points}</span>
                </div>
              </div>
            </div>
            {/* Answer lines */}
            <div className="px-4 py-2 bg-white">
              {Array.from({ length: answerLines(criterion.max_points) }).map((_, l) => (
                <div key={l} className="border-b border-gray-200 h-8" />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-6 flex justify-end">
        <div className="border-2 border-black rounded-lg px-6 py-3 flex items-center gap-4">
          <span className="font-bold text-sm">TOTAL</span>
          <div className="flex items-center gap-1">
            <div className="w-14 h-9 border border-black rounded bg-white" />
            <span className="font-bold text-lg">/ {assignment.max_marks}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function answerLines(maxPoints: number): number {
  if (maxPoints <= 2) return 3;
  if (maxPoints <= 4) return 5;
  if (maxPoints <= 6) return 7;
  return 10;
}
