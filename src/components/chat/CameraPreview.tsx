import { useEffect, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Camera } from 'lucide-react';

interface CameraPreviewProps {
  isCameraActive: boolean;
  hasPermission: boolean | null;
  isCapturing?: boolean;
}

export const CameraPreview = ({
  isCameraActive,
  hasPermission,
  isCapturing = false
}: CameraPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [flashEffect, setFlashEffect] = useState(false);

  // Handle flash effect when capturing a photo
  useEffect(() => {
    if (isCapturing) {
      setFlashEffect(true);
      const timer = setTimeout(() => {
        setFlashEffect(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isCapturing]);

  useEffect(() => {
    const setupVideoStream = async () => {
      if (isCameraActive && hasPermission && videoRef.current) {
        try {
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }

          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' }
          });

          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error setting up video stream:', error);
        }
      } else if (!isCameraActive && streamRef.current) {
        // Clean up stream when camera is deactivated
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }
    };

    setupVideoStream();

    // Clean up on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraActive, hasPermission]);

  return (
    <Card className="shadow-lg w-full">
      <CardHeader className="py-2">
        <CardTitle className="text-sm flex items-center">
          <Camera className="w-4 h-4 mr-2" /> Camera Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full aspect-square relative bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center">
          {isCameraActive && hasPermission ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              {flashEffect && (
                <div className="absolute inset-0 bg-white opacity-70 animate-flash"></div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 p-4">
              {hasPermission === false ?
                "Camera access denied. Please check your browser settings." :
                "Camera is currently inactive. Toggle the camera button to enable."}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CameraPreview;