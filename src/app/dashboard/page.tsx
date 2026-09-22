'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

import Navbar from '../components/NavBar';
import DashboardView from '../components/Dashboard';
import MapView from '../components/MapView';
import TripsView from '../components/TripViews';
import PlanTripView from '../components/PlanTripView';

import { Place, Trip, InterestOption, DailyItinerary } from '@/lib/schema';

// Create a copy of the organizeItinerary function from MapView.tsx since we need it here
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

export default function Dashboard() {
  const auth = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isCreatingTrip, setIsCreatingTrip] = useState<boolean>(false);
  const [destination, setDestination] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [travelPace, setTravelPace] = useState<string>('balanced');
  const [interests, setInterests] = useState<string[]>([]);
  const [plannedTrips, setPlannedTrips] = useState<Trip[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [mapCenter, setMapCenter] = useState<{lat: number, lng: number}>({ lat: 40.7128, lng: -74.0060 });
  const [mapZoom, setMapZoom] = useState<number>(13);
  const [selectedPlaces, setSelectedPlaces] = useState<Place[]>([]);
  const [recommendedPlaces, setRecommendedPlaces] = useState<Place[]>([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState<boolean>(false);
  const [editingTripId, setEditingTripId] = useState<string | number | null>(null);

  const interestOptions: InterestOption[] = [
    { id: 'history', label: 'History & Culture' },
    { id: 'food', label: 'Food & Dining' },
    { id: 'nature', label: 'Nature & Outdoors' },
    { id: 'shopping', label: 'Shopping' },
    { id: 'nightlife', label: 'Nightlife' },
    { id: 'adventure', label: 'Adventure' },
    { id: 'relaxation', label: 'Relaxation' },
    { id: 'family', label: 'Family-Friendly' }
  ];

  // Fetch user's trips from the database when component mounts or user changes
  useEffect(() => {
    async function fetchUserTrips() {
      if (!auth.user) return;
      
      // Get user ID from either id or _id (MongoDB ObjectId format)
      const userId = auth.user?.id || auth.user?._id;
      
      if (!userId) {
        console.error('User ID is missing from auth context');
        return;
      }
      
      setIsLoadingTrips(true);
      
      try {
        const response = await fetch(`/api/trips?userId=${userId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch trips: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.trips && Array.isArray(data.trips)) {
          setPlannedTrips(data.trips);
          console.log(`Loaded ${data.trips.length} trips from database`);
        }
      } catch (error) {
        console.error('Error fetching trips:', error);
      } finally {
        setIsLoadingTrips(false);
      }
    }
    
    fetchUserTrips();
  }, [auth.user]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  if (!auth.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to view your dashboard</h1>
          <button 
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const toggleInterest = (interestId: string) => {
    if (interests.includes(interestId)) {
      setInterests(interests.filter(id => id !== interestId));
    } else {
      setInterests([...interests, interestId]);
    }
  };

  const handleDestinationSearch = async () => {
    // This function is now handled directly in the MapView component
    // We're keeping this function as a placeholder for compatibility
    // The actual implementation is now in MapView.tsx
  };

  const addPlace = (place: Place) => {
    if (!selectedPlaces.find(p => p.id === place.id)) {
      setSelectedPlaces([...selectedPlaces, place]);
    }
  };

  const removePlace = (placeId: number | string) => {
    setSelectedPlaces(selectedPlaces.filter(place => place.id !== placeId));
  };

  const editTrip = (trip: Trip) => {
    setDestination(trip.destination);
    setStartDate(trip.startDate);
    setEndDate(trip.endDate);
    setTravelPace(trip.travelPace || 'balanced');
    setSelectedPlaces(trip.places);
    
    setEditingTripId(trip.id);
    
    const updatedTrips = plannedTrips.filter(t => t.id !== trip.id);
    setPlannedTrips(updatedTrips);
    
    setIsCreatingTrip(true);
    setActiveTab('planTrip');
  };

  const deleteTrip = async (tripId: string | number) => {
    try {
      // Remove trip from local state
      const updatedTrips = plannedTrips.filter(trip => trip.id !== tripId);
      setPlannedTrips(updatedTrips);
      
      // Delete from database
      const response = await fetch(`/api/trips?tripId=${tripId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete trip: ${response.status}`);
      }
      
      console.log('Trip deleted from database:', tripId);
    } catch (error) {
      console.error('Error deleting trip from database:', error);
      alert('Trip was removed from your view, but we encountered an error deleting it from the server.');
    }
  };

  const createTrip = async () => {
    if (!destination || !startDate || !endDate) {
      alert('Please fill in all required fields (destination, start date, and end date)');
      return;
    }

    // Debug the auth structure to find the user ID
    console.log("Auth structure:", JSON.stringify({
      user: auth.user ? {
        hasId: !!auth.user.id,
        has_id: !!auth.user._id,
        keys: Object.keys(auth.user)
      } : null
    }));

    // Get user ID from either id or _id (MongoDB ObjectId format)
    const userId = auth.user?.id || auth.user?._id;

    if (!userId) {
      console.error('User ID is missing from auth context');
      alert('You must be logged in to create a trip. Please log in again.');
      return;
    }

    // Organize selected places into daily itineraries
    const dailyItineraries = organizeItinerary(selectedPlaces, startDate, endDate);
    
    // Check if we're editing an existing trip or creating a new one
    const isEditing = !!editingTripId;
    
    // Create trip object, use existing ID if editing
    const tripData: Trip = {
      id: isEditing ? editingTripId : `trip-${Date.now()}`,
      destination,
      startDate,
      endDate,
      places: selectedPlaces,
      travelPace,
      dailyItineraries
    };

    // Pre-validate the data
    console.log(`${isEditing ? 'Updating' : 'Creating'} trip with data:`, {
      tripId: tripData.id,
      destination: tripData.destination,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      placesCount: tripData.places.length,
      daysPlanned: dailyItineraries.length,
      userId: userId
    });

    // ✅ Save trip in frontend state first
    setPlannedTrips([...plannedTrips, tripData]);

    // ✅ Save trip to MongoDB
    try {
      console.log(`Sending ${isEditing ? 'PUT' : 'POST'} request to /api/trips`);
      const response = await fetch('/api/trips', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...tripData,
          userId: userId, // Use the extracted userId
        }),
      });

      // Get the response data
      const result = await response.json();

      if (!response.ok) {
        // If we got an error response, throw it
        const errorMessage = result.error || 'Failed to save trip to database';
        console.error('Server error:', result);
        throw new Error(errorMessage);
      }

      console.log(`Trip ${isEditing ? 'updated' : 'saved'} to DB with ID:`, result.tripId);
      alert(`Trip ${isEditing ? 'updated' : 'created'} successfully!`);

      // Reset state after successful trip creation/update
      setDestination('');
      setStartDate('');
      setEndDate('');
      setTravelPace('balanced');
      setInterests([]);
      setSelectedPlaces([]);
      setIsCreatingTrip(false);
      setEditingTripId(null); // Clear the editing state
      setActiveTab('myTrips');
    } catch (err) {
      console.error(`Error ${isEditing ? 'updating' : 'saving'} trip to database:`, err);
      
      // Keep the trip in frontend state but inform the user about the backend error
      alert(`Your trip was ${isEditing ? 'updated' : 'created'} locally, but we encountered an error saving it to the server. Please try again later.`);
    }
  };
  

  const viewTripOnMap = (trip: Trip) => {
    // Set the active tab to map view
    setActiveTab('map');
    
    // Set map center based on the first place in the trip
    setMapCenter(trip.places[0]?.location || { lat: 40.7128, lng: -74.0060 });
    setMapZoom(12);
    
    // Set the destination text field to show the trip's destination
    setDestination(trip.destination);
    
    // Set the selected places
    setSelectedPlaces(trip.places);
    
    // Set the trip dates
    if (trip.startDate) {
      setStartDate(trip.startDate);
    }
    
    if (trip.endDate) {
      setEndDate(trip.endDate);
    }
    
    // Track that we're editing this specific trip
    setEditingTripId(trip.id);
    
    // If the trip has saved daily itineraries, use them
    // Otherwise, we'll generate them in the MapView component
    if (trip.dailyItineraries && trip.dailyItineraries.length > 0) {
      console.log('Loading saved daily itineraries:', trip.dailyItineraries.length);
    }
    
    // Infer interests based on place types in the trip
    const tripPlaceTypes = trip.places
      .map(place => place.type?.toLowerCase())
      .filter(Boolean) as string[];
    
    // Map of place types to interest categories
    const typeToInterestMap: Record<string, string> = {
      // History & Culture
      'museum': 'history', 'historic': 'history', 'landmark': 'history', 
      'monument': 'history', 'heritage': 'history', 'gallery': 'history',
      
      // Food & Dining
      'restaurant': 'food', 'cafe': 'food', 'bakery': 'food', 
      'dining': 'food', 'eatery': 'food', 'cuisine': 'food',
      
      // Nature & Outdoors
      'park': 'nature', 'garden': 'nature', 'mountain': 'nature', 
      'beach': 'nature', 'lake': 'nature', 'forest': 'nature',
      
      // Shopping
      'shopping_mall': 'shopping', 'store': 'shopping', 'market': 'shopping',
      'shop': 'shopping', 'boutique': 'shopping', 'mall': 'shopping',
      
      // Nightlife
      'bar': 'nightlife', 'club': 'nightlife', 'lounge': 'nightlife',
      'pub': 'nightlife', 'casino': 'nightlife', 'nightclub': 'nightlife',
      
      // Adventure
      'amusement_park': 'adventure', 'theme_park': 'adventure', 'water_park': 'adventure',
      'zoo': 'adventure', 'tour': 'adventure', 'activity': 'adventure',
      
      // Relaxation
      'spa': 'relaxation', 'hot_spring': 'relaxation', 'resort': 'relaxation',
      'wellness': 'relaxation', 'beach_resort': 'relaxation', 'lodging': 'relaxation',
      
      // Family-Friendly
      'playground': 'family', 'children': 'family', 'family': 'family',
      'kids': 'family', 'education': 'family', 'fun': 'family'
    };
    
    // Infer interests based on place types
    const inferredInterests = new Set<string>();
    
    tripPlaceTypes.forEach(type => {
      if (type && typeToInterestMap[type]) {
        inferredInterests.add(typeToInterestMap[type]);
      }
      
      // Also check if the type contains any of our interest keywords
      Object.entries(typeToInterestMap).forEach(([keyword, interest]) => {
        if (type && type.includes(keyword)) {
          inferredInterests.add(interest);
        }
      });
    });
    
    // Set the interests based on what we inferred from the places
    if (inferredInterests.size > 0) {
      setInterests([...inferredInterests]);
    }
  };

  return (
    <div className="min-h-screen text-gray-800 bg-gray-50">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        setIsCreatingTrip={setIsCreatingTrip} 
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView 
            user={auth.user}
            plannedTrips={plannedTrips}
            setActiveTab={setActiveTab}
            setIsCreatingTrip={setIsCreatingTrip}
            viewTripOnMap={viewTripOnMap}
          />
        )}

        {activeTab === 'map' && (
          <MapView 
            destination={destination}
            setDestination={setDestination}
            selectedPlaces={selectedPlaces}
            removePlace={removePlace}
            interests={interests}
            toggleInterest={toggleInterest}
            interestOptions={interestOptions}
            recommendedPlaces={recommendedPlaces}
            addPlace={addPlace}
            handleDestinationSearch={handleDestinationSearch}
            setActiveTab={setActiveTab}
            setIsCreatingTrip={setIsCreatingTrip}
            startDate={startDate}
            endDate={endDate}
            initialDailyItineraries={plannedTrips.find(trip => 
              trip.destination === destination && trip.startDate === startDate && trip.endDate === endDate
            )?.dailyItineraries}
            isEditing={editingTripId !== null}
          />
        )}

        {activeTab === 'myTrips' && (
          <TripsView 
            plannedTrips={plannedTrips}
            viewTripOnMap={viewTripOnMap}
            setActiveTab={setActiveTab}
            setIsCreatingTrip={setIsCreatingTrip}
            editTrip={editTrip}
            deleteTrip={deleteTrip}
            isLoading={isLoadingTrips}
          />
        )}

        {activeTab === 'planTrip' && isCreatingTrip && (
          <PlanTripView 
            destination={destination}
            setDestination={setDestination}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            travelPace={travelPace}
            setTravelPace={setTravelPace}
            interests={interests}
            interestOptions={interestOptions}
            toggleInterest={toggleInterest}
            selectedPlaces={selectedPlaces}
            removePlace={removePlace}
            createTrip={createTrip}
            setIsCreatingTrip={setIsCreatingTrip}
            setActiveTab={setActiveTab}
          />
        )}
      </div>
    </div>
  );
}