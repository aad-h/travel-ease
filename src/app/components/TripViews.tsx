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

  const formatMoney = (amount: number, currency = 'USD') => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        maximumFractionDigits: 0
      }).format(amount);
    } catch {
      return `${currency} ${amount}`;
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
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {trip.preferences?.budget !== undefined && (
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-800">
                          Budget: {formatMoney(trip.preferences.budget, trip.preferences.currency)}
                        </span>
                      )}
                      {trip.preferences?.travelers && (
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">
                          {trip.preferences.travelers} traveler{trip.preferences.travelers === 1 ? '' : 's'}
                        </span>
                      )}
                      {trip.preferences?.hotelName && (
                        <span className="rounded-full bg-indigo-100 px-2 py-1 text-indigo-800">
                          Base: {trip.preferences.hotelName}
                        </span>
                      )}
                      {trip.preferences?.hiddenGems && (
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-800">
                          Hidden gems prioritized
                        </span>
                      )}
                    </div>
                    {trip.interests && trip.interests.length > 0 && (
                      <p className="mt-2 text-xs text-gray-500">
                        Interests: {trip.interests.join(', ')}
                      </p>
                    )}
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

                {trip.dailyItineraries && trip.dailyItineraries.length > 0 && (
                  <details className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
                    <summary className="cursor-pointer font-medium text-blue-900">
                      View smart day-by-day itinerary
                    </summary>
                    <div className="mt-4 space-y-4">
                      {trip.dailyItineraries.map((day, dayIndex) => (
                        <section key={day.date} className="rounded-md bg-white p-3 shadow-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="font-semibold">
                              {day.title || `Day ${dayIndex + 1}`} · {formatDate(day.date)}
                            </h4>
                            {day.estimatedBudget !== undefined && trip.preferences && (
                              <span className="text-sm text-emerald-700">
                                Daily target: {formatMoney(day.estimatedBudget, trip.preferences.currency)}
                              </span>
                            )}
                          </div>
                          {day.stops && day.stops.length > 0 ? (
                            <ol className="mt-3 space-y-3">
                              {day.stops.map((stop, stopIndex) => (
                                <li key={`${day.date}-${stop.place.id}-${stopIndex}`} className="border-l-2 border-blue-300 pl-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-xs text-blue-700">{stop.time}</span>
                                    <span className="font-medium">{stop.place.name}</span>
                                    <span className="text-xs text-gray-500">
                                      Est. {formatMoney(stop.estimatedCost, trip.preferences?.currency)}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-sm text-gray-600">{stop.reason}</p>
                                  <div className="mt-1 flex gap-3 text-sm">
                                    <a
                                      href={stop.mapsUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-700 hover:underline"
                                    >
                                      Open map
                                    </a>
                                    <a
                                      href={stop.bookingUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-700 hover:underline"
                                    >
                                      Official/booking search
                                    </a>
                                  </div>
                                </li>
                              ))}
                            </ol>
                          ) : (
                            <p className="mt-2 text-sm text-gray-500">Flexible day — add places from the map when ready.</p>
                          )}
                        </section>
                      ))}
                    </div>
                  </details>
                )}

                {trip.planningGuidance && trip.planningGuidance.length > 0 && (
                  <details className="mt-3 rounded-lg border border-gray-200 p-4">
                    <summary className="cursor-pointer font-medium">Planning guidance used</summary>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-600">
                      {trip.planningGuidance.map((guidance, index) => (
                        <li key={`${trip.id}-guidance-${index}`}>{guidance}</li>
                      ))}
                    </ul>
                  </details>
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
