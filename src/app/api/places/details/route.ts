import { NextResponse } from 'next/server';
import { placesApiConfigured, placesApiKey, placesApiRequest } from '@/lib/googlePlaces';

interface PlaceDetailsResponse {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  userRatingCount?: number;
  types?: string[];
  websiteUri?: string;
}

export async function GET(request: Request) {
  const placeId = new URL(request.url).searchParams.get('placeId');
  if (!placeId) return NextResponse.json({ error: 'Place ID parameter is required' }, { status: 400 });
  if (!placesApiConfigured()) return NextResponse.json({ error: 'Google Places is not configured. Add GOOGLE_PLACES_API to .env.local.' }, { status: 503 });

  try {
    const data = await placesApiRequest<PlaceDetailsResponse>(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': placesApiKey() as string,
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,rating,userRatingCount,types,websiteUri'
      }
    });

    if (data.location?.latitude === undefined || data.location.longitude === undefined) {
      return NextResponse.json({ error: 'Place details did not include a location.' }, { status: 404 });
    }

    return NextResponse.json({ placeDetails: {
      id: data.id,
      name: data.displayName?.text || 'Unnamed place',
      address: data.formattedAddress || '',
      location: { lat: data.location.latitude, lng: data.location.longitude },
      rating: data.rating || null,
      userRatingsTotal: data.userRatingCount || 0,
      types: data.types || [],
      website: data.websiteUri || '',
      reviews: [],
      photos: []
    } });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown Places API error';
    console.error('Place Details (New) failed:', details);
    return NextResponse.json({ error: 'Place details failed. Confirm Places API (New) is enabled and the server key allows it.', details }, { status: 502 });
  }
}
