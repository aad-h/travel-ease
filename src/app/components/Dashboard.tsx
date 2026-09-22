'use client';

import React from 'react';
import UserProfile from './UserProfile';
import { User, Trip } from '@/lib/schema';

interface DashboardViewProps {
  user: User;
  plannedTrips: Trip[];
  setActiveTab: (tab: string) => void;
  setIsCreatingTrip: (isCreating: boolean) => void;
  viewTripOnMap: (trip: Trip) => void;
}

export default function DashboardView({ 
  user, 
  plannedTrips, 
  setActiveTab, 
  setIsCreatingTrip, 
  viewTripOnMap 
}: DashboardViewProps) {
  return (
    <div>
      <UserProfile user={user} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">My Account</h2>
          <div className="space-y-2">
            <p><span className="font-medium">Name:</span> {user.name || 'Not provided'}</p>
            <p><span className="font-medium">Email:</span> {user.email}</p>
            <p><span className="font-medium">Email Verified:</span> {user.email ? 'Yes' : 'No'}</p>
            <p><span className="font-medium">Account ID:</span> {user.id}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Upcoming Trips</h2>
          {plannedTrips.length > 0 ? (
            <div className="space-y-3">
              {plannedTrips.slice(0, 2).map(trip => (
                <div key={trip.id} className="border-b pb-2">
                  <p className="font-medium">{trip.destination}</p>
                  <p className="text-sm text-gray-600">{trip.startDate} - {trip.endDate}</p>
                  <button 
                    onClick={() => viewTripOnMap(trip)}
                    className="text-sm text-blue-600 hover:underline mt-1"
                  >
                    View on Map
                  </button>
                </div>
              ))}
              <button
                onClick={() => setActiveTab('myTrips')}
                className="text-sm text-blue-600 hover:underline"
              >
                View All Trips
              </button>
            </div>
          ) : (
            <p className="text-gray-600">No upcoming trips. Ready to plan your next adventure?</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => {setActiveTab('planTrip'); setIsCreatingTrip(true);}}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
            >
              Plan a New Trip
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md"
            >
              Explore Map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}