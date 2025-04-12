import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageInputProps, CameraPermissionState } from '@/types';
import { Camera, CameraOff, Send } from 'lucide-react';

export interface MessageInputExtendedProps extends MessageInputProps {
  isCameraActive?: boolean;
  onToggleCamera?: () => void;
  cameraPermissionState: CameraPermissionState;
}

export const MessageInput = ({
  input,
  onInputChange,
  onSend,
  isProcessing = false,
  isCameraActive = false,
  onToggleCamera,
  cameraPermissionState
}: MessageInputExtendedProps) => (
  <div className="flex w-full gap-2">
    <Button
      variant="outline"
      size="icon"
      onClick={onToggleCamera}
      className={`transition-colors ${isCameraActive ? "bg-blue-100 dark:bg-blue-900/40" : cameraPermissionState === false ? "bg-red-100 dark:bg-red-900/40" : ""}`}
      disabled={isProcessing || cameraPermissionState === false}
      title={cameraPermissionState === false ? "相机权限被拒绝" : "切换相机"}
    >
      {isCameraActive ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
    </Button>
    <Input
      value={input}
      onChange={(e) => onInputChange(e.target.value)}
      placeholder="输入你的消息..."
      disabled={isProcessing}
      className="flex-1"
      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSend()}
    />
    <Button
      onClick={onSend}
      disabled={isProcessing || (isCameraActive && cameraPermissionState === false)}
    >
      {isProcessing ? '正在处理...' : <Send className="h-5 w-5" />}
    </Button>
  </div>
);

export default MessageInput;