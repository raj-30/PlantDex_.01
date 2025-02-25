import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const plants = pgTable("plants", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  scientificName: text("scientific_name").notNull(),
  imageUrl: text("image_url").notNull(),
  habitat: text("habitat").notNull(),
  careTips: text("care_tips").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPlantSchema = createInsertSchema(plants)
  .pick({
    name: true,
    scientificName: true,
    imageUrl: true,
    habitat: true,
    careTips: true,
  })
  .extend({
    image: z.instanceof(File).optional(),
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Plant = typeof plants.$inferSelect;
export type InsertPlant = z.infer<typeof insertPlantSchema>;
