'use client';

import React from 'react';

interface UserProfileProps {
  user: {
    id?: string;
    name?: string;
    email?: string;
  };
}

export default function UserProfile({ user }: UserProfileProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl">
          {user.name?.charAt(0) || user.email?.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome, {user.name || user.email}!
          </h1>
          <p className="text-gray-600">{user.email}</p>
        </div>
      </div>
    </div>
  );
}