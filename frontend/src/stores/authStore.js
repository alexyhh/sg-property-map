import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { fetchUserTier } from '../lib/api';

const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  tier: 'free',
  features: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      set({ user: session.user, session, loading: false, initialized: true });
      get().fetchTier();
    } else {
      set({ loading: false, initialized: true });
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        set({ user: session.user, session, loading: false });
        get().fetchTier();
      } else {
        set({ user: null, session: null, tier: 'free', features: null, loading: false });
      }
    });
  },

  fetchTier: async () => {
    try {
      const data = await fetchUserTier();
      set({ tier: data.tier, features: data.features });
    } catch (err) {
      console.error('Failed to fetch tier:', err);
      set({ tier: 'free', features: null });
    }
  },

  signInWithEmail: async (email, password) => {
    set({ loading: true });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ loading: false });
      throw error;
    }
  },

  signUpWithEmail: async (email, password, name) => {
    set({ loading: true });
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    });
    if (error) {
      set({ loading: false });
      throw error;
    }
    set({ loading: false });
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/app` },
    });
    if (error) throw error;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, tier: 'free', features: null });
  },
}));

export default useAuthStore;
