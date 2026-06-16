import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { ClothingItem, UserProfile, Outfit, CalendarEvent, AuthUser, ClothingCategory } from '../types';
import { supabase } from '../services/supabase';
import { generateOutfitRecommendation, reviewOutfit, analyzeClothingImage } from '../services/ai';
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

export interface AnalysisResult {
  is_clothing: boolean;
  confidence: number;
  metadata?: {
    category: string;
    color_primary: string;
    color_secondary: string;
    pattern: string;
    occasion: string[];
    season: string[];
    material?: string;
  };
  message?: string;
}

interface WardrobeContextType {
  user: AuthUser | null;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string, profileData?: UserProfile) => Promise<void>;
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

  // Onboarding Tour extensions
  isOnboardingTour: boolean;
  onboardingStep: number;
  startOnboardingTour: () => void;
  setOnboardingStep: (step: number) => void;
  completeOnboardingTour: () => void;
  reviewOutfit: (selectedItems: ClothingItem[]) => Promise<{ success: boolean; score: number; review: string }>;
  analyzeClothingImage: (image: string) => Promise<AnalysisResult>;
}

const WardrobeContext = createContext<WardrobeContextType | undefined>(undefined);

// --- Onboarding Tour Default Mock Data ---
const DEFAULT_MOCK_CLOTHES: ClothingItem[] = [
  {
    id: 'mock_leather_jacket',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=60',
    category: ClothingCategory.OUTERWEAR,
    color: 'Black',
    style: 'Casual, Streetwear',
    material: 'Leather',
    description: 'Premium black leather jacket',
    seasonSuitability: ['winter', 'autumn', 'all-season'],
    dateAdded: Date.now()
  },
  {
    id: 'mock_jeans',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&auto=format&fit=crop&q=60',
    category: ClothingCategory.BOTTOM,
    color: 'Blue',
    style: 'Casual, Streetwear',
    material: 'Denim',
    description: 'Classic slim-fit blue denim jeans',
    seasonSuitability: ['summer', 'winter', 'spring', 'autumn', 'all-season'],
    dateAdded: Date.now() - 1000
  },
  {
    id: 'mock_tshirt',
    image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&auto=format&fit=crop&q=60',
    category: ClothingCategory.TOP,
    color: 'White',
    style: 'Casual, Minimalist',
    material: 'Cotton',
    description: 'Soft combed cotton white crewneck t-shirt',
    seasonSuitability: ['summer', 'spring', 'all-season'],
    dateAdded: Date.now() - 2000
  },
  {
    id: 'mock_dress',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=60',
    category: ClothingCategory.DRESS,
    color: 'Emerald Green',
    style: 'Formal, Date Night',
    material: 'Silk',
    description: 'Elegant emerald green silk midi slip dress',
    seasonSuitability: ['summer', 'spring', 'all-season'],
    dateAdded: Date.now() - 3000
  },
  {
    id: 'mock_sneakers',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&auto=format&fit=crop&q=60',
    category: ClothingCategory.SHOES,
    color: 'Beige',
    style: 'Casual, Sporty',
    material: 'Suede',
    description: 'Retro suede low-top sneakers',
    seasonSuitability: ['summer', 'winter', 'spring', 'autumn', 'all-season'],
    dateAdded: Date.now() - 4000
  },
  {
    id: 'mock_sunglasses',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&auto=format&fit=crop&q=60',
    category: ClothingCategory.ACCESSORY,
    color: 'Brown',
    style: 'Casual, Vintage',
    material: 'Acetate',
    description: 'Classic tortoiseshell frame sunglasses',
    seasonSuitability: ['summer', 'spring', 'all-season'],
    dateAdded: Date.now() - 5000
  }
];

const DEFAULT_MOCK_OUTFITS = (clothesPool: ClothingItem[]): Outfit[] => [
  {
    id: 'mock_outfit_1',
    items: [
      clothesPool.find(c => c.id === 'mock_tshirt')!,
      clothesPool.find(c => c.id === 'mock_jeans')!,
      clothesPool.find(c => c.id === 'mock_sneakers')!,
      clothesPool.find(c => c.id === 'mock_leather_jacket')!
    ].filter(Boolean),
    date: new Date().toISOString(),
    notes: 'Classic leather jacket streetwear combination'
  },
  {
    id: 'mock_outfit_2',
    items: [
      clothesPool.find(c => c.id === 'mock_dress')!,
      clothesPool.find(c => c.id === 'mock_sneakers')!,
      clothesPool.find(c => c.id === 'mock_sunglasses')!
    ].filter(Boolean),
    date: new Date().toISOString(),
    notes: 'Effortless silk dress day out look'
  }
];

