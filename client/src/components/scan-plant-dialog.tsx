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
import { Loader2, Upload, Camera, RefreshCw, FlipHorizontal } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import Webcam from "react-webcam";

interface ScanPlantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ScanPlantDialog({ open, onOpenChange }: ScanPlantDialogProps) {
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const webcamRef = useRef<Webcam>(null);
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
      setRetryCount(0);
      setIsCapturing(false);
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
      setRetryCount(0);
      setIsCapturing(false);
      toast({
        title: "Success!",
        description: "Plant successfully added to your collection!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to add plant. Please try again.",
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
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = () => {
    setIsCameraLoading(true);
    setIsCapturing(true);
  };

  const stopCamera = () => {
    setIsCapturing(false);
    setIsCameraLoading(false);
  };

  const flipCamera = () => {
    setFacingMode(prevMode => prevMode === "user" ? "environment" : "user");
  };

  const captureImage = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        // Show loading state
        setIsProcessing(true);
        
        // Set the preview and stop the camera
        setPreviewUrl(imageSrc);
        stopCamera();
        
        // Start identification process
        identifyPlantFromImage(imageSrc);
        
        // Provide haptic feedback if available (for mobile devices)
        if (navigator.vibrate) {
          navigator.vibrate(100);
        }
      }
    }
  }, [webcamRef]);

  const retryIdentification = () => {
    setRetryCount(prev => prev + 1);
    if (previewUrl) {
      identifyPlantFromImage(previewUrl);
    }
  };

  const identifyPlantFromImage = async (imageUrl: string) => {
    setIsProcessing(true);
    try {
      // Show a toast to indicate processing has started
      toast({
        title: "Processing Image",
        description: "Identifying your plant...",
      });
      
      // Make sure we're sending just the imageUrl in the request
      const response = await apiRequest("POST", "/api/plants", { 
        imageUrl,
        // Send empty strings for required fields to pass validation
        name: "",
        scientificName: "",
        habitat: "",
        careTips: ""
      });
      
      const plantData = await response.json();

      if (!plantData.name) {
        throw new Error("Could not identify plant");
      }

      // Update form with identified plant data
      form.reset({
        name: plantData.name,
        scientificName: plantData.scientificName,
        habitat: plantData.habitat,
        careTips: plantData.careTips,
        imageUrl: imageUrl,
      });

      // Provide haptic feedback for success (for mobile devices)
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      toast({
        title: "Plant Identified!",
        description: `Found: ${plantData.name}`,
        variant: "default",
      });
      
      // Automatically close the dialog after successful identification
      stopCamera();
      setPreviewUrl(undefined);
      setRetryCount(0);
      queryClient.invalidateQueries({ queryKey: ["/api/plants"] });
      onOpenChange(false);
      
    } catch (error) {
      console.error("Plant identification error:", error);
      
      // Provide haptic feedback for error (for mobile devices)
      if (navigator.vibrate) {
        navigator.vibrate(300);
      }
      
      toast({
        title: "Identification Failed",
        description: retryCount >= 2 
          ? "Multiple identification attempts failed. Try a different image or angle."
          : "Could not identify plant. Try again with better lighting or a clearer image.",
        variant: "destructive",
      });
      
      // Don't close the dialog on failure, allow the user to retry
      setIsProcessing(false);
    } finally {
      setIsProcessing(false);
    }
  };

  // Configure webcam settings with better mobile support
  const videoConstraints = {
    width: { ideal: 1280, min: 640 },
    height: { ideal: 720, min: 480 },
    facingMode: facingMode,
    aspectRatio: 4/3
  };

  // Add a function to handle webcam errors
  const handleWebcamError = useCallback((err: string | DOMException) => {
    console.error("Webcam error:", err);
    toast({
      title: "Camera Error",
      description: "Could not access your camera. Please check permissions or try uploading an image instead.",
      variant: "destructive",
    });
    setIsCapturing(false);
  }, [toast]);

  // Add a function to handle webcam success
  const handleWebcamSuccess = useCallback(() => {
    setIsCameraLoading(false);
    // Provide haptic feedback when camera is ready
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) stopCamera();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-md max-w-[95vw] p-3 sm:p-6">
        <DialogHeader>
          <DialogTitle>Scan New Plant</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-3 sm:space-y-4">
            <Tabs defaultValue="camera" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="camera">Camera</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
              </TabsList>

              <TabsContent value="camera">
                <div className="flex justify-center">
                  <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    {previewUrl ? (
                      <div className="relative">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 right-2 flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="bg-white/80 hover:bg-white"
                            onClick={() => {
                              setPreviewUrl(undefined);
                              startCamera();
                            }}
                          >
                            Retake
                          </Button>
                        </div>
                      </div>
                    ) : isCapturing ? (
                      <div className="relative">
                        {isCameraLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                            <div className="text-center">
                              <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-600 mb-2" />
                              <p className="text-sm text-gray-600">Initializing camera...</p>
                            </div>
                          </div>
                        )}
                        <Webcam
                          audio={false}
                          ref={webcamRef}
                          screenshotFormat="image/jpeg"
                          videoConstraints={videoConstraints}
                          className="w-full h-full object-cover"
                          mirrored={facingMode === "user"}
                          onUserMediaError={handleWebcamError}
                          onUserMedia={handleWebcamSuccess}
                          imageSmoothing={true}
                        />
                        
                        {/* Hint overlay - only show on larger screens */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none hidden md:flex">
                          <div className="text-center bg-black/30 px-4 py-2 rounded-full text-white text-sm animate-bounce">
                            Tap the button below to take a photo
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full p-3 sm:p-4 text-center">
                        <div className="mb-2 sm:mb-4 p-3 rounded-full bg-green-50">
                          <Camera className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
                        </div>
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">Camera Access Required</h3>
                        <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-6 max-w-xs">
                          We'll need access to your camera to identify plants. Please allow access when prompted.
                        </p>
                        <Button
                          type="button"
                          onClick={startCamera}
                          className="bg-green-600 hover:bg-green-700 px-4 sm:px-6 py-2 text-white font-medium rounded-md flex items-center gap-2"
                          size="default"
                        >
                          <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                          Start Camera
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="upload">
                <div className="flex justify-center">
                  <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    {previewUrl ? (
                      <div className="relative">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="absolute bottom-2 right-2"
                          onClick={() => setPreviewUrl(undefined)}
                        >
                          Change Image
                        </Button>
                      </div>
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

            {/* Camera controls moved outside of camera view */}
            {isCapturing && !previewUrl && !isProcessing && (
              <div className="mt-3 sm:mt-4">
                <div className="flex flex-col items-center gap-2">
                  {/* Take Photo Button - Outside camera view */}
                  <div className="relative w-full">
                    {/* Outer glow effect */}
                    <div className="absolute -inset-1 bg-green-400 opacity-30 rounded-xl blur-md"></div>
                    <Button
                      type="button"
                      onClick={captureImage}
                      className="bg-green-600 hover:bg-green-700 text-white w-full py-3 sm:py-5 rounded-lg shadow-xl flex items-center justify-center gap-2 relative border-2 border-white"
                      size="lg"
                    >
                      {/* Pulsing effect */}
                      <span className="absolute inset-0 rounded-lg bg-green-500 opacity-50 animate-ping"></span>
                      <Camera className="h-5 w-5 sm:h-6 sm:w-6 relative z-10" />
                      <span className="font-bold text-sm sm:text-lg relative z-10">TAKE PHOTO</span>
                    </Button>
                  </div>
                  
                  {/* Flip Camera Button */}
                  <Button
                    type="button"
                    onClick={flipCamera}
                    variant="outline"
                    size="sm"
                    className="bg-white/90 hover:bg-white text-xs sm:text-sm py-1 h-7 sm:h-8"
                  >
                    <FlipHorizontal className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span>Flip Camera</span>
                  </Button>
                </div>
              </div>
            )}

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

                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    className="flex-1"
                    onClick={retryIdentification}
                    disabled={isProcessing || retryCount >= 3}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Identification
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={scanMutation.isPending}
                  >
                    {scanMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Add to Collection
                  </Button>
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="text-center py-4 sm:py-8">
                <div className="relative mx-auto w-12 h-12 sm:w-16 sm:h-16">
                  <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin mx-auto text-green-600 opacity-25" />
                  <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin mx-auto text-green-600 absolute top-0 left-0" style={{ animationDuration: '3s' }} />
                </div>
                <p className="mt-3 sm:mt-4 text-green-700 font-medium text-sm sm:text-base">Identifying your plant...</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">This may take a few moments</p>
                <div className="mt-3 sm:mt-4 max-w-xs mx-auto">
                  <div className="h-1 sm:h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 