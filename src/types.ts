export type Message = {
  text?: string;
  photo?: string;
  isUser: boolean;
  timestamp: Date;
};

export type ChatMessageProps = {
  message: Message;
};

export type MessageInputProps = {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  isProcessing?: boolean;
  isCameraActive?: boolean;
  onToggleCamera?: () => void;
};