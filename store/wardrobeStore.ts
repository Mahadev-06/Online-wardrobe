import { create } from 'zustand';
import { ClothingItem, Outfit, UserProfile, ClothingCategory } from '../types';
import { supabase } from '../services/supabase';
import { generateOutfitRecommendation } from '../services/ai';

interface WardrobeState {
  clothes: ClothingItem[];
  savedOutfits: Outfit[];
  recommendation: { outfitItemIds: string[]; reasoning: string } | null;
  loadingRec: boolean;
  recError: string | null;
  customRecommendation: { outfitItemIds: string[]; reasoning: string } | null;
  customLoading: boolean;

  setClothes: (clothes: ClothingItem[]) => void;
  setSavedOutfits: (outfits: Outfit[]) => void;
  setRecommendation: (rec: { outfitItemIds: string[]; reasoning: string } | null) => void;
  setLoadingRec: (loading: boolean) => void;
  setRecError: (error: string | null) => void;

  addClothingItem: (item: ClothingItem, userId: string) => Promise<void>;
  deleteClothingItem: (id: string) => Promise<void>;
  saveOutfit: (outfit: Outfit, userId: string) => Promise<void>;
  deleteOutfit: (id: string) => Promise<void>;
  generateCustomRecommendation: (occasion: string, weather: string, profile: UserProfile) => Promise<void>;
  clearCustomRecommendation: () => void;
}

const calculateHash = async (base64Str: string): Promise<string> => {
  const msgUint8 = new TextEncoder().encode(base64Str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const uploadImageToStorage = async (base64Str: string, userId: string): Promise<string> => {
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
  const { data, error } = await supabase.storage.from('wardrobe-images').upload(userId + '/' + fileName, blob);
  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage.from('wardrobe-images').getPublicUrl(data.path);
  return publicUrl;
};

export const useWardrobeStore = create<WardrobeState>((set, get) => ({
  clothes: [],
  savedOutfits: [],
  recommendation: null,
  loadingRec: false,
  recError: null,
  customRecommendation: null,
  customLoading: false,

  setClothes: (clothes) => set({ clothes }),
  setSavedOutfits: (savedOutfits) => set({ savedOutfits }),
  setRecommendation: (recommendation) => set({ recommendation }),
  setLoadingRec: (loadingRec) => set({ loadingRec }),
  setRecError: (recError) => set({ recError }),

  addClothingItem: async (item, userId) => {
    try {
      // 1. Quota Check (Max 100 items)
      const { count, error: countError } = await supabase
        .from('clothing_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
        
      if (countError) throw countError;
      if (count !== null && count >= 100) {
        throw new Error("Closet quota exceeded: You can only have up to 100 items in your closet.");
      }

      // 2. Hash Calculation & Duplicate Detection
      const hash = await calculateHash(item.image);
      const { data: duplicate } = await supabase
        .from('clothing_items')
        .select('id')
        .eq('user_id', userId)
        .eq('image_hash', hash)
        .maybeSingle();

      if (duplicate) {
        throw new Error("Duplicate item: This clothing item is already in your closet.");
      }

      // 3. Image Upload
      let imageUrl = item.image;
      if (item.image.length > 200) {
        console.log("Uploading image...");
        imageUrl = await uploadImageToStorage(item.image, userId);
      }

      const dbItem = {
        user_id: userId,
        image_url: imageUrl,
        category: item.category,
        color: item.color,
        style: item.style,
        material: item.material,
        description: item.description,
        season_suitability: item.seasonSuitability || [],
        image_hash: hash
      };

      const { data, error } = await supabase.from('clothing_items').insert(dbItem).select().single();
      if (error) throw error;

      const newItem: ClothingItem = { 
        ...item, 
        id: data.id, 
        image: data.image_url 
      };
      set(state => ({ clothes: [newItem, ...state.clothes] }));
      console.log('Item added to your closet!');
    } catch (error: any) {
      console.error('Failed to add item: ' + error.message);
      throw error;
    }
  },

  deleteClothingItem: async (id) => {
    try {
      const { error } = await supabase.from('clothing_items').delete().eq('id', id);
      if (error) throw error;
      set(state => ({ clothes: state.clothes.filter(c => c.id !== id) }));
      console.log('Item removed from closet');
    } catch (error: any) {
      console.error('Could not delete item: ' + error.message);
      throw error;
    }
  },

  saveOutfit: async (outfit, userId) => {
    try {
      // 1. Quota Check (Max 50 outfits)
      const { count, error: countError } = await supabase
        .from('outfits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
        
      if (countError) throw countError;
      if (count !== null && count >= 50) {
        throw new Error("Outfit quota exceeded: You can only have up to 50 saved outfits.");
      }

      const { data, error } = await supabase.from('outfits').insert({
        user_id: userId,
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

      set(state => ({ savedOutfits: [{ ...outfit, id: outfitId }, ...state.savedOutfits] }));
      console.log('Outfit saved!');
    } catch (error: any) {
      console.error('Could not save outfit: ' + error.message);
      throw error;
    }
  },

  deleteOutfit: async (id) => {
    try {
      const { error } = await supabase.from('outfits').delete().eq('id', id);
      if (error) throw error;
      set(state => ({ savedOutfits: state.savedOutfits.filter(o => o.id !== id) }));
      console.log('Outfit deleted');
    } catch (error: any) {
      console.error('Could not delete outfit: ' + error.message);
      throw error;
    }
  },

  generateCustomRecommendation: async (occasion, weather, profile) => {
    const { clothes } = get();
    if (clothes.length < 2 || !profile) return;
    set({ customLoading: true });
    try {
      const res = await generateOutfitRecommendation(clothes, profile, occasion, weather);
      if (res.success) {
        set({
          customRecommendation: {
            outfitItemIds: res.outfitItemIds || [],
            reasoning: res.reasoning
          }
        });
      } else {
        throw new Error(res.reasoning);
      }
    } catch (err) {
      console.error("Custom AI Stylist generation failed:", err);
      throw err;
    } finally {
      set({ customLoading: false });
    }
  },

  clearCustomRecommendation: () => {
    set({ customRecommendation: null });
  }
}));
