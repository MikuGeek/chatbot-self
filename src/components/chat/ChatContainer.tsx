import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Message, ChatContainerProps } from '@/types';
import { useCameraCapture } from '@/hooks/useCameraCapture';
import { detectEmotionFromPhoto, generateResponse } from '@/services/geminiService';
import ChatMessageList from './ChatMessageList';
import MessageInput from './MessageInput';
import ErrorNotification from './ErrorNotification';
import CameraPreview from './CameraPreview';
import SettingsPanel from './SettingsPanel';
import {
  DEFAULT_WELCOME_MESSAGE,
  CAMERA_PERMISSION_DENIED_MESSAGE,
  PROCESSING_MESSAGE,
  DEFAULT_ERROR_MESSAGE,
  API_KEY_MISSING_MESSAGE
} from '@/lib/constants';

export const ChatContainer = ({ welcomeMessage = DEFAULT_WELCOME_MESSAGE }: ChatContainerProps) => {
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [input, setInput] = useState('');
  const { capturePhoto, toggleCamera, isCameraActive, hasPermission } = useCameraCapture();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // Check if API key is missing
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      // Display API key missing message if no token is set
      setMessages(prev => {
        // Check if we already added this message to avoid duplicates
        if (!prev.some(msg => msg.text?.includes('API Key Missing'))) {
          return [
            ...prev,
            {
              text: API_KEY_MISSING_MESSAGE,
              isUser: false,
              timestamp: new Date()
            }
          ];
        }
        return prev;
      });
    }
  }, []);

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const isSmall = window.innerWidth < 768; // md breakpoint in Tailwind
      setIsSmallScreen(isSmall);
    };

    // Initial check
    checkScreenSize();

    // Add event listener for resize
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Handle camera permission changes
  useEffect(() => {
    if (hasPermission === false) {
      const existingPermissionMessage = messages.find(
        msg => !msg.isUser && msg.text?.includes('Camera permission denied')
      );

      if (!existingPermissionMessage) {
        setMessages(prev => [
          ...prev,
          {
            text: CAMERA_PERMISSION_DENIED_MESSAGE,
            isUser: false,
            timestamp: new Date()
          }
        ]);
      }
    }
  }, [hasPermission, messages]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleSend = async () => {
    // Only proceed if there's text input or camera is active, and not already processing
    if ((!input.trim() && !isCameraActive) || isProcessing) {
      return;
    }

    // Check if camera is active but permission is denied
    if (isCameraActive && hasPermission === false) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      let photoUrl = '';

      // Only attempt to capture photo if camera is active and has permission
      if (isCameraActive && hasPermission !== false) {
        setIsCapturing(true);
        photoUrl = await capturePhoto();
        setIsCapturing(false);
      }

      // Create and add user message with photo and text
      const userMessage: Message = {
        text: input.trim(),
        photo: photoUrl || undefined,
        isUser: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);
      setInput('');

      // Add a temporary "processing" message from the bot
      setMessages(prev => [
        ...prev,
        {
          text: PROCESSING_MESSAGE,
          isUser: false,
          timestamp: new Date()
        }
      ]);

      let detectedEmotion = 'neutral'; // Default emotion

      // Only detect emotion if we have a photo
      if (photoUrl) {
        // Use Gemini to detect emotion from the photo
        detectedEmotion = await detectEmotionFromPhoto(photoUrl);
      }

      // Generate response using Gemini based on detected emotion and user text
      const botResponse = await generateResponse(detectedEmotion, input.trim() || 'Hello');

      // Replace the temporary processing message with the actual response
      setMessages(prev => [
        ...prev.slice(0, prev.length - 1),
        {
          text: botResponse,
          isUser: false,
          timestamp: new Date()
        }
      ]);
    } catch (error) {
      console.error('Error in handleSend:', error);

      // Determine the appropriate error message
      let errorMessage = DEFAULT_ERROR_MESSAGE;

      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          errorMessage = 'Camera permission denied. Please grant camera access in your browser settings.';
        }
        setError(errorMessage);
      }

      // Remove the processing message
      setMessages(prev => [
        ...prev.slice(0, prev.length - 1),
        {
          text: errorMessage,
          isUser: false,
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadHistory = () => {
    if (messages.length <= 1) return; // Don't download if only the welcome message exists

    try {
      // Format the chat history as JSON
      const historyData = JSON.stringify(
        messages.map(msg => ({
          text: msg.text,
          isUser: msg.isUser,
          timestamp: msg.timestamp
        })),
        null,
        2
      );

      // Create a blob and download link
      const blob = new Blob([historyData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-history-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading chat history:', err);
      setError('Failed to download chat history');
    }
  };

  return (
    <div className="flex w-full h-[calc(100vh-2rem)] gap-4">
      {/* Main Chat Window */}
      <Card className="flex-grow shadow-lg flex flex-col">
        <CardHeader className="py-4 shrink-0">
          <CardTitle className="text-center">AI Chat Assistant</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0 relative">
          {error && (
            <ErrorNotification message={error} />
          )}
          <ChatMessageList messages={messages} />
        </CardContent>
        <CardFooter className="p-4 border-t shrink-0">
          <MessageInput
            input={input}
            onInputChange={handleInputChange}
            onSend={handleSend}
            isProcessing={isProcessing}
            isCameraActive={isCameraActive}
            onToggleCamera={toggleCamera}
            cameraPermissionState={hasPermission}
          />
        </CardFooter>
      </Card>

      {/* Side Panel - Fixed width for Camera and Controls - Hidden on small screens via CSS */}
      <div className={`w-80 flex flex-col gap-4 transition-all duration-300 ${isSmallScreen ? 'hidden md:flex' : ''}`}>
        {/* Camera Preview */}
        <div className="w-80">
          <CameraPreview
            isCameraActive={isCameraActive}
            hasPermission={hasPermission}
            isCapturing={isCapturing}
          />
        </div>

        {/* Settings Panel */}
        <SettingsPanel
          onDownloadHistory={handleDownloadHistory}
          canDownloadHistory={messages.length > 1}
        />
      </div>
    </div>
  );
};

export default ChatContainer;