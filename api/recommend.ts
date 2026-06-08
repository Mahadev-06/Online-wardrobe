import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

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
  if (!availableClothes || !profile || !occasion || !weather) {
    return res.status(400).send('Missing required fields');
  }

  if (!API_KEY) {
    return res.status(500).json({ success: false, outfitItemIds: [], reasoning: "Gemini API Key is not configured on the server." });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      outfitItemIds: realIds,
      reasoning: parsed.reasoning || "Here's a stylish combination from your wardrobe!"
    });
  } catch (err: any) {
    console.error("Server API Recommend Error:", err);
    return res.status(500).json({ success: false, outfitItemIds: [], reasoning: err.message || 'Error generating recommendation' });
  }
}
