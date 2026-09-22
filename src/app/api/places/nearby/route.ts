import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API;

// Helper function to fetch the places from Google Places API
async function fetchPlacesFromGoogle(url: string) {
  try {
    console.log(`Fetching places from Google API: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Google Places API error: ${response.status} ${response.statusText}`);
      return { error: `API error: ${response.status}` };
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error(`Google Places API status error: ${data.status}`, data.error_message);
      return { error: data.error_message || `API status: ${data.status}` };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching from Google Places API:', error);
    return { error: 'Failed to fetch places' };
  }
}

// Helper function to analyze if a place matches user interests based on reviews and types
function placeMatchesInterests(place: any, userInterests: string[]) {
  if (!userInterests || userInterests.length === 0) return true;
  
  let score = 0;
  
  // Check place types against common tourism categories
  const tourismTypes = [
    'tourist_attraction', 'museum', 'art_gallery', 'aquarium', 'amusement_park',
    'park', 'zoo', 'landmark', 'point_of_interest', 'natural_feature',
    'historic', 'monument', 'beach', 'shopping_mall', 'restaurant'
  ];
  
  if (place.types) {
    for (const type of place.types) {
      if (tourismTypes.includes(type)) {
        score += 1;
      }
    }
  }
  
  return score > 0;
}

export async function GET(request: NextRequest) {
  console.log('Starting nearby places search API request');
  const { searchParams } = new URL(request.url);
  
  // Fix: Parse location parameter (which comes as "lat,lng")
  const location = searchParams.get('location');
  // Parse types parameter (optional)
  const types = searchParams.get('types');
  const apiKey = process.env.GOOGLE_PLACES_API;
  
  console.log(`Parameters received - location: ${location}, types: ${types}`);
  
  if (!location || !location.includes(',')) {
    console.error('Missing or invalid location parameter');
    return NextResponse.json({ error: 'Missing or invalid location parameter. Format should be "lat,lng"' }, { status: 400 });
  }
  
  // Split the location parameter into lat and lng
  const [lat, lng] = location.split(',');
  
  if (!lat || !lng) {
    console.error('Invalid location format');
    return NextResponse.json({ error: 'Invalid location format. Should be "lat,lng"' }, { status: 400 });
  }
  
  if (!apiKey) {
    console.error('Google Places API key not configured');
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }
  
  // Parse user interests from types parameter, if provided
  const userInterests = types ? types.split(',') : [];
  console.log(`User interests/types: ${userInterests.join(', ') || 'None'}`);
  
  const radius = 8000; // 8km radius
  
  try {
    // First, basic search for tourist attractions - this ensures we always get some results
    const basicUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=tourist_attraction&key=${apiKey}`;
    const basicData = await fetchPlacesFromGoogle(basicUrl);
    
    if (basicData.error) {
      console.error('Error in basic search:', basicData.error);
      return NextResponse.json({ error: basicData.error }, { status: 500 });
    }
    
    console.log(`Basic search found ${basicData.results?.length || 0} places`);
    
    // Types to search based on common interests
    const searchTypes = ['tourist_attraction', 'museum', 'park', 'restaurant', 'shopping_mall'];
    
    // Add more specialized searches based on interests
    let allResults: any[] = [...(basicData.results || [])];
    
    // Always do basic search for tourist attractions and add these interest-based searches
    for (const type of searchTypes) {
      const typeUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${apiKey}`;
      const typeData = await fetchPlacesFromGoogle(typeUrl);
      
      if (!typeData.error && typeData.results) {
        console.log(`Found ${typeData.results.length} places for type: ${type}`);
        allResults = [...allResults, ...typeData.results];
      }
    }
    
    // If we still have zero results, try a broader keyword search
    if (allResults.length === 0) {
      console.log('No results found, trying keyword search');
      const keywordUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius * 1.5}&keyword=attraction&key=${apiKey}`;
      const keywordData = await fetchPlacesFromGoogle(keywordUrl);
      
      if (!keywordData.error && keywordData.results) {
        console.log(`Keyword search found ${keywordData.results.length} places`);
        allResults = [...allResults, ...keywordData.results];
      }
    }
    
    // Remove duplicates
    const uniqueResults = Array.from(
      new Map(allResults.map(place => [place.place_id, place])).values()
    );
    
    console.log(`Total unique places found: ${uniqueResults.length}`);
    
    // Process all places
    let processedPlaces = uniqueResults.map(place => {
      return {
        id: place.place_id,
        name: place.name,
        location: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng
        },
        address: place.vicinity,
        types: place.types || [],
        rating: place.rating || null,
        userRatingsTotal: place.user_ratings_total || 0,
        photo: place.photos?.[0]?.photo_reference 
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`
          : null,
      };
    });
    
    // Filter places that are more likely to be of interest to tourists
    const interestingPlaces = processedPlaces.filter(place => 
      placeMatchesInterests(place, userInterests)
    );
    
    console.log(`After filtering, returning ${interestingPlaces.length} interesting places`);
    
    // Return top results
    return NextResponse.json({ 
      places: interestingPlaces.slice(0, 30)
    });
    
  } catch (error) {
    console.error('Server error in nearby places:', error);
    return NextResponse.json({ error: 'Failed to fetch nearby places' }, { status: 500 });
  }
} 