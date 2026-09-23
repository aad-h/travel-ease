export interface User {
    id?: string;
    _id?: string;
    email?: string;
    name?: string;
    googleId?: string;
    picture?: string;
    emailVerified?: boolean;
    createdAt?: Date;
  };

export interface Place {
  id: number | string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  rating?: number;
  type?: string;
  types?: string[];
  userRatingsTotal?: number;
  priceLevel?: number;
  address?: string;
  photo?: string | null;
  website?: string;
}

export interface ItineraryStop {
  time: string;
  place: Place;
  reason: string;
  estimatedCost: number;
  mapsUrl: string;
  bookingUrl: string;
}

export interface DailyItinerary {
  date: string;
  places: Place[];
  title?: string;
  estimatedBudget?: number;
  stops?: ItineraryStop[];
}

export interface TripPreferences {
  budget?: number;
  currency: string;
  travelers: number;
  hotelName?: string;
  hotelAddress?: string;
  hotelLocation?: {
    lat: number;
    lng: number;
  };
  dailyStartTime: string;
  dailyEndTime: string;
  dietaryPreferences?: string;
  accessibilityNeeds?: string;
  notes?: string;
  hiddenGems: boolean;
}

export interface Trip {
  id: number | string;
  destination: string;
  startDate: string;
  endDate: string;
  places: Place[];
  travelPace?: string;
  interests?: string[];
  preferences?: TripPreferences;
  dailyItineraries?: DailyItinerary[];
  planningGuidance?: string[];
}

export interface InterestOption {
  id: string;
  label: string;
}
