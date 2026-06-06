import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { ClothingItem, UserProfile, Outfit, CalendarEvent, AuthUser, ClothingCategory } from '../types';
import { supabase } from '../services/supabase';

interface WardrobeContextType {
  user: AuthUser | null;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;

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
}

const WardrobeContext = createContext<WardrobeContextType | undefined>(undefined);

export const WardrobeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safety timeout: if session check takes > 5s, stop loading anyway
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
  }, []);

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
  }, [user]);

  const loginWithEmail = async (email: string, password: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      console.log('Logged in successfully!');
    } catch (err: any) {
      console.error(err.message || 'Login failed');
    }
  };

  const signupWithEmail = async (email: string, password: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password
      });
      if (error) throw error;
      console.log('Sign up successful! Please check your email for verification.');
    } catch (err: any) {
      console.error(err.message || 'Sign up failed');
    }
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    console.log('Logged out');
  };

  const uploadImageToStorage = async (base64Str: string): Promise<string> => {
    if (!base64Str.startsWith('data:image')) return base64Str; // Already a URL
    
    // Extract base64 part
    const [, base64Data] = base64Str.split(',');
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    const blob = new Blob(byteArrays, { type: 'image/jpeg' });
    
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    const { data, error } = await supabase.storage.from('wardrobe-images').upload(user!.id + '/' + fileName, blob);
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage.from('wardrobe-images').getPublicUrl(data.path);
    return publicUrl;
  };

  const setProfile = async (p: UserProfile): Promise<void> => {
    if (!user) {
        setProfileState(p);
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
            updated_at: new Date().toISOString()
        });
        if (error) throw error;
        setProfileState(p);
        console.log("Profile saved!");
    } catch (error: any) {
        console.error('Could not save profile: ' + error.message);
    }
  };

  const addClothingItem = async (item: ClothingItem): Promise<void> => {
    if (!user) return;
    try {
      // Upload image
      let imageUrl = item.image;
      if (item.image.length > 200) { // arbitrary length to check for base64
          console.log("Uploading image...");
          imageUrl = await uploadImageToStorage(item.image);
      }
      
      const dbItem = {
          // don't pass ID, let db generate it or use item.id if valid uuid
          user_id: user.id,
          image_url: imageUrl,
          category: item.category,
          color: item.color,
          style: item.style,
          material: item.material,
          description: item.description
      };
      
      const { data, error } = await supabase.from('clothing_items').insert(dbItem).select().single();
      if (error) throw error;
      
      // Update local state with the returned ID
      const newItem = { ...item, id: data.id, image: data.image_url };
      setClothes(prev => [newItem, ...prev]);
      console.log('Item added to your closet!');
      
    } catch (error: any) {
      console.error('Failed to add item: ' + error.message);
    }
  };

  const deleteClothingItem = async (id: string): Promise<void> => {
    try {
        const { error } = await supabase.from('clothing_items').delete().eq('id', id);
        if (error) throw error;
        setClothes((prev) => prev.filter((c) => c.id !== id));
        console.log('Item removed from closet');
    } catch (error: any) {
        console.error('Could not delete item: ' + error.message);
    }
  };

  const saveOutfit = async (outfit: Outfit): Promise<void> => {
    if (!user) return;
    try {
        const { data, error } = await supabase.from('outfits').insert({
            user_id: user.id,
            notes: outfit.notes
        }).select().single();
        if (error) throw error;
        
        const outfitId = data.id;
        
        if (outfit.items.length > 0) {
            const outfitItems = outfit.items.map(item => ({
                outfit_id: outfitId,
                clothing_id: typeof item === 'string' ? item : item.id
            }));
            const { error: itemsError } = await supabase.from('outfit_items').insert(outfitItems);
            if (itemsError) throw itemsError;
        }

        setSavedOutfits((prev) => [{ ...outfit, id: outfitId }, ...prev]);
        console.log('Outfit saved!');
    } catch (error: any) {
        console.error('Could not save outfit: ' + error.message);
    }
  };

  const deleteOutfit = async (id: string): Promise<void> => {
    try {
        const { error } = await supabase.from('outfits').delete().eq('id', id);
        if (error) throw error;
        setSavedOutfits((prev) => prev.filter((o) => o.id !== id));
        console.log('Outfit deleted');
    } catch (error: any) {
        console.error('Could not delete outfit: ' + error.message);
    }
  };

  const addCalendarEvent = async (event: CalendarEvent): Promise<void> => {
    if (!user) return;
    try {
        const { data, error } = await supabase.from('calendar_events').insert({
            user_id: user.id,
            date: event.date,
            title: event.title,
            outfit_id: event.outfitId || null
        }).select().single();
        if (error) throw error;
        
        setCalendarEvents((prev) => [...prev, { ...event, id: data.id }]);
        console.log('Event added to calendar!');
    } catch (error: any) {
        console.error('Could not add event: ' + error.message);
    }
  };

  return (
    <WardrobeContext.Provider
      value={{
        user, loginWithEmail, signupWithEmail, logout, loading,
        profile, setProfile,
        clothes, addClothingItem, deleteClothingItem,
        savedOutfits, saveOutfit, deleteOutfit,
        calendarEvents, addCalendarEvent,
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
