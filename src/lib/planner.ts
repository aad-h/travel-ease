import type {
  DailyItinerary,
  ItineraryStop,
  Place,
  TripPreferences
} from './schema';
import { travelKnowledge } from './travelKnowledge.ts';

export interface PlannerRequest {
  destination: string;
  startDate: string;
  endDate: string;
  travelPace: string;
  interests: string[];
  places: Place[];
  preferences: TripPreferences;
}

export interface PlannerResult {
  dailyItineraries: DailyItinerary[];
  planningGuidance: string[];
  unplannedPlaces: Place[];
}

const interestKeywords: Record<string, string[]> = {
  history: ['museum', 'historic', 'history', 'culture', 'heritage', 'monument', 'gallery'],
  food: ['restaurant', 'cafe', 'bakery', 'food', 'market', 'dining'],
  nature: ['park', 'garden', 'nature', 'beach', 'trail', 'mountain'],
  shopping: ['shop', 'mall', 'market', 'store', 'boutique'],
  nightlife: ['bar', 'club', 'lounge', 'pub', 'night'],
  adventure: ['adventure', 'tour', 'zoo', 'aquarium', 'amusement'],
  relaxation: ['spa', 'wellness', 'resort', 'garden', 'beach'],
  family: ['family', 'children', 'playground', 'zoo', 'aquarium', 'museum']
};

const paceStops: Record<string, number> = {
  relaxed: 2,
  balanced: 3,
  packed: 4
};

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter(token => token.length > 1);
}

function tripDates(startDate: string, endDate: string): string[] {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    throw new Error('The trip dates are invalid.');
  }

  const dates: string[] = [];
  for (const date = new Date(start); date <= end; date.setUTCDate(date.getUTCDate() + 1)) {
    dates.push(date.toISOString().slice(0, 10));
  }

  if (dates.length > 31) {
    throw new Error('Trips are limited to 31 days.');
  }

  return dates;
}

function haversineKm(first: Place['location'], second: Place['location']): number {
  const radius = 6371;
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const latDistance = toRadians(second.lat - first.lat);
  const lngDistance = toRadians(second.lng - first.lng);
  const a = Math.sin(latDistance / 2) ** 2
    + Math.cos(toRadians(first.lat)) * Math.cos(toRadians(second.lat))
    * Math.sin(lngDistance / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimatedPlaceCost(place: Place): number {
  const priceLevelCosts = [0, 15, 35, 70, 120];
  if (typeof place.priceLevel === 'number') {
    return priceLevelCosts[Math.min(Math.max(place.priceLevel, 0), 4)];
  }
  return place.type?.includes('restaurant') || place.types?.includes('restaurant') ? 30 : 20;
}

export function scorePlace(place: Place, request: PlannerRequest): number {
  const searchable = tokenize(`${place.name} ${place.type || ''} ${(place.types || []).join(' ')}`);
  let score = (place.rating || 3.5) * 10;

  for (const interest of request.interests) {
    const matches = interestKeywords[interest] || [interest];
    if (matches.some(keyword => searchable.some(token => token.includes(keyword)))) {
      score += 25;
    }
  }

  if (request.preferences.hiddenGems) {
    const ratings = place.userRatingsTotal ?? 1000;
    if ((place.rating || 0) >= 4 && ratings <= 500) score += 25;
    if (ratings > 5000) score -= 8;
  }

  if (request.preferences.hotelLocation) {
    score -= Math.min(haversineKm(place.location, request.preferences.hotelLocation) * 1.5, 20);
  }

  const dates = tripDates(request.startDate, request.endDate);
  const totalBudget = request.preferences.budget || 0;
  if (totalBudget > 0) {
    const perPersonDay = totalBudget / request.preferences.travelers / dates.length;
    if (estimatedPlaceCost(place) > perPersonDay * 0.45) score -= 15;
  }

  return Math.round(score * 10) / 10;
}

function formatTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = Math.round(totalMinutes % 60);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${suffix}`;
}

function timeSlots(startTime: string, endTime: string, count: number): string[] {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  const safeEnd = end > start ? end : start + 8 * 60;
  const interval = (safeEnd - start) / Math.max(count, 1);
  return Array.from({ length: count }, (_, index) => formatTime(start + interval * index));
}

function reasonFor(place: Place, request: PlannerRequest): string {
  const searchable = tokenize(`${place.name} ${place.type || ''} ${(place.types || []).join(' ')}`);
  const matchedInterest = request.interests.find(interest =>
    (interestKeywords[interest] || [interest]).some(keyword =>
      searchable.some(token => token.includes(keyword))
    )
  );
  const hiddenGem = request.preferences.hiddenGems
    && (place.rating || 0) >= 4
    && (place.userRatingsTotal ?? 1000) <= 500;

  if (hiddenGem) return 'A well-rated, less-discovered stop that matches your hidden-gem preference.';
  if (matchedInterest) return `Selected because it matches your ${matchedInterest} interest.`;
  return 'A strong nearby candidate for a balanced day.';
}

function externalLinks(place: Place, destination: string) {
  const label = `${place.name} ${place.address || destination}`;
  return {
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label)}`,
    bookingUrl: place.website
      || `https://www.google.com/search?q=${encodeURIComponent(`${place.name} ${destination} official tickets reservations`)}`
  };
}

