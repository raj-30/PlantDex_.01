import { Plant } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Leaf, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PlantCardProps {
  plant: Plant;
}

export default function PlantCard({ plant }: PlantCardProps) {
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/plants/${plant.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plants"] });
      toast({
        title: "Plant deleted",
        description: "The plant has been removed from your collection.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to delete plant. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200">
      <div className="relative">
        {/* Delete button */}
        <Button
          variant="destructive"
          size="icon"
          className="absolute -right-2 -top-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        {/* Title overlay on image */}
        <div className="absolute -top-6 left-0 right-0 z-10 text-center">
          <div className="inline-block bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border transform -translate-y-2 group-hover:translate-y-0 transition-transform duration-200">
            <h3 className="font-bold text-lg bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
              {plant.name}
            </h3>
          </div>
        </div>

        {/* Image */}
        <CardHeader className="relative h-48 p-0 overflow-hidden rounded-t-lg">
          <img
            src={plant.imageUrl}
            alt={plant.name}
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-200"
          />
        </CardHeader>
      </div>

      <CardContent className="p-4 pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-emerald-600 font-medium italic">{plant.scientificName}</p>
          </div>
          <Leaf className="h-5 w-5 text-green-600 transform group-hover:rotate-12 transition-transform duration-200" />
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Habitat
            </h4>
            <p className="text-sm text-gray-600 ml-4">{plant.habitat}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Care Tips
            </h4>
            <p className="text-sm text-gray-600 ml-4">{plant.careTips}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}