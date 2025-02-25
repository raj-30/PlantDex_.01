import { Plant } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Leaf } from "lucide-react";

interface PlantCardProps {
  plant: Plant;
}

export default function PlantCard({ plant }: PlantCardProps) {
  return (
    <Card>
      <CardHeader className="relative h-48 p-0 overflow-hidden">
        <img
          src={plant.imageUrl}
          alt={plant.name}
          className="w-full h-full object-cover"
        />
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg text-green-900">{plant.name}</h3>
            <p className="text-sm text-gray-500 italic">{plant.scientificName}</p>
          </div>
          <Leaf className="h-5 w-5 text-green-600" />
        </div>
        <div className="mt-4 space-y-2">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Habitat</h4>
            <p className="text-sm text-gray-600">{plant.habitat}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900">Care Tips</h4>
            <p className="text-sm text-gray-600">{plant.careTips}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
