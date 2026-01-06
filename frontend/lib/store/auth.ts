import { create } from 'zustand';
import { authAPI } from '../api';

interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  initAuth: () => Promise<void>;
  verifyToken: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isLoading: true,
  isInitialized: false,

  initAuth: async () => {
    // Prevent multiple initializations
    if (get().isInitialized) {
      return;
    }

    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        const res = await authAPI.me();
        set({ 
          token, 
          user: res.data.user, 
          isLoading: false,
          isInitialized: true 
        });
      } catch (error) {
        console.error('Token verification failed:', error);
        localStorage.removeItem('token');
        set({ 
          token: null, 
          user: null, 
          isLoading: false,
          isInitialized: true 
        });
      }
    } else {
      set({ 
        isLoading: false,
        isInitialized: true 
      });
    }
  },

  verifyToken: async () => {
    const token = get().token || localStorage.getItem('token');
    
    if (!token) {
      return false;
    }

    try {
      const res = await authAPI.me();
      set({ user: res.data.user });
      return true;
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('token');
      set({ token: null, user: null });
      return false;
    }
  },

  login: async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      const { token, user } = response.data;
      
      // Store token in localStorage first
      localStorage.setItem('token', token);
      
      // Then update state synchronously
      set({ 
        token, 
        user,
        isLoading: false,
        isInitialized: true 
      });
      
      console.log('Login successful, token stored');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ 
      token: null, 
      user: null,
      isInitialized: true 
    });
  },
}));

// Initialize auth on client side only
if (typeof window !== 'undefined') {
  useAuthStore.getState().initAuth();
}