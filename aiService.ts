import { GoogleGenAI, Type } from "@google/genai";

export interface VerificationResult {
  latitude: number | null;
  longitude: number | null;
  isAuthentic: boolean;
  isCampus: boolean;
  confidence: number;
  detectedAddress?: string;
  error?: string;
}

export const verifyAttendanceImage = async (base64Image: string): Promise<VerificationResult> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined") {
    throw new Error("API_KEY_MISSING: Please add the API_KEY to your deployment environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image.split(',')[1] || base64Image,
            },
          },
          {
            text: `Act as a high-precision GPS verification unit for MIT-WPU Kothrud campus.
            Analyze the provided image for:
            1. GPS Coordinates: Extract numerical Latitude and Longitude from text overlays or EXIF-style data printed on the image.
            2. Authenticity: Confirm this is a real photo of people/campus, not a photo of another screen or a digital screenshot.
            3. Context: Confirm the environment looks like a university campus setting.
            
            Return ONLY a valid JSON object. No markdown, no commentary.`
          }
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            latitude: { type: Type.NUMBER },
            longitude: { type: Type.NUMBER },
            isAuthentic: { type: Type.BOOLEAN },
            isCampus: { type: Type.BOOLEAN },
            confidence: { type: Type.NUMBER },
            detectedAddress: { type: Type.STRING }
          },
          required: ["latitude", "longitude", "isAuthentic", "isCampus", "confidence"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI service.");
    
    // Safety: Strip markdown if the model accidentally includes it
    const cleanJson = text.replace(/```json|```/gi, "").trim();
    return JSON.parse(cleanJson);
    
  } catch (error: any) {
    console.error("Gemini Verification Error:", error);
    throw new Error(error.message || "Failed to analyze image telemetry.");
  }
};