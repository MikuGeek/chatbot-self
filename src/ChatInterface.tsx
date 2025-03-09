import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCameraCapture } from '@/hooks/useCameraCapture';
import { Message, ChatMessageProps, MessageInputProps } from '@/types';
import { detectEmotionFromPhoto, generateResponse } from '@/services/geminiService';
import { Camera, CameraOff, Send } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// Separate Message Component
const ChatMessage = ({ message }: ChatMessageProps) => (
  <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} gap-3`}>
    {!message.isUser && (
      <Avatar>
        <AvatarImage src="/bot-avatar.png" />
        <AvatarFallback>AI</AvatarFallback>
      </Avatar>
    )}
    <div
      className={`p-3 rounded-lg max-w-[80%] ${
        message.isUser
          ? 'bg-blue-500 text-white'
          : 'bg-gray-100 text-gray-800'
      }`}
    >
      {message.photo && (
        <img
          src={message.photo}
          alt="Captured content"
          className="max-w-full rounded-md mb-2"
        />
      )}
      {message.text && <p className="break-words">{message.text}</p>}
      <p className={`text-xs mt-1 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
        {message.timestamp.toLocaleTimeString()}
      </p>
    </div>
    {message.isUser && (
      <Avatar>
        <AvatarImage src="/user-avatar.png" />
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
    )}
  </div>
);

