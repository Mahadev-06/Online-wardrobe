import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-pro",
  "gemini-flash-latest",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro-latest"
];

async function generateWithFallback(prompt: string, imageParts: any[]) {
  let lastError = null;
  for (const modelName of MODELS) {
    try {
      console.log(`[Backend API] Attempting analyze with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      return await model.generateContent([prompt, ...imageParts]);
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

  const { image } = req.body;
  if (!image) {
    return res.status(400).send('Image is required');
  }

  if (!API_KEY) {
    return res.status(500).send('Gemini API Key is not configured on the server.');
  }

  try {
    const prompt = `
You are an expert fashion AI and wardrobe supervisor.
Analyze this image and return a STRICT JSON object answering the following:

1. is_clothing: boolean (Set to true if this image clearly depicts a standalone clothing piece, pair of shoes, or fashion accessory, OR if it depicts a person/human wearing visible clothes like a T-shirt, shirt, pants, dress, outerwear, etc.
   - NOTE: This site is for human wardrobe management, so images of a human wearing or modeling clothes are COMPLETELY VALID. You MUST set is_clothing to true if the person is wearing visible clothes. Do NOT reject or make the image invalid just because there is a human face, human body, or human hands showing the clothes.
   - Return false if the image contains no visible clothing, if it is only a close-up human face/headshot with no garments shown, if the person is naked, shirtless, or undressed, or if the subject is a pet, scenery, food, or non-clothing item).
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

Return ONLY the raw JSON structure!
`;
    const base64Data = image.split(',')[1] || image;
    const imageParts = [
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      }
    ];

    const result = await generateWithFallback(prompt, imageParts);
    const rawText = result.response.text();
    
    // Robust JSON extraction
    let parsed: any = null;
    const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    try {
      parsed = JSON.parse(cleaned);
    } catch (_) {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    }

    if (!parsed || typeof parsed.is_clothing !== 'boolean') {
      throw new Error("AI returned unexpected format: " + rawText);
    }

    return res.status(200).json(parsed);
  } catch (err: any) {
    console.error("Server API Analyze Error:", err);
    return res.status(500).send(err.message || 'Error analyzing image');
  }
}
