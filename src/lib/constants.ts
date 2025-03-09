import { Message } from '@/types';

export const DEFAULT_WELCOME_MESSAGE: Message = {
  text: "Hello! I'm your AI assistant. Toggle the camera button to take a photo, or just type a message. I'll analyze your emotions from your photo and respond accordingly. How can I help you today?",
  isUser: false,
  timestamp: new Date()
};

export const CAMERA_PERMISSION_DENIED_MESSAGE = "Camera permission denied. Please grant camera access to use this feature.";

export const PROCESSING_MESSAGE = "Processing your message...";

export const DEFAULT_ERROR_MESSAGE = "Sorry, something went wrong. Please try again.";