export function retrievePlanningGuidance(request: PlannerRequest, limit = 4): string[] {
  const queryTokens = new Set(tokenize([
    request.destination,
    request.travelPace,
    ...request.interests,
    request.preferences.hiddenGems ? 'hidden gems local' : '',
    request.preferences.hotelName ? 'hotel route distance' : '',
    request.preferences.dietaryPreferences || '',
    request.preferences.accessibilityNeeds ? 'accessibility mobility' : '',
    request.preferences.budget ? 'budget money cost' : '',
    request.preferences.notes || ''
  ].join(' ')));

  return travelKnowledge
    .map(entry => ({
      entry,
      score: entry.tags.reduce((total, tag) => total + (tag === 'all' || queryTokens.has(tag) ? 1 : 0), 0)
    }))
    .sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id))
    .slice(0, limit)
    .map(result => result.entry.guidance);
}

export function generateItinerary(request: PlannerRequest): PlannerResult {
  const dates = tripDates(request.startDate, request.endDate);
  const stopsPerDay = paceStops[request.travelPace] || paceStops.balanced;
  const capacity = dates.length * stopsPerDay;
  const rankedPlaces = [...request.places]
    .sort((first, second) => scorePlace(second, request) - scorePlace(first, request));
  const planned = rankedPlaces.slice(0, capacity);
  const unplannedPlaces = rankedPlaces.slice(capacity);
  const totalBudget = Math.max(request.preferences.budget || 0, 0);
  const dailyBudget = totalBudget > 0 ? Math.round(totalBudget / dates.length) : undefined;

  const dailyItineraries = dates.map((date, dayIndex): DailyItinerary => {
    const dayPlaces: Place[] = [];
    for (let offset = 0; offset < stopsPerDay; offset += 1) {
      const place = planned[dayIndex + offset * dates.length];
      if (place) dayPlaces.push(place);
    }
    const slots = timeSlots(
      request.preferences.dailyStartTime,
      request.preferences.dailyEndTime,
      dayPlaces.length
    );
    const stops: ItineraryStop[] = dayPlaces.map((place, index) => ({
      time: slots[index],
      place,
      reason: reasonFor(place, request),
      estimatedCost: estimatedPlaceCost(place) * request.preferences.travelers,
      ...externalLinks(place, request.destination)
    }));

    return {
      date,
      title: dayPlaces.length ? `Day ${dayIndex + 1} in ${request.destination}` : `Flexible day in ${request.destination}`,
      places: dayPlaces,
      estimatedBudget: dailyBudget,
      stops
    };
  });

  return {
    dailyItineraries,
    planningGuidance: retrievePlanningGuidance(request),
    unplannedPlaces
  };
}
