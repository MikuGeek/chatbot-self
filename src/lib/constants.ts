import { Message } from '@/types';

export const DEFAULT_WELCOME_MESSAGE: Message = {
  text: "你好！我是你的 AI 助手。切换相机按钮拍照，或者直接输入消息。我会从你的照片中分析你的情绪并做出相应的回应。今天我能帮你什么？",
  isUser: false,
  timestamp: new Date()
};

export const CAMERA_PERMISSION_DENIED_MESSAGE = "相机权限被拒绝。请授予相机访问权限以使用此功能。";

export const PROCESSING_MESSAGE = "正在处理您的消息...";

export const DEFAULT_ERROR_MESSAGE = "抱歉，出错了。请重试。";

export const API_KEY_MISSING_MESSAGE = `API 密钥丢失
缺少 Gemini API 密钥。请按照以下步骤添加：

1. 在根目录中创建一个 .env 文件
2. 将以下行添加到文件中：
   VITE_GEMINI_API_KEY=你的实际 API 密钥
3. 将 你的实际 API 密钥 替换为你的 Gemini API 密钥
4. 重新启动开发服务器

你可以从 Google AI Studio 获取 Gemini API 密钥。`;