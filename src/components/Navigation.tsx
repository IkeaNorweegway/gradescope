'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, Users, ClipboardList, Camera, LayoutDashboard, LogOut } from 'lucide-react';

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/mark', label: 'Mark Work', icon: Camera },
  { href: '/students', label: 'Students', icon: Users },
  { href: '/assignments', label: 'Assignments', icon: ClipboardList },
  { href: '/classes', label: 'Classes', icon: BookOpen },
];

export default function Navigation() {
  const path = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <nav className="fixed left-0 top-0 h-full w-56 bg-slate-900 text-slate-100 flex flex-col">
      <div className="px-4 py-5 border-b border-slate-700">
        <span className="text-xl font-bold text-white tracking-tight">GradeScope</span>
        <p className="text-xs text-slate-400 mt-0.5">AI-powered marking</p>
      </div>
      <ul className="flex-1 px-2 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={17} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="px-2 pb-4">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white w-full transition-colors"
        >
          <LogOut size={17} />
          Sign Out
        </button>
      </div>
    </nav>
  );
}
