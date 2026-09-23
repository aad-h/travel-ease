import { NextRequest, NextResponse } from 'next/server';
import { generateItinerary, type PlannerRequest } from '@/lib/planner';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Partial<PlannerRequest>;

    if (!body.destination || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: 'Destination, start date, and end date are required.' },
        { status: 400 }
      );
    }

    if (!body.preferences || !Array.isArray(body.places) || !Array.isArray(body.interests)) {
      return NextResponse.json(
        { error: 'Preferences, places, and interests must be provided.' },
        { status: 400 }
      );
    }

    const travelers = Number(body.preferences.travelers);
    const budget = body.preferences.budget === undefined || body.preferences.budget === null
      ? undefined
      : Number(body.preferences.budget);

    if (!Number.isInteger(travelers) || travelers < 1 || travelers > 20) {
      return NextResponse.json({ error: 'Travelers must be between 1 and 20.' }, { status: 400 });
    }

    if (budget !== undefined && (!Number.isFinite(budget) || budget < 0 || budget > 1_000_000)) {
      return NextResponse.json({ error: 'Budget must be a valid positive amount.' }, { status: 400 });
    }

    const result = generateItinerary({
      destination: body.destination,
      startDate: body.startDate,
      endDate: body.endDate,
      travelPace: body.travelPace || 'balanced',
      interests: body.interests,
      places: body.places,
      preferences: {
        ...body.preferences,
        travelers,
        budget
      }
    } as PlannerRequest);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to generate an itinerary.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
