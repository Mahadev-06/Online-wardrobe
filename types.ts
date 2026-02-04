
export enum ClothingCategory {
  TOP = 'Top',
  BOTTOM = 'Bottom',
  DRESS = 'Dress',
  SHOES = 'Shoes',
  OUTERWEAR = 'Outerwear',
  ACCESSORY = 'Accessory',
}

export interface ClothingItem {
  id: string;
  image: string; // Base64
  category: ClothingCategory;
  color: string;
  style: string;
  material?: string;
  description: string;
  dateAdded: number;
}

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    photoUrl?: string;
}

export interface UserProfile {
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  height: number; // cm
  weight: number; // kg
  skinTone: string; // Description
  skinToneHex: string; // Hex code for the mannequin
  stylePreference?: string;
  bodyPhoto?: string; // Base64 full body photo
}

export interface TryOnImages {
  front?: string;
  left?: string;
  right?: string;
  back?: string;
}

export interface Outfit {
  id: string;
  items: ClothingItem[];
  date?: string; // ISO date string creation
  notes?: string;
  aiFeedback?: string;
  tryOnImages?: TryOnImages;
}

export interface CalendarEvent {
  date: string; // ISO string
  title: string;
  outfitId: string;
}

export interface SharedLook {
  id: string;
  user: string;
  outfit: Outfit;
  likes: number;
  comments: string[];
}
