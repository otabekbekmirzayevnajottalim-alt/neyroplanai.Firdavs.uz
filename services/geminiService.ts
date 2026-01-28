
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage, Role } from "../types";

// Gemini-3-flash-preview eng tezkor va aqlli model hisoblanadi
const MODEL_NAME = 'gemini-3-flash-preview';

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  async *streamChat(history: ChatMessage[], systemInstruction?: string) {
    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: msg.parts.map(p => {
        if (p.text) return { text: p.text };
        if (p.inlineData) return { inlineData: p.inlineData };
        return { text: "" };
      })
    }));

    try {
      const responseStream = await this.ai.models.generateContentStream({
        model: MODEL_NAME,
        contents,
        config: {
          systemInstruction: systemInstruction || "Siz aqlli va yordam berishga tayyor 'Neyroplan' sun'iy intellektisiz. Foydalanuvchi bilan o'zbek tilida muloqot qiling. Javoblaringiz aniq, tushunarli va chiroyli formatlangan bo'lsin.",
          temperature: 0.8,
          topK: 40,
          topP: 0.95
        },
      });

      for await (const chunk of responseStream) {
        const c = chunk as GenerateContentResponse;
        if (c.text) yield c.text;
      }
    } catch (error) {
      console.error("Gemini Stream Error:", error);
      throw error;
    }
  }

  async analyzeImage(prompt: string, base64Image: string, mimeType: string) {
    const response = await this.ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { data: base64Image, mimeType } }
        ]
      }
    });
    return response.text;
  }
}

export const gemini = new GeminiService();
