import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyAR_7nlJ9MHi7aZX0nLjtAmdamRGRrlJVA";
const genAI = new GoogleGenerativeAI(API_KEY);

async function testModels() {
    const modelsToTest = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro", "gemini-pro"];
    
    for (const m of modelsToTest) {
        try {
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("Say 'hello' in one word.");
            console.log(`[Success] ${m}: `, result.response.text());
        } catch (err: any) {
            console.log(`[Error] ${m}: `, err.message);
        }
    }
}

testModels();
