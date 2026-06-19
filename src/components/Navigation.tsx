'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Users, ClipboardList, Camera, LayoutDashboard, Settings } from 'lucide-react';

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/mark', label: 'Mark', icon: Camera },
  { href: '/students', label: 'Students', icon: Users },
  { href: '/assignments', label: 'Assignments', icon: ClipboardList },
  { href: '/classes', label: 'Classes', icon: BookOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Navigation() {
  const path = usePathname();

  const isActive = (href: string) => href === '/' ? path === '/' : path.startsWith(href);

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <nav className="hidden md:flex fixed left-0 top-0 h-full w-56 bg-slate-900 text-slate-100 flex-col">
        <div className="px-4 py-5 border-b border-slate-700">
          <span className="text-xl font-bold text-white tracking-tight">GradeScope</span>
          <p className="text-xs text-slate-400 mt-0.5">AI-powered marking</p>
        </div>
        <ul className="flex-1 px-2 py-4 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(href)
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={17} />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Mobile header ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 px-4 py-3 flex items-center">
        <span className="text-base font-bold text-white tracking-tight">GradeScope</span>
      </header>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-700 flex">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors ${
              isActive(href)
                ? 'text-indigo-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px]">{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
