import { create } from 'zustand';
import { AuthUser, UserProfile } from '../types';
import { supabase } from '../services/supabase';

interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  setProfileState: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setProfile: (profile: UserProfile) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  setUser: (user) => set({ user }),
  setProfileState: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),

  loginWithEmail: async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      console.log('Logged in successfully!');
    } catch (err: any) {
      console.error(err.message || 'Login failed');
      throw err;
    }
  },

  signupWithEmail: async (email, password) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      console.log('Sign up successful! Please check your email for verification.');
    } catch (err: any) {
      console.error(err.message || 'Sign up failed');
      throw err;
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
    console.log('Logged out');
  },

  setProfile: async (p: UserProfile) => {
    const { user } = get();
    if (!user) {
      set({ profile: p });
      return;
    }
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        name: p.name,
        gender: p.gender,
        height: p.height,
        weight: p.weight,
        skin_tone: p.skinTone,
        skin_tone_hex: p.skinToneHex,
        body_type: p.bodyType || 'Average',
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      set({ profile: p });
      console.log('Profile saved!');
    } catch (error: any) {
      console.error('Could not save profile: ' + error.message);
      throw error;
    }
  },
}));
