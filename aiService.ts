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

// RATE LIMITER: 15 RPM = 1 request every 4 seconds.
// We use 4500ms to ensure we stay safely under the limit.
const REQ_THROTTLE_MS = 4500;
let lastRequestTime = 0;
let isProcessing = false;

interface QueueItem {
  base64Image: string;
  resolve: (res: VerificationResult) => void;
  reject: (err: any) => void;
}

const queue: QueueItem[] = [];

const processQueue = async () => {
  if (isProcessing || queue.length === 0) return;

  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  
  if (timeSinceLast < REQ_THROTTLE_MS) {
    setTimeout(processQueue, REQ_THROTTLE_MS - timeSinceLast);
    return;
  }

  isProcessing = true;
  const item = queue.shift();
  
  if (item) {
    try {
      lastRequestTime = Date.now();
      const result = await executeVerification(item.base64Image);
      item.resolve(result);
    } catch (err) {
      item.reject(err);
    } finally {
      isProcessing = false;
      // Trigger next immediately; the throttle at the top will handle the wait
      processQueue();
    }
  }
};

export const getQueuePosition = () => queue.length;

export const verifyAttendanceImage = (base64Image: string): Promise<VerificationResult> => {
  return new Promise((resolve, reject) => {
    queue.push({ base64Image, resolve, reject });
    processQueue();
  });
};

const executeVerification = async (base64Image: string): Promise<VerificationResult> => {
  if (!process.env.API_KEY || process.env.API_KEY === "undefined") {
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
            text: `Extract GPS data from this image. Target: MIT-WPU Campus. 
            Confirm:
            1. GPS Coordinates (Lat/Lng) if available.
            2. Authenticity (Is it a real photo?).
            Return JSON only.`
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
            confidence: { type: Type.NUMBER }
          },
          required: ["latitude", "longitude", "isAuthentic", "isCampus", "confidence"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("Verification Timeout");
    return JSON.parse(text);
    
  } catch (error: any) {
    console.error("AI Node Error:", error);
    throw error;
  }
};
