import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-3.5-flash"];

async function generateWithFallback(prompt: string) {
  let lastError = null;
  for (const modelName of MODELS) {
    try {
      console.log(`[Backend API] Attempting recommend with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      return await model.generateContent(prompt);
    } catch (err) {
      console.warn(`[Backend API] Model ${modelName} failed or unavailable:`, err);
      lastError = err;
    }
  }
  throw lastError || new Error("All fallback models failed.");
}

export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { availableClothes, profile, occasion, weather } = req.body;
  
  if (!availableClothes || availableClothes.length === 0) {
    return res.status(400).send('Available clothes are required');
  }

  if (!API_KEY) {
    return res.status(500).send('Gemini API Key is not configured on the server.');
  }

  try {
    const idMap = new Map<string, string>();
    const safePool = availableClothes.map((c: any, idx: number) => {
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
${safePool.map((item: any) => `- ${item.id}: ${item.category}, ${item.color}, ${item.style}`).join('\n')}

RULES:
1. Pick ONLY IDs from the wardrobe above (like item_1, item_2, etc.)
2. An outfit needs: [Top + Bottom] OR [Dress]. Add Shoes if available.
3. Match colors that look good together for the occasion.

Return ONLY this JSON (no markdown, no extra text):
{"outfitItemIds": ["item_X", "item_Y"], "reasoning": "Brief 1-2 sentence explanation."}`;

    const result = await generateWithFallback(prompt);
    const rawText = result.response.text();
    
    // Robust JSON extraction
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
        throw new Error("AI returned unexpected format: " + rawText);
    }

    const realIds = parsed.outfitItemIds
        .map((shortId: string) => idMap.get(shortId))
        .filter(Boolean) as string[];

    return res.status(200).json({
        success: true,
        outfitItemIds: realIds,
        reasoning: parsed.reasoning || "Here's a stylish combination from your wardrobe!"
    });
  } catch (err: any) {
    console.error("Server API Recommend Error:", err);
    return res.status(500).send(err.message || 'Error generating recommendation');
  }
}
