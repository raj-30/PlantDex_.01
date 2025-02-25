import session from "express-session";
import createMemoryStore from "memorystore";
import { User, InsertUser, Plant, InsertPlant } from "@shared/schema";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Plant operations
  getPlants(userId: number): Promise<Plant[]>;
  getPlant(id: number): Promise<Plant | undefined>;
  createPlant(userId: number, plant: InsertPlant): Promise<Plant>;
  
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private plants: Map<number, Plant>;
  private currentUserId: number;
  private currentPlantId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.plants = new Map();
    this.currentUserId = 1;
    this.currentPlantId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getPlants(userId: number): Promise<Plant[]> {
    return Array.from(this.plants.values()).filter(
      (plant) => plant.userId === userId,
    );
  }

  async getPlant(id: number): Promise<Plant | undefined> {
    return this.plants.get(id);
  }

  async createPlant(userId: number, insertPlant: InsertPlant): Promise<Plant> {
    const id = this.currentPlantId++;
    const plant: Plant = {
      ...insertPlant,
      id,
      userId,
      createdAt: new Date(),
    };
    this.plants.set(id, plant);
    return plant;
  }
}

export const storage = new MemStorage();
