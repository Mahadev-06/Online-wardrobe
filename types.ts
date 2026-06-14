
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
  secondaryColor?: string;
  pattern?: string;
  style: string; // General style like "Casual, Streetwear"
  material?: string;
  occasionTags?: string[];
  seasonSuitability?: string[];
  description: string;
  isValidClothing?: boolean;
  aiConfidenceScore?: number;
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
  bodyType: string; // e.g. "Slim", "Athletic", "Average", "Curvy", "Plus Size"
  stylePreference?: string;
  bodyPhoto?: string; // Base64 full body photo
}



export interface Outfit {
  id: string;
  items: ClothingItem[];
  date?: string; // ISO date string creation
  notes?: string;
}

export interface CalendarEvent {
  id?: string;
  date: string; // ISO string
  title: string;
  outfitId: string;
}
