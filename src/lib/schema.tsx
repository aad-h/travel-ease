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
  address?: string;
  photo?: string | null;
}

export interface DailyItinerary {
  date: string;
  places: Place[];
}

export interface Trip {
  id: number | string;
  destination: string;
  startDate: string;
  endDate: string;
  places: Place[];
  travelPace?: string;
  dailyItineraries?: DailyItinerary[];
}

export interface InterestOption {
  id: string;
  label: string;
}