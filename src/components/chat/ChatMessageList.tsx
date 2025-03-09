import { useEffect, useRef } from 'react';
import { Message } from '@/types';
import ChatMessage from './ChatMessage';

interface ChatMessageListProps {
  messages: Message[];
}

export const ChatMessageList = ({ messages }: ChatMessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  return (
    <div className="absolute inset-0 flex flex-col gap-4 overflow-y-auto p-4">
      {messages.map((message, index) => (
        <ChatMessage key={`${message.timestamp.getTime()}-${index}`} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessageList;