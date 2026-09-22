'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setIsCreatingTrip: (isCreating: boolean) => void;
}

export default function Navbar({ activeTab, setActiveTab, setIsCreatingTrip }: NavbarProps) {
  const auth = useAuth();

  return (
    <div className="bg-blue-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="text-xl font-bold">TravelEase</div>
            <nav className="ml-8 space-x-4 flex">
              <button 
                onClick={() => setActiveTab('dashboard')} 
                className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${activeTab === 'dashboard' ? 'bg-blue-700' : 'hover:bg-blue-500'}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('map')} 
                className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${activeTab === 'map' ? 'bg-blue-700' : 'hover:bg-blue-500'}`}
              >
                Map
              </button>
              <button 
                onClick={() => setActiveTab('myTrips')} 
                className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${activeTab === 'myTrips' ? 'bg-blue-700' : 'hover:bg-blue-500'}`}
              >
                My Trips
              </button>
              <button 
                onClick={() => {setActiveTab('planTrip'); setIsCreatingTrip(true);}} 
                className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${activeTab === 'planTrip' ? 'bg-blue-700' : 'hover:bg-blue-500'}`}
              >
                Plan a Trip
              </button>
            </nav>
          </div>
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                {auth.user?.name?.charAt(0) || auth.user?.email?.charAt(0)}
              </div>
              <span className="text-sm">{auth.user?.name || auth.user?.email}</span>
            </div>
            <button 
              onClick={() => auth.logout && auth.logout()} 
              className="ml-4 px-3 py-1 text-sm bg-blue-700 hover:bg-blue-800 rounded cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}