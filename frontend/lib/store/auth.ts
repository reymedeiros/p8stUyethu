import { create } from 'zustand';
import { authAPI } from '../api';

interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true,

  initAuth: () => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.me()
        .then((res) => set({ token, user: res.data.user, isLoading: false }))
        .catch(() => {
          localStorage.removeItem('token');
          set({ token: null, user: null, isLoading: false });
        });
    } else {
      set({ isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    const response = await authAPI.login(email, password);
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null });
  },
}));

if (typeof window !== 'undefined') {
  useAuthStore.getState().initAuth();
}