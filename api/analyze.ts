import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export default async function handler(req: any, res: any) {
  // CORS configuration for local development or Vercel edge environments
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
    const base64Data = image.split(',')[1] || image;
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
    return res.status(200).json(parsed);
  } catch (err: any) {
    console.error("Server API Analyze Error:", err);
    return res.status(500).send(err.message || 'Error analyzing image');
  }
}
