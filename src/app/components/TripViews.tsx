'use client';

import React from 'react';
import { Place, Trip } from '@/lib/schema';

interface TripsViewProps {
  plannedTrips: Trip[];
  viewTripOnMap: (trip: Trip) => void;
  setActiveTab: (tab: string) => void;
  setIsCreatingTrip: (isCreating: boolean) => void;
  editTrip?: (trip: Trip) => void;
  deleteTrip?: (tripId: string | number) => void;
  isLoading?: boolean;
}

export default function TripsView({ 
  plannedTrips, 
  viewTripOnMap, 
  setActiveTab, 
  setIsCreatingTrip,
  editTrip,
  deleteTrip,
  isLoading = false
}: TripsViewProps) {
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
    
    const date = new Date(year, month - 1, day);
    
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    return date.toLocaleDateString(undefined, options);
  };

  const handleEditTrip = (trip: Trip) => {
    if (editTrip) {
      editTrip(trip);
    }
  };

  const handleDeleteTrip = (tripId: string | number) => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      if (deleteTrip) {
        deleteTrip(tripId);
      }
    }
  };

  return (
    <div>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">My Trips</h2>
          <button
            onClick={() => {setActiveTab('planTrip'); setIsCreatingTrip(true);}}
            className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md cursor-pointer"
          >
            Plan a New Trip
          </button>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-gray-600">Loading your trips...</p>
          </div>
        ) : plannedTrips.length > 0 ? (
          <div className="space-y-6">
            {plannedTrips.map(trip => (
              <div key={trip.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium">{trip.destination}</h3>
                    <p className="text-gray-600">
                      {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                    </p>
                    <div className="mt-1 flex items-center text-sm">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        trip.travelPace === 'relaxed' ? 'bg-blue-100 text-blue-800' :
                        trip.travelPace === 'packed' ? 'bg-orange-100 text-orange-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {(trip.travelPace ?? 'balanced').charAt(0).toUpperCase() + (trip.travelPace ?? 'balanced').slice(1)} Pace
                      </span>
                      <span className="ml-2">
                        {trip.places.length} place{trip.places.length !== 1 ? 's' : ''} planned
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => viewTripOnMap(trip)}
                      className="py-1 px-3 bg-green-600 hover:bg-green-700 text-white text-sm rounded cursor-pointer"
                    >
                      View on Map
                    </button>
                    <button
                      onClick={() => handleEditTrip(trip)}
                      className="py-1 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded cursor-pointer"
                    >
                      Edit Trip
                    </button>
                    <button
                      onClick={() => handleDeleteTrip(trip.id)}
                      className="py-1 px-3 bg-red-600 hover:bg-red-700 text-white text-sm rounded cursor-pointer"
                      aria-label="Delete Trip"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {trip.places.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Places to Visit:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {trip.places.map((place: Place, index: number) => (
                        <div 
                          key={place.id || index} 
                          className="bg-gray-50 p-2 rounded text-sm flex items-center border border-gray-200"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{place.name}</div>
                            {place.type && (
                              <div className="text-xs text-gray-500 capitalize">{place.type}</div>
                            )}
                          </div>
                          {place.rating && (
                            <div className="text-yellow-500 font-medium text-xs">
                              ★ {place.rating}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {trip.places.length === 0 && (
                  <div className="mt-4 text-sm text-gray-500 italic">
                    No places added to this trip yet. Use "View on Map" to add some attractions!
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">You haven't planned any trips yet.</p>
            <button
              onClick={() => {setActiveTab('planTrip'); setIsCreatingTrip(true);}}
              className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md cursor-pointer"
            >
              Plan Your First Trip
            </button>
          </div>
        )}
      </div>
    </div>
  );
}