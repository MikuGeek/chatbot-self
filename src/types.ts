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
};

export type CameraPermissionState = boolean | null;

export interface ChatContainerProps {
  welcomeMessage?: Message;
}

export interface ErrorNotificationProps {
  title?: string;
  message: string;
  variant?: "default" | "destructive";
}
