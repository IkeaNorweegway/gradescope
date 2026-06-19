'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Camera, Users, ClipboardList, TrendingUp, Settings, ArrowRight } from 'lucide-react';
import { getSupabaseClient, getSettings } from '@/lib/supabase';

interface Stats {
  students: number;
  assignments: number;
  submissions: number;
  avgPercent: number | null;
}

interface RecentSubmission {
  id: string;
  percentage: number;
  grade: number;
  marked_at: string;
  student: { first_name: string; last_name: string };
  assignment: { title: string; max_marks: number };
}

function gradeLetter(pct: number) {
  if (pct >= 86) return 'A';
  if (pct >= 73) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
}

function gradeColor(pct: number) {
  if (pct >= 86) return 'text-green-700 bg-green-100';
  if (pct >= 73) return 'text-blue-700 bg-blue-100';
  if (pct >= 60) return 'text-yellow-700 bg-yellow-100';
  return 'text-red-700 bg-red-100';
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ students: 0, assignments: 0, submissions: 0, avgPercent: null });
  const [recent, setRecent] = useState<RecentSubmission[]>([]);
  const [configured, setConfigured] = useState(true);

  const load = useCallback(async () => {
    const settings = getSettings();
    if (!settings.supabaseUrl || !settings.supabaseAnonKey) {
      setConfigured(false);
      return;
    }
    const sb = getSupabaseClient();
    if (!sb) return;

    const [{ count: studs }, { count: assigns }, { data: subs }] = await Promise.all([
      sb.from('students').select('*', { count: 'exact', head: true }),
      sb.from('assignments').select('*', { count: 'exact', head: true }),
      sb.from('submissions').select('*, student:students(first_name,last_name), assignment:assignments(title,max_marks)').order('marked_at', { ascending: false }).limit(5),
    ]);

    const recentSubs = (subs || []) as RecentSubmission[];
    const allSubs = subs || [];
    const avg = allSubs.length
      ? Math.round(allSubs.reduce((s: number, sub: { percentage: number }) => s + sub.percentage, 0) / allSubs.length)
      : null;

    setStats({ students: studs || 0, assignments: assigns || 0, submissions: allSubs.length, avgPercent: avg });
    setRecent(recentSubs);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!configured) {
    return (
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome to GradeScope</h1>
        <p className="text-slate-500 mb-8">Set up your keys to get started.</p>
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
            <Settings size={22} className="text-indigo-600" />
          </div>
          <h2 className="font-semibold text-slate-800 mb-1">Configure GradeScope</h2>
          <p className="text-sm text-slate-500 mb-4">
            You need a Claude API key and a Supabase project to use GradeScope. Both have free tiers.
          </p>
          <Link href="/settings" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            Go to Settings <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }


  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          href="/mark"
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 shadow-sm"
        >
          <Camera size={17} /> Mark Work
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Students', value: stats.students, icon: Users, href: '/students', color: 'text-indigo-600 bg-indigo-100' },
          { label: 'Assignments', value: stats.assignments, icon: ClipboardList, href: '/assignments', color: 'text-violet-600 bg-violet-100' },
          { label: 'Submissions', value: stats.submissions, icon: Camera, href: '/mark', color: 'text-blue-600 bg-blue-100' },
          {
            label: 'Class Average',
            value: stats.avgPercent !== null ? `${stats.avgPercent}%` : '—',
            icon: TrendingUp,
            href: '/students',
            color: stats.avgPercent !== null
              ? (stats.avgPercent >= 73 ? 'text-green-600 bg-green-100' : 'text-amber-600 bg-amber-100')
              : 'text-slate-500 bg-slate-100',
          },
        ].map(({ label, value, icon: Icon, href, color }) => (
          <Link key={label} href={href} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-sm transition-all">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
              <Icon size={18} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-sm text-slate-500">{label}</p>
          </Link>
        ))}
      </div>

      {/* Recent submissions */}
      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Recent Submissions</h2>
          <Link href="/students" className="text-xs text-indigo-600 hover:underline">View all</Link>
        </div>
        {recent.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Camera size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No submissions yet — mark your first assignment!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recent.map((sub) => (
              <div key={sub.id} className="px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {sub.student?.first_name?.[0]}{sub.student?.last_name?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {sub.student?.first_name} {sub.student?.last_name}
                    </p>
                    <p className="text-xs text-slate-400">{sub.assignment?.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">
                    {new Date(sub.marked_at).toLocaleDateString()}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${gradeColor(sub.percentage)}`}>
                    {gradeLetter(sub.percentage)} · {sub.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
