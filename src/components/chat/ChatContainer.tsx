import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Message, ChatContainerProps } from '@/types';
import { useCameraCapture } from '@/hooks/useCameraCapture';
import { detectEmotionFromPhoto, generateResponse, updateApiKey } from '@/services/geminiService';
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
  // In production, we don't use the environment variable for security reasons
  const isProduction = import.meta.env.PROD;
  const [geminiToken, setGeminiToken] = useState(isProduction ? '' : (import.meta.env.VITE_GEMINI_API_KEY || ''));
  const [isUpdatingToken, setIsUpdatingToken] = useState(false);
  const [tokenUpdateSuccess, setTokenUpdateSuccess] = useState<boolean | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // Check if API key is missing in production
  useEffect(() => {
    if (isProduction && !geminiToken) {
      // Display API key missing message if in production and no token is set
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
  }, [isProduction, geminiToken]);

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

  const handleGeminiTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGeminiToken(e.target.value);
    // Reset token update status when user changes the input
    setTokenUpdateSuccess(null);
  };

  const handleUpdateGeminiToken = async () => {
    if (!geminiToken.trim()) {
      setError("API token cannot be empty");
      return;
    }

    setIsUpdatingToken(true);
    setTokenUpdateSuccess(null);

    try {
      const success = updateApiKey(geminiToken);
      setTokenUpdateSuccess(success);

      if (success) {
        // Add a system message about successful token update
        setMessages(prev => [
          ...prev,
          {
            text: "Gemini API token has been updated successfully.",
            isUser: false,
            timestamp: new Date()
          }
        ]);
      } else {
        setError("Failed to update Gemini API token");
      }
    } catch (error) {
      console.error("Error updating Gemini token:", error);
      setError("Error updating Gemini API token");
      setTokenUpdateSuccess(false);
    } finally {
      setIsUpdatingToken(false);
    }
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
    const messagesText = messages
      .map((msg) => {
        const timestamp = msg.timestamp ? new Date(msg.timestamp).toLocaleString() : 'Unknown time';
        const sender = msg.isUser ? 'You' : 'AI';
        const photoInfo = msg.photo ? '[🖼️ Photo was captured]' : '';
        return `[${timestamp}] ${sender}: ${photoInfo} ${msg.text}`;
      })
      .join('\n\n');

    const blob = new Blob([messagesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-history-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          geminiToken={geminiToken}
          onGeminiTokenChange={handleGeminiTokenChange}
          onUpdateGeminiToken={handleUpdateGeminiToken}
          onDownloadHistory={handleDownloadHistory}
          isUpdatingToken={isUpdatingToken}
          tokenUpdateSuccess={tokenUpdateSuccess}
          canDownloadHistory={messages.length > 1}
        />
      </div>
    </div>
  );
};

export default ChatContainer;