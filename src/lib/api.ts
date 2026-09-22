const GOOGLE_API_KEY = process.env.GOOGLE_MAP_API || 'YOUR_GOOGLE_API_KEY'; 

export async function fetchPlaceSuggestions(query: string, types: string = 'locality,country') {
  if (!query || query.length < 2) return [];
  
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=${types}&key=${GOOGLE_API_KEY}`,
      { 
        headers: {
          'Content-Type': 'application/json'
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.predictions.map((prediction: any) => ({
      placeId: prediction.place_id,
      mainText: prediction.structured_formatting.main_text,
      secondaryText: prediction.structured_formatting.secondary_text,
      description: prediction.description
    }));
  } catch (error) {
    console.error('Error fetching place suggestions:', error);
    return [];
  }
}

export async function fetchPlaceDetails(placeId: string) {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address,name&key=${GOOGLE_API_KEY}`,
      { 
        headers: {
          'Content-Type': 'application/json'
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK' || !data.result) {
      throw new Error('Place details not found');
    }
    
    return {
      name: data.result.name,
      address: data.result.formatted_address,
      location: {
        lat: data.result.geometry.location.lat,
        lng: data.result.geometry.location.lng
      }
    };
  } catch (error) {
    console.error('Error fetching place details:', error);
    return null;
  }
} 