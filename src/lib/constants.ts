import { Message } from '@/types';

export const DEFAULT_WELCOME_MESSAGE: Message = {
  text: "Hello! I'm your AI assistant. Toggle the camera button to take a photo, or just type a message. I'll analyze your emotions from your photo and respond accordingly. How can I help you today?",
  isUser: false,
  timestamp: new Date()
};

export const CAMERA_PERMISSION_DENIED_MESSAGE = "Camera permission denied. Please grant camera access to use this feature.";

export const PROCESSING_MESSAGE = "Processing your message...";

export const DEFAULT_ERROR_MESSAGE = "Sorry, something went wrong. Please try again.";

export const API_KEY_MISSING_MESSAGE = `API Key Missing
The Gemini API key is missing. Please follow these steps to add it:

1. Create a .env file in the root directory
2. Add the following line to the file:
   VITE_GEMINI_API_KEY=your_actual_api_key_here
3. Replace your_actual_api_key_here with your Gemini API key
4. Restart the development server

You can get a Gemini API key from the Google AI Studio.`;