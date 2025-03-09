import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Download, Key, Settings, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SettingsPanelProps {
  geminiToken: string;
  onGeminiTokenChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpdateGeminiToken: () => void;
  onDownloadHistory: () => void;
  isUpdatingToken: boolean;
  tokenUpdateSuccess: boolean | null;
  canDownloadHistory: boolean;
}

export const SettingsPanel = ({
  geminiToken,
  onGeminiTokenChange,
  onUpdateGeminiToken,
  onDownloadHistory,
  isUpdatingToken,
  tokenUpdateSuccess,
  canDownloadHistory
}: SettingsPanelProps) => {
  const isProduction = import.meta.env.PROD;

  return (
    <Card className="shadow-lg w-full">
      <CardHeader className="py-2">
        <CardTitle className="text-sm flex items-center">
          <Settings className="w-4 h-4 mr-2" /> Settings & Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="gemini-token" className="text-sm font-medium">
            Gemini API Token
          </label>

          {isProduction && !geminiToken && (
            <Alert variant="destructive" className="mb-2">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription className="text-xs">
                In production, you must enter your Gemini API key manually for security reasons.
                Get your API key from the <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a>.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Input
              id="gemini-token"
              type="password"
              value={geminiToken}
              onChange={onGeminiTokenChange}
              placeholder="Enter Gemini API token"
              className={`flex-1 ${tokenUpdateSuccess === true ? 'border-green-500' :
                tokenUpdateSuccess === false ? 'border-red-500' : ''}`}
              disabled={isUpdatingToken}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={onUpdateGeminiToken}
              disabled={isUpdatingToken || !geminiToken.trim()}
              className={tokenUpdateSuccess === true ? 'bg-green-100 dark:bg-green-900/40' :
                tokenUpdateSuccess === false ? 'bg-red-100 dark:bg-red-900/40' : ''}
              title="Update API Token"
            >
              <Key className="h-4 w-4" />
            </Button>
          </div>
          {tokenUpdateSuccess === true && (
            <p className="text-xs text-green-600 dark:text-green-400">API token updated successfully</p>
          )}
          {tokenUpdateSuccess === false && (
            <p className="text-xs text-red-600 dark:text-red-400">Failed to update API token</p>
          )}
        </div>

        <Button
          onClick={onDownloadHistory}
          className="w-full"
          variant="outline"
          disabled={!canDownloadHistory}
        >
          <Download className="h-4 w-4 mr-2" /> Download Chat History
        </Button>
      </CardContent>
    </Card>
  );
};

export default SettingsPanel;