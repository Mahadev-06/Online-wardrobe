import { GoogleGenerativeAI } from "@google/generative-ai";
import { ClothingItem, UserProfile } from "../types";

// Initialize Gemini SDK
// Note: (import.meta as any) is to silence TS strict issues with Vite env vars.
const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

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
 * Analyzes a clothing image using Gemini 1.5 Flash (vision suitable).
 * It extracts features and strictly validates if the image is actually clothing to prevent hallucinations.
 */
export async function analyzeClothingImage(base64Image: string): Promise<AnalysisResult> {
    if (!API_KEY) {
        throw new Error("Gemini API Key missing.");
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

        // The image parts must be stripped of metadata
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
        
        const parsed = JSON.parse(responseText);
        return parsed as AnalysisResult;

    } catch (err) {
        console.error("AI Analysis Error:", err);
        throw new Error("Failed to analyze image mathematically. " + String(err));
    }
}

/**
 * Rule-Based + AI Hybrid Engine.
 * Suggests an outfit combination based on the available constraints and rules.
 */
export async function generateOutfitRecommendation(
    availableClothes: ClothingItem[],
    profile: UserProfile,
    occasion: string,
    weather: string
): Promise<{ success: boolean; outfitItemIds: string[]; reasoning: string }> {

    if (!API_KEY) {
        return { success: false, outfitItemIds: [], reasoning: "Gemini API Key is missing. Add it in Settings." };
    }

    if (availableClothes.length < 2) {
        return { success: false, outfitItemIds: [], reasoning: "You need at least 2 clothing items in your wardrobe to generate a look." };
    }

    // --- HYBRID RULE 1: Baseline Check ---
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

    try {
        // Use flash for speed and reliability
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Map real UUIDs to simple short IDs so the AI doesn't mangle them
        const idMap = new Map<string, string>(); // shortId -> realId
        const reverseMap = new Map<string, string>(); // realId -> shortId
        
        const safePool = availableClothes.map((c, idx) => {
            const shortId = `item_${idx + 1}`;
            idMap.set(shortId, c.id);
            reverseMap.set(c.id, shortId);
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
        console.log("AI Raw Response:", rawText);
        
        // Robust JSON extraction - try multiple approaches
        let parsed: any = null;
        
        // Approach 1: Clean markdown and parse directly
        const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        try {
            parsed = JSON.parse(cleaned);
        } catch (_) {
            // Approach 2: Extract JSON object with regex
            const jsonMatch = rawText.match(/\{[\s\S]*"outfitItemIds"[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    parsed = JSON.parse(jsonMatch[0]);
                } catch (_) {
                    console.error("Failed to parse extracted JSON:", jsonMatch[0]);
                }
            }
        }

        if (!parsed || !Array.isArray(parsed.outfitItemIds)) {
            console.error("AI returned unparseable response:", rawText);
            return {
                success: false,
                outfitItemIds: [],
                reasoning: "AI returned an unexpected format. Please try generating again."
            };
        }

        // --- HYBRID RULE 2: Map short IDs back to real UUIDs and validate ---
        const realIds = parsed.outfitItemIds
            .map((shortId: string) => idMap.get(shortId))
            .filter(Boolean) as string[];
        
        if (realIds.length === 0) {
            return {
                success: false,
                outfitItemIds: [],
                reasoning: "AI couldn't match items properly. Please try again."
            };
        }

        return {
            success: true,
            outfitItemIds: realIds,
            reasoning: parsed.reasoning || "Here's a stylish combination from your wardrobe!"
        };

    } catch (err) {
        console.error("AI Recommendation Error:", err);
        
        let errorMessage = "Failed to generate look due to a network or AI service error. Please try again.";
        const errorString = err instanceof Error ? err.message : String(err);
        
        if (errorString.includes("429") || errorString.includes("quota")) {
            errorMessage = "AI generation quota exceeded. You have reached the limit for your API key. Please wait a while or check your Gemini API plan.";
        } else if (errorString.includes("API Key is missing") || errorString.includes("API_KEY_INVALID")) {
            errorMessage = "Invalid or missing Gemini API Key. Please check your configuration.";
        }

        return {
            success: false,
            outfitItemIds: [],
            reasoning: errorMessage
        };
    }
}
