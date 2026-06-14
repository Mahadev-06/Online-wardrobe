import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { ClothingItem, UserProfile, Outfit, CalendarEvent, AuthUser, ClothingCategory } from '../types';
import { supabase } from '../services/supabase';
import { generateOutfitRecommendation } from '../services/ai';
import { useAuthStore } from '../store/authStore';
import { useWardrobeStore } from '../store/wardrobeStore';
import { useCalendarStore } from '../store/calendarStore';
import { useWeatherStore } from '../store/weatherStore';

export interface ForecastDay {
  day: string;
  tempMin: number;
  tempMax: number;
  code: number;
}

export interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  location: string;
  isDay: boolean;
  advice: string;
  code: number;
  forecast: ForecastDay[];
}

interface WardrobeContextType {
  user: AuthUser | null;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  
  weather: WeatherData | null;
  loadingWeather: boolean;
  weatherError: string | null;
  recommendation: { outfitItemIds: string[]; reasoning: string } | null;
  loadingRec: boolean;
  recError: string | null;

  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => Promise<void>;

  clothes: ClothingItem[];
  addClothingItem: (item: ClothingItem) => Promise<void>;
  deleteClothingItem: (id: string) => Promise<void>;

  savedOutfits: Outfit[];
  saveOutfit: (outfit: Outfit) => Promise<void>;
  deleteOutfit: (id: string) => Promise<void>;

  calendarEvents: CalendarEvent[];
  addCalendarEvent: (event: CalendarEvent) => Promise<void>;
  deleteCalendarEvent: (id: string) => Promise<void>;
  updateCalendarEvent: (event: CalendarEvent) => Promise<void>;

  customRecommendation: { outfitItemIds: string[]; reasoning: string } | null;
  customLoading: boolean;
  generateCustomRecommendation: (occasion: string, weather: string) => Promise<void>;
  clearCustomRecommendation: () => void;
}

const WardrobeContext = createContext<WardrobeContextType | undefined>(undefined);

