import { GoogleGenerativeAI } from "@google/generative-ai";
import { ClothingItem, UserProfile } from "../types";

// Initialize Gemini SDK for local development
const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// Determine if we are running in local development mode
const isLocal = (import.meta as any).env.DEV;

interface AnalysisResult {
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

/**
 * Local implementation of clothing image analysis (direct SDK call)
 */
async function analyzeLocally(base64Image: string): Promise<AnalysisResult> {
    if (!API_KEY) {
        throw new Error("Gemini API Key missing.");
    }
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
You are an expert fashion AI and wardrobe supervisor.
Analyze this image and return a STRICT JSON object answering the following:

1. is_clothing: boolean (Is this image clearly a standalone piece of clothing or footwear? Return false if it is a human face, randomly cropped scenery, an animal, or unidentifiable object).
2. confidence: number (0.0 to 1.0)
3. message: string (If is_clothing is false, explain why).
4. metadata: object (If is_clothing is true, provide the following details):
   - category: (Choose ONE: "Top", "Bottom", "Dress", "Shoes", "Outerwear", "Accessory")
   - color_primary: string
   - color_secondary: string
   - pattern: string (Solid, Striped, Printed, Checked, etc.)
   - occasion: array of strings (casual, formal, party, business, lounge, activewear)
   - season: array of strings (summer, winter, all-season)
   - material: string (Cotton, Denim, Leather, Polyester, Silk, Wool, Linen, etc. - choose the closest matching fabric type)

DO NOT return markdown code blocks like \`\`\`json. Return strictly the raw JSON structure!
`;
    const base64Data = base64Image.split(',')[1] || base64Image;
    const imageParts = [
        {
            inlineData: {
                data: base64Data,
                mimeType: "image/jpeg"
            }
        }
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(responseText) as AnalysisResult;
}

/**
 * Local implementation of outfit recommendation (direct SDK call)
 */
async function recommendLocally(
    availableClothes: ClothingItem[],
    profile: UserProfile,
    occasion: string,
    weather: string
): Promise<{ success: boolean; outfitItemIds: string[]; reasoning: string }> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const idMap = new Map<string, string>();
    const safePool = availableClothes.map((c, idx) => {
        const shortId = `item_${idx + 1}`;
        idMap.set(shortId, c.id);
        return {
            id: shortId,
            category: c.category,
            color: c.color || 'Unknown',
            style: c.style || 'Unknown',
            description: c.description || '',
        };
    });

    const prompt = `You are a fashion stylist. Pick the best outfit from the wardrobe below.

OCCASION: ${occasion}
WEATHER: ${weather}
USER: Height ${profile.height || 170}cm

WARDROBE:
${safePool.map(item => `- ${item.id}: ${item.category}, ${item.color}, ${item.style}`).join('\n')}

RULES:
1. Pick ONLY IDs from the wardrobe above (like item_1, item_2, etc.)
2. An outfit needs: [Top + Bottom] OR [Dress]. Add Shoes if available.
3. Match colors that look good together for the occasion.

Return ONLY this JSON (no markdown, no extra text):
{"outfitItemIds": ["item_X", "item_Y"], "reasoning": "Brief 1-2 sentence explanation."}`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    
    let parsed: any = null;
    const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    try {
        parsed = JSON.parse(cleaned);
    } catch (_) {
        const jsonMatch = rawText.match(/\{[\s\S]*"outfitItemIds"[\s\S]*\}/);
        if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
        }
    }

    if (!parsed || !Array.isArray(parsed.outfitItemIds)) {
        throw new Error("AI returned unexpected format");
    }

    const realIds = parsed.outfitItemIds
        .map((shortId: string) => idMap.get(shortId))
        .filter(Boolean) as string[];

    return {
        success: true,
        outfitItemIds: realIds,
        reasoning: parsed.reasoning || "Here's a stylish combination from your wardrobe!"
    };
}

/**
 * Analyzes a clothing image (Vision API).
 * Hybrid: Calls local SDK in dev mode, secure serverless API on Vercel.
 */
export async function analyzeClothingImage(base64Image: string): Promise<AnalysisResult> {
    if (isLocal) {
        console.log("[Fashion AI] Running locally using direct Gemini SDK...");
        try {
            return await analyzeLocally(base64Image);
        } catch (err) {
            console.error("Local AI Analysis Error:", err);
            throw err;
        }
    }

    console.log("[Fashion AI] Running in production: forwarding request to Vercel Serverless Function...");
    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: base64Image }),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText || 'Failed to analyze image');
        }

        return await response.json();
    } catch (err: any) {
        console.error("Production AI Analysis Error:", err);
        throw new Error(err.message || "Failed to analyze image");
    }
}

/**
 * Recommends an outfit combination based on clothes pool and criteria.
 * Hybrid: Calls local SDK in dev mode, secure serverless API on Vercel.
 */
export async function generateOutfitRecommendation(
    availableClothes: ClothingItem[],
    profile: UserProfile,
    occasion: string,
    weather: string
): Promise<{ success: boolean; outfitItemIds: string[]; reasoning: string }> {
    if (availableClothes.length < 2) {
        return { success: false, outfitItemIds: [], reasoning: "You need at least 2 clothing items in your wardrobe to generate a look." };
    }

    // Baseline checks
    const hasTop = availableClothes.some(c => c.category === 'Top');
    const hasBottom = availableClothes.some(c => c.category === 'Bottom');
    const hasDress = availableClothes.some(c => c.category === 'Dress');
    
    if (!hasDress && (!hasTop || !hasBottom)) {
        return {
            success: false,
            outfitItemIds: [],
            reasoning: "You need at least one Top and one Bottom (or a Dress) in your closet to create an outfit."
        };
    }

    if (isLocal) {
        console.log("[Fashion AI] Generating recommendation locally using direct Gemini SDK...");
        try {
            if (!API_KEY) {
                return { success: false, outfitItemIds: [], reasoning: "Gemini API Key is missing. Add it to .env.local" };
            }
            return await recommendLocally(availableClothes, profile, occasion, weather);
        } catch (err) {
            console.error("Local AI Recommendation Error:", err);
            return {
                success: false,
                outfitItemIds: [],
                reasoning: "Failed to generate recommendation. Check your local API key and connection."
            };
        }
    }

    console.log("[Fashion AI] Generating recommendation in production: forwarding request to Vercel Serverless Function...");
    try {
        const response = await fetch('/api/recommend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ availableClothes, profile, occasion, weather }),
        });

        if (!response.ok) {
            const errText = await response.text();
            return {
                success: false,
                outfitItemIds: [],
                reasoning: errText || "Failed to generate recommendation."
            };
        }

        return await response.json();
    } catch (err: any) {
        console.error("Production AI Recommendation Error:", err);
        return {
            success: false,
            outfitItemIds: [],
            reasoning: "Failed to generate look due to a network or AI service error. Please try again."
        };
    }
}
