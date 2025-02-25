import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Plant } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { LogOut, Plus, Sprout } from "lucide-react";
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
          <div className="flex items-center gap-2">
            <Sprout className="h-6 w-6 text-green-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              PlantDex
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setScanOpen(true)}
              className="bg-white hover:bg-green-50"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => logoutMutation.mutate()}
              className="bg-white hover:bg-green-50"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-24 pb-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-green-900 mb-2">
            Welcome to Your Plant Collection
          </h2>
          <p className="text-green-700">
            Hey {user?.username}! Discover and document your botanical journey.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plants.map((plant) => (
            <PlantCard key={plant.id} plant={plant} />
          ))}
          {plants.length === 0 && !isLoading && (
            <div className="col-span-full text-center py-12">
              <div className="max-w-md mx-auto space-y-4">
                <div className="p-4 rounded-full bg-green-50 w-fit mx-auto">
                  <Sprout className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-green-900">
                  Start Your Collection
                </h3>
                <p className="text-green-700">
                  Click the + button to scan your first plant!
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <ScanPlantDialog open={scanOpen} onOpenChange={setScanOpen} />
    </div>
  );
}