import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChatMessageProps } from '@/types';
import { Camera } from 'lucide-react';

export const ChatMessage = ({ message }: ChatMessageProps) => (
  <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} gap-3`}>
    {!message.isUser && (
      <Avatar className="shrink-0">
        <AvatarImage src="/bot-avatar.png" />
        <AvatarFallback>AI</AvatarFallback>
      </Avatar>
    )}
    <div
      className={`p-3 rounded-lg max-w-[85%] ${
        message.isUser
          ? 'bg-blue-500 text-white dark:bg-blue-600'
          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
      }`}
    >
      {/* Photo display removed from chat UI as requested */}
      <div className="flex flex-col">
        {message.text && <p className="break-words">{message.text}</p>}
        <div className="flex items-center justify-between mt-1">
          <p className={`text-xs ${message.isUser ? 'text-blue-100 dark:text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
            {message.timestamp.toLocaleTimeString()}
          </p>
          {message.photo && (
            <div className={`flex items-center ml-2 text-xs ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
              <Camera size={12} className="mr-1" />
              <span>Photo captured</span>
            </div>
          )}
        </div>
      </div>
    </div>
    {message.isUser && (
      <Avatar className="shrink-0">
        <AvatarImage src="/user-avatar.png" />
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
    )}
  </div>
);

export default ChatMessage;