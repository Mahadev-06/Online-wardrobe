import { GoogleGenerativeAI } from "@google/generative-ai";
import { verifyUser, checkRateLimit, sanitizeText } from "./_auth.js";

const API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-pro",
  "gemini-flash-latest",
  "gemini-1.5-flash",
  "gemini-1.5-pro-latest"
];

async function generateWithFallback(prompt: string) {
  let lastError = null;
  for (const modelName of MODELS) {
    try {
      console.log(`[Backend API] Attempting review with model: ${modelName}`);
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

  // 2. Enforce 10s Rate Limit
  const { allowed, waitTime } = await checkRateLimit(user.id, 'review', 10);
  if (!allowed) {
    return res.status(429).send(`Rate limit exceeded. Please wait ${waitTime} seconds before creating another outfit review.`);
  }

  const { selectedItems, profile: rawProfile } = req.body;
  
  if (!selectedItems || selectedItems.length === 0) {
    return res.status(400).send('Selected items are required');
  }

  if (!rawProfile) {
    return res.status(400).send('Profile is required');
  }

  const profile = {
    gender: sanitizeText(rawProfile.gender || '', 30),
    bodyType: sanitizeText(rawProfile.bodyType || 'Average', 30),
    skinTone: sanitizeText(rawProfile.skinTone || '', 30),
    skinToneHex: sanitizeText(rawProfile.skinToneHex || '', 10),
    stylePreference: sanitizeText(rawProfile.stylePreference || '', 50),
    height: Number(rawProfile.height) || 170,
    weight: Number(rawProfile.weight) || 65,
  };

  if (!API_KEY) {
    return res.status(500).send('Gemini API Key is not configured on the server.');
  }

  try {
    const itemsDescription = selectedItems.map((i: any) => 
      `- ${i.category}: ${sanitizeText(i.color || '', 30)} ${sanitizeText(i.style || '', 55)} ${sanitizeText(i.description || '', 100)}`
    ).join('\n');
    
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

CRITICAL — Personalized Critique & Suitability Check:
- You MUST evaluate whether the outfit suits the client's specific physical proportions (height, weight, body type).
- Be completely honest, analytical, and professional. If a combination or item does not flatter them, you MUST explicitly state that it will not suit them.
- SPECIFIC SILHOUETTE RULE: If the client is relatively short and heavy/stout (e.g. low height and high weight, or a "Plus Size" body type), and they pair multiple oversized items (like an oversized pant and an oversized shirt), you MUST explicitly state in the review that this combination will NOT suit them well because it adds visual bulk and overwhelms a shorter frame.
- RECOMMENDATION RULE: If an item or combination is unflattering or doesn't suit their body, you MUST provide a specific, flattering alternative style recommendation (e.g. "Instead, pair a structured, well-fitted shirt with slim-fit trousers to elongate your silhouette and avoid looking overwhelmed by fabric.").
- You MUST explicitly reference the client's body type ("${profile.bodyType || 'Average'}"), skin tone ("${profile.skinTone || 'Medium'}"), height (${profile.height || 170}cm), and weight (${profile.weight || 65}kg) in your review.

Response Format: Return ONLY a raw JSON object matching the schema below. No markdown, no code blocks.

JSON Schema:
{
    "score": 8,
    "review": "A sophisticated, analytical, and deeply personalized critique (3-4 sentences). You MUST mention the client's body type, skin tone, height, and weight. Use high-end fashion vocabulary to explain color coordination against their skin tone, how the silhouette works with their body type and proportions, and overall style alignment. Be honest — point out any clashes in formality, silhouette weight, or color tone relative to their specific physique. If the outfit does not suit their height, weight, and body type (such as double oversized garments on a short/heavy frame), clearly state that it will not suit them and provide a specific, flattering style recommendation instead."
}`;

    const result = await generateWithFallback(prompt);
    const rawText = result.response.text();
    
    // Robust JSON extraction
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
      throw new Error("AI returned unexpected format: " + rawText);
    }

    return res.status(200).json(parsed);
  } catch (err: any) {
    console.error("Server API Review Error:", err);
    return res.status(500).send(err.message || 'Error generating outfit review');
  }
}
