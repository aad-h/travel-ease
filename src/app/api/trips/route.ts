// src/app/api/trips/route.ts
import { NextRequest, NextResponse } from "next/server";
import { saveTrip, getUserTrips, deleteTrip, updateTrip } from "@/lib/mongodb/trips";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: "Missing required parameter: userId" }, { status: 400 });
    }

    console.log(`GET /api/trips - Fetching trips for user: ${userId}`);
    
    const result = await getUserTrips(userId);
    
    if (result.error) {
      console.error("Error fetching trips:", result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    return NextResponse.json({ trips: result.trips });
  } catch (error) {
    console.error("Error in GET trips API:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Log request being received
    console.log('POST /api/trips received');
    
    const body = await req.json();
    
    // Log body for debugging (be careful with sensitive data)
    console.log('Request body keys:', Object.keys(body));
    
    const {
      destination,
      startDate,
      endDate,
      places,
      travelPace,
      userId,
      dailyItineraries,
    } = body;
    
    // Log what we received to debug missing fields
    console.log('Trip data received:', {
      hasDestination: !!destination,
      hasStartDate: !!startDate,
      hasEndDate: !!endDate, 
      placesCount: places?.length,
      hasTravelPace: !!travelPace,
      hasUserId: !!userId,
      hasDailyItineraries: !!dailyItineraries
    });

    if (!userId) {
      return NextResponse.json({ error: "Missing required field: userId" }, { status: 400 });
    }
    
    if (!destination) {
      return NextResponse.json({ error: "Missing required field: destination" }, { status: 400 });
    }
    
    if (!startDate) {
      return NextResponse.json({ error: "Missing required field: startDate" }, { status: 400 });
    }
    
    if (!endDate) {
      return NextResponse.json({ error: "Missing required field: endDate" }, { status: 400 });
    }
    
    if (!places || !Array.isArray(places)) {
      return NextResponse.json({ error: "Missing or invalid places array" }, { status: 400 });
    }

    const result = await saveTrip({
      id: body.id || `trip-${Date.now()}`,
      destination,
      startDate,
      endDate,
      places,
      travelPace,
      dailyItineraries,
      userId,
    });

    if (result.error) {
      console.error("Error from MongoDB:", result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ message: "Trip saved", tripId: result.tripId }, { status: 201 });
  } catch (error) {
    console.error("Error in trip API:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Log request being received
    console.log('PUT /api/trips received - Updating trip');
    
    const body = await req.json();
    
    // Check that we have the trip ID
    if (!body.id) {
      return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });
    }
    
    const {
      id,
      destination,
      startDate,
      endDate,
      places,
      travelPace,
      userId,
      dailyItineraries,
    } = body;
    
    // Log what we received
    console.log('Trip update data received:', {
      tripId: id,
      hasDestination: !!destination,
      hasStartDate: !!startDate,
      hasEndDate: !!endDate, 
      placesCount: places?.length,
      hasTravelPace: !!travelPace,
      hasUserId: !!userId,
      hasDailyItineraries: !!dailyItineraries
    });

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ error: "Missing required field: userId" }, { status: 400 });
    }
    
    if (!destination) {
      return NextResponse.json({ error: "Missing required field: destination" }, { status: 400 });
    }
    
    if (!startDate) {
      return NextResponse.json({ error: "Missing required field: startDate" }, { status: 400 });
    }
    
    if (!endDate) {
      return NextResponse.json({ error: "Missing required field: endDate" }, { status: 400 });
    }
    
    if (!places || !Array.isArray(places)) {
      return NextResponse.json({ error: "Missing or invalid places array" }, { status: 400 });
    }

    // Update the trip in the database
    const result = await updateTrip({
      id,
      destination,
      startDate,
      endDate,
      places,
      travelPace,
      dailyItineraries,
      userId,
    });

    if (result.error) {
      console.error("Error updating trip in MongoDB:", result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ message: "Trip updated", tripId: id }, { status: 200 });
  } catch (error) {
    console.error("Error in PUT trip API:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get('tripId');

    if (!tripId) {
      return NextResponse.json({ error: "Missing required parameter: tripId" }, { status: 400 });
    }

    console.log(`DELETE /api/trips - Deleting trip: ${tripId}`);
    
    const result = await deleteTrip(tripId);
    
    if (result.error) {
      console.error("Error deleting trip:", result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE trips API:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
