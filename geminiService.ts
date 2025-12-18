
import { GoogleGenAI } from "@google/genai";
import { ApiResponse } from "./types";

export const editImageWithGemini = async (
  base64Image: string,
  prompt: string
): Promise<ApiResponse> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    // The gemini-2.5-flash-image model handles image editing
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              // Extract pure base64 data from data URI if present
              data: base64Image.split(',')[1] || base64Image,
              mimeType: 'image/png',
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    let generatedImageUrl: string | undefined;
    let textResponse: string = "";

    // Iterate through parts to find the image and any accompanying text
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        generatedImageUrl = `data:image/png;base64,${part.inlineData.data}`;
      } else if (part.text) {
        textResponse += part.text;
      }
    }

    if (!generatedImageUrl) {
      return { 
        error: "No image was generated. The model might have returned only text.",
        message: textResponse 
      };
    }

    return { imageUrl: generatedImageUrl, message: textResponse };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return { error: error.message || "An unexpected error occurred during image editing." };
  }
};
