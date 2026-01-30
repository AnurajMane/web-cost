import { create } from 'zustand';

/**
 * Zustand store for managing global authentication state.
 * This will be updated by your SignupPage and LoginPage after 
 * successful verification from your new Java/Auth microservice.
 */
export const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  
  // Set the user profile after successful login or signup verification
  login: (user) => set({ 
    user, 
    loading: false 
  }),
  
  // Clear the user session (used by the Header component)
  logout: () => {
    // You might want to clear local tokens here as well
    localStorage.removeItem('auth_token');
    set({ user: null, loading: false });
  },
  
  // Update loading state during API calls
  setLoading: (loading) => set({ loading }),
  
  // Optional: Update specific user details (e.g., avatar or username)
  updateUser: (data) => set((state) => ({
    user: state.user ? { ...state.user, ...data } : null
  })),
}));