import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Download, Settings } from 'lucide-react';

interface SettingsPanelProps {
  onDownloadHistory: () => void;
  canDownloadHistory: boolean;
}

export const SettingsPanel = ({
  onDownloadHistory,
  canDownloadHistory
}: SettingsPanelProps) => {
  return (
    <Card className="shadow-lg w-full">
      <CardHeader className="py-2">
        <CardTitle className="text-sm flex items-center">
          <Settings className="w-4 h-4 mr-2" /> Settings & Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex flex-col gap-4">
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