import { NextResponse } from 'next/server';
import { placesApiConfigured, placesApiKey, placesApiRequest } from '@/lib/googlePlaces';

interface AutocompleteResponse {
  suggestions?: Array<{
    placePrediction?: {
      placeId?: string;
      text?: { text?: string };
      structuredFormat?: {
        mainText?: { text?: string };
        secondaryText?: { text?: string };
      };
    };
  }>;
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('query')?.trim();

  if (!query) return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  if (!placesApiConfigured()) {
    return NextResponse.json({ error: 'Google Places is not configured. Add GOOGLE_PLACES_API to .env.local.' }, { status: 503 });
  }

  try {
    const data = await placesApiRequest<AutocompleteResponse>('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': placesApiKey() as string,
        'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat'
      },
      body: JSON.stringify({ input: query, includedPrimaryTypes: ['(cities)'] })
    });

    const suggestions = (data.suggestions || [])
      .map(({ placePrediction }) => {
        if (!placePrediction?.placeId) return null;
        const description = placePrediction.text?.text || placePrediction.structuredFormat?.mainText?.text || '';
        return {
          placeId: placePrediction.placeId,
          mainText: placePrediction.structuredFormat?.mainText?.text || description,
          secondaryText: placePrediction.structuredFormat?.secondaryText?.text || '',
          description
        };
      })
      .filter(Boolean);

    return NextResponse.json({ suggestions });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown Places API error';
    console.error('Places Autocomplete (New) failed:', details);
    return NextResponse.json({ error: 'Places search failed. Confirm Places API (New) is enabled and the server key allows it.', details }, { status: 502 });
  }
}