export const WardrobeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const authStore = useAuthStore();
  const wardrobeStore = useWardrobeStore();
  const calendarStore = useCalendarStore();
  const weatherStore = useWeatherStore();

  const { user, setUser, setProfileState, setLoading, profile } = authStore;
  const { clothes, setClothes, setSavedOutfits } = wardrobeStore;
  const { setCalendarEvents } = calendarStore;

  // Supabase Auth and Initial Load
  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.full_name || 'User',
          email: session.user.email || '',
          photoUrl: session.user.user_metadata?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        });
      }
      setLoading(false);
      clearTimeout(timeout);
    }).catch((err) => {
      console.error("Session check failed:", err);
      setLoading(false);
      clearTimeout(timeout);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.full_name || 'User',
          email: session.user.email || '',
          photoUrl: session.user.user_metadata?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [setUser, setLoading]);

  // Load Database Data on User login
  useEffect(() => {
    if (!user) {
      setProfileState(null);
      setClothes([]);
      setSavedOutfits([]);
      setCalendarEvents([]);
      return;
    }

    const fetchData = async () => {
      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (prof) {
          setProfileState({
            name: prof.name,
            gender: prof.gender,
            height: prof.height,
            weight: prof.weight,
            skinTone: prof.skin_tone,
            skinToneHex: prof.skin_tone_hex,
            bodyType: prof.body_type || 'Average',
          });
        }

        const { data: clothing } = await supabase
          .from('clothing_items')
          .select('*')
          .eq('user_id', user.id);
          
        if (clothing) {
          setClothes(clothing.map(c => ({
            id: c.id,
            image: c.image_url,
            category: c.category as ClothingCategory,
            color: c.color,
            style: c.style,
            material: c.material,
            description: c.description,
            seasonSuitability: c.season_suitability || [],
            dateAdded: new Date(c.created_at).getTime(),
          })));
        }

        const { data: outfitsData } = await supabase
          .from('outfits')
          .select('*, outfit_items(clothing_id)')
          .eq('user_id', user.id);
          
        if (outfitsData && clothing) {
          const clothesMap = new Map(clothing.map(c => [c.id, c]));
          setSavedOutfits(outfitsData.map(o => {
            const resolvedItems = (o.outfit_items || []).map((oi: any) => {
              const dbItem = clothesMap.get(oi.clothing_id);
              if (!dbItem) return null;
              return {
                id: dbItem.id,
                image: dbItem.image_url,
                category: dbItem.category as ClothingCategory,
                color: dbItem.color,
                style: dbItem.style,
                material: dbItem.material,
                description: dbItem.description,
                seasonSuitability: dbItem.season_suitability || [],
                dateAdded: new Date(dbItem.created_at).getTime(),
              };
            }).filter(Boolean);
            return {
              id: o.id,
              items: resolvedItems,
              date: o.created_at,
              notes: o.notes,
            };
          }));
        }

        const { data: events } = await supabase
          .from('calendar_events')
          .select('*')
          .eq('user_id', user.id);
          
        if (events) {
          setCalendarEvents(events.map(e => ({
            id: e.id,
            date: e.date,
            title: e.title,
            outfitId: e.outfit_id,
          })));
        }
      } catch (err) {
        console.error("Error fetching data", err);
      }
    };

    fetchData();
  }, [user, setProfileState, setClothes, setSavedOutfits, setCalendarEvents]);

  // Weather triggers
  useEffect(() => {
    if (!user) {
      weatherStore.setWeather(null);
      wardrobeStore.setRecommendation(null);
      return;
    }

    const defaultLat = 40.7128;
    const defaultLon = -74.0060;

    weatherStore.setLoadingWeather(true);
    if (!navigator.geolocation) {
      weatherStore.fetchWeather(defaultLat, defaultLon, true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        weatherStore.fetchWeather(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.warn("Geo error, using fallback:", error);
        weatherStore.fetchWeather(defaultLat, defaultLon, true);
      },
      { timeout: 5000 }
    );
  }, [user]);

  // AI Recommendation updates
  useEffect(() => {
    const currentWeather = weatherStore.weather;
    if (!currentWeather || clothes.length < 2) {
      wardrobeStore.setRecommendation(null);
      return;
    }

    let isMounted = true;
    const loadRecommendation = async () => {
      wardrobeStore.setLoadingRec(true);
      wardrobeStore.setRecError(null);
      try {
        const weatherContext = `${currentWeather.temp}°C, ${currentWeather.condition} (${currentWeather.advice})`;
        const res = await generateOutfitRecommendation(
          clothes,
          profile || { name: 'User', gender: 'Other', height: 170, weight: 65, skinTone: 'Medium', skinToneHex: '#E0AC69', bodyType: 'Average' },
          'Casual',
          weatherContext
        );
        if (isMounted) {
          if (res.success) {
            wardrobeStore.setRecommendation({
              outfitItemIds: res.outfitItemIds || [],
              reasoning: res.reasoning
            });
          } else {
            wardrobeStore.setRecommendation({
              outfitItemIds: [],
              reasoning: res.reasoning
            });
          }
        }
      } catch (err: any) {
        console.error("Failed to load daily recommendation:", err);
        if (isMounted) {
          wardrobeStore.setRecError("Could not load recommendation");
        }
      } finally {
        if (isMounted) {
          wardrobeStore.setLoadingRec(false);
        }
      }
    };

    loadRecommendation();
    return () => {
      isMounted = false;
    };
  }, [weatherStore.weather?.condition, weatherStore.weather?.temp, clothes.length, profile]);

  return (
    <WardrobeContext.Provider
      value={{
        // Auth Store
        user: authStore.user,
        loginWithEmail: authStore.loginWithEmail,
        signupWithEmail: authStore.signupWithEmail,
        logout: authStore.logout,
        loading: authStore.loading,
        profile: authStore.profile,
        setProfile: authStore.setProfile,

        // Weather Store
        weather: weatherStore.weather,
        loadingWeather: weatherStore.loadingWeather,
        weatherError: weatherStore.weatherError,

        // Wardrobe Store
        clothes: wardrobeStore.clothes,
        savedOutfits: wardrobeStore.savedOutfits,
        recommendation: wardrobeStore.recommendation,
        loadingRec: wardrobeStore.loadingRec,
        recError: wardrobeStore.recError,
        customRecommendation: wardrobeStore.customRecommendation,
        customLoading: wardrobeStore.customLoading,
        addClothingItem: (item) => wardrobeStore.addClothingItem(item, user!.id),
        deleteClothingItem: wardrobeStore.deleteClothingItem,
        saveOutfit: (outfit) => wardrobeStore.saveOutfit(outfit, user!.id),
        deleteOutfit: wardrobeStore.deleteOutfit,
        generateCustomRecommendation: (occasion, weather) => wardrobeStore.generateCustomRecommendation(occasion, weather, profile!),
        clearCustomRecommendation: wardrobeStore.clearCustomRecommendation,

        // Calendar Store
        calendarEvents: calendarStore.calendarEvents,
        addCalendarEvent: (event) => calendarStore.addCalendarEvent(event, user!.id),
        deleteCalendarEvent: calendarStore.deleteCalendarEvent,
        updateCalendarEvent: (event) => calendarStore.updateCalendarEvent(event, user!.id),
      }}
    >
      {children}
    </WardrobeContext.Provider>
  );
};

export const useWardrobe = (): WardrobeContextType => {
  const context = useContext(WardrobeContext);
  if (!context) {
    throw new Error('useWardrobe must be used within a <WardrobeProvider>.');
  }
  return context;
};
