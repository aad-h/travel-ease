import { NextResponse } from 'next/server';

// Use the Routes API key instead of Directions API
const GOOGLE_ROUTES_API_KEY = process.env.GOOGLE_ROUTES_API;

// Define the interface for the request body
interface RouteRequestBody {
  origin: {
    location: { latLng: { latitude: number; longitude: number } }
  };
  destination: {
    location: { latLng: { latitude: number; longitude: number } }
  };
  travelMode: string;
  routingPreference: string;
  computeAlternativeRoutes: boolean;
  routeModifiers: {
    avoidTolls: boolean;
    avoidHighways: boolean;
    avoidFerries: boolean;
  };
  languageCode: string;
  units: string;
  intermediates?: Array<{
    location: { latLng: { latitude: number; longitude: number } }
  }>;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const waypoints = searchParams.get('waypoints');
  const mode = searchParams.get('mode') || 'driving';
  
  if (!origin || !destination) {
    return NextResponse.json({ error: 'Origin and destination parameters are required' }, { status: 400 });
  }

  if (!GOOGLE_ROUTES_API_KEY) {
    console.error('Google Routes API key is not defined in environment variables');
    return NextResponse.json({ error: 'API configuration error' }, { status: 500 });
  }
  
  try {
    // Parse origin and destination
    const [originLat, originLng] = origin.split(',').map(Number);
    const [destLat, destLng] = destination.split(',').map(Number);
    
    // Prepare intermediate waypoints if any
    const intermediatePoints = [];
    if (waypoints) {
      const waypointArray = waypoints.split('|');
      for (const waypoint of waypointArray) {
        const [lat, lng] = waypoint.split(',').map(Number);
        intermediatePoints.push({
          location: { latLng: { latitude: lat, longitude: lng } }
        });
      }
    }
    
    // Build the Routes API request body
    const requestBody: RouteRequestBody = {
      origin: {
        location: { latLng: { latitude: originLat, longitude: originLng } }
      },
      destination: {
        location: { latLng: { latitude: destLat, longitude: destLng } }
      },
      travelMode: mode === 'driving' ? 'DRIVE' : 'WALK',
      routingPreference: 'TRAFFIC_AWARE',
      computeAlternativeRoutes: false,
      routeModifiers: {
        avoidTolls: false,
        avoidHighways: false,
        avoidFerries: false
      },
      languageCode: 'en-US',
      units: 'IMPERIAL'
    };
    
    // Add intermediate waypoints if they exist
    if (intermediatePoints.length > 0) {
      requestBody.intermediates = intermediatePoints;
    }
    
    console.log(`Computing route from (${originLat},${originLng}) to (${destLat},${destLng}) with ${intermediatePoints.length} waypoints`);
    
    // Make the request to the Routes API
    const response = await fetch(
      `https://routes.googleapis.com/directions/v2:computeRoutes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_ROUTES_API_KEY,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'
        },
        body: JSON.stringify(requestBody)
      }
    );
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Google Routes API error:', response.status, errorData);
      return NextResponse.json({ 
        error: `Google Routes API error: ${response.status}`, 
        details: errorData 
      }, { status: 500 });
    }
    
    const data = await response.json();
    
    if (!data.routes || data.routes.length === 0) {
      console.error('No routes found in Google Routes API response');
      return NextResponse.json({ 
        error: 'No routes found', 
        details: 'The Routes API did not return any valid routes' 
      }, { status: 404 });
    }
    
    // Process the routes data to a format compatible with our map component
    const polyline = data.routes[0].polyline?.encodedPolyline;
    
    // Process and convert the Routes API response to a format similar to what our frontend expects
    const processedDirections = {
      status: 'OK',
      routes: [{
        overview_polyline: { points: polyline },
        legs: [{
          distance: { value: data.routes[0].distanceMeters, text: `${Math.round(data.routes[0].distanceMeters / 1609.34)} mi` },
          duration: { value: parseInt(data.routes[0].duration.replace('s', '')) * 1000, text: formatDuration(data.routes[0].duration) },
          steps: [] // We don't get detailed steps from the basic Routes API
        }],
        waypoint_order: []
      }],
      request: {
        origin: { location: { lat: originLat, lng: originLng } },
        destination: { location: { lat: destLat, lng: destLng } },
        travelMode: mode.toUpperCase()
      }
    };
    
    return NextResponse.json({ directions: processedDirections });
    
  } catch (error) {
    console.error('Error computing route:', error);
    return NextResponse.json({ 
      error: 'Failed to compute route',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper function to format duration string
function formatDuration(duration: string): string {
  // Parse duration like "3600s" to "1 hour"
  const seconds = parseInt(duration.replace('s', ''));
  
  if (seconds < 60) {
    return `${seconds} sec`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const remainingMinutes = Math.floor((seconds % 3600) / 60);
    
    if (remainingMinutes === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} min`;
    }
  }
} 