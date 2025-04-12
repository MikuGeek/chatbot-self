import { useState, useEffect } from 'react';

export const useCameraCapture = () => {
  console.log('useCameraCapture hook initialized');

  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Log state changes
  useEffect(() => {
    console.log('Camera state:', { isCapturing, isCameraActive, hasPermission });
  }, [isCapturing, isCameraActive, hasPermission]);

  // Check camera permissions when camera is activated
  useEffect(() => {
    if (isCameraActive && hasPermission === null) {
      checkCameraPermission();
    }
  }, [isCameraActive, hasPermission]);

  // Function to check camera permissions
  const checkCameraPermission = async () => {
    try {
      console.log('Checking camera permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      // Stop tracks immediately after permission check
      stream.getTracks().forEach(track => track.stop());

      console.log('Camera permission granted');
      setHasPermission(true);
      return true;
    } catch (error) {
      console.error('Camera permission denied:', error);
      setHasPermission(false);
      setIsCameraActive(false); // Auto-disable camera if permission denied
      return false;
    }
  };

  const toggleCamera = async () => {
    console.log('toggleCamera called, current state:', isCameraActive);

    // If trying to activate camera and permission is not granted, check permission first
    if (!isCameraActive && hasPermission !== true) {
      const permissionGranted = await checkCameraPermission();
      if (!permissionGranted) {
        console.log('Cannot activate camera - permission denied');
        return false;
      }
    }

    setIsCameraActive(prev => {
      const newState = !prev;
      console.log('Setting isCameraActive to:', newState);
      return newState;
    });

    return true;
  };

  const capturePhoto = async () => {
    console.log('capturePhoto called, isCameraActive:', isCameraActive, 'hasPermission:', hasPermission);

    if (!isCameraActive) {
      console.log('Camera is not active, cannot capture photo');
      return '';
    }

    if (hasPermission === false) {
      console.log('Camera permission denied, cannot capture photo');
      throw new Error('Camera permission denied');
    }

    console.log('Setting isCapturing to true');
    setIsCapturing(true);
    try {
      console.log('Attempting to access camera...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      console.log('Camera access granted, stream tracks:', stream.getVideoTracks().length);

      const video = document.createElement('video');
      video.srcObject = stream;
      console.log('Video element created, attempting to play');
      await video.play();
      console.log('Video element playing, size:', video.videoWidth, 'x', video.videoHeight);

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get canvas 2D context');
        throw new Error('Failed to get canvas 2D context');
      }
      ctx.drawImage(video, 0, 0);
      console.log('Photo captured on canvas, dimensions:', canvas.width, 'x', canvas.height);

      const photoBlob = await new Promise<Blob | null>((resolve) => {
        console.log('Converting canvas to blob...');
        canvas.toBlob(resolve, 'image/jpeg');
      });
      console.log('Canvas converted to blob:', photoBlob ? 'success' : 'failed',
        photoBlob ? `size: ${photoBlob.size} bytes` : '');

      console.log('Stopping camera stream tracks');
      stream.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind, track.label);
        track.stop();
      });
      console.log('Camera stream tracks stopped');

      if (!photoBlob) {
        console.error('Failed to capture photo - null blob');
        throw new Error('Failed to capture photo');
      }

      const photoUrl = URL.createObjectURL(photoBlob);
      console.log('Created object URL for photo:', photoUrl.substring(0, 30) + '...');
      return photoUrl;

    } catch (error) {
      console.error('Camera capture error:', error);
      throw error;
    } finally {
      console.log('Setting isCapturing to false');
      setIsCapturing(false);
    }
  };

  return {
    capturePhoto,
    isCapturing,
    toggleCamera,
    isCameraActive,
    hasPermission
  };
};
