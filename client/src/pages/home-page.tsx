import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Plant } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { LogOut, Plus } from "lucide-react";
import PlantCard from "@/components/plant-card";
import ScanPlantDialog from "@/components/scan-plant-dialog";
import { useState } from "react";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [scanOpen, setScanOpen] = useState(false);
  
  const { data: plants = [], isLoading } = useQuery<Plant[]>({
    queryKey: ["/api/plants"],
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <header className="border-b bg-white/50 backdrop-blur-sm fixed top-0 left-0 right-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-green-900">
            Welcome, {user?.username}!
          </h1>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setScanOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-24 pb-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plants.map((plant) => (
            <PlantCard key={plant.id} plant={plant} />
          ))}
          {plants.length === 0 && !isLoading && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No plants yet. Click the + button to scan your first plant!
            </div>
          )}
        </div>
      </main>

      <ScanPlantDialog open={scanOpen} onOpenChange={setScanOpen} />
    </div>
  );
}
