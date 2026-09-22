'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Place, InterestOption } from '@/lib/schema';
import GoogleMapView from './GoogleMap';
import Image from 'next/image';

// Define the type for place suggestions
interface PlaceSuggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
  description: string;
}

interface MapViewProps {
  destination: string;
  setDestination: (destination: string) => void;
  selectedPlaces: Place[];
  removePlace: (id: number | string) => void;
  interests: string[];
  toggleInterest: (id: string) => void;
  interestOptions: InterestOption[];
  recommendedPlaces: Place[];
  addPlace: (place: Place) => void;
  handleDestinationSearch: () => void;
  setActiveTab: (tab: string) => void;
  setIsCreatingTrip: (isCreating: boolean) => void;
  startDate?: string;
  endDate?: string;
  initialDailyItineraries?: DailyItinerary[];
  isEditing?: boolean;
}

interface DailyItinerary {
  date: string;
  places: Place[];
}

// Add this new interface for tracking day selection
interface DaySelectionState {
  currentDay: string | null;
  isSelectingForDay: boolean;
}

// Add this function to get the primary interest of a place based on its type and name
function getPrimaryInterest(place: Place, interests: string[]): string | null {
  if (!interests.length) return null;
  
  // Define keywords for each interest (simplified version of what's in the API)
  const interestKeywords: Record<string, string[]> = {
    'history': ['museum', 'historic', 'history', 'cultural', 'heritage', 'monument'],
    'food': ['restaurant', 'cafe', 'food', 'dining', 'cuisine', 'bistro', 'eatery'],
    'nature': ['park', 'garden', 'nature', 'outdoor', 'mountain', 'beach', 'trail'],
    'shopping': ['mall', 'shop', 'market', 'store', 'boutique', 'retail'],
    'nightlife': ['bar', 'club', 'lounge', 'pub', 'night', 'dance'],
    'adventure': ['adventure', 'activity', 'tour', 'experience', 'zoo', 'aquarium'],
    'relaxation': ['spa', 'resort', 'hotel', 'relax', 'wellness', 'retreat'],
    'family': ['family', 'kids', 'children', 'fun', 'play', 'entertainment']
  };
  
  // Check if place type or name contains keywords from interests
  for (const interest of interests) {
    const keywords = interestKeywords[interest] || [];
    
    // Check against place type
    if (place.type && keywords.some(keyword => 
      place.type?.toLowerCase().includes(keyword.toLowerCase())
    )) {
      return interest;
    }
    
    // Check against place name
    if (place.name && keywords.some(keyword => 
      place.name.toLowerCase().includes(keyword.toLowerCase())
    )) {
      return interest;
    }
  }
  
  // If no specific match, return the first selected interest as default
  return interests[0];
}

// Get human-readable interest label
function getInterestLabel(interestId: string, interestOptions: InterestOption[]): string {
  const option = interestOptions.find(opt => opt.id === interestId);
  return option?.label || interestId;
}

