'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ArrowLeft, GripVertical } from 'lucide-react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import type { RubricCriterion } from '@/lib/types';

const SUBJECTS = ['Science', 'Math', 'English', 'Social Studies', 'Other'];

function newCriterion(): RubricCriterion {
  return { id: crypto.randomUUID(), name: '', description: '', max_points: 4 };
}

const SCIENCE_TEMPLATES = [
  {
    name: 'Knowledge & Understanding',
    description: 'Demonstrates accurate factual knowledge and understanding of key concepts',
    max_points: 4,
  },
  {
    name: 'Application & Analysis',
    description: 'Applies concepts to explain phenomena and analyzes relationships between ideas',
    max_points: 4,
  },
  {
    name: 'Communication',
    description: 'Uses scientific vocabulary correctly and communicates ideas clearly',
    max_points: 4,
  },
  {
    name: 'Diagrams / Visuals',
    description: 'Diagrams are accurate, labelled, and support understanding',
    max_points: 4,
  },
];

const MATH_TEMPLATES = [
  {
    name: 'Conceptual Understanding',
    description: 'Shows understanding of the mathematical concept or procedure',
    max_points: 4,
  },
  {
    name: 'Procedural Accuracy',
    description: 'Carries out calculations and procedures correctly with minimal errors',
    max_points: 4,
  },
  {
    name: 'Problem Solving',
    description: 'Selects appropriate strategies and applies them effectively',
    max_points: 4,
  },
  {
    name: 'Communication / Reasoning',
    description: 'Shows work clearly, explains reasoning, and uses mathematical language',
    max_points: 4,
  },
];

export default function NewAssignmentPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    subject: 'Science',
    description: '',
  });
  const [rubric, setRubric] = useState<RubricCriterion[]>([newCriterion()]);
  const [saving, setSaving] = useState(false);

  function loadTemplate(subject: string) {
    const tpl = subject === 'Math' ? MATH_TEMPLATES : SCIENCE_TEMPLATES;
    setRubric(tpl.map((t) => ({ ...t, id: crypto.randomUUID() })));
  }

  function updateCriterion(id: string, field: keyof RubricCriterion, value: string | number) {
    setRubric((r) => r.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  }

  function removeCriterion(id: string) {
    setRubric((r) => r.filter((c) => c.id !== id));
  }

  const maxMarks = rubric.reduce((s, c) => s + (Number(c.max_points) || 0), 0);

  async function save() {
    if (!form.title.trim() || rubric.length === 0) return;
    setSaving(true);
    const sb = getSupabaseClient();
    if (!sb) { setSaving(false); return; }
    await sb.from('assignments').insert({
      title: form.title,
      subject: form.subject,
      description: form.description,
      rubric: rubric.filter((c) => c.name.trim()),
      max_marks: maxMarks,
    });
    router.push('/assignments');
  }

  return (
    <div className="max-w-2xl">
      <Link href="/assignments" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <ArrowLeft size={15} /> Back to Assignments
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">New Assignment</h1>

      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-semibold text-slate-700 mb-4">Details</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Assignment Title</label>
              <input
                autoFocus
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Heat Transfer Lab Report"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Description / Instructions (optional)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="What students were asked to do — helps Claude understand context"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-slate-700">Rubric</h2>
            <span className="text-sm text-slate-500 font-medium">{maxMarks} total marks</span>
          </div>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => loadTemplate(form.subject)}
              className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-medium"
            >
              Load {form.subject} template
            </button>
          </div>

          <div className="space-y-3">
            {rubric.map((c, i) => (
              <div key={c.id} className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <GripVertical size={16} className="text-slate-300 mt-2 flex-shrink-0 cursor-grab" />
                <div className="flex-1 grid grid-cols-12 gap-2">
                  <div className="col-span-4">
                    <input
                      type="text"
                      value={c.name}
                      onChange={(e) => updateCriterion(c.id, 'name', e.target.value)}
                      placeholder={`Criterion ${i + 1}`}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                  <div className="col-span-6">
                    <input
                      type="text"
                      value={c.description}
                      onChange={(e) => updateCriterion(c.id, 'description', e.target.value)}
                      placeholder="What is Claude looking for?"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-1">
                    <input
                      type="number"
                      value={c.max_points}
                      onChange={(e) => updateCriterion(c.id, 'max_points', parseInt(e.target.value) || 0)}
                      min={1}
                      max={100}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm bg-white text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <span className="text-xs text-slate-400">pts</span>
                  </div>
                </div>
                <button
                  onClick={() => removeCriterion(c.id)}
                  className="text-slate-300 hover:text-red-400 transition-colors p-1 mt-0.5 flex-shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => setRubric((r) => [...r, newCriterion()])}
            className="mt-3 flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <Plus size={15} /> Add criterion
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={save}
            disabled={saving || !form.title.trim()}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Assignment'}
          </button>
          <Link href="/assignments" className="px-5 py-2.5 text-slate-600 rounded-lg hover:bg-slate-100 font-medium">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
