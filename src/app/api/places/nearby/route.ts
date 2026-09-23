import { NextResponse } from 'next/server';
import { placesApiConfigured, placesApiKey, placesApiRequest } from '@/lib/googlePlaces';

interface NearbyResponse {
  places?: Array<{
    id?: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    location?: { latitude?: number; longitude?: number };
    rating?: number;
    userRatingCount?: number;
    priceLevel?: string;
    types?: string[];
    websiteUri?: string;
  }>;
}

const priceLevelMap: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4
};

// Nearby Search (New) accepts only requestable place types. Some legacy
// response-only types (for example natural_feature and hiking_area) must not
// be sent in includedTypes.
const requestableTypes = new Set([
  'aquarium', 'amusement_park', 'bar', 'bakery', 'cafe', 'casino',
  'department_store', 'landmark', 'market', 'museum', 'night_club',
  'park', 'restaurant', 'resort', 'shopping_mall', 'spa', 'tourist_attraction',
  'zoo'
]);

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const location = searchParams.get('location');
  const types = searchParams.get('types');
  if (!location || !location.includes(',')) return NextResponse.json({ error: 'Location must use the format "lat,lng".' }, { status: 400 });
  if (!placesApiConfigured()) return NextResponse.json({ error: 'Google Places is not configured. Add GOOGLE_PLACES_API to .env.local.' }, { status: 503 });

  const [latitude, longitude] = location.split(',').map(Number);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return NextResponse.json({ error: 'Location coordinates are invalid.' }, { status: 400 });

  const requestedTypes = (types || 'tourist_attraction')
    .split(',')
    .map(type => type.trim())
    .filter(Boolean);
  const includedTypes = requestedTypes.filter(type => requestableTypes.has(type)).slice(0, 20);
  if (includedTypes.length === 0) includedTypes.push('tourist_attraction');

  try {
    const data = await placesApiRequest<NearbyResponse>('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': placesApiKey() as string,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.types,places.websiteUri'
      },
      body: JSON.stringify({
        includedTypes,
        maxResultCount: 20,
        rankPreference: 'POPULARITY',
        locationRestriction: { circle: { center: { latitude, longitude }, radius: 8000 } }
      })
    });

    const places = (data.places || [])
      .filter(place => place.id && place.location?.latitude !== undefined && place.location?.longitude !== undefined)
      .map(place => ({
        id: place.id,
        name: place.displayName?.text || 'Unnamed place',
        location: { lat: place.location?.latitude as number, lng: place.location?.longitude as number },
        address: place.formattedAddress || '',
        types: place.types || [],
        type: place.types?.[0],
        rating: place.rating || null,
        userRatingsTotal: place.userRatingCount || 0,
        priceLevel: place.priceLevel ? priceLevelMap[place.priceLevel] : undefined,
        website: place.websiteUri || null,
        photo: null
      }));

    return NextResponse.json({ places });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown Places API error';
    console.error('Nearby Search (New) failed:', details);
    return NextResponse.json({ error: 'Nearby place search failed. Confirm Places API (New) is enabled and the server key allows it.', details }, { status: 502 });
  }
}
