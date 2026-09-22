import { NextResponse } from 'next/server';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  
  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  if (!GOOGLE_PLACES_API_KEY) {
    console.error('Google Places API key is not defined in environment variables');
    return NextResponse.json({ error: 'API configuration error' }, { status: 500 });
  }
  
  try {
    const apiUrl = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    
    apiUrl.searchParams.append('input', query);
    apiUrl.searchParams.append('types', '(cities)');
    apiUrl.searchParams.append('key', GOOGLE_PLACES_API_KEY);
    
    console.log('Fetching from Places API:', query);
    
    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const responseText = await response.text();
      console.error('Google API error:', response.status, responseText);
      return NextResponse.json({ 
        error: `Google API error: ${response.status}`, 
        details: responseText 
      }, { status: 500 });
    }
    
    const data = await response.json();
    console.log('API response:', data);
    
    if (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status, data.error_message);
      return NextResponse.json({ 
        error: `Google API error: ${data.status}`,
        details: data.error_message 
      }, { status: 500 });
    }
    
    let suggestions = [];
    if (data.predictions && Array.isArray(data.predictions)) {
      suggestions = data.predictions.map((prediction: any) => ({
        placeId: prediction.place_id,
        mainText: prediction.structured_formatting?.main_text || prediction.description,
        secondaryText: prediction.structured_formatting?.secondary_text || '',
        description: prediction.description
      }));
    }
    
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error fetching place suggestions:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch suggestions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 