import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPlantSchema, InsertPlant } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Upload, Camera } from "lucide-react";
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
  const [identifiedPlant, setIdentifiedPlant] = useState<InsertPlant | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const form = useForm<InsertPlant>({
    resolver: zodResolver(insertPlantSchema),
    defaultValues: {
      name: "",
      scientificName: "",
      habitat: "",
      careTips: "",
      imageUrl: "",
    },
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
      setPreviewUrl(undefined);
      setIdentifiedPlant(null);
      stopCamera();
    }
  }, [open, form]);

  const scanMutation = useMutation({
    mutationFn: async (data: InsertPlant) => {
      setIsProcessing(true);
      try {
        const res = await apiRequest("POST", "/api/plants", data);
        return res.json();
      } finally {
        setIsProcessing(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plants"] });
      onOpenChange(false);
      form.reset();
      setPreviewUrl(undefined);
      setIdentifiedPlant(null);
      stopCamera();
      toast({
        title: "Success",
        description: "Plant added to your collection!",
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPreviewUrl(dataUrl);
        identifyPlantFromImage(dataUrl);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCapturing(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast({
        title: "Camera Error",
        description: "Could not access your camera. Please check permissions.",
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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setPreviewUrl(dataUrl);
        identifyPlantFromImage(dataUrl);
        stopCamera();
      }
    }
  };

  const identifyPlantFromImage = async (imageUrl: string) => {
    setIsProcessing(true);
    try {
      const response = await apiRequest("POST", "/api/plants", { imageUrl });
      const plantData = await response.json();

      // Update form with identified plant data
      form.reset({
        name: plantData.name,
        scientificName: plantData.scientificName,
        habitat: plantData.habitat,
        careTips: plantData.careTips,
        imageUrl: imageUrl,
      });
      setIdentifiedPlant(plantData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to identify plant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) stopCamera();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan New Plant</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <Tabs defaultValue="camera" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="camera">Camera</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
              </TabsList>

              <TabsContent value="camera">
                <div className="flex justify-center">
                  <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
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
                <canvas ref={canvasRef} className="hidden" />
              </TabsContent>

              <TabsContent value="upload">
                <div className="flex justify-center">
                  <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                        <Upload className="h-8 w-8 text-gray-400" />
                        <span className="mt-2 text-sm text-gray-500">Upload Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {previewUrl && !isProcessing && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plant Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scientificName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scientific Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="habitat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Habitat</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="careTips"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Care Tips</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={scanMutation.isPending}>
                  {scanMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add to Collection
                </Button>
              </div>
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