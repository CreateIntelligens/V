import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertModelSchema, insertGeneratedContentSchema } from "@shared/schema";
import multer from "multer";
import path from "path";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.mp3', '.wav', '.flac', '.zip', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowedTypes.includes(ext));
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Model routes
  app.get("/api/models", async (req, res) => {
    try {
      const models = await storage.getModels();
      res.json(models);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch models" });
    }
  });

  app.get("/api/models/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const model = await storage.getModel(id);
      if (!model) {
        return res.status(404).json({ error: "Model not found" });
      }
      res.json(model);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch model" });
    }
  });

  app.post("/api/models", async (req, res) => {
    try {
      const modelData = insertModelSchema.parse(req.body);
      const model = await storage.createModel(modelData);
      res.status(201).json(model);
    } catch (error) {
      res.status(400).json({ error: "Invalid model data" });
    }
  });

  app.patch("/api/models/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const model = await storage.updateModel(id, updates);
      if (!model) {
        return res.status(404).json({ error: "Model not found" });
      }
      res.json(model);
    } catch (error) {
      res.status(500).json({ error: "Failed to update model" });
    }
  });

  app.delete("/api/models/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteModel(id);
      if (!deleted) {
        return res.status(404).json({ error: "Model not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete model" });
    }
  });

  // File upload route
  app.post("/api/upload", upload.array('files'), async (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ error: "No files uploaded" });
      }
      
      const files = req.files.map(file => ({
        originalName: file.originalname,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path
      }));
      
      res.json({ files });
    } catch (error) {
      res.status(500).json({ error: "File upload failed" });
    }
  });

  // Content generation routes
  app.get("/api/content", async (req, res) => {
    try {
      const content = await storage.getGeneratedContent();
      res.json(content);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  app.post("/api/generate/audio", async (req, res) => {
    try {
      const contentData = insertGeneratedContentSchema.parse({
        ...req.body,
        type: "audio",
        status: "generating"
      });
      
      const content = await storage.createGeneratedContent(contentData);
      
      // Simulate audio generation process
      setTimeout(async () => {
        await storage.updateGeneratedContent(content.id, {
          status: "completed",
          outputPath: `audio_${content.id}.mp3`,
          duration: Math.floor(Math.random() * 120) + 30 // 30-150 seconds
        });
      }, 2000);
      
      res.status(201).json(content);
    } catch (error) {
      res.status(400).json({ error: "Invalid content data" });
    }
  });

  app.post("/api/generate/video", async (req, res) => {
    try {
      const contentData = insertGeneratedContentSchema.parse({
        ...req.body,
        type: "video",
        status: "generating"
      });
      
      const content = await storage.createGeneratedContent(contentData);
      
      // Simulate video generation process
      setTimeout(async () => {
        await storage.updateGeneratedContent(content.id, {
          status: "completed",
          outputPath: `video_${content.id}.mp4`,
          duration: Math.floor(Math.random() * 180) + 60 // 60-240 seconds
        });
      }, 5000);
      
      res.status(201).json(content);
    } catch (error) {
      res.status(400).json({ error: "Invalid content data" });
    }
  });

  app.get("/api/content/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const content = await storage.getGeneratedContent();
      const item = content.find(c => c.id === id);
      if (!item) {
        return res.status(404).json({ error: "Content not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  // Training simulation endpoint
  app.post("/api/models/:id/train", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const model = await storage.getModel(id);
      if (!model) {
        return res.status(404).json({ error: "Model not found" });
      }
      
      // Update model status to training
      await storage.updateModel(id, { status: "training" });
      
      // Simulate training process
      setTimeout(async () => {
        await storage.updateModel(id, { status: "ready" });
      }, 10000); // 10 seconds for demo
      
      res.json({ message: "Training started" });
    } catch (error) {
      res.status(500).json({ error: "Failed to start training" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
