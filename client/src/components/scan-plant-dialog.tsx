import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPlantSchema, InsertPlant } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Upload } from "lucide-react";
import { useState } from "react";

interface ScanPlantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ScanPlantDialog({ open, onOpenChange }: ScanPlantDialogProps) {
  const [previewUrl, setPreviewUrl] = useState<string>();
  
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

  const scanMutation = useMutation({
    mutationFn: async (data: InsertPlant) => {
      const res = await apiRequest("POST", "/api/plants", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plants"] });
      onOpenChange(false);
      form.reset();
      setPreviewUrl(undefined);
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    scanMutation.mutate({
      ...data,
      imageUrl: previewUrl || "https://placehold.co/400x300",
    });
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan New Plant</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
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
                    <Input {...field} />
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
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={scanMutation.isPending}>
              {scanMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Plant
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
