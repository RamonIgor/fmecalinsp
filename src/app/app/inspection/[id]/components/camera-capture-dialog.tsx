"use client";

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Check, RefreshCw, X } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface CameraCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPhotoCapture: (dataUrl: string) => void;
}

export function CameraCaptureDialog({ open, onOpenChange, onPhotoCapture }: CameraCaptureDialogProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    async function setupCamera() {
      if (open && !capturedImage) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setHasCameraPermission(true);
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Acesso à Câmera Negado',
            description: 'Por favor, habilite a permissão da câmera nas configurações do seu navegador.',
          });
        }
      }
    }
    setupCamera();

    return () => {
      // Cleanup: stop camera stream when dialog closes or component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [open, capturedImage, toast]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        // Set canvas dimensions to match video to avoid distortion
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);

        // Stop the stream after capturing
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleSave = () => {
    if (capturedImage) {
      onPhotoCapture(capturedImage);
      onOpenChange(false);
      setCapturedImage(null);
    }
  };
  
  const handleClose = () => {
      onOpenChange(false);
      setCapturedImage(null);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-4">
        <DialogHeader>
          <DialogTitle>Anexar Fotografia</DialogTitle>
        </DialogHeader>
        <div className="relative w-full aspect-video rounded-md overflow-hidden bg-muted">
          {!hasCameraPermission ? (
            <div className="flex items-center justify-center h-full">
              <Alert variant="destructive" className="w-auto">
                <Camera className="h-4 w-4" />
                <AlertTitle>Sem acesso à câmera</AlertTitle>
                <AlertDescription>
                  Permita o acesso nas configurações do seu navegador.
                </AlertDescription>
              </Alert>
            </div>
          ) : capturedImage ? (
            <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
          ) : (
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <DialogFooter className="mt-4 gap-2">
            {capturedImage ? (
                <>
                    <Button variant="outline" onClick={handleRetake}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Tirar Outra
                    </Button>
                    <Button onClick={handleSave}>
                        <Check className="mr-2 h-4 w-4" />
                        Salvar Foto
                    </Button>
                </>
            ) : (
                <>
                    <Button variant="outline" onClick={handleClose}>
                        <X className="mr-2 h-4 w-4" />
                        Cancelar
                    </Button>
                    <Button onClick={handleCapture} disabled={!hasCameraPermission}>
                        <Camera className="mr-2 h-4 w-4" />
                        Capturar
                    </Button>
                </>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
