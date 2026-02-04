
import { GoogleGenAI, Type } from "@google/genai";
import { ClothingItem, UserProfile, TryOnImages } from "../types";

// Safely initialize AI to prevent top-level crashes if env var is missing
let ai: GoogleGenAI | null = null;

try {
  // process.env.API_KEY is replaced by Vite at build time
  const apiKey = process.env.API_KEY;
  if (apiKey && typeof apiKey === 'string' && apiKey.length > 0) {
      ai = new GoogleGenAI({ apiKey });
  } else {
      console.warn("Gemini API Key is missing. AI features will not work.");
  }
} catch (e) {
  console.error("Failed to initialize GoogleGenAI:", e);
}

// Helper to check status in UI
export const isAiConfigured = () => {
    return ai !== null;
};

// Helper to access AI instance safely
const getAi = () => {
    if (!ai) {
        throw new Error("MISSING_API_KEY");
    }
    return ai;
};

// Helper to clean base64 string
const cleanBase64 = (str: string) => str.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

// Helper for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeClothingImage = async (base64Image: string, retryCount = 0): Promise<Partial<ClothingItem>> => {
  try {
    const client = getAi();
    const data = cleanBase64(base64Image);
    
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: data,
            },
          },
          {
            text: `Analyze this clothing item with the expertise of a fashion designer. 
            
            Identify the following:
            1. Category: (Top, Bottom, Dress, Shoes, Outerwear, Accessory)
            2. Color: Be specific (e.g., 'Crimson Red' instead of just 'Red', 'Sage Green' instead of 'Green').
            3. Material: Estimate the fabric composition or texture specificities (e.g., 'Ribbed Cotton', 'Satin Silk', 'Distressed Denim', 'Faux Leather').
            4. Style: List 2-3 key aesthetic keywords (e.g., 'Streetwear, Minimalist, Y2K', 'Business Casual, Preppy').
            5. Description: A concise editorial description suitable for a catalog.
            
            Return strictly JSON.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                category: { type: Type.STRING },
                color: { type: Type.STRING },
                style: { type: Type.STRING },
                material: { type: Type.STRING },
                description: { type: Type.STRING },
            }
        }
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No response from AI");
  } catch (error: any) {
    if (error.message === "MISSING_API_KEY") {
        throw new Error("API Key Missing. Please add API_KEY to Vercel Environment Variables.");
    }

    // Handle Rate Limits (429 / RESOURCE_EXHAUSTED)
    const isRateLimit = error?.status === 429 || 
                        error?.status === 'RESOURCE_EXHAUSTED' || 
                        (error?.message && error.message.includes('429')) ||
                        (error?.message && error.message.includes('quota'));

    if (isRateLimit && retryCount < 5) {
        // Exponential backoff: 5000, 7500, 11250, 16875, 25312 ms
        const backoffTime = 5000 * Math.pow(1.5, retryCount); 
        console.warn(`Rate limit hit for analysis. Retrying in ${backoffTime}ms... (Attempt ${retryCount + 1}/5)`);
        await delay(backoffTime);
        return analyzeClothingImage(base64Image, retryCount + 1);
    }

    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const suggestOutfit = async (profile: UserProfile, items: ClothingItem[], occasion: string, retryCount = 0): Promise<{ suggestion: string, recommendedItemIds: string[] }> => {
  try {
    const client = getAi();
    const wardrobeInventory = items.map(item => ({
      id: item.id,
      category: item.category,
      color: item.color,
      style: item.style,
      material: item.material,
      description: item.description
    }));

    const prompt = `
      Act as a professional fashion stylist.
      
      User Profile:
      - Height: ${profile.height}cm
      - Weight: ${profile.weight}kg
      - Skin Tone: ${profile.skinTone}
      
      Occasion/Context: ${occasion}
      ${profile.stylePreference ? `- Style Preference: ${profile.stylePreference}` : ''}
      
      Wardrobe Inventory:
      ${JSON.stringify(wardrobeInventory)}
      
      Task:
      Select the best outfit combination from the inventory for this user and occasion.
      Explain why these items work together and how they complement the user's features (height, skin tone).
      
      Return a JSON object with:
      1. 'suggestion': A friendly paragraph explaining the choice.
      2. 'recommendedItemIds': An array of the IDs of the selected items.
    `;

    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
         responseSchema: {
            type: Type.OBJECT,
            properties: {
                suggestion: { type: Type.STRING },
                recommendedItemIds: { 
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        }
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No suggestion generated");

  } catch (error: any) {
    if (error.message === "MISSING_API_KEY") {
        return { suggestion: "AI Stylist is offline. Please configure the API_KEY in Vercel settings.", recommendedItemIds: [] };
    }

    const isRateLimit = error?.status === 429 || 
                        error?.status === 'RESOURCE_EXHAUSTED' || 
                        (error?.message && error.message.includes('429')) ||
                        (error?.message && error.message.includes('quota'));

    if (isRateLimit && retryCount < 5) {
        const backoffTime = 5000 * Math.pow(1.5, retryCount);
        console.warn(`Rate limit hit for suggestion. Retrying in ${backoffTime}ms... (Attempt ${retryCount + 1}/5)`);
        await delay(backoffTime);
        return suggestOutfit(profile, items, occasion, retryCount + 1);
    }

    console.error("Gemini Suggestion Error:", error);
    return { suggestion: "I couldn't generate a suggestion right now due to high traffic. Try adding more items!", recommendedItemIds: [] };
  }
};

const generateSingleAngleTryOn = async (userPhoto: string, items: ClothingItem[], angle: string, retryCount = 0): Promise<string> => {
    try {
        const client = getAi();
        const parts = [];
    
        // 1. Add User Photo
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanBase64(userPhoto)
          }
        });
    
        // 2. Add Clothing Items
        items.forEach(item => {
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64(item.image)
            }
          });
        });
    
        // 3. Add Strict Prompt
        const itemDescriptions = items.map(i => `${i.color} ${i.category} (${i.description})`).join(', ');
        const prompt = `
          Generate a realistic virtual try-on image.
          The first image provided is the user (reference model).
          The subsequent images are the ONLY clothing items to be worn.
          
          Task: Generate a high-quality image of the user wearing these specific items from a ${angle} angle.
          
          Strict Rules:
          1. Replace the user's original clothes with ONLY the items provided in the input images (${itemDescriptions}).
          2. Do NOT add any extra accessories, bags, hats, or jewelry that are not in the input.
          3. Do NOT change the user's body shape or face.
          4. The background should be neutral or identical to the original user photo.
          5. Perspective: This must be a ${angle} view.
        `;
        
        parts.push({ text: prompt });
    
        const response = await client.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: parts },
          config: {}
        });
    
        // Extract image
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
    
        throw new Error(`No image generated for ${angle}`);
      } catch (error: any) {
        if (error.message === "MISSING_API_KEY") {
            throw new Error("API Key Missing. Check Vercel Settings.");
        }

        // Handle Rate Limits (429 / RESOURCE_EXHAUSTED)
        const isRateLimit = error?.status === 429 || 
                            error?.status === 'RESOURCE_EXHAUSTED' || 
                            (error?.message && error.message.includes('429')) ||
                            (error?.message && error.message.includes('quota'));

        if (isRateLimit && retryCount < 5) {
            const backoffTime = 5000 * Math.pow(1.5, retryCount); // Exponential backoff for images
            console.warn(`Rate limit hit for ${angle}. Retrying in ${backoffTime}ms... (Attempt ${retryCount + 1}/5)`);
            await delay(backoffTime);
            return generateSingleAngleTryOn(userPhoto, items, angle, retryCount + 1);
        }

        console.error(`Gemini Try-On Error (${angle}):`, error);
        throw error;
      }
}

export const generateVirtualTryOn = async (userPhoto: string, items: ClothingItem[]): Promise<string> => {
    return generateSingleAngleTryOn(userPhoto, items, "Front View");
};

export const generateTryOnTurnaround = async (userPhoto: string, items: ClothingItem[]): Promise<TryOnImages> => {
    try {
        // Run requests SEQUENTIALLY with strict delays to avoid rate limits (429 RESOURCE_EXHAUSTED).
        
        const front = await generateSingleAngleTryOn(userPhoto, items, "Front View");
        await delay(4000); // 4s delay
        
        const left = await generateSingleAngleTryOn(userPhoto, items, "Left Side Profile");
        await delay(4000);
        
        const right = await generateSingleAngleTryOn(userPhoto, items, "Right Side Profile");
        await delay(4000);
        
        const back = await generateSingleAngleTryOn(userPhoto, items, "Back View (Rear)");

        return {
            front,
            left,
            right,
            back
        };
    } catch (error) {
        console.error("Turnaround Generation Failed", error);
        throw error;
    }
}
