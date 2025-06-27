import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const models = pgTable("models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'voice' or 'character'
  provider: text("provider").notNull().default("heygem"), // 'heygem', 'edgetts', 'minimax'
  language: text("language").notNull(),
  description: text("description"),
  status: text("status").notNull().default("training"), // 'training', 'ready', 'failed'
  voiceSettings: text("voice_settings"), // JSON string for voice parameters
  characterSettings: text("character_settings"), // JSON string for character parameters
  trainingFiles: text("training_files").array(), // Array of file paths
  createdAt: timestamp("created_at").defaultNow(),
});

export const generatedContent = pgTable("generated_content", {
  id: serial("id").primaryKey(),
  modelId: integer("model_id").references(() => models.id),
  type: text("type").notNull(), // 'audio' or 'video'
  inputText: text("input_text").notNull(),
  outputPath: text("output_path"),
  emotion: text("emotion").default("neutral"),
  status: text("status").notNull().default("generating"), // 'generating', 'completed', 'failed'
  duration: integer("duration"), // in seconds
  provider: text("provider"), // TTS 提供商
  ttsModel: text("tts_model"), // TTS 模型名稱
  isFavorite: boolean("is_favorite").default(false), // 是否收藏
  everFavorited: boolean("ever_favorited").default(false), // 是否曾經被收藏過
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertModelSchema = createInsertSchema(models).omit({
  id: true,
  createdAt: true,
});

export const insertGeneratedContentSchema = createInsertSchema(generatedContent).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertModel = z.infer<typeof insertModelSchema>;
export type Model = typeof models.$inferSelect;
export type InsertGeneratedContent = z.infer<typeof insertGeneratedContentSchema>;
export type GeneratedContent = typeof generatedContent.$inferSelect;
