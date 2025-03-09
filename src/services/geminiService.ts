import { GoogleGenerativeAI } from '@google/generative-ai';
import { API_KEY_MISSING_MESSAGE } from '@/lib/constants';

console.log('geminiService.ts is being loaded');

// In production, we don't automatically load from environment variables
const isProduction = import.meta.env.PROD;
let apiKey = isProduction ? '' : (import.meta.env.VITE_GEMINI_API_KEY || '');

console.log('Gemini API Key available:', !!apiKey, 'Length:', apiKey.length);
console.log('Environment variables available:', {
  MODE: import.meta.env.MODE, // development or production
  DEV: import.meta.env.DEV,   // boolean
  PROD: import.meta.env.PROD, // boolean
  IS_PRODUCTION: isProduction,
  // We can't enumerate all env vars in Vite like we could with process.env
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
const initializeGemini = (key: string) => {
try {
  console.log('Initializing GoogleGenerativeAI with key');
    genAI = new GoogleGenerativeAI(key);
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

// Initialize with current API key
initializeGemini(apiKey);

// Function to update the API key
export const updateApiKey = (newKey: string): boolean => {
  if (!newKey || newKey.trim() === '') {
    console.error('Cannot update with empty API key');
    return false;
  }

  try {
    apiKey = newKey.trim();
    initializeGemini(apiKey);
    return true;
  } catch (error) {
    console.error('Error updating API key:', error);
    return false;
  }
};

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
      { text: "Analyze this facial image carefully and identify the primary emotion displayed. Focus on facial expressions, micro-expressions, and any visible emotional cues. Pay special attention to signs of strong emotions like anger, sadness, or joy. Only return a single word representing the primary emotion - choose from: angry, sad, happy, surprised, fearful, disgusted, neutral, contempt, confused. Be accurate and prioritize detecting strong emotional signals over defaulting to neutral." }
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
      // Return a more helpful message in production
      if (isProduction) {
        return "I can't process your request. " + API_KEY_MISSING_MESSAGE;
      }
      return "I'm sorry, I couldn't process your request. API key is missing.";
    }

    // Get the Gemini-2.0-flash model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    console.log('Gemini model initialized for response generation');

    // Enhanced prompt with more emotional intelligence
    const prompt = `
      I have detected that the person in the image appears to be expressing: ${emotion}.

      Guidelines for response:
      - If the emotion is 'angry': Be calming, acknowledge their frustration, and offer support without being dismissive
      - If the emotion is 'sad': Be empathetic, show understanding, and offer gentle encouragement
      - If the emotion is 'happy': Match their positive energy and reinforce their positive state
      - If the emotion is 'surprised': Address what might be surprising them and provide clarity
      - If the emotion is 'fearful': Provide reassurance and helpful information to address concerns
      - If the emotion is 'disgusted': Acknowledge their reaction without judgment and offer perspective
      - If the emotion is 'contempt': Be respectful and try to understand their perspective without confrontation
      - If the emotion is 'confused': Provide clear, helpful information and check understanding
      - If the emotion is 'neutral': Respond in a balanced, informative manner

      Based on their emotional state of ${emotion}, respond to this message:
      "${userText}"

      Make your response explicitly acknowledge and appropriately respond to their emotional state.
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
    return "I'm sorry, I couldn't process your request at the moment. Please try again later.";
  }
}