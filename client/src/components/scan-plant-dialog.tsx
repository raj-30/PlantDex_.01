import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPlantSchema, InsertPlant } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Camera } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface ScanPlantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ScanPlantDialog({ open, onOpenChange }: ScanPlantDialogProps) {
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const form = useForm<InsertPlant>({
    resolver: zodResolver(insertPlantSchema),
    defaultValues: {
      name: "",
      scientificName: "",
      imageUrl: "",
      habitat: "",
      careTips: "",
    },
  });

  const scanMutation = useMutation({
    mutationFn: async (data: InsertPlant) => {
      setIsProcessing(true);
      try {
        const res = await apiRequest("POST", "/api/plants", data);
        return await res.json();
      } finally {
        setIsProcessing(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plants"] });
      onOpenChange(false);
      form.reset();
      setPreviewUrl(undefined);
      stopCamera();
      toast({
        title: "Success",
        description: "Plant identified and added to your collection!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to identify plant. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    if (!previewUrl) {
      toast({
        title: "Error",
        description: "Please capture or upload an image first.",
        variant: "destructive",
      });
      return;
    }

    scanMutation.mutate({
      ...data,
      imageUrl: previewUrl,
    });
  });

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: { exact: "environment" }, // Use back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints).catch(() => {
        // Fallback to any available camera if environment camera fails
        return navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          } 
        });
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsCapturing(true);
        };
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast({
        title: "Camera Error",
        description: "Could not access your camera. Please check permissions and try again.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Set canvas size to match video dimensions
      const { videoWidth, videoHeight } = video;
      canvas.width = videoWidth;
      canvas.height = videoHeight;

      // Draw the video frame to canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

        // Convert to JPEG with high quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setPreviewUrl(dataUrl);
        stopCamera();
      }
    }
  };

  // Cleanup camera on unmount or dialog close
  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) stopCamera();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Plant</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="flex justify-center">
              <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                {previewUrl ? (
                  <>
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
                      onClick={() => {
                        setPreviewUrl(undefined);
                        startCamera();
                      }}
                    >
                      Retake
                    </Button>
                  </>
                ) : isCapturing ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      onClick={captureImage}
                      className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
                    >
                      Capture
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    onClick={startCamera}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  >
                    <Camera className="h-6 w-6 mr-2" />
                    Start Camera
                  </Button>
                )}
              </div>
            </div>

            {previewUrl && !isProcessing && (
              <Button type="submit" className="w-full" disabled={scanMutation.isPending}>
                {scanMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Identify Plant
              </Button>
            )}

            {isProcessing && (
              <div className="text-center py-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-600" />
                <p className="mt-2 text-sm text-gray-600">Identifying your plant...</p>
              </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}