import { verifyPassword } from "../utils";
import { MongoDbClientService } from "./index";
import bcrypt from "bcryptjs";

const db = MongoDbClientService.getInstance();

export async function getUsers() {
    try {
        const usersCollection = await db.getCollection('users');
        
        const result = await usersCollection.find({}).toArray();
        
        console.log(`Retrieved ${result.length} users`);
        return { users: result };
    } catch (error) {
        console.error('Error fetching users:', error);
        return { error: 'Failed to fetch users' };
    }
}

export async function authenticateUser(email: string, password: string) {
    try {
      const usersCollection = await db.getCollection('users');

      const user = await usersCollection.findOne({ email });

      if(user?.googleId) {
        return { error: 'Invalid email or password' };
      }
      
      if (!user) {
        return { error: 'Invalid email or password' };
      }
      
      // Check password
      const isPasswordValid = await verifyPassword(password, user.password)
      if (!isPasswordValid) {
        return { error: 'Invalid email or password' };
      }
      
      return { 
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name
        } 
      };
    } catch (error) {
      console.error('Error authenticating user:', error);
      return { error: 'Authentication failed' };
    }
  }