const DEFAULT_MOCK_EVENTS = (gender?: string): CalendarEvent[] => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // Find all Fridays and Sundays in the current month
  const fridays: Date[] = [];
  const sundays: Date[] = [];

  const tempDate = new Date(currentYear, currentMonth, 1);
  while (tempDate.getMonth() === currentMonth) {
    if (tempDate.getDay() === 5) { // Friday
      fridays.push(new Date(tempDate));
    } else if (tempDate.getDay() === 0) { // Sunday
      sundays.push(new Date(tempDate));
    }
    tempDate.setDate(tempDate.getDate() + 1);
  }

  // Pick the Friday and Sunday closest to today's date
  let closestFriday = fridays[0] || new Date();
  let minFridayDiff = Infinity;
  for (const f of fridays) {
    const diff = Math.abs(f.getTime() - today.getTime());
    if (diff < minFridayDiff) {
      minFridayDiff = diff;
      closestFriday = f;
    }
  }

  let closestSunday = sundays[0] || new Date();
  let minSundayDiff = Infinity;
  for (const s of sundays) {
    const diff = Math.abs(s.getTime() - today.getTime());
    if (diff < minSundayDiff) {
      minSundayDiff = diff;
      closestSunday = s;
    }
  }

  // Helper to format as local ISO string without 'Z' (timezone-safe local midnight/noon)
  const formatLocal = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T12:00:00`;
  };

  const isMale = gender === 'Male';

  return [
    {
      id: 'mock_event_1',
      date: formatLocal(closestSunday),
      title: 'Brunch Dateout',
      outfitId: isMale ? 'mock_outfit_1' : 'mock_outfit_2'
    },
    {
      id: 'mock_event_2',
      date: formatLocal(closestFriday),
      title: 'Casual Friday Office',
      outfitId: 'mock_outfit_1'
    }
  ];
};

const mockWeather: WeatherData = {
  temp: 22,
  condition: 'Partly Cloudy',
  humidity: 60,
  location: 'Paris, France',
  isDay: true,
  advice: 'Perfect weather for a light jacket and jeans!',
  code: 1003,
  forecast: [
    { day: 'Mon', tempMin: 15, tempMax: 24, code: 1003 },
    { day: 'Tue', tempMin: 16, tempMax: 25, code: 1000 },
    { day: 'Wed', tempMin: 14, tempMax: 22, code: 1063 },
  ]
};

export const WardrobeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const authStore = useAuthStore();
  const wardrobeStore = useWardrobeStore();
  const calendarStore = useCalendarStore();
  const weatherStore = useWeatherStore();

  const { user, setUser, setProfileState, setLoading, profile } = authStore;
  const { clothes, setClothes, setSavedOutfits } = wardrobeStore;
  const { setCalendarEvents } = calendarStore;

  // Onboarding States
  const [isOnboardingTour, setIsOnboardingTour] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingClothes, setOnboardingClothes] = useState<ClothingItem[]>([]);
  const [onboardingOutfits, setOnboardingOutfits] = useState<Outfit[]>([]);
  const [onboardingEvents, setOnboardingEvents] = useState<CalendarEvent[]>([]);

  const startOnboardingTour = () => {
    setOnboardingClothes(DEFAULT_MOCK_CLOTHES);
    setOnboardingOutfits(DEFAULT_MOCK_OUTFITS(DEFAULT_MOCK_CLOTHES));
    setOnboardingEvents(DEFAULT_MOCK_EVENTS(profile?.gender));
    setOnboardingStep(0);
    setIsOnboardingTour(true);
  };

  const completeOnboardingTour = () => {
    setIsOnboardingTour(false);
    setOnboardingClothes([]);
    setOnboardingOutfits([]);
    setOnboardingEvents([]);
    if (user) {
      localStorage.setItem(`completed_onboarding_tour_${user.id}`, 'true');
    }
  };

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
          
        if (prof && prof.height && prof.weight) {
          setProfileState({
            name: prof.name,
            gender: prof.gender,
            height: prof.height,
            weight: prof.weight,
            skinTone: prof.skin_tone,
            skinToneHex: prof.skin_tone_hex,
            bodyType: prof.body_type || 'Average',
          });
        } else {
          // If no profile row in DB or it is a stub missing height/weight, check user_metadata from signup
          const { data: { session } } = await supabase.auth.getSession();
          const meta = session?.user?.user_metadata;
          if (meta && meta.height && meta.weight) {
            const signupProfile: UserProfile = {
              name: meta.full_name || meta.name || 'User',
              gender: meta.gender || 'Female',
              height: Number(meta.height),
              weight: Number(meta.weight),
              skinTone: meta.skin_tone || 'Medium',
              skinToneHex: meta.skin_tone_hex || '#C68642',
              bodyType: meta.body_type || 'Average',
            };
            
            // Save to DB and update state
            await authStore.setProfile(signupProfile);
            
            // Trigger onboarding tour if they haven't completed it
            const tourCompleted = localStorage.getItem(`completed_onboarding_tour_${user.id}`);
            if (!tourCompleted) {
              startOnboardingTour();
            }
          }
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
    if (isOnboardingTour) {
      wardrobeStore.setRecommendation({
        outfitItemIds: ['mock_tshirt', 'mock_jeans', 'mock_leather_jacket', 'mock_sneakers'],
        reasoning: `Based on your Average body type and Fair skin tone, this classic combination of a white t-shirt, blue jeans, leather jacket, and sneakers is perfect for today's 22°C partly cloudy weather.`
      });
      return;
    }

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
        setProfile: async (p: UserProfile) => {
          const isBrandNew = !authStore.profile;
          await authStore.setProfile(p);
          if (isBrandNew) {
            const tourCompleted = localStorage.getItem(`completed_onboarding_tour_${authStore.user?.id}`);
            if (!tourCompleted) {
              startOnboardingTour();
            }
          }
        },

        // Weather Store
        weather: isOnboardingTour ? mockWeather : weatherStore.weather,
        loadingWeather: isOnboardingTour ? false : weatherStore.loadingWeather,
        weatherError: isOnboardingTour ? null : weatherStore.weatherError,

        // Wardrobe Store
        clothes: isOnboardingTour ? onboardingClothes : wardrobeStore.clothes,
        savedOutfits: isOnboardingTour ? onboardingOutfits : wardrobeStore.savedOutfits,
        recommendation: wardrobeStore.recommendation,
        loadingRec: wardrobeStore.loadingRec,
        recError: wardrobeStore.recError,
        customRecommendation: wardrobeStore.customRecommendation,
        customLoading: wardrobeStore.customLoading,
        addClothingItem: async (item) => {
          if (isOnboardingTour) {
            setOnboardingClothes(prev => [item, ...prev]);
          } else {
            await wardrobeStore.addClothingItem(item, user!.id);
          }
        },
        deleteClothingItem: async (id) => {
          if (isOnboardingTour) {
            setOnboardingClothes(prev => prev.filter(c => c.id !== id));
          } else {
            await wardrobeStore.deleteClothingItem(id);
          }
        },
        saveOutfit: async (outfit) => {
          if (isOnboardingTour) {
            setOnboardingOutfits(prev => [outfit, ...prev]);
          } else {
            await wardrobeStore.saveOutfit(outfit, user!.id);
          }
        },
        deleteOutfit: async (id) => {
          if (isOnboardingTour) {
            setOnboardingOutfits(prev => prev.filter(o => o.id !== id));
          } else {
            await wardrobeStore.deleteOutfit(id);
          }
        },
        generateCustomRecommendation: async (occasion, weather) => {
          if (isOnboardingTour) {
            useWardrobeStore.setState({ customLoading: true });
            setTimeout(() => {
              useWardrobeStore.setState({
                customRecommendation: {
                  outfitItemIds: ['mock_dress', 'mock_sneakers', 'mock_sunglasses'],
                  reasoning: `Based on your Average body type, this emerald silk dress paired with beige sneakers and sunglasses matches a ${occasion} in ${weather} weather perfectly.`
                }
              });
              useWardrobeStore.setState({ customLoading: false });
            }, 1000);
          } else {
            await wardrobeStore.generateCustomRecommendation(occasion, weather, profile!);
          }
        },
        clearCustomRecommendation: wardrobeStore.clearCustomRecommendation,

        // Calendar Store
        calendarEvents: isOnboardingTour ? onboardingEvents : calendarStore.calendarEvents,
        addCalendarEvent: async (event) => {
          if (isOnboardingTour) {
            setOnboardingEvents(prev => [...prev, { ...event, id: 'onboarding_' + Date.now().toString() }]);
          } else {
            await calendarStore.addCalendarEvent(event, user!.id);
          }
        },
        deleteCalendarEvent: async (id) => {
          if (isOnboardingTour) {
            setOnboardingEvents(prev => prev.filter(e => e.id !== id));
          } else {
            await calendarStore.deleteCalendarEvent(id);
          }
        },
        updateCalendarEvent: async (event) => {
          if (isOnboardingTour) {
            setOnboardingEvents(prev => prev.map(e => e.id === event.id ? event : e));
          } else {
            await calendarStore.updateCalendarEvent(event, user!.id);
          }
        },

        // Onboarding Tour Context
        isOnboardingTour,
        onboardingStep,
        startOnboardingTour,
        setOnboardingStep,
        completeOnboardingTour,
        reviewOutfit: async (selectedItems) => {
          if (isOnboardingTour) {
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve({
                  success: true,
                  score: 9,
                  review: `This combination is extremely cohesive. The colors pair perfectly, and the silhouette flatters your ${profile?.bodyType || 'Average'} body type, complementing your height of ${profile?.height || 170}cm beautifully. Excellent choice for a casual styling.`
                });
              }, 1000);
            });
          } else {
            return reviewOutfit(selectedItems, profile!);
          }
        },
        analyzeClothingImage: async (image) => {
          if (isOnboardingTour) {
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve({
                  is_clothing: true,
                  confidence: 0.95,
                  metadata: {
                    category: 'Top',
                    color_primary: 'Navy Blue',
                    color_secondary: 'None',
                    pattern: 'Solid',
                    occasion: ['casual', 'party'],
                    season: ['summer', 'all-season'],
                    material: 'Cotton'
                  },
                  message: 'Detected a Navy Blue cotton crewneck t-shirt.'
                });
              }, 1000);
            });
          } else {
            return analyzeClothingImage(image);
          }
        }
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
