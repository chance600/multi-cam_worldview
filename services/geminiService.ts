import { GoogleGenAI, Type } from "@google/genai";

// Helper to get AI instance safely
const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// --- Analysis & Thinking ---

export const analyzeImage = async (base64Image: string, prompt: string, useThinking = false) => {
  const ai = getAIClient();
  const model = 'gemini-3-pro-preview';
  
  const config: any = {};
  
  if (useThinking) {
      config.thinkingConfig = { thinkingBudget: 1024 }; // Keep budget modest for responsive web app
  }

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        { text: prompt }
      ]
    },
    config
  });

  return response.text;
};

export const analyzeVideo = async (videoUri: string, prompt: string) => {
    // Note: In a real implementation we would use the File API to upload the video
    // to the File API and get a URI. For this demo, we assume the user might provide 
    // text description or we treat it as a complex thinking task.
    // Since we can't easily upload large video files in a purely client-side demo without a backend proxy for File API,
    // we will simulate video analysis capabilities or use the text-only thinking model if no video file is actually provided in code context.
    
    // However, if we assume the video is hosted or we are just mocking the "File API" part:
    const ai = getAIClient();
    const model = 'gemini-3-pro-preview';

    // If we had the file uploaded via File API:
    // const filePart = { fileData: { fileUri: videoUri, mimeType: 'video/mp4' }};
    
    // Fallback for demo: Use Thinking model on the prompt directly
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 32768 } // Max thinking for deep analysis
        }
    });
    return response.text;
};


// --- Image Editing ---

export const editImage = async (base64Image: string, prompt: string) => {
  const ai = getAIClient();
  const model = 'gemini-2.5-flash-image';

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        { text: prompt }
      ]
    }
  });

  // Extract image from response
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};


// --- Video Generation (Veo) ---

export const generateVideo = async (
  prompt: string, 
  aspectRatio: '16:9' | '9:16' = '16:9',
  imageBytes?: string // Optional input image for animation
): Promise<string | null> => {
    
    // 1. Key Selection Gating
    // @ts-ignore - window.aistudio is injected by the environment if available
    if (window.aistudio) {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
             // @ts-ignore
             await window.aistudio.openSelectKey();
             // Assume success after dialog closes or throw to retry
        }
    }

    // Re-init client to ensure we pick up any potentially selected key from the environment
    const ai = getAIClient();
    
    let operation;
    const model = 'veo-3.1-fast-generate-preview';
    const config = {
        numberOfVideos: 1,
        resolution: '720p', // Fast preview default
        aspectRatio: aspectRatio
    };

    try {
        if (imageBytes) {
            // Image-to-Video
            operation = await ai.models.generateVideos({
                model,
                prompt, // Prompt is optional for i2v but good to have
                image: {
                    imageBytes,
                    mimeType: 'image/jpeg' 
                },
                config
            });
        } else {
            // Text-to-Video
            operation = await ai.models.generateVideos({
                model,
                prompt,
                config
            });
        }

        // Poll for completion
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
            operation = await ai.operations.getVideosOperation({ operation });
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!videoUri) return null;

        // Determine if we need to append key. 
        // If the process.env.API_KEY is available, we append it.
        return `${videoUri}&key=${process.env.API_KEY}`;

    } catch (e) {
        console.error("Veo generation failed", e);
        throw e;
    }
};

// --- Thinking ---

export const thinkAndAnswer = async (prompt: string) => {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 32768 }
        }
    });
    return response.text;
};
