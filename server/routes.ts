import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertPlantSchema } from "@shared/schema";
import { identifyPlant } from "./plant-id";
import session from "express-session";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Update the session configuration to use the SESSION_SECRET from environment variables
  app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
  }));

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

  // Delete plant
  app.delete("/api/plants/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const plant = await storage.getPlant(parseInt(req.params.id));
    if (!plant) return res.sendStatus(404);
    if (plant.userId !== req.user.id) return res.sendStatus(403);
    await storage.deletePlant(parseInt(req.params.id));
    res.sendStatus(204);
  });

  // Create new plant
  app.post("/api/plants", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const result = insertPlantSchema.safeParse(req.body);
    if (!result.success) {
      console.error("Validation error:", result.error);
      return res.status(400).json(result.error);
    }

    try {
      // If image is provided, identify the plant
      let plantData;
      if (result.data.imageUrl && (result.data.imageUrl.startsWith('data:image') || result.data.imageUrl.includes('base64'))) {
        try {
          plantData = await identifyPlant(result.data.imageUrl);
          console.log("Plant identification successful:", plantData.name);
        } catch (identifyError: any) {
          console.error("Plant identification error:", identifyError);
          // If identification fails but we have other data, continue with that
          if (result.data.name && result.data.scientificName) {
            plantData = {
              name: result.data.name,
              scientificName: result.data.scientificName,
              habitat: result.data.habitat || "Various habitats",
              careTips: result.data.careTips || "Water regularly, provide adequate sunlight",
            };
          } else {
            return res.status(500).json({ error: 'Failed to identify plant: ' + identifyError.message });
          }
        }
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
    } catch (error: any) {
      console.error('Error creating plant:', error);
      res.status(500).json({ error: 'Failed to create plant: ' + error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}