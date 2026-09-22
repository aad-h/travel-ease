import { Collection, MongoClient, ServerApiVersion } from "mongodb";

// Database configuration
const URI = process.env.MONGODB_URI as string;
// Log the URI length to debug without exposing credentials
console.log('MongoDB URI length:', URI ? URI.length : 0);
console.log('MongoDB URI defined:', !!URI);

const DB_NAME = 'travelease';
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
};

// Check for missing environment variables at startup
let uriWarning = '';
if (!URI) {
  uriWarning = 'WARNING: MongoDB URI is not defined in environment variables. Please set MONGODB_URI in .env.local file.';
  console.error(uriWarning);
}

declare global {
  var _mongoClientPromise: MongoClient | undefined;
}

export class MongoDbClientService {
  private client: MongoClient | null = null;
  private static instance: MongoDbClientService;
  private connectionError: string | null = null;

  public static getInstance(): MongoDbClientService {
    if (!MongoDbClientService.instance) {
      MongoDbClientService.instance = new MongoDbClientService();
    }
    return MongoDbClientService.instance;
  }

  // This method is used to initialize the mongodb connection
  private async initClient(): Promise<MongoClient> {
    if (this.client) return this.client;
    
    if (!URI) {
      this.connectionError = 'MongoDB URI is not defined. Please check your environment variables.';
      throw new Error(this.connectionError);
    }
    
    try {
      if (process.env.NODE_ENV !== 'production') {
        if (!global._mongoClientPromise) {
          global._mongoClientPromise = await MongoClient.connect(URI, options);
        }
        this.client = global._mongoClientPromise;
      } else {
        // In production, create a new client
        this.client = await MongoClient.connect(URI, options);
      }
      
      console.log('MongoDB connection successful');
      return this.client;
    } catch (error: any) {
      this.connectionError = `Failed to connect to MongoDB: ${error.message}`;
      console.error(this.connectionError);
      throw new Error(this.connectionError);
    }
  }

  // Get a collection by name
  public async getCollection(collectionName: string): Promise<Collection> {
    try {
      const client = await this.initClient();
      const db = client.db(DB_NAME);
      return db.collection(collectionName);
    } catch (error: any) {
      console.error(`Error getting collection ${collectionName}:`, error);
      throw error;
    }
  }

  // Getter for connection error
  public getConnectionError(): string | null {
    return this.connectionError;
  }

  // Check if MongoDB is connected
  public async isConnected(): Promise<boolean> {
    try {
      await this.initClient();
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default MongoDbClientService.getInstance();