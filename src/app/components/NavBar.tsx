'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setIsCreatingTrip: (isCreating: boolean) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Overview', icon: '⌂' },
  { id: 'planTrip', label: 'Plan a trip', icon: '＋' },
  { id: 'map', label: 'Explore', icon: '⌖' },
  { id: 'myTrips', label: 'My trips', icon: '◇' }
];

export default function Navbar({ activeTab, setActiveTab, setIsCreatingTrip }: NavbarProps) {
  const auth = useAuth();
  const initial = auth.user?.name?.charAt(0) || auth.user?.email?.charAt(0) || 'T';

  const navigate = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'planTrip') setIsCreatingTrip(true);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-18 max-w-[1480px] items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <button type="button" onClick={() => navigate('dashboard')} className="flex shrink-0 items-center gap-3 text-left">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-lg font-bold text-white shadow-lg shadow-blue-200">T</span>
          <span className="hidden sm:block">
            <span className="block text-base font-bold leading-4 text-slate-950">TravelEase</span>
            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Plan with confidence</span>
          </span>
        </button>

        <nav className="order-3 flex w-full gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1 sm:order-none sm:ml-4 sm:w-auto" aria-label="Main navigation">
          {navItems.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                activeTab === item.id
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'
              }`}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-1.5 md:flex">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold uppercase text-white">{initial}</span>
            <span className="max-w-36 truncate pr-2 text-sm font-medium text-slate-700">{auth.user?.name || auth.user?.email}</span>
          </div>
          <button type="button" onClick={auth.logout} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700" aria-label="Log out">
            <span className="hidden sm:inline">Log out</span><span className="sm:hidden">↗</span>
          </button>
        </div>
      </div>
    </header>
  );
}
