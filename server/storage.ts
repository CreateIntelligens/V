import { users, models, generatedContent, type User, type InsertUser, type Model, type InsertModel, type GeneratedContent, type InsertGeneratedContent } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Model operations
  getModels(): Promise<Model[]>;
  getModel(id: number): Promise<Model | undefined>;
  createModel(model: InsertModel): Promise<Model>;
  updateModel(id: number, updates: Partial<Model>): Promise<Model | undefined>;
  deleteModel(id: number): Promise<boolean>;
  
  // Generated content operations
  getGeneratedContent(): Promise<GeneratedContent[]>;
  getGeneratedContentByModel(modelId: number): Promise<GeneratedContent[]>;
  createGeneratedContent(content: InsertGeneratedContent): Promise<GeneratedContent>;
  updateGeneratedContent(id: number, updates: Partial<GeneratedContent>): Promise<GeneratedContent | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private models: Map<number, Model>;
  private generatedContent: Map<number, GeneratedContent>;
  private currentUserId: number;
  private currentModelId: number;
  private currentContentId: number;

  constructor() {
    this.users = new Map();
    this.models = new Map();
    this.generatedContent = new Map();
    this.currentUserId = 1;
    this.currentModelId = 1;
    this.currentContentId = 1;
    
    // Add some sample models
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const sampleModels: Model[] = [
      // Voice Models - HeyGem
      {
        id: this.currentModelId++,
        name: "溫柔女聲",
        type: "voice",
        provider: "heygem",
        language: "zh-TW",
        description: "溫和親切的女性聲音，適合客服和教學內容",
        status: "ready",
        voiceSettings: JSON.stringify({ pitch: 50, speed: 60, emotion: "gentle" }),
        characterSettings: null,
        trainingFiles: ["sample_voice_1.mp3", "sample_voice_2.mp3"],
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        id: this.currentModelId++,
        name: "專業男聲",
        type: "voice",
        provider: "heygem",
        language: "zh-TW",
        description: "沉穩專業的男性聲音，適合商務和新聞播報",
        status: "ready",
        voiceSettings: JSON.stringify({ pitch: 30, speed: 55, emotion: "professional" }),
        characterSettings: null,
        trainingFiles: ["male_voice_1.mp3"],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      // Voice Models - EdgeTTS
      {
        id: this.currentModelId++,
        name: "EdgeTTS 中文女聲",
        type: "voice",
        provider: "edgetts",
        language: "zh-CN",
        description: "Microsoft EdgeTTS 中文女性聲音",
        status: "ready",
        voiceSettings: JSON.stringify({ voice: "zh-CN-XiaoxiaoNeural", rate: "0%", pitch: "0%" }),
        characterSettings: null,
        trainingFiles: null,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: this.currentModelId++,
        name: "EdgeTTS 英文女聲",
        type: "voice",
        provider: "edgetts",
        language: "en-US",
        description: "Microsoft EdgeTTS 英文女性聲音",
        status: "ready",
        voiceSettings: JSON.stringify({ voice: "en-US-JennyNeural", rate: "0%", pitch: "0%" }),
        characterSettings: null,
        trainingFiles: null,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      // Voice Models - MiniMax (both preset and trainable)
      {
        id: this.currentModelId++,
        name: "MiniMax 智能語音",
        type: "voice",
        provider: "minimax",
        language: "zh-CN",
        description: "MiniMax 高品質中文語音合成 (自訓練)",
        status: "ready",
        voiceSettings: JSON.stringify({ model: "speech-01", speed: 1.0, vol: 0.8 }),
        characterSettings: null,
        trainingFiles: ["minimax_custom_voice.wav"],
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
      // Character Models - HeyGem only
      {
        id: this.currentModelId++,
        name: "活潑主播",
        type: "character",
        provider: "heygem",
        language: "zh-TW",
        description: "年輕活潑的女性角色，適合娛樂和推廣內容",
        status: "ready",
        voiceSettings: null,
        characterSettings: JSON.stringify({ age: "young", gender: "female", style: "energetic" }),
        trainingFiles: ["character_data_1.zip", "character_data_2.zip"],
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        id: this.currentModelId++,
        name: "商務精英",
        type: "character",
        provider: "heygem",
        language: "zh-TW",
        description: "專業商務人士形象，適合企業宣傳和培訓",
        status: "ready",
        voiceSettings: null,
        characterSettings: JSON.stringify({ age: "middle", gender: "male", style: "professional" }),
        trainingFiles: ["business_character.zip"],
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
    ];
    
    sampleModels.forEach(model => this.models.set(model.id, model));
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

  async getModels(): Promise<Model[]> {
    return Array.from(this.models.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getModel(id: number): Promise<Model | undefined> {
    return this.models.get(id);
  }

  async createModel(insertModel: InsertModel): Promise<Model> {
    const id = this.currentModelId++;
    const model: Model = { 
      ...insertModel,
      description: insertModel.description || null,
      status: insertModel.status || "training",
      provider: insertModel.provider || "heygem",
      voiceSettings: insertModel.voiceSettings || null,
      characterSettings: insertModel.characterSettings || null,
      trainingFiles: insertModel.trainingFiles || null,
      id,
      createdAt: new Date(),
    };
    this.models.set(id, model);
    return model;
  }

  async updateModel(id: number, updates: Partial<Model>): Promise<Model | undefined> {
    const existing = this.models.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.models.set(id, updated);
    return updated;
  }

  async deleteModel(id: number): Promise<boolean> {
    return this.models.delete(id);
  }

  async getGeneratedContent(): Promise<GeneratedContent[]> {
    return Array.from(this.generatedContent.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getGeneratedContentByModel(modelId: number): Promise<GeneratedContent[]> {
    return Array.from(this.generatedContent.values())
      .filter(content => content.modelId === modelId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createGeneratedContent(insertContent: InsertGeneratedContent): Promise<GeneratedContent> {
    const id = this.currentContentId++;
    const content: GeneratedContent = { 
      ...insertContent,
      status: insertContent.status || "generating",
      modelId: insertContent.modelId || null,
      outputPath: insertContent.outputPath || null,
      emotion: insertContent.emotion || null,
      duration: insertContent.duration || null,
      id,
      createdAt: new Date(),
    };
    this.generatedContent.set(id, content);
    return content;
  }

  async updateGeneratedContent(id: number, updates: Partial<GeneratedContent>): Promise<GeneratedContent | undefined> {
    const existing = this.generatedContent.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.generatedContent.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
