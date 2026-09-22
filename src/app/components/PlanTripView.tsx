'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Place, InterestOption } from '@/lib/schema';

interface PlanTripViewProps {
  destination: string;
  setDestination: (destination: string) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  travelPace: string;
  setTravelPace: (pace: string) => void;
  interests: string[];
  interestOptions: InterestOption[];
  toggleInterest: (id: string) => void;
  selectedPlaces: Place[];
  removePlace: (id: number | string) => void;
  createTrip: () => void;
  setIsCreatingTrip: (isCreating: boolean) => void;
  setActiveTab: (tab: string) => void;
}

// Define the type for place suggestions
interface PlaceSuggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
  description: string;
}

export default function PlanTripView({
  destination,
  setDestination,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  travelPace,
  setTravelPace,
  interests,
  interestOptions,
  toggleInterest,
  selectedPlaces,
  removePlace,
  createTrip,
  setIsCreatingTrip,
  setActiveTab
}: PlanTripViewProps) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Fetch suggestions from the API with debounce
  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/places?query=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching place suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce the API call to avoid too many requests while typing
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    if (destination && destination.length >= 2) {
      debounceTimeout.current = setTimeout(() => {
        fetchSuggestions(destination);
        setShowSuggestions(true);
      }, 300); // 300ms debounce time
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [destination]);

  // Handle clicks outside the suggestions dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSuggestionClick = (suggestion: PlaceSuggestion) => {
    setDestination(suggestion.description);
    setShowSuggestions(false);
  };

  return (
    <div>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">Plan a New Trip</h2>
        
        <div className="space-y-6">
          <div className="relative">
            <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
              Destination
            </label>
            <input
              id="destination"
              type="text"
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                // Auto-display suggestions if we have enough characters
                if (e.target.value.length >= 2) {
                  setShowSuggestions(true);
                } else {
                  setShowSuggestions(false);
                }
              }}
              onFocus={() => destination && destination.length >= 2 && setShowSuggestions(true)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              placeholder="Enter a city or country"
              required
            />
            
            {showSuggestions && (
              <div 
                ref={suggestionRef}
                className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
              >
                {isLoading ? (
                  <div className="px-4 py-2 text-gray-500">Loading suggestions...</div>
                ) : suggestions.length > 0 ? (
                  suggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.placeId}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <div className="font-medium">{suggestion.mainText}</div>
                      {suggestion.secondaryText && (
                        <div className="text-sm text-gray-500">{suggestion.secondaryText}</div>
                      )}
                    </div>
                  ))
                ) : destination.length >= 2 ? (
                  <div className="px-4 py-2 text-gray-500">No destinations found</div>
                ) : (
                  <div className="px-4 py-2 text-gray-500">Enter at least 2 characters</div>
                )}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                required
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Travel Pace
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTravelPace('relaxed')}
                className={`py-2 px-4 border rounded-md ${
                  travelPace === 'relaxed'
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Relaxed
              </button>
              <button
                type="button"
                onClick={() => setTravelPace('balanced')}
                className={`py-2 px-4 border rounded-md ${
                  travelPace === 'balanced'
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Balanced
              </button>
              <button
                type="button"
                onClick={() => setTravelPace('packed')}
                className={`py-2 px-4 border rounded-md ${
                  travelPace === 'packed'
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Packed
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interests
            </label>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleInterest(option.id)}
                  className={`px-3 py-1 rounded-full text-sm cursor-pointer ${
                    interests.includes(option.id)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          
          {selectedPlaces.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selected Places
              </label>
              <div className="border rounded-md p-3 bg-gray-50">
                <div className="space-y-2">
                  {selectedPlaces.map(place => (
                    <div key={place.id} className="flex justify-between items-center">
                      <span>{place.name}</span>
                      <button
                        type="button"
                        onClick={() => removePlace(place.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {setIsCreatingTrip(false); setActiveTab('dashboard');}}
              className="py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('map')}
              className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md cursor-pointer"
            >
              Find Places on Map
            </button>
            <button
              type="button"
              onClick={createTrip}
              disabled={!destination || !startDate || !endDate}
              className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Create Trip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}