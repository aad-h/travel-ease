'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../lib/schema';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  googleAuth: (mode?: 'login' | 'signup') => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  setUserData: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper functions
const isBrowser = () => typeof window !== 'undefined';

const saveUser = (user: User) => {
  if (isBrowser()) {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

const removeUser = () => {
  if (isBrowser()) {
    localStorage.removeItem('user');
  }
};

const loadUser = (): User | null => {
  if (isBrowser()) {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  }
  return null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      setUser(loadUser());
    } catch (error) {
      console.error('Failed to load user', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // helper function used to implement the login and signup without google 
  const handleApiRequest = async (url: string, options: RequestInit = {}) => {
    setLoading(true);
    
    try {
      const response = await fetch(url, options);
      
      // Check for non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Received non-JSON response:', await response.text());
        return { success: false, error: 'Server error: Invalid response format' };
      }
      
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Request failed' };
      }
      
      if (data.user) {
        setUser(data.user);
        saveUser(data.user);
        return { success: true };
      }
      
      return data;
    } catch (error: any) {
      console.error('Request failed', error);
      return { success: false, error: error.message || 'Request failed' };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    return handleApiRequest('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
  };

  const signup = async (email: string, password: string, name: string) => {
    return handleApiRequest('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
  };

  // method that hanldes both login and signup with google
  const googleAuth = async (mode: 'login' | 'signup' = 'login') => {
    setLoading(true);
    
    try {
      // calling google api request
      const response = await fetch(`/api/auth/google?mode=${mode}`);
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        const errorData = contentType?.includes('application/json')
          ? await response.json()
          : { error: await response.text() };
        return { success: false, error: errorData.error || `Google ${mode} failed` };
      }
      
      const data = await response.json();
      
      // Redirect to Google auth page
      if (data.url) {
        window.location.href = data.url;
        return { success: true };
      }
      
      // Handle direct user return
      if (data.user) {
        setUser(data.user);
        saveUser(data.user);
        return { success: true };
      }
      
      return { success: false, error: `Google ${mode} failed` };
    } catch (error: any) {
      console.error(`Google ${mode} failed`, error);
      return { success: false, error: error.message || `Google ${mode} failed` };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    removeUser();
    setUser(null);
  };

  const setUserData = (userData: User) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      googleAuth,
      logout,
      signup,
      setUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
}
