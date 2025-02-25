import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertPlantSchema } from "@shared/schema";
import { identifyPlant } from "./plant-id";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Get user's plants
  app.get("/api/plants", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const plants = await storage.getPlants(req.user.id);
    res.json(plants);
  });

  // Get single plant
  app.get("/api/plants/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const plant = await storage.getPlant(parseInt(req.params.id));
    if (!plant) return res.sendStatus(404);
    if (plant.userId !== req.user.id) return res.sendStatus(403);
    res.json(plant);
  });

  // Create new plant
  app.post("/api/plants", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const result = insertPlantSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json(result.error);
    }

    try {
      // If image is provided, identify the plant
      let plantData;
      if (result.data.imageUrl && result.data.imageUrl.startsWith('data:image')) {
        plantData = await identifyPlant(result.data.imageUrl);
      } else {
        // Use provided data or fallback values
        plantData = {
          name: result.data.name || "Unknown Plant",
          scientificName: result.data.scientificName || "Plantus Unknownus",
          habitat: result.data.habitat || "Various habitats",
          careTips: result.data.careTips || "Water regularly, provide adequate sunlight",
        };
      }

      const plant = await storage.createPlant(req.user.id, {
        ...plantData,
        imageUrl: result.data.imageUrl || "https://placehold.co/400x300",
      });

      res.status(201).json(plant);
    } catch (error) {
      console.error('Error creating plant:', error);
      res.status(500).json({ error: 'Failed to identify plant' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}