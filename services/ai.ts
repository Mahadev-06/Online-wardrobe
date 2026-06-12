import { GoogleGenerativeAI } from "@google/generative-ai";
import { ClothingItem, UserProfile } from "../types";

// Initialize Gemini SDK for local development
const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// Determine if we are running in local development mode
const isLocal = (import.meta as any).env.DEV;

const MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-pro",
    "gemini-flash-latest",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro-latest"
];

async function localGenerateWithFallback(prompt: string, imageParts?: any[]) {
    let lastError = null;
    for (const modelName of MODELS) {
        try {
            console.log(`[Local SDK] Attempting generation with model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            if (imageParts && imageParts.length > 0) {
                return await model.generateContent([prompt, ...imageParts]);
            } else {
                return await model.generateContent(prompt);
            }
        } catch (err) {
            console.warn(`[Local SDK] Model ${modelName} failed or unavailable:`, err);
            lastError = err;
        }
    }
    throw lastError || new Error("All fallback models failed.");
}

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
/**
 * Local implementation of clothing image analysis (direct SDK call)
 */
async function analyzeLocally(base64Image: string): Promise<AnalysisResult> {
    if (!API_KEY) {
        throw new Error("Gemini API Key is missing. Please add VITE_GEMINI_API_KEY in your local environment (.env.local)");
    }
    try {
        const prompt = `You are a professional fashion AI and wardrobe supervisor.
Analyze the provided image of a clothing item, footwear, or fashion accessory.
Return a STRICT JSON object with the following fields:

1. is_clothing: boolean (True if this image clearly depicts a standalone clothing piece, pair of shoes, or fashion accessory. Return false if the image contains human faces, pets, scenery, or non-fashion items).
2. confidence: number (Confidence score between 0.0 and 1.0)
3. message: string (Explain the classification decision. If is_clothing is false, explain why).
4. metadata: object (Include ONLY if is_clothing is true):
   - category: (MUST be one of: "Top", "Bottom", "Dress", "Shoes", "Outerwear", "Accessory")
   - color_primary: string (Main dominant color, e.g. Navy Blue, Emerald Green, Charcoal Grey, Crimson)
   - color_secondary: string (Secondary color or pattern details, or "None")
   - pattern: string (Solid, Striped, Printed, Checked, Polka Dot, Floral, etc.)
   - occasion: array of strings (Selected from: casual, formal, party, business, lounge, activewear)
   - season: array of strings (Selected from: summer, winter, all-season)
   - material: string (Cotton, Denim, Leather, Polyester, Silk, Wool, Linen, etc. - identify or choose closest matching fabric)

DO NOT return markdown code blocks like \`\`\`json. Return strictly the raw JSON structure!`;
        const base64Data = base64Image.split(',')[1] || base64Image;
        const imageParts = [
            {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg"
                }
            }
        ];

        const result = await localGenerateWithFallback(prompt, imageParts);
        const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(responseText) as AnalysisResult;
    } catch (err) {
        console.error("Local analyzeLocally error:", err);
        throw err;
    }
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
            seasons: c.seasonSuitability || []
        };
    });

    const prompt = `You are an elite, high-end personal fashion stylist and image consultant. Your client is seeking a personalized look from their wardrobe that matches their body profile, the occasion, and the weather.

OCCASION: ${occasion}
WEATHER: ${weather}

CLIENT PROFILE:
- Gender: ${profile.gender || 'Not specified'}
- Height: ${profile.height || 170} cm
- Weight: ${profile.weight || 65} kg
- Body Type: ${profile.bodyType || 'Average'}
- Skin Tone: ${profile.skinTone || 'Not specified'} (Hex: ${profile.skinToneHex || 'N/A'})
- Style Preference: ${profile.stylePreference || 'Not specified'}

WARDROBE ITEMS AVAILABLE:
${safePool.map(item => `- ${item.id}: ${item.category}, color: ${item.color}, style/occasion tags: ${item.style}, seasons: ${item.seasons.join(', ')}, description: ${item.description}`).join('\n')}

RULES:
1. Selection: Pick ONLY item IDs listed in the wardrobe above (e.g., item_1, item_2, etc.).
2. Outfit Structure: The outfit must contain either [Top + Bottom] or [Dress]. You should also select Shoes, and optionally Outerwear (highly recommended if weather is cold, winter, or rainy) and Accessories (watches, bags, jewelry) if they are in the wardrobe and fit the look.
3. Aesthetic Standards: Mix colors, textures, and styles to curate a high-fashion, cohesive look. Respect the client's body profile (height/weight/body type/skin tone) and style preferences.
4. CRITICAL — Weather Suitability: Check if there are wardrobe items suitable for the current weather (e.g. if the weather is freezing/winter, the user needs long pants, warm tops, or coats). If no clothes in the wardrobe are appropriate for the current weather, you MUST return an empty array for "outfitItemIds" (i.e. []) and write a very concise stylist's recommendation in the "reasoning" field explaining why and suggesting what they should add to their wardrobe (e.g. "Because it is freezing winter and your digital closet only contains lightweight summer items, no outfit can be recommended. I recommend adding sweaters or a winter coat to your closet.").
5. CRITICAL — Personalized Reasoning: Your reasoning paragraph MUST explicitly reference the client's body type ("${profile.bodyType || 'Average'}"), skin tone ("${profile.skinTone || 'Medium'}"), height (${profile.height || 170}cm), and weight (${profile.weight || 65}kg) by name. Keep it extremely concise (1-2 sentences, max 40 words total).
6. Response Format: Return ONLY a raw JSON object matching the schema below. No markdown formatting, no code blocks, no trailing text.

JSON Schema:
{
    "outfitItemIds": ["item_1", "item_2", ...],
    "reasoning": "A highly concise, professional, and personalized explanation (strictly 1-2 sentences, max 40 words total) from a premium stylist's perspective. You MUST mention the client's body type, skin tone, height, and weight by name. Discuss how the outfit fits their body metrics and weather concisely. If no outfit was selected due to weather mismatch, explain the reason and provide a very concise recommendation of what they should add to their closet."
}`;

    const result = await localGenerateWithFallback(prompt);
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
                return { success: false, outfitItemIds: [], reasoning: "Gemini API Key is missing. Please add VITE_GEMINI_API_KEY in your local environment (.env.local)" };
            }
            return await recommendLocally(availableClothes, profile, occasion, weather);
        } catch (err: any) {
            console.error("Local AI Recommendation Error:", err);
            return {
                success: false,
                outfitItemIds: [],
                reasoning: `Failed to generate AI recommendation. Error: ${err.message || 'Unknown API Error'}`
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
                reasoning: `Server API Error: ${errText || "Failed to generate recommendation."}`
            };
        }

        return await response.json();
    } catch (err: any) {
        console.error("Production AI Recommendation Error:", err);
        return {
            success: false,
            outfitItemIds: [],
            reasoning: `Network Error: ${err.message || "Failed to connect to AI service."}`
        };
    }
}

