// src/lib/trips.tsx
import { MongoDbClientService } from "./index";
import { Trip } from "../schema";
import { ObjectId } from "mongodb";

const db = MongoDbClientService.getInstance();

export async function saveTrip(trip: Trip & { userId: string }) {
  try {
    console.log('Saving trip to MongoDB:', {
      destination: trip.destination,
      userId: trip.userId ? 'defined' : 'undefined',
      userIdType: typeof trip.userId
    });
    
    // Validate MongoDB connection
    const isConnected = await db.isConnected();
    if (!isConnected) {
      console.error('MongoDB connection failed');
      return { error: "Database connection failed" };
    }
    
    const tripsCollection = await db.getCollection("trips");
    
    // Check if we need to convert userId to ObjectId
    let userIdForStorage: string | ObjectId = trip.userId;
    
    try {
      // Only convert if it's a valid ObjectId format
      if (ObjectId.isValid(trip.userId)) {
        userIdForStorage = new ObjectId(trip.userId);
      }
    } catch (e) {
      console.warn('Could not convert userId to ObjectId, using as string:', e);
      // Continue with the original string userId
    }
    
    const result = await tripsCollection.insertOne({
      ...trip,
      userId: userIdForStorage,
      createdAt: new Date(),
    });

    if (!result.acknowledged) {
      console.error('MongoDB insert not acknowledged');
      return { error: "Failed to save trip: insertion not acknowledged" };
    }

    console.log("Trip saved with ID:", result.insertedId);
    return { success: true, tripId: result.insertedId.toString() };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error saving trip:", errorMessage);
    return { error: `Failed to save trip: ${errorMessage}` };
  }
}

export async function getUserTrips(userId: string) {
  try {
    console.log('Fetching trips for user from MongoDB:', userId);
    
    // Validate MongoDB connection
    const isConnected = await db.isConnected();
    if (!isConnected) {
      console.error('MongoDB connection failed');
      return { error: "Database connection failed" };
    }
    
    const tripsCollection = await db.getCollection("trips");
    
    // Prepare query to handle both string and ObjectId user IDs
    let query: { userId: string } | { $or: Array<{ userId: string | ObjectId }> } = { userId: userId };
    
    // If userId looks like an ObjectId, also try that format
    if (ObjectId.isValid(userId)) {
      query = { 
        $or: [
          { userId: userId },
          { userId: new ObjectId(userId) }
        ] 
      };
    }
    
    const trips = await tripsCollection.find(query).sort({ createdAt: -1 }).toArray();
    
    console.log(`Found ${trips.length} trips for user ${userId}`);
    
    // Transform MongoDB _id to id for frontend consistency
    const transformedTrips = trips.map(trip => {
      const { _id, ...rest } = trip;
      return { ...rest, id: _id.toString() };
    });
    
    return { trips: transformedTrips };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error fetching trips:", errorMessage);
    return { error: `Failed to fetch trips: ${errorMessage}` };
  }
}

export async function deleteTrip(tripId: string) {
  try {
    console.log('Deleting trip from MongoDB:', tripId);
    
    // Validate MongoDB connection
    const isConnected = await db.isConnected();
    if (!isConnected) {
      console.error('MongoDB connection failed');
      return { error: "Database connection failed" };
    }
    
    const tripsCollection = await db.getCollection("trips");
    
    // Use ObjectId if the id looks like a MongoDB ObjectId
    let mongoTripId: string | ObjectId = tripId;
    if (ObjectId.isValid(tripId)) {
      mongoTripId = new ObjectId(tripId);
    }
    
    const result = await tripsCollection.deleteOne({ 
      $or: [
        { _id: mongoTripId },
        { id: tripId }
      ]
    } as any); // Use type assertion for the complex query
    
    if (result.deletedCount === 0) {
      console.warn(`No trip found with ID ${tripId} to delete`);
      return { success: false, message: "Trip not found" };
    }
    
    console.log(`Successfully deleted trip: ${tripId}`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error deleting trip:", errorMessage);
    return { error: `Failed to delete trip: ${errorMessage}` };
  }
}

export async function updateTrip(trip: Trip & { userId: string }) {
  try {
    console.log('Updating trip in MongoDB:', {
      tripId: trip.id,
      destination: trip.destination,
      userId: trip.userId ? 'defined' : 'undefined',
      userIdType: typeof trip.userId
    });
    
    // Validate MongoDB connection
    const isConnected = await db.isConnected();
    if (!isConnected) {
      console.error('MongoDB connection failed');
      return { error: "Database connection failed" };
    }
    
    const tripsCollection = await db.getCollection("trips");
    
    // Check if we need to convert userId to ObjectId
    let userIdForStorage: string | ObjectId = trip.userId;
    
    try {
      // Only convert if it's a valid ObjectId format
      if (ObjectId.isValid(trip.userId)) {
        userIdForStorage = new ObjectId(trip.userId);
      }
    } catch (e) {
      console.warn('Could not convert userId to ObjectId, using as string:', e);
      // Continue with the original string userId
    }
    
    // Prepare query to handle both string and ObjectId trip IDs
    let query: { id: string | number } | { $or: Array<{ id: string | number } | { _id: ObjectId }> } = { id: trip.id };
    if (ObjectId.isValid(trip.id.toString())) {
      query = { 
        $or: [
          { id: trip.id },
          { _id: new ObjectId(trip.id.toString()) }
        ] 
      };
    }
    
    // Update the trip - set updatedAt timestamp
    const result = await tripsCollection.updateOne(
      query,
      { 
        $set: { 
          ...trip,
          userId: userIdForStorage,
          updatedAt: new Date() 
        } 
      }
    );

    if (!result.acknowledged) {
      console.error('MongoDB update not acknowledged');
      return { error: "Failed to update trip: update not acknowledged" };
    }
    
    if (result.matchedCount === 0) {
      console.error('No trip found with ID', trip.id);
      return { error: `Trip not found with ID: ${trip.id}` };
    }

    console.log("Trip updated with ID:", trip.id);
    return { success: true, tripId: trip.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error updating trip:", errorMessage);
    return { error: `Failed to update trip: ${errorMessage}` };
  }
}