// Add this new helper function after the getPrimaryInterest function
function organizeItinerary(places: Place[], startDate: string, endDate: string): DailyItinerary[] {
  if (!startDate || !endDate || places.length === 0) {
    return [];
  }
  
  // Create array of dates from start to end
  const days: Date[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
    days.push(new Date(day));
  }
  
  // If we have very few places or only one day, just distribute evenly
  if (places.length <= days.length || days.length === 1) {
    // Simple distribution - divide places equally among days
    const placesPerDay = Math.ceil(places.length / days.length);
    
    return days.map((date, index) => {
      const startIdx = index * placesPerDay;
      const endIdx = Math.min(startIdx + placesPerDay, places.length);
      return {
        date: date.toISOString().split('T')[0],
        places: places.slice(startIdx, endIdx)
      };
    }).filter(day => day.places.length > 0); // Remove empty days
  }
  
  // Group places by type to create balanced itineraries
  const placesByType: Record<string, Place[]> = {};
  
  // First, categorize places by their main type
  places.forEach(place => {
    const type = place.type || 'unknown';
    if (!placesByType[type]) {
      placesByType[type] = [];
    }
    placesByType[type].push(place);
  });
  
  // Create an array to hold the organized itineraries
  const dailyItineraries: DailyItinerary[] = days.map(date => ({
    date: date.toISOString().split('T')[0],
    places: []
  }));
  
  // Try to group similar activities on the same day
  // History & culture in one day, nature in another, shopping in another, etc.
  const primaryCategories = [
    ['museum', 'art_gallery', 'church', 'historic', 'monument', 'landmark'], // History & culture
    ['park', 'garden', 'natural_feature', 'zoo', 'aquarium', 'beach'], // Nature
    ['shopping_mall', 'store', 'market', 'mall', 'department_store'], // Shopping
    ['restaurant', 'cafe', 'bakery', 'bar', 'food'], // Food
    ['amusement_park', 'theme_park', 'zoo', 'stadium', 'bowling_alley'] // Activities
  ];
  
  // For each primary category, assign places to a single day when possible
  primaryCategories.forEach((categoryTypes, index) => {
    // Get places matching this category
    const matchingPlaces: Place[] = [];
    
    categoryTypes.forEach(type => {
      if (placesByType[type]) {
        matchingPlaces.push(...placesByType[type]);
        delete placesByType[type]; // Remove these so we don't assign them twice
      }
    });
    
    if (matchingPlaces.length > 0) {
      // Find which day to assign these places to (cycling through days)
      const targetDayIndex = index % days.length;
      dailyItineraries[targetDayIndex].places.push(...matchingPlaces);
    }
  });
  
  // Distribute any remaining places across days, maintaining balance
  const remainingPlaces: Place[] = Object.values(placesByType).flat();
  
  if (remainingPlaces.length > 0) {
    // Sort days by how many places they already have, ascending
    dailyItineraries.sort((a, b) => a.places.length - b.places.length);
    
    // Distribute remaining places to the days with fewest places
    remainingPlaces.forEach(place => {
      dailyItineraries[0].places.push(place);
      // Re-sort after each addition
      dailyItineraries.sort((a, b) => a.places.length - b.places.length);
    });
    
    // Sort days back to chronological order
    dailyItineraries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  // Return the organized itineraries, filtering out any empty days
  return dailyItineraries.filter(day => day.places.length > 0);
}

export default function MapView({ 
  destination, 
  setDestination, 
  selectedPlaces, 
  removePlace, 
  interests, 
  toggleInterest, 
  interestOptions, 
  recommendedPlaces: propRecommendedPlaces, 
  addPlace,
  handleDestinationSearch: propHandleDestinationSearch,
  setActiveTab,
  setIsCreatingTrip,
  startDate,
  endDate,
  initialDailyItineraries,
  isEditing = false
}: MapViewProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [dailyItineraries, setDailyItineraries] = useState<DailyItinerary[]>(initialDailyItineraries || []);
  const [recommendedPlaces, setRecommendedPlaces] = useState<Place[]>(propRecommendedPlaces);
  const [locationCoords, setLocationCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  
  // New state for day selection and tracking
  const [daySelection, setDaySelection] = useState<DaySelectionState>({
    currentDay: null,
    isSelectingForDay: false
  });
  
  // Place suggestion states
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Define the interest type map for Google Places API
  const interestTypeMap: Record<string, string> = {
    'history': 'museum,historic_site,landmark',
    'food': 'restaurant,cafe,bakery',
    'nature': 'park,natural_feature,hiking_area',
    'shopping': 'shopping_mall,department_store,market',
    'nightlife': 'bar,night_club,casino',
    'adventure': 'amusement_park,zoo,aquarium',
    'relaxation': 'spa,hot_spring,resort',
    'family': 'zoo,museum,amusement_park,aquarium'
  };
  
  // Update the useEffect for dailyItineraries to manage day selection
  useEffect(() => {
    if (!startDate || !endDate) {
      setDailyItineraries([]);
      return;
    }
    
    // If we already have initialized itineraries from props, use those
    if (initialDailyItineraries && initialDailyItineraries.length > 0 && dailyItineraries.length === 0) {
      console.log('Using provided daily itineraries:', initialDailyItineraries.length);
      setDailyItineraries(initialDailyItineraries);
      
      // Set the selected day to the first day with places
      const firstDayWithPlaces = initialDailyItineraries.find(day => day.places.length > 0);
      if (firstDayWithPlaces) {
        setSelectedDay(firstDayWithPlaces.date);
        setDaySelection({
          currentDay: firstDayWithPlaces.date,
          isSelectingForDay: false
        });
      }
      return;
    }
    
    // Create array of dates from start to end for the trip
    const days: Date[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
      days.push(new Date(day));
    }
    
    // Initialize daily itineraries if none exist yet
    if (dailyItineraries.length === 0) {
      const initialItineraries = days.map(date => ({
        date: date.toISOString().split('T')[0],
        places: []
      }));
      setDailyItineraries(initialItineraries);
      
      // Set the selected day to the first day if none is selected
      if (!selectedDay) {
        setSelectedDay(initialItineraries[0].date);
        // Also initialize day selection state
        setDaySelection({
          currentDay: initialItineraries[0].date,
          isSelectingForDay: false
        });
      }
    } else {
      // Make sure our itineraries match the date range if it changed
      // Add any missing days
      const existingDates = dailyItineraries.map(day => day.date);
      const daysToAdd = days
        .map(d => d.toISOString().split('T')[0])
        .filter(dateStr => !existingDates.includes(dateStr))
        .map(date => ({ date, places: [] }));
      
      if (daysToAdd.length > 0) {
        // Add the new days and sort chronologically
        const updatedItineraries = [...dailyItineraries, ...daysToAdd]
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setDailyItineraries(updatedItineraries);
      }
    }
  }, [startDate, endDate, selectedDay, initialDailyItineraries]);
  
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

  // Fetch place details for coordinates after selecting a place
  const fetchPlaceDetails = async (placeId: string) => {
    try {
      const response = await fetch(`/api/places/details?placeId=${placeId}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.placeDetails;
    } catch (error) {
      console.error('Error fetching place details:', error);
      return null;
    }
  };

  // Fetch nearby places using coordinates
  const fetchNearbyPlaces = async (lat: number, lng: number) => {
    console.log(`Fetching nearby places for lat: ${lat}, lng: ${lng} with interests`, interests);
    
    if (!lat || !lng) {
      console.error('Missing location parameters in fetchNearbyPlaces');
      return;
    }
    
    try {
      setIsLoadingPlaces(true);
      // Format the location as "lat,lng" and convert interests to a comma-separated list
      const interestTypes = interests.map(interest => interestTypeMap[interest] || interest).join(',');
      const url = `/api/places/nearby?location=${lat},${lng}&types=${interestTypes}`;
      console.log('Nearby places request URL:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(`API error: ${errorData.error || response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Nearby places API response:', data);
      
      if (data.places && Array.isArray(data.places)) {
        // Filter out places without valid name or location
        const validPlaces = data.places.filter((place: any) => 
          place.name && place.location && 
          typeof place.location.lat === 'number' && 
          typeof place.location.lng === 'number'
        );
        
        console.log(`Found ${validPlaces.length} valid nearby places`);
        setRecommendedPlaces(validPlaces);
      } else {
        console.log('No places found or invalid response format');
        setRecommendedPlaces([]);
      }
    } catch (error) {
      console.error('Error fetching nearby places:', error);
      setRecommendedPlaces([]);
    } finally {
      setIsLoadingPlaces(false);
    }
  };

  // Handle destination search
  const handleDestinationSearch = async () => {
    if (!destination) {
      alert('Please enter a destination');
      return;
    }
    
    try {
      console.log('Starting destination search for:', destination);
      setIsLoadingPlaces(true);
      
      // First, get the selected place suggestions if any
      const targetPlaceId = suggestions.find(s => s.description === destination)?.placeId;
      
      if (!targetPlaceId) {
        console.log('No matching suggestion found, searching directly for:', destination);
        // Try to search again
        const query = encodeURIComponent(destination);
        const suggestionsResponse = await fetch(`/api/places?query=${query}`);
        
        if (!suggestionsResponse.ok) {
          throw new Error('Failed to get place suggestions');
        }
        
        const suggestionsData = await suggestionsResponse.json();
        const suggestions = suggestionsData.suggestions || [];
        
        if (suggestions.length === 0) {
          throw new Error('No place found with this name');
        }
        
        // Use the first suggestion's placeId
        const placeId = suggestions[0].placeId;
        console.log('Using place ID:', placeId);
        
        const placeDetails = await fetchPlaceDetails(placeId);
        
        if (!placeDetails) {
          throw new Error('Could not get details for this place');
        }
        
        console.log('Got place details:', placeDetails);
        setLocationCoords(placeDetails.location);
        
        // Fetch nearby places
        await fetchNearbyPlaces(
          placeDetails.location.lat,
          placeDetails.location.lng
        );
      } else {
        console.log('Found matching suggestion with place ID:', targetPlaceId);
        // We already have the placeId from suggestions
        const placeDetails = await fetchPlaceDetails(targetPlaceId);
        
        if (!placeDetails) {
          throw new Error('Could not get details for this place');
        }
        
        console.log('Got place details:', placeDetails);
        setLocationCoords(placeDetails.location);
        
        // Fetch nearby places with interest filters
        await fetchNearbyPlaces(
          placeDetails.location.lat,
          placeDetails.location.lng
        );
        
        if (recommendedPlaces.length === 0) {
          console.log('No places found, retrying with broader search');
          // If no places found, try a broader search
          await fetchNearbyPlaces(
            placeDetails.location.lat,
            placeDetails.location.lng
          );
        }
      }
    } catch (error) {
      console.error('Error in destination search:', error);
      alert('Error finding this destination. Please try a different search term.');
    } finally {
      setIsLoadingPlaces(false);
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

  // Change in interests should trigger a search with new interests
  useEffect(() => {
    if (locationCoords) {
      console.log('Interests changed, refreshing recommendations');
      
      fetchNearbyPlaces(locationCoords.lat, locationCoords.lng);
    }
  }, [interests, locationCoords]);

  // Add this useEffect to trigger search when destination is passed from parent
  useEffect(() => {
    // If destination is set but we haven't loaded any recommendations yet,
    // automatically trigger the search
    if (destination && 
        recommendedPlaces.length === 0 && 
        !isLoadingPlaces && 
        locationCoords === null) {
      console.log("Auto-triggering search for destination:", destination);
      handleDestinationSearch();
    }
  }, [destination, recommendedPlaces.length, isLoadingPlaces]);

  const handleSuggestionClick = (suggestion: PlaceSuggestion) => {
    setDestination(suggestion.description);
    setShowSuggestions(false);
    // Trigger search after selecting a suggestion
    handleDestinationSearch();
  };
  
  // Get the current day's places for the map
  const currentDayPlaces = selectedDay 
    ? dailyItineraries.find(day => day.date === selectedDay)?.places || []
    : [];
    
  // Convert places to waypoints for the map
  const waypoints = currentDayPlaces.map(place => ({
    location: place.location,
    name: place.name
  }));

  // Function to calculate estimated visit durations based on place type
  const getVisitDuration = (placeType: string | undefined): number => {
    if (!placeType) return 60; // Default 60 minutes
    
    // Estimated durations in minutes by place type
    const durationMap: Record<string, number> = {
      'museum': 120,
      'art_gallery': 90,
      'historic': 60,
      'park': 90,
      'zoo': 180,
      'aquarium': 120,
      'amusement_park': 240,
      'shopping_mall': 120,
      'restaurant': 90,
      'cafe': 45,
      'bar': 90,
      'beach': 180,
      'tourist_attraction': 90,
      'church': 45,
      'monument': 30,
      'garden': 60,
      'natural_feature': 90,
      'store': 45,
      'market': 60,
      'food': 60,
      'night_club': 180,
      'spa': 120,
      'lodging': 30,
    };
    
    return durationMap[placeType.toLowerCase()] || 60;
  };
  
  // Function to generate a day schedule with estimated times
  const generateDaySchedule = (places: Place[]): { place: Place, startTime: string, endTime: string, duration: number }[] => {
    if (!places.length) return [];
    
    const schedule = [];
    // Start at 9:00 AM
    let currentTime = new Date();
    currentTime.setHours(9, 0, 0, 0);
    
    // Add 30 minutes travel time between places
    const travelTime = 30;
    
    for (let i = 0; i < places.length; i++) {
      const place = places[i];
      const visitDuration = getVisitDuration(place.type);
      
      const startTime = new Date(currentTime);
      const endTime = new Date(currentTime);
      endTime.setMinutes(endTime.getMinutes() + visitDuration);
      
      schedule.push({
        place,
        startTime: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        endTime: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: visitDuration
      });
      
      // Add travel time to the next place (if not the last place)
      if (i < places.length - 1) {
        currentTime = new Date(endTime);
        currentTime.setMinutes(currentTime.getMinutes() + travelTime);
      }
    }
    
    return schedule;
  };
  
  // Generate the schedule for the currently selected day
  const currentDaySchedule = selectedDay 
    ? generateDaySchedule(dailyItineraries.find(day => day.date === selectedDay)?.places || [])
    : [];

  // Override the existing addPlace function with this custom handler
  const handleAddPlace = (place: Place) => {
    // If we're not currently selecting places for a day, prompt the user to start
    if (!daySelection.isSelectingForDay) {
      // If no current day is selected, set it to the first day
      if (!daySelection.currentDay && dailyItineraries.length > 0) {
        const firstDay = dailyItineraries[0].date;
        setDaySelection({
          currentDay: firstDay,
          isSelectingForDay: true
        });
        setSelectedDay(firstDay);
      } else {
        // Start selection mode for the current day
        setDaySelection({
          ...daySelection,
          isSelectingForDay: true
        });
      }
    }
    
    // Add the place to the itinerary for the current day
    if (daySelection.currentDay) {
      // Check if the place is already in the selected places
      if (selectedPlaces.find(p => p.id === place.id)) {
        alert("This attraction is already in your itinerary.");
        return;
      }
      
      // First add the place to the global selected places array
      addPlace(place);
      
      // Then update our daily itineraries
      const updatedItineraries = dailyItineraries.map(day => {
        if (day.date === daySelection.currentDay) {
          return {
            ...day,
            places: [...day.places, place]
          };
        }
        return day;
      });
      
      setDailyItineraries(updatedItineraries);
    } else {
      alert("Please select a day for this attraction first.");
    }
  };

  // Function to finalize the current day and move to the next day
  const finalizeDay = () => {
    if (!daySelection.currentDay) return;
    
    // Find the index of the current day
    const currentIndex = dailyItineraries.findIndex(day => day.date === daySelection.currentDay);
    
    // If there's a next day, select it
    if (currentIndex < dailyItineraries.length - 1) {
      const nextDay = dailyItineraries[currentIndex + 1].date;
      setDaySelection({
        currentDay: nextDay,
        isSelectingForDay: false // Reset selection mode
      });
      setSelectedDay(nextDay);
    } else {
      // If we're on the last day, just stop selecting
      setDaySelection({
        ...daySelection,
        isSelectingForDay: false
      });
    }
  };

  // Function to switch to a different day for adding attractions
  const switchDay = (date: string) => {
    setSelectedDay(date);
    setDaySelection({
      currentDay: date,
      isSelectingForDay: false
    });
  };

  return (
    <div>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Interactive Map</h2>
        
        {dailyItineraries.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Select a day to view its itinerary or add attractions to it:
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {dailyItineraries.map(day => (
                <button
                  key={day.date}
                  onClick={() => switchDay(day.date)}
                  className={`px-3 py-1 rounded text-sm font-medium cursor-pointer transition-colors ${
                    selectedDay === day.date 
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : day.places.length > 0 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  {day.places.length > 0 ? ` (${day.places.length})` : ''}
                </button>
              ))}
            </div>
            
            {daySelection.isSelectingForDay && daySelection.currentDay && (
              <div className="mt-3 bg-blue-50 p-3 rounded-lg border border-blue-100 flex justify-between items-center">
                <div>
                  <p className="font-medium text-blue-800">
                    Adding attractions for: {new Date(daySelection.currentDay).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-sm text-blue-600">
                    Current attractions: {dailyItineraries.find(day => day.date === daySelection.currentDay)?.places.length || 0}
                  </p>
                </div>
                <button
                  onClick={finalizeDay}
                  className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md cursor-pointer transition-colors"
                >
                  End Day & Move to Next
                </button>
              </div>
            )}
          </div>
        )}
       
        <div className="w-full h-96 rounded-lg mb-4">
          <GoogleMapView 
            waypoints={waypoints} 
            date={selectedDay || undefined}
            key={`map-${selectedDay || 'all'}`}
          />
        </div>
        
        {currentDaySchedule.length > 0 ? (
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Day Itinerary - {selectedDay && new Date(selectedDay).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            
            <div className="space-y-3 my-4">
              <div className="grid grid-cols-5 gap-2 text-sm font-medium bg-gray-100 p-2 rounded-t">
                <div className="col-span-1">Time</div>
                <div className="col-span-3">Activity</div>
                <div className="col-span-1 text-right">Duration</div>
              </div>
              
              {currentDaySchedule.map((item, index) => (
                <div key={item.place.id} className="grid grid-cols-5 gap-2 border-b pb-2">
                  <div className="col-span-1 text-sm">
                    <div className="font-medium">{item.startTime}</div>
                    <div className="text-gray-500">{item.endTime}</div>
                  </div>
                  
                  <div className="col-span-3 flex items-center">
                    <div className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm mr-3 flex-shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{item.place.name}</p>
                      <div className="flex items-center text-xs space-x-2 text-gray-600">
                        <span>{item.place.type && item.place.type.replace(/_/g, ' ')}</span>
                        {item.place.rating && (
                          <span className="flex items-center">
                            <span className="text-yellow-500 mr-1">★</span>
                            {item.place.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-span-1 flex items-center justify-end">
                    <div className="text-sm text-gray-600 mr-2">{item.duration} min</div>
                    <button 
                      onClick={() => removePlace(item.place.id)}
                      className="text-red-600 hover:text-red-800"
                      aria-label="Remove place"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  
                  {index < currentDaySchedule.length - 1 && (
                    <div className="col-span-5 flex items-center text-gray-500 text-sm py-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <span>30 min travel time</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
              <h4 className="font-medium text-blue-800 mb-1">Day Summary</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Total activities: {currentDaySchedule.length}</li>
                <li>• Start time: {currentDaySchedule[0]?.startTime || 'N/A'}</li>
                <li>• End time: {currentDaySchedule[currentDaySchedule.length - 1]?.endTime || 'N/A'}</li>
                <li>• Total activity time: {currentDaySchedule.reduce((sum, item) => sum + item.duration, 0)} minutes</li>
                <li>• Travel time between locations: {(currentDaySchedule.length - 1) * 30} minutes</li>
              </ul>
            </div>
          </div>
        ) : selectedPlaces.length === 0 ? (
          <p className="text-center text-gray-500">No places selected yet. Add some attractions to plan your route.</p>
        ) : (
          <p className="text-center text-gray-500">No places assigned to this day. Select another day or add more attractions.</p>
        )}
        
        {selectedPlaces.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => {setActiveTab('planTrip'); setIsCreatingTrip(true);}}
              className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md cursor-pointer transition-colors"
            >
              {isEditing ? 'Update Trip with Changes' : 'Create Trip with These Places'}
            </button>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Nearby Recommendations</h2>
        
        <div className="mb-4 relative">
          <div className="flex space-x-2">
            <div className="flex-grow relative">
              <input
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
                placeholder="Enter a destination"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              {showSuggestions && (
                <div 
                  ref={suggestionRef}
                  className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
                >
                  {isLoading ? (
                    <div className="px-4 py-2 text-gray-500">Loading suggestions...</div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((suggestion) => (
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
            <button
              onClick={handleDestinationSearch}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md cursor-pointer transition-colors"
            >
              Search
            </button>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Filter by Interest:</p>
          <div className="flex flex-wrap gap-2">
            {interestOptions.map(option => (
              <button
                key={option.id}
                onClick={() => toggleInterest(option.id)}
                className={`px-3 py-1 text-sm rounded-full cursor-pointer transition-colors ${
                  interests.includes(option.id)
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {interests.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Recommendations are based on actual reviews and visitor experiences
            </p>
          )}
        </div>
        
        {isLoadingPlaces ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading recommendations based on reviews and interests...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a moment to find the best places for you</p>
          </div>
        ) : recommendedPlaces.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedPlaces.map(place => {
              const primaryInterest = getPrimaryInterest(place, interests);
              
              return (
                <div key={place.id} className="border rounded-lg p-3 flex flex-col">
                  <div className="relative">
                    <div className="h-40 bg-gray-200 rounded mb-2 relative overflow-hidden">
                      {place.photo ? (
                        <img 
                          src={place.photo} 
                          alt={place.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          No Image Available
                        </div>
                      )}
                    </div>
                    
                    {primaryInterest && (
                      <div className="absolute top-2 right-2">
                        <div className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                          {getInterestLabel(primaryInterest, interestOptions)}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-grow">
                    <h3 className="font-medium">{place.name}</h3>
                    <div className="flex items-center mt-1">
                      <span className="text-sm text-yellow-500 mr-1">★</span>
                      <span className="text-sm font-medium">{place.rating || 'N/A'}</span>
                      {place.type && (
                        <span className="text-xs text-gray-500 ml-2 capitalize">
                          {place.type.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                    {place.address && (
                      <p className="text-xs text-gray-500 mt-1 truncate">{place.address}</p>
                    )}
                    
                    {primaryInterest && (
                      <p className="text-xs text-gray-600 mt-2 italic">
                        Perfect for {getInterestLabel(primaryInterest, interestOptions).toLowerCase()} enthusiasts
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleAddPlace(place)}
                    className={`mt-3 w-full py-1 px-2 text-sm rounded cursor-pointer transition-colors ${
                      !daySelection.isSelectingForDay && daySelection.currentDay
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : daySelection.isSelectingForDay
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-600 hover:bg-gray-700 text-white'
                    }`}
                  >
                    {daySelection.isSelectingForDay
                      ? `Add to Day ${new Date(daySelection.currentDay || '').getDate()}`
                      : daySelection.currentDay
                      ? 'Start Adding to Selected Day'
                      : 'Select a Day First'}
                  </button>
                </div>
              );
            })}
          </div>
        ) : destination ? (
          <div className="text-center py-8 border rounded-lg bg-gray-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <h3 className="text-lg font-medium text-gray-700">No places found for this location</h3>
            <p className="text-gray-600 mt-2">Try a different destination or select different interests</p>
            <button
              onClick={handleDestinationSearch}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md cursor-pointer transition-colors"
            >
              Try Search Again
            </button>
          </div>
        ) : (
          <div className="text-center py-8 border rounded-lg bg-gray-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-700">Search for a destination to see recommendations</h3>
            <p className="text-gray-600 mt-2">Enter a city or landmark above to discover attractions</p>
          </div>
        )}
      </div>
    </div>
  );
}