/**
 * Evaluates a manually constructed outfit and gives a brutally honest fashion review.
 */
export async function reviewOutfit(
    selectedItems: ClothingItem[],
    profile: UserProfile
): Promise<{ success: boolean; score: number; review: string }> {
    if (selectedItems.length === 0) {
        return { success: false, score: 0, review: "You haven't selected any clothes to review." };
    }

    const itemsDescription = selectedItems.map(i => `- ${i.category}: ${i.color} ${i.style} ${i.description}`).join('\n');
    
    const prompt = `You are an elite, world-class fashion critic and stylist. Critique this outfit curated by the client.

OUTFIT PIECES SELECTED:
${itemsDescription}

CLIENT PROFILE:
- Gender: ${profile.gender || 'Not specified'}
- Height: ${profile.height || 170} cm
- Weight: ${profile.weight || 65} kg
- Body Type: ${profile.bodyType || 'Average'}
- Skin Tone: ${profile.skinTone || 'Not specified'} (Hex: ${profile.skinToneHex || 'Not specified'})
- Style Preference: ${profile.stylePreference || 'Not specified'}

STYLING GUIDELINES:
Evaluate this outfit based on elite fashion principles: color theory and contrast matching their ${profile.skinTone || 'medium'} skin tone, structural proportions complementing their ${profile.bodyType || 'average'} body type at ${profile.height || 170}cm and ${profile.weight || 65}kg, texture synergy, and style cohesion.

CRITICAL — Personalized Critique:
- You MUST explicitly reference the client's body type ("${profile.bodyType || 'Average'}"), skin tone ("${profile.skinTone || 'Medium'}"), height (${profile.height || 170}cm), and weight (${profile.weight || 65}kg) in your review.
- Be completely honest, analytical, and professional. If a piece doesn't flatter their ${profile.bodyType || 'average'} body type, say so diplomatically.
- For example: "For your ${profile.bodyType || 'average'} frame at ${profile.height || 170}cm, this oversized silhouette may add unnecessary visual bulk — a more structured fit would better define your waist."
- Or: "The warm undertones of this top beautifully complement your ${profile.skinTone || 'medium'} complexion, creating a harmonious color story."

Response Format: Return ONLY a raw JSON object matching the schema below. No markdown, no code blocks.

JSON Schema:
{
    "score": 8,
    "review": "A sophisticated, analytical, and deeply personalized critique (3-4 sentences). You MUST mention the client's body type, skin tone, height, and weight. Use high-end fashion vocabulary to explain color coordination against their skin tone, how the silhouette works with their body type and proportions, and overall style alignment. Be honest — point out any clashes in formality, silhouette weight, or color tone relative to their specific physique."
}`;

    try {
        if (!API_KEY) {
            throw new Error("Gemini API Key is missing. Please add VITE_GEMINI_API_KEY in your local environment (.env.local)");
        }
        const result = await localGenerateWithFallback(prompt);
        const rawText = result.response.text();
        
        let parsed: any = null;
        const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        try {
            parsed = JSON.parse(cleaned);
        } catch (_) {
            const jsonMatch = rawText.match(/\{[\s\S]*"score"[\s\S]*"review"[\s\S]*\}/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            }
        }

        if (!parsed || typeof parsed.score !== 'number' || !parsed.review) {
            throw new Error("AI returned unexpected format");
        }

        return {
            success: true,
            score: parsed.score,
            review: parsed.review
        };
    } catch (err: any) {
        console.error("Review Error:", err);
        return { success: false, score: 0, review: `Failed to review outfit. Error: ${err.message || 'Unknown AI Error'}` };
    }
}
