import { GoogleGenerativeAI } from "@google/generative-ai";
import { verifyUser, checkRateLimit, sanitizeText } from "./_auth";

const API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-pro",
  "gemini-flash-latest",
  "gemini-1.5-flash",
  "gemini-3.5-flash"
];

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
  const origin = req.headers.origin;
  if (origin) {
    const isAllowedOrigin = 
      origin.startsWith('http://localhost:') || 
      origin === 'https://online-wardrobe.vercel.app' ||
      origin.endsWith('.vercel.app');
      
    if (!isAllowedOrigin) {
      return res.status(403).send('Forbidden: CORS origin not allowed');
    }
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
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

  // 1. Verify User Token
  const { user, error: authError } = await verifyUser(req);
  if (authError || !user) {
    return res.status(401).send(authError || 'Unauthorized');
  }

  // 2. Enforce 15s Rate Limit
  const { allowed, waitTime } = await checkRateLimit(user.id, 'recommend', 15);
  if (!allowed) {
    return res.status(429).send(`Rate limit exceeded. Please wait ${waitTime} seconds before generating another recommendation.`);
  }

  const { availableClothes, profile: rawProfile } = req.body;
  const occasion = sanitizeText(req.body.occasion, 50);
  const weather = sanitizeText(req.body.weather, 50);
  
  if (!availableClothes || availableClothes.length === 0) {
    return res.status(400).send('Available clothes are required');
  }

  if (!rawProfile) {
    return res.status(400).send('Profile is required');
  }

  const profile = {
    gender: sanitizeText(rawProfile.gender || '', 30),
    bodyType: sanitizeText(rawProfile.bodyType || 'Average', 30),
    skinTone: sanitizeText(rawProfile.skinTone || '', 30),
    stylePreference: sanitizeText(rawProfile.stylePreference || '', 50),
    height: Number(rawProfile.height) || 170,
    weight: Number(rawProfile.weight) || 65,
  };

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
            color: sanitizeText(c.color || 'Unknown', 30),
            style: sanitizeText(c.style || 'Unknown', 50),
            description: sanitizeText(c.description || '', 100),
            seasons: Array.isArray(c.season_suitability || c.seasonSuitability) 
              ? (c.season_suitability || c.seasonSuitability).map((s: string) => sanitizeText(s, 20))
              : []
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
- Skin Tone: ${profile.skinTone || 'Not specified'}
- Style Preference: ${profile.stylePreference || 'Not specified'}

WARDROBE ITEMS AVAILABLE:
${safePool.map((item: any) => `- ${item.id}: ${item.category}, color: ${item.color}, style/occasion tags: ${item.style}, seasons: ${item.seasons.join(', ')}, description: ${item.description}`).join('\n')}

RULES:
1. Selection: Pick ONLY item IDs listed in the wardrobe above (e.g., item_1, item_2, etc.).
2. Outfit Structure: The outfit must contain either [Top + Bottom] or [Dress]. You should also select Shoes, and optionally Outerwear (highly recommended if weather is cold, winter, or rainy) and Accessories (watches, bags, jewelry) if they are in the wardrobe and fit the look.
3. Aesthetic Standards: Mix colors, textures, and styles to curate a high-fashion, cohesive look. Respect the client's body profile (height/weight/skin tone) and style preferences.
4. CRITICAL — Weather Suitability: Check if there are wardrobe items suitable for the current weather (e.g. if the weather is freezing/winter, the user needs long pants, warm tops, or coats). If no clothes in the wardrobe are appropriate for the current weather, you MUST return an empty array for "outfitItemIds" (i.e. []) and write a very concise stylist's recommendation in the "reasoning" field explaining why and suggesting what they should add to their wardrobe (e.g. "Because it is freezing winter and your digital closet only contains lightweight summer items, no outfit can be recommended. I recommend adding sweaters or a winter coat to your closet.").
5. Response Format: Return ONLY a raw JSON object matching the schema below. No markdown formatting, no code blocks, no trailing text.

JSON Schema:
{
    "outfitItemIds": ["item_1", "item_2", ...],
    "reasoning": "A highly concise, professional, and elegant explanation (strictly 1-2 sentences, max 40 words total) from a premium stylist's perspective. You MUST mention the client's body type (e.g., '${profile.bodyType || 'Average'}'), skin tone (e.g., '${profile.skinTone || 'Medium'}'), height, and weight. Discuss color and silhouette briefly. If no outfit was selected due to weather mismatch, explain the reason and provide a very concise recommendation of what they should add to their closet."
}`;

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
