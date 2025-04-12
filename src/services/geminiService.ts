import { GoogleGenerativeAI } from '@google/generative-ai';
import { API_KEY_MISSING_MESSAGE } from '@/lib/constants';

console.log('geminiService.ts is being loaded');

// Only use the environment variable API key
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

console.log('Gemini API Key available:', !!apiKey, 'Length:', apiKey.length);
console.log('Environment variables available:', {
  MODE: import.meta.env.MODE, // development or production
  DEV: import.meta.env.DEV,   // boolean
  PROD: import.meta.env.PROD, // boolean
  HAS_GEMINI_KEY: !!import.meta.env.VITE_GEMINI_API_KEY
});

// Create a type for our fallback implementation
type GenAIFallback = {
  getGenerativeModel: (params: { model: string }) => {
    generateContent: (params: {
      contents: Array<{
        role?: string;
        parts: Array<{
          text?: string;
          inlineData?: {
            mimeType: string;
            data: string
          }
        }>
      }>
    }) => Promise<{
      response: { text: () => string }
    }>
  }
};

let genAI: GoogleGenerativeAI | GenAIFallback;

// Function to initialize Gemini with API key
const initializeGemini = () => {
try {
  console.log('Initializing GoogleGenerativeAI with key');
    genAI = new GoogleGenerativeAI(apiKey);
  console.log('GoogleGenerativeAI initialized successfully');
} catch (error) {
  console.error('Error initializing GoogleGenerativeAI:', error);
  // Provide a dummy implementation if initialization fails
  genAI = {
    getGenerativeModel: () => ({
      generateContent: async () => ({
        response: { text: () => 'Error initializing Gemini API' }
      })
    })
  };
}
};

// Initialize with API key from environment
initializeGemini();

// Helper function to convert blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Extract just the Base64 data, removing the data URL prefix
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Function to detect emotion from a photo
export async function detectEmotionFromPhoto(photoUrl: string): Promise<string> {
  console.log('Starting emotion detection from photo');
  try {
    if (!apiKey) {
      console.error('No Gemini API key found. Please check your .env file.');
      return "neutral";
    }

    // Get the Gemini-2.0-flash model instead of gemini-1.5-pro-vision
    console.log('Getting Gemini model instance');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    console.log('Gemini model initialized:', !!model);

    // Convert the photo URL to binary data
    console.log('Fetching photo from URL:', photoUrl.substring(0, 50) + '...'); // Only log the start of the URL
    const response = await fetch(photoUrl);
    const blob = await response.blob();
    console.log('Photo fetched, blob size:', blob.size, 'bytes, type:', blob.type);

    // Convert blob to base64 data
    const photoData = await blobToBase64(blob);
    console.log('Photo converted to base64 data');

    // Create prompt parts - put image first as recommended in the Gemini API docs
    const promptParts = [
      {
        inlineData: {
          mimeType: blob.type,
          data: photoData
        }
      },
      { text: "仔细分析这张面部图像并识别显示的主要情绪。关注面部表情、微表情和任何可见的情绪线索。特别注意强烈情绪的迹象，如愤怒、悲伤或喜悦。只返回代表主要情绪的单个词——从以下选择：angry（愤怒）、sad（悲伤）、happy（快乐）、surprised（惊讶）、fearful（恐惧）、disgusted（厌恶）、neutral（中性）、contempt（蔑视）、confused（困惑）。准确识别，优先检测强烈的情绪信号而不是默认为中性。" }
    ];

    // Generate content
    console.log('Sending request to Gemini API');
    const result = await model.generateContent({
      contents: [{ role: "user", parts: promptParts }],
    });

    let emotion = result.response.text().trim().toLowerCase();
    console.log("Detected emotion (raw):", emotion);

    // Normalize common emotion words to ensure consistency
    if (emotion.includes('angry') || emotion.includes('anger') || emotion.includes('rage') || emotion.includes('furious')) {
      emotion = 'angry';
    } else if (emotion.includes('happy') || emotion.includes('joy') || emotion.includes('delight')) {
      emotion = 'happy';
    } else if (emotion.includes('sad') || emotion.includes('sorrow') || emotion.includes('unhappy')) {
      emotion = 'sad';
    } else if (emotion.includes('surprise') || emotion.includes('shocked')) {
      emotion = 'surprised';
    } else if (emotion.includes('fear') || emotion.includes('afraid') || emotion.includes('scared')) {
      emotion = 'fearful';
    } else if (emotion.includes('disgust')) {
      emotion = 'disgusted';
    } else if (emotion.includes('contempt')) {
      emotion = 'contempt';
    } else if (emotion.includes('confus')) {
      emotion = 'confused';
    } else if (emotion.includes('neutral')) {
      emotion = 'neutral';
    }

    console.log("Normalized detected emotion:", emotion);
    return emotion;
  } catch (error) {
    console.error("Error detecting emotion:", error);
    return "neutral"; // Default fallback emotion
  }
}

// Function to generate a response based on emotion and text
export async function generateResponse(emotion: string, userText: string): Promise<string> {
  console.log('Starting response generation with emotion:', emotion, 'and text:', userText);
  try {
    if (!apiKey) {
      console.error('No Gemini API key found. Please check your .env file.');
      // Return a more helpful message
      return "我无法处理您的请求。" + API_KEY_MISSING_MESSAGE;
    }

    // Get the Gemini-2.0-flash model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    console.log('Gemini model initialized for response generation');

    // Enhanced prompt with more emotional intelligence
    const prompt = `
      我已经检测到图像中的人似乎正在表达：${emotion}。

      回应指南：
      - 如果情绪是'angry'（愤怒）：保持冷静，承认他们的沮丧，提供支持而不显得轻视
      - 如果情绪是'sad'（悲伤）：表示同理心，表现理解，提供温和的鼓励
      - 如果情绪是'happy'（快乐）：匹配他们的积极能量并强化他们的积极状态
      - 如果情绪是'surprised'（惊讶）：解决可能让他们感到惊讶的事情并提供清晰度
      - 如果情绪是'fearful'（恐惧）：提供安慰和有用的信息来解决担忧
      - 如果情绪是'disgusted'（厌恶）：不带判断地承认他们的反应并提供观点
      - 如果情绪是'contempt'（蔑视）：保持尊重并尝试理解他们的观点而不引起冲突
      - 如果情绪是'confused'（困惑）：提供清晰、有帮助的信息并检查理解
      - 如果情绪是'neutral'（中性）：以平衡、信息丰富的方式回应

      基于他们的情绪状态${emotion}，回应这条消息：
      "${userText}"

      请确保你的回应明确承认并适当回应他们的情绪状态。
      重要：请只用中文回应。
    `;

    // Generate content
    console.log('Sending request to Gemini API for response generation');
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const response = result.response.text().trim();
    console.log('Generated response:', response.substring(0, 100) + '...'); // Log first 100 chars
    return response;
  } catch (error) {
    console.error("Error generating response:", error);
    return "抱歉，我暂时无法处理您的请求。请稍后再试。";
  }
}