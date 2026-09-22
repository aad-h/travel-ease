'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useJsApiLoader, GoogleMap as GoogleMapComponent, Marker, InfoWindow, Polyline } from '@react-google-maps/api';

const libraries = ['places'];
const mapContainerStyle = { width: '100%', height: '100%' };
const center = { lat: 37.7749, lng: -122.4194 }; // San Francisco

interface GoogleMapProps {
  waypoints?: Array<{
    location: { lat: number; lng: number };
    name: string;
  }>;
  date?: string;
}

interface DirectionsResult {
  routes: any[];
  geocoded_waypoints?: any[];
  status?: string;
  request: {
    origin: { location: { lat: number, lng: number } };
    destination: { location: { lat: number, lng: number } };
    travelMode: string;
  };
}

export default function GoogleMapView({ waypoints = [], date }: GoogleMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_JSMAP_API || '',
    libraries: libraries as any,
  });

  const [activeMarker, setActiveMarker] = useState<number | null>(null);
  const [directions, setDirections] = useState<DirectionsResult | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [routePath, setRoutePath] = useState<google.maps.LatLngLiteral[]>([]);
  const [mapZoom, setMapZoom] = useState<number>(12);
  
  // Keep track of the previous date to detect changes
  const prevDateRef = useRef<string | undefined>(date);
  // Keep track of whether routes are currently being fetched
  const isFetchingRef = useRef<boolean>(false);

  // Function to decode polyline from Google
  const decodePolyline = useCallback((encoded: string): google.maps.LatLngLiteral[] => {
    if (!encoded) return [];
    
    const poly = [];
    let index = 0, lat = 0, lng = 0;

    while (index < encoded.length) {
      let b, shift = 0, result = 0;
      
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;
      
      shift = 0;
      result = 0;
      
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;
      
      poly.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }
    
    return poly;
  }, []);

  // Function to clear all route data
  const clearRoutes = useCallback(() => {
    console.log('Clearing all routes and direction data');
    setDirections(null);
    setRoutePath([]);
    setActiveMarker(null);
  }, []);

  // Function to fetch directions using Google Routes API
  const fetchDirections = useCallback(async () => {
    if (!waypoints || waypoints.length < 2) {
      clearRoutes();
      return;
    }

    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      console.log('Already fetching directions, skipping duplicate request');
      return;
    }

    isFetchingRef.current = true;
    setError(null);
    
    try {
      console.log(`Fetching directions for ${waypoints.length} waypoints on date: ${date}`);
      
      // Build waypoints parameter string
      const origin = `${waypoints[0].location.lat},${waypoints[0].location.lng}`;
      const destination = `${waypoints[waypoints.length - 1].location.lat},${waypoints[waypoints.length - 1].location.lng}`;
      
      let waypointsParam = '';
      if (waypoints.length > 2) {
        waypointsParam = '&waypoints=' + waypoints.slice(1, -1)
          .map(wp => `${wp.location.lat},${wp.location.lng}`)
          .join('|');
      }

      // Make request to our internal API that proxies to Google Routes API
      const response = await fetch(
        `/api/directions?origin=${origin}&destination=${destination}${waypointsParam}&mode=driving`
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // If we have a directions response, set it
      if (data.directions) {
        const polyline = data.directions.routes[0]?.overview_polyline?.points;
        if (polyline) {
          const decodedPath = decodePolyline(polyline);
          setRoutePath(decodedPath);
        }
        setDirections(data.directions);
      }
    } catch (err) {
      console.error('Error fetching directions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch directions');
      // Also clear routes on error
      clearRoutes();
    } finally {
      isFetchingRef.current = false;
    }
  }, [waypoints, decodePolyline, clearRoutes, date]);

  // Reset directions when date changes - with more thorough cleanup
  useEffect(() => {
    // Check if date has actually changed
    if (date !== prevDateRef.current) {
      console.log(`Date changed from ${prevDateRef.current} to ${date}, clearing routes`);
      
      // Clear all routes completely first
      clearRoutes();
      
      // Update the ref
      prevDateRef.current = date;
    }
  }, [date, clearRoutes]);

  // Fetch directions when waypoints change or date changes
  useEffect(() => {
    if (isLoaded && waypoints.length >= 2) {
      // Add a small delay to ensure clearing happens first
      const timer = setTimeout(() => {
        fetchDirections();
      }, 50);
      
      return () => clearTimeout(timer);
    } else {
      // Clear previous directions if not enough waypoints
      clearRoutes();
    }
  }, [isLoaded, waypoints, fetchDirections, clearRoutes]);

  // Fit bounds to include all waypoints when they change
  useEffect(() => {
    if (mapInstance && waypoints.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      
      waypoints.forEach(waypoint => {
        bounds.extend(waypoint.location);
      });
      
      mapInstance.fitBounds(bounds);
      
      // If we only have one waypoint, set an appropriate zoom level
      if (waypoints.length === 1) {
        mapInstance.setZoom(15);
        setMapZoom(15);
      }
    }
  }, [mapInstance, waypoints]);

  const handleZoomIn = useCallback(() => {
    if (mapInstance) {
      const newZoom = Math.min((mapInstance.getZoom() || 12) + 1, 20);
      mapInstance.setZoom(newZoom);
      setMapZoom(newZoom);
    }
  }, [mapInstance]);

  const handleZoomOut = useCallback(() => {
    if (mapInstance) {
      const newZoom = Math.max((mapInstance.getZoom() || 12) - 1, 3);
      mapInstance.setZoom(newZoom);
      setMapZoom(newZoom);
    }
  }, [mapInstance]);

  const handleFitBounds = useCallback(() => {
    if (mapInstance && waypoints.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      waypoints.forEach(wp => bounds.extend(wp.location));
      mapInstance.fitBounds(bounds);
    }
  }, [mapInstance, waypoints]);

  if (loadError) {
    return <div className="p-4 text-red-600 text-center">Error loading Google Maps: {loadError.message}</div>;
  }

  if (!isLoaded) {
    return <div className="p-4 text-center">Loading map...</div>;
  }

  return (
    <div className="h-full relative">
      {date && (
        <div className="absolute top-3 left-3 z-10 bg-white px-3 py-1 rounded shadow text-sm font-medium">
          Itinerary for {new Date(date).toLocaleDateString()}
        </div>
      )}
      
      {error && (
        <div className="absolute top-3 right-3 z-10 bg-red-100 text-red-800 px-3 py-1 rounded shadow text-sm">
          {error}
        </div>
      )}
      
      <GoogleMapComponent
        mapContainerStyle={mapContainerStyle}
        center={waypoints.length > 0 ? waypoints[0].location : center}
        zoom={waypoints.length > 0 ? mapZoom : 12}
        options={{
          fullscreenControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          gestureHandling: 'cooperative',
          clickableIcons: true,
          zoomControl: false, // We'll add our own zoom controls
          draggableCursor: 'move', // Set default cursor for map
        }}
        onLoad={(map) => setMapInstance(map)}
      >
        {/* Add custom markers with numbers */}
        {waypoints.map((waypoint, index) => (
          <Marker 
            key={`waypoint-${index}-${date || 'nodate'}`}
            position={waypoint.location}
            label={{
              text: (index + 1).toString(),
              color: '#FFFFFF',
              fontWeight: 'bold'
            }}
            onClick={() => setActiveMarker(index)}
            // Make markers more interactive with animations
            animation={google.maps.Animation.DROP}
            options={{
              cursor: 'pointer', // Ensure cursor changes on hover
            }}
          />
        ))}
        
        {/* Show info window for active marker */}
        {activeMarker !== null && waypoints[activeMarker] && (
          <InfoWindow
            position={waypoints[activeMarker].location}
            onCloseClick={() => setActiveMarker(null)}
            options={{
              pixelOffset: new google.maps.Size(0, -35),
            }}
          >
            <div className="p-2">
              <p className="font-medium">{waypoints[activeMarker].name}</p>
              <p className="text-xs text-gray-600">Stop #{activeMarker + 1}</p>
            </div>
          </InfoWindow>
        )}
        
        {/* Render the route path using Polyline */}
        {routePath.length > 0 && (
          <Polyline
            path={routePath}
            options={{
              strokeColor: '#4285F4', // Google blue
              strokeWeight: 5,
              strokeOpacity: 0.8,
              clickable: true, // Make the polyline clickable
            }}
          />
        )}
      </GoogleMapComponent>
      
      {/* Custom map controls with proper hover effects */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        <button 
          onClick={handleZoomIn}
          className="bg-white w-8 h-8 rounded-full shadow flex items-center justify-center hover:bg-gray-100 cursor-pointer transition-colors"
          aria-label="Zoom in"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M10 5a1 1 0 0 1 1 1v3h3a1 1 0 1 1 0 2h-3v3a1 1 0 1 1-2 0v-3H6a1 1 0 1 1 0-2h3V6a1 1 0 0 1 1-1Z" clipRule="evenodd" />
          </svg>
        </button>
        <button 
          onClick={handleZoomOut}
          className="bg-white w-8 h-8 rounded-full shadow flex items-center justify-center hover:bg-gray-100 cursor-pointer transition-colors"
          aria-label="Zoom out"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M4 10a1 1 0 0 1 1-1h10a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1Z" clipRule="evenodd" />
          </svg>
        </button>
        <button 
          onClick={handleFitBounds}
          className="bg-white w-8 h-8 rounded-full shadow flex items-center justify-center hover:bg-gray-100 cursor-pointer transition-colors"
          aria-label="Fit all waypoints"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 0 0 1.06.053L16.5 4.44v2.81a.75.75 0 0 0 1.5 0v-4.5a.75.75 0 0 0-.75-.75h-4.5a.75.75 0 0 0 0 1.5h2.553l-9.056 8.194a.75.75 0 0 0-.053 1.06Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}