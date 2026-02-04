
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ClothingItem, UserProfile, Outfit, CalendarEvent, SharedLook, AuthUser } from '../types';
import { useToast } from './ToastContext';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

interface WardrobeContextType {
  user: AuthUser | null;
  loginWithGoogle: () => Promise<void>;
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;
  clothes: ClothingItem[];
  addClothingItem: (item: ClothingItem) => void;
  deleteClothingItem: (id: string) => void;
  savedOutfits: Outfit[];
  saveOutfit: (outfit: Outfit) => void;
  deleteOutfit: (id: string) => void;
  calendarEvents: CalendarEvent[];
  addCalendarEvent: (event: CalendarEvent) => void;
  sharedLooks: SharedLook[];
  shareLook: (look: SharedLook) => void;
  logout: () => void;
  loading: boolean;
}

const WardrobeContext = createContext<WardrobeContextType | undefined>(undefined);

export const WardrobeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [sharedLooks, setSharedLooks] = useState<SharedLook[]>([]);
  const [loading, setLoading] = useState(true);
  
  const toast = useToast();
  
  // Helper to get storage key based on user ID
  const getKey = (key: string) => user ? `${user.id}_${key}` : `guest_${key}`;

  // Monitor Firebase Auth State
  useEffect(() => {
    // If auth is null (keys missing), stop loading and behave as guest
    if (!auth) {
        console.warn("Authentication service not initialized.");
        setLoading(false);
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Map Firebase user to our internal type
        const appUser: AuthUser = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email || '',
          photoUrl: firebaseUser.photoURL || undefined
        };
        setUser(appUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load Data when User Changes
  useEffect(() => {
    if (!user) {
        setProfileState(null);
        setClothes([]);
        setSavedOutfits([]);
        setCalendarEvents([]);
        return;
    }

    const loadUserData = () => {
      try {
        const storedProfile = localStorage.getItem(getKey('profile'));
        const storedClothes = localStorage.getItem(getKey('clothes'));
        const storedOutfits = localStorage.getItem(getKey('outfits'));
        const storedCalendar = localStorage.getItem(getKey('calendar'));
        
        const storedSocial = localStorage.getItem('wardrobe_social');

        if (storedProfile) setProfileState(JSON.parse(storedProfile));
        else setProfileState(null);

        if (storedClothes) setClothes(JSON.parse(storedClothes));
        else setClothes([]);

        if (storedOutfits) setSavedOutfits(JSON.parse(storedOutfits));
        else setSavedOutfits([]);

        if (storedCalendar) setCalendarEvents(JSON.parse(storedCalendar));
        else setCalendarEvents([]);

        if (storedSocial) setSharedLooks(JSON.parse(storedSocial));
      } catch (e) {
        console.error("Failed to load user data", e);
        toast.error("Failed to load your data");
      }
    };
    loadUserData();
  }, [user]);

  // --- Actions ---

  const loginWithGoogle = async () => {
      if (!auth || !googleProvider) {
          toast.error("Google Login is not configured (Missing API Keys)");
          throw new Error("Firebase configuration missing");
      }
      try {
        await signInWithPopup(auth, googleProvider);
        toast.success("Successfully signed in!");
      } catch (error: any) {
        console.error("Login failed", error);
        
        let errorMessage = "Login failed. Please try again.";
        
        // Handle specific Firebase errors
        if (error.code === 'auth/unauthorized-domain') {
            const domain = window.location.hostname;
            errorMessage = `Domain (${domain}) is not authorized in Firebase.`;
            // Detailed log for the developer
            console.error(`
              Firebase Error: auth/unauthorized-domain
              ACTION REQUIRED: 
              1. Go to Firebase Console (https://console.firebase.google.com/)
              2. Select project 'online-wardrobe-c8ff4'
              3. Go to Authentication > Settings > Authorized Domains
              4. Add this domain: ${domain}
            `);
            toast.error(errorMessage);
            throw error; // Throw so UI can handle it
        } else if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = "Sign-in cancelled.";
            toast.info(errorMessage);
            throw error;
        } else if (error.code === 'auth/operation-not-allowed') {
            errorMessage = "Google Sign-In is not enabled in Firebase Console.";
        } else if (error.code === 'auth/invalid-api-key') {
            errorMessage = "Invalid Firebase API Key configuration.";
        }

        toast.error(errorMessage);
        throw error;
      }
  };

  const logout = async () => {
      if (!auth) {
          setUser(null);
          setProfileState(null);
          toast.info("Logged out (Guest)");
          return;
      }
      try {
        await signOut(auth);
        setUser(null);
        setProfileState(null);
        toast.info("You have been logged out");
      } catch (error) {
        console.error("Logout failed", error);
        toast.error("Failed to log out");
      }
  };

  const setProfile = (p: UserProfile) => {
    setProfileState(p);
    try {
        localStorage.setItem(getKey('profile'), JSON.stringify(p));
    } catch (e) {
        toast.error("Could not save profile. Storage full?");
    }
  };

  const addClothingItem = (item: ClothingItem) => {
    setClothes(prev => {
        const updated = [item, ...prev];
        try {
            localStorage.setItem(getKey('clothes'), JSON.stringify(updated));
            toast.success("Item added to closet");
        } catch (e) {
            console.error("Storage limit reached");
            toast.error("Storage full! Item available for this session only.");
        }
        return updated;
    });
  };

  const deleteClothingItem = (id: string) => {
      setClothes(prev => {
          const updated = prev.filter(c => c.id !== id);
          localStorage.setItem(getKey('clothes'), JSON.stringify(updated));
          toast.info("Item removed");
          return updated;
      });
  }

  const saveOutfit = (outfit: Outfit) => {
    setSavedOutfits(prev => {
        const updated = [outfit, ...prev];
        try {
            localStorage.setItem(getKey('outfits'), JSON.stringify(updated));
            toast.success("Outfit saved!");
        } catch (e) {
            console.error("Storage limit reached");
            toast.error("Storage full! Outfit saved for this session only.");
        }
        return updated;
    });
  };

  const deleteOutfit = (id: string) => {
    setSavedOutfits(prev => {
        const updated = prev.filter(o => o.id !== id);
        localStorage.setItem(getKey('outfits'), JSON.stringify(updated));
        toast.info("Outfit deleted");
        return updated;
    });
  };

  const addCalendarEvent = (event: CalendarEvent) => {
    setCalendarEvents(prev => {
        const updated = [...prev, event];
        localStorage.setItem(getKey('calendar'), JSON.stringify(updated));
        toast.success("Added to calendar");
        return updated;
    });
  };

  const shareLook = (look: SharedLook) => {
    setSharedLooks(prev => {
        const updated = [look, ...prev];
        localStorage.setItem('wardrobe_social', JSON.stringify(updated));
        return updated;
    });
  };

  return (
    <WardrobeContext.Provider value={{
      user, loginWithGoogle,
      profile, setProfile,
      clothes, addClothingItem, deleteClothingItem,
      savedOutfits, saveOutfit, deleteOutfit,
      calendarEvents, addCalendarEvent,
      sharedLooks, shareLook,
      logout,
      loading
    }}>
      {children}
    </WardrobeContext.Provider>
  );
};

export const useWardrobe = () => {
  const context = useContext(WardrobeContext);
  if (!context) throw new Error("useWardrobe must be used within WardrobeProvider");
  return context;
};