// Separate Input Component
const MessageInput = ({
  input,
  onInputChange,
  onSend,
  isProcessing = false,
  isCameraActive = false,
  onToggleCamera,
  cameraPermissionState
}: MessageInputProps & {
  isCameraActive?: boolean,
  onToggleCamera?: () => void,
  cameraPermissionState: boolean | null
}) => (
  <div className="flex gap-2">
    <Button
      variant="outline"
      size="icon"
      onClick={onToggleCamera}
      className={isCameraActive ? "bg-blue-100" : cameraPermissionState === false ? "bg-red-100" : ""}
      disabled={isProcessing || cameraPermissionState === false}
      title={cameraPermissionState === false ? "Camera permission denied" : "Toggle camera"}
    >
      {isCameraActive ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
    </Button>
    <Input
      value={input}
      onChange={(e) => onInputChange(e.target.value)}
      placeholder="Type your message..."
      disabled={isProcessing}
      className="flex-1"
    />
    <Button onClick={onSend} disabled={isProcessing || (isCameraActive && cameraPermissionState === false)}>
      {isProcessing ? 'Processing...' : <Send className="h-4 w-4" />}
    </Button>
  </div>
);

// Main Component
export function ChatInterface() {
  console.log('ChatInterface component initialized');

  const welcomeMessage = {
    text: "Hello! I'm your AI assistant. Toggle the camera button to take a photo, or just type a message. I'll analyze your emotions from your photo and respond accordingly. How can I help you today?",
    isUser: false,
    timestamp: new Date()
  };

  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [input, setInput] = useState('');
  const { capturePhoto, toggleCamera, isCameraActive, hasPermission } = useCameraCapture();
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Debugging variables
  const [renderCount, setRenderCount] = useState(0);

  console.log('Initial state -', {
    messagesCount: messages.length,
    input,
    isCameraActive,
    isProcessing,
    renderCount,
    hasPermission
  });

  // Use a separate useEffect to track renders
  useEffect(() => {
    setRenderCount(prev => {
      const newCount = prev + 1;
      console.log(`Component rendered ${newCount} times`);
      return newCount;
    });
  }, []); // Run only on mount

  // Log whenever messages change
  useEffect(() => {
    console.log('Messages updated:', messages);
  }, [messages]);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      console.log('Scrolling to bottom, messages length:', messages.length);
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]); // Only re-run when the number of messages changes

  // Handle camera permission changes
  useEffect(() => {
    if (hasPermission === false) {
      console.log('Camera permission denied, showing notification');
      // Add a notification message when camera permission is denied
      const existingPermissionMessage = messages.find(
        msg => !msg.isUser && msg.text?.includes('Camera permission denied')
      );

      if (!existingPermissionMessage) {
        setMessages(prev => [
          ...prev,
          {
            text: "Camera permission denied. Please grant camera access to use this feature.",
            isUser: false,
            timestamp: new Date()
          }
        ]);
      }
    }
  }, [hasPermission, messages]);

  const handleSend = async () => {
    console.log('handleSend called with:', { input, isCameraActive, isProcessing, hasPermission });

    // Only proceed if there's text input or camera is active, and not already processing
    if ((!input.trim() && !isCameraActive) || isProcessing) {
      console.log('Aborting handleSend - no input/camera or already processing');
      return;
    }

    // Check if camera is active but permission is denied
    if (isCameraActive && hasPermission === false) {
      console.log('Aborting handleSend - camera is active but permission is denied');
      return;
    }

    setIsProcessing(true);
    console.log('Set isProcessing to true');

    try {
      let photoUrl = '';

      // Only attempt to capture photo if camera is active and has permission
      if (isCameraActive && hasPermission !== false) {
        console.log('Camera is active, attempting to capture photo');
        photoUrl = await capturePhoto();
        console.log('Photo captured:', photoUrl ? 'success' : 'failed');
      } else {
        console.log('Camera not active or no permission, skipping photo capture');
      }

      // Create and add user message with photo and text
      const userMessage: Message = {
        text: input.trim(),
        photo: photoUrl || undefined,
        isUser: true,
        timestamp: new Date()
      };
      console.log('Adding user message to chat:', userMessage);
      setMessages(prev => [...prev, userMessage]);
      setInput('');

      // Add a temporary "processing" message from the bot
      const processingMessageIndex = messages.length;
      console.log('Adding processing message at index:', processingMessageIndex);
      setMessages(prev => [
        ...prev,
        {
          text: 'Processing your message...',
          isUser: false,
          timestamp: new Date()
        }
      ]);

      let detectedEmotion = 'neutral'; // Default emotion

      // Only detect emotion if we have a photo
      if (photoUrl) {
        console.log('Calling Gemini to detect emotion from photo');
        // Step 2: Use Gemini to detect emotion from the photo
        detectedEmotion = await detectEmotionFromPhoto(photoUrl);
        console.log('Detected emotion:', detectedEmotion);
      } else {
        console.log('No photo available, using default emotion:', detectedEmotion);
      }

      console.log('Calling Gemini to generate response');
      // Step 3: Generate response using Gemini based on detected emotion and user text
      const botResponse = await generateResponse(detectedEmotion, input.trim() || 'Hello');
      console.log('Received bot response:', botResponse);

      // Replace the temporary processing message with the actual response
      console.log('Replacing processing message with actual response');
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
      let errorMessage = 'Sorry, something went wrong. Please try again.';

      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          errorMessage = 'Camera permission denied. Please grant camera access in your browser settings.';
        }
      }

      // Replace the "processing" message with an error message instead of adding a new one
      setMessages(prev => [
        ...prev.slice(0, prev.length - 1),
        {
          text: errorMessage,
          isUser: false,
          timestamp: new Date()
        }
      ]);
    } finally {
      console.log('Setting isProcessing back to false');
      setIsProcessing(false);
    }
  };

  // Log before render
  console.log('Rendering ChatInterface with', messages.length, 'messages');

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>AI Assistant</CardTitle>
        {hasPermission === false && (
          <Alert variant="destructive" className="mt-2">
            <AlertTitle>Camera Access Denied</AlertTitle>
            <AlertDescription>
              Please enable camera access in your browser settings to use the camera features.
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent className="h-128 overflow-y-auto space-y-4">
        {messages.length > 0 ? (
          messages.map((message, index) => {
            console.log(`Rendering message ${index}:`, message);
            return <ChatMessage key={index} message={message} />;
          })
        ) : (
          <div className="text-center text-gray-500">No messages yet. Start a conversation!</div>
        )}
        <div ref={messagesEndRef} />
      </CardContent>
      <CardFooter>
        <MessageInput
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          isProcessing={isProcessing}
          isCameraActive={isCameraActive}
          onToggleCamera={toggleCamera}
          cameraPermissionState={hasPermission}
        />
      </CardFooter>
    </Card>
  );
}