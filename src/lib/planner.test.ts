import test from 'node:test';
import assert from 'node:assert/strict';
import { generateItinerary, retrievePlanningGuidance, scorePlace, type PlannerRequest } from './planner.ts';

const baseRequest: PlannerRequest = {
  destination: 'Portland',
  startDate: '2026-10-01',
  endDate: '2026-10-02',
  travelPace: 'balanced',
  interests: ['food', 'nature'],
  preferences: {
    budget: 600,
    currency: 'USD',
    travelers: 2,
    hotelName: 'Downtown hotel',
    hotelAddress: 'Downtown Portland',
    hotelLocation: { lat: 45.52, lng: -122.68 },
    dailyStartTime: '09:00',
    dailyEndTime: '20:00',
    hiddenGems: true
  },
  places: []
};

const hiddenCafe = {
  id: 'cafe',
  name: 'Neighborhood Cafe',
  type: 'cafe',
  rating: 4.8,
  userRatingsTotal: 120,
  priceLevel: 1,
  location: { lat: 45.521, lng: -122.681 }
};

const famousMall = {
  id: 'mall',
  name: 'Famous Shopping Mall',
  type: 'shopping_mall',
  rating: 4.2,
  userRatingsTotal: 12000,
  priceLevel: 3,
  location: { lat: 45.6, lng: -122.8 }
};

test('hidden-gem and interest signals improve place ranking', () => {
  assert.ok(scorePlace(hiddenCafe, baseRequest) > scorePlace(famousMall, baseRequest));
});

test('planner distributes stops across dates and creates safe external links', () => {
  const places = [hiddenCafe, famousMall, {
    id: 'park',
    name: 'River Park',
    type: 'park',
    rating: 4.5,
    userRatingsTotal: 300,
    location: { lat: 45.53, lng: -122.67 }
  }];
  const result = generateItinerary({ ...baseRequest, places });

  assert.equal(result.dailyItineraries.length, 2);
  assert.equal(result.dailyItineraries.flatMap(day => day.places).length, 3);
  assert.equal(result.dailyItineraries[0].estimatedBudget, 300);
  const firstStop = result.dailyItineraries.flatMap(day => day.stops || [])[0];
  assert.match(firstStop.mapsUrl, /^https:\/\/www\.google\.com\/maps\/search/);
  assert.match(firstStop.bookingUrl, /^https:\/\/www\.google\.com\/search/);
});

test('retrieval returns budget and official-booking guidance without an external service', () => {
  const guidance = retrievePlanningGuidance(baseRequest, 6);
  assert.ok(guidance.some(item => item.toLowerCase().includes('budget')));
  assert.ok(guidance.some(item => item.toLowerCase().includes('official')));
});

test('planner rejects reversed dates', () => {
  assert.throws(() => generateItinerary({
    ...baseRequest,
    startDate: '2026-10-03',
    endDate: '2026-10-01'
  }), /invalid/i);
});
