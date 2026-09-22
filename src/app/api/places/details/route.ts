import { NextResponse } from 'next/server';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get('placeId');
  
  if (!placeId) {
    return NextResponse.json({ error: 'Place ID parameter is required' }, { status: 400 });
  }
  
  if (!GOOGLE_PLACES_API_KEY) {
    console.error('Google Places API key is not defined in environment variables');
    return NextResponse.json({ error: 'API configuration error' }, { status: 500 });
  }
  
  try {
    const apiUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    
    apiUrl.searchParams.append('place_id', placeId);
    apiUrl.searchParams.append('fields', 'geometry,formatted_address,name,rating,reviews,types,photos');
    apiUrl.searchParams.append('key', GOOGLE_PLACES_API_KEY);
    
    console.log('Fetching details for placeId:', placeId);
    
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
    console.log('Details API response:', data);
    
    if (data.status && data.status !== 'OK') {
      console.error('Google Places API error:', data.status, data.error_message);
      return NextResponse.json({ 
        error: `Google API error: ${data.status}`,
        details: data.error_message 
      }, { status: 500 });
    }
    
    if (!data.result) {
      return NextResponse.json({ error: 'Place details not found' }, { status: 404 });
    }
    
    const placeDetails = {
      name: data.result.name,
      address: data.result.formatted_address,
      location: {
        lat: data.result.geometry.location.lat,
        lng: data.result.geometry.location.lng
      },
      rating: data.result.rating || null,
      reviews: data.result.reviews || [],
      types: data.result.types || [],
      photos: data.result.photos ? data.result.photos.map((photo: any) => ({
        reference: photo.photo_reference,
        width: photo.width,
        height: photo.height
      })) : []
    };
    
    return NextResponse.json({ placeDetails });
  } catch (error) {
    console.error('Error fetching place details:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch place details',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 