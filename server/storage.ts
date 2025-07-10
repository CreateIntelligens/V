import { users, models, generatedContent, type User, type InsertUser, type Model, type InsertModel, type GeneratedContent, type InsertGeneratedContent } from "@shared/schema";
import fs from "fs-extra";
import path from "path";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(username: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(username: string, password?: string): Promise<boolean>;
  validateUserPassword(username: string, password?: string): Promise<boolean>;
  
  // Model operations
  getModels(userId?: string, userRole?: string): Promise<Model[]>;
  getModel(id: number | string): Promise<Model | undefined>;
  createModel(model: InsertModel): Promise<Model>;
  updateModel(id: number | string, updates: Partial<Model>): Promise<Model | undefined>;
  deleteModel(id: number | string): Promise<boolean>;
  
  // Generated content operations
  getGeneratedContent(userId?: string): Promise<GeneratedContent[]>;
  getGeneratedContentByModel(modelId: number): Promise<GeneratedContent[]>;
  createGeneratedContent(content: InsertGeneratedContent): Promise<GeneratedContent>;
  updateGeneratedContent(id: number | string, updates: Partial<GeneratedContent>): Promise<GeneratedContent | undefined>;
  deleteGeneratedContent(id: number | string): Promise<boolean>;
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
        userId: "global",
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
        userId: "global",
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
      // Voice Models - EdgeTTS (一些自定義設置的範例)
      {
        id: this.currentModelId++,
        userId: "global",
        name: "EdgeTTS 客製曉曉",
        type: "voice",
        provider: "edgetts",
        language: "zh-CN",
        description: "自定義設置的曉曉聲音（語速加快）",
        status: "ready",
        voiceSettings: JSON.stringify({ voice: "zh-CN-XiaoxiaoNeural", rate: "+20%", pitch: "+10%" }),
        characterSettings: null,
        trainingFiles: null,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: this.currentModelId++,
        userId: "global",
        name: "EdgeTTS 新聞播報",
        type: "voice",
        provider: "edgetts",
        language: "zh-CN",
        description: "適合新聞播報的雲健聲音設置",
        status: "ready",
        voiceSettings: JSON.stringify({ voice: "zh-CN-YunjianNeural", rate: "0%", pitch: "-5%" }),
        characterSettings: null,
        trainingFiles: null,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      // Voice Models - MiniMax (both preset and trainable)
      {
        id: this.currentModelId++,
        userId: "global",
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
        userId: "global",
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
        userId: "global",
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
    
    // 使用 bcrypt 加密密碼
    let hashedPassword = null;
    if (insertUser.password) {
      const bcrypt = await import('bcrypt');
      hashedPassword = await bcrypt.hash(insertUser.password, 10);
    }
    
    const user: User = { 
      ...insertUser, 
      id,
      password: hashedPassword,
      role: insertUser.role || "user",
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async deleteUser(username: string, password?: string): Promise<boolean> {
    // global 用戶不能刪除
    if (username === "global") {
      return false;
    }

    const user = await this.getUserByUsername(username);
    if (!user) return false;

    // 如果用戶設置了密碼，需要驗證密碼
    if (user.password !== null && password) {
      const bcrypt = await import('bcrypt');
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return false;
      }
    }

    this.users.delete(user.id);
    return true;
  }

  async validateUserPassword(username: string, password?: string): Promise<boolean> {
    const user = await this.getUserByUsername(username);
    if (!user) return false;

    // 如果用戶沒有設置密碼，任何密碼都可以
    if (user.password === null || user.password === undefined) {
      return true;
    }

    // 如果用戶設置了密碼，使用 bcrypt 驗證
    if (!password) return false;
    const bcrypt = await import('bcrypt');
    return bcrypt.compare(password, user.password);
  }

  async updateUser(username: string, updates: Partial<User>): Promise<User | undefined> {
    const user = await this.getUserByUsername(username);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(user.id, updatedUser);
    return updatedUser;
  }

  async getModels(userId?: string, userRole?: string): Promise<Model[]> {
    let models = Array.from(this.models.values());
    
    if (userId) {
      if (userRole === "admin") {
        // 管理員可以看到所有模型
        // models 保持不變，返回所有模型
      } else {
        // 普通用戶：看到自己的模型 + global 模型 + 分享的模型
        models = models.filter(m => 
          m.userId === userId || 
          m.userId === "global" || 
          m.isShared === true
        );
      }
    } else {
      // 訪客用戶：只能看到 global 模型和分享的模型
      models = models.filter(m => 
        m.userId === "global" || 
        m.isShared === true
      );
    }
    
    return models.sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getModel(id: number | string): Promise<Model | undefined> {
    // 支援字串和數字 ID，統一轉換為數字
    const numId = typeof id === 'string' ? parseInt(id) : id;
    return this.models.get(numId);
  }

  async createModel(insertModel: InsertModel): Promise<Model> {
    const id = this.currentModelId++;
    const model: Model = { 
      ...insertModel,
      userId: insertModel.userId || "global", // 默認為 global
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

  async updateModel(id: number | string, updates: Partial<Model>): Promise<Model | undefined> {
    // 支援字串和數字 ID，統一轉換為數字
    const numId = typeof id === 'string' ? parseInt(id) : id;
    const existing = this.models.get(numId);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.models.set(numId, updated);
    return updated;
  }

  async deleteModel(id: number | string): Promise<boolean> {
    // 支援字串和數字 ID，統一轉換為數字
    const numId = typeof id === 'string' ? parseInt(id) : id;
    return this.models.delete(numId);
  }

  async getGeneratedContent(userId?: string): Promise<GeneratedContent[]> {
    let content = Array.from(this.generatedContent.values());
    
    if (userId) {
      // 返回該用戶的內容 + global 內容 + 分享的內容（isFavorite=true）
      content = content.filter(c => 
        c.userId === userId || 
        c.userId === "global" || 
        c.isFavorite === true
      );
    }
    
    return content.sort((a, b) => 
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
      userId: insertContent.userId || "global", // 默認為 global
      status: insertContent.status || "generating",
      modelId: insertContent.modelId || null,
      outputPath: insertContent.outputPath || null,
      emotion: insertContent.emotion || null,
      duration: insertContent.duration || null,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.generatedContent.set(id, content);
    return content;
  }

  async updateGeneratedContent(id: number | string, updates: Partial<GeneratedContent>): Promise<GeneratedContent | undefined> {
    const numId = typeof id === 'string' ? parseInt(id) : id;
    const existing = this.generatedContent.get(numId);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.generatedContent.set(numId, updated);
    return updated;
  }

  async deleteGeneratedContent(id: number | string): Promise<boolean> {
    const numId = typeof id === 'string' ? parseInt(id) : id;
    return this.generatedContent.delete(numId);
  }
}

// JSON 檔案存儲類
export class JsonStorage implements IStorage {
  private modelsPath = path.join(process.cwd(), 'data', 'database', 'models.json');
  private videosPath = path.join(process.cwd(), 'data', 'database', 'videos.json');
  private usersPath = path.join(process.cwd(), 'data', 'database', 'users.json');

  async getUser(id: number): Promise<User | undefined> {
    const users = await this.getUsers();
    return users.find(u => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await this.getUsers();
    return users.find(u => u.username === username);
  }

  async getAllUsers(): Promise<User[]> {
    return await this.getUsers();
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const users = await this.getUsers();
    
    // 使用 bcrypt 加密密碼
    let hashedPassword = null;
    if (insertUser.password) {
      const bcrypt = await import('bcrypt');
      hashedPassword = await bcrypt.hash(insertUser.password, 10);
    }
    
    const newUser: User = {
      ...insertUser,
      id: Date.now(), // 使用時間戳作為 ID
      password: hashedPassword,
      role: insertUser.role || "user",
      createdAt: new Date()
    };
    
    users.push(newUser);
    await fs.writeJson(this.usersPath, { users }, { spaces: 2 });
    return newUser;
  }

  async deleteUser(username: string, password?: string): Promise<boolean> {
    // global 用戶不能刪除
    if (username === "global") {
      return false;
    }

    const users = await this.getUsers();
    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex === -1) return false;

    const user = users[userIndex];
    // 如果用戶設置了密碼，需要驗證密碼
    if (user.password !== null && password) {
      const bcrypt = await import('bcrypt');
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return false;
      }
    }

    users.splice(userIndex, 1);
    await fs.writeJson(this.usersPath, { users }, { spaces: 2 });
    return true;
  }

  async validateUserPassword(username: string, password?: string): Promise<boolean> {
    const user = await this.getUserByUsername(username);
    if (!user) return false;

    // 如果用戶沒有設置密碼，任何密碼都可以
    if (user.password === null || user.password === undefined) {
      return true;
    }

    // 如果用戶設置了密碼，使用 bcrypt 驗證
    if (!password) return false;
    const bcrypt = await import('bcrypt');
    return bcrypt.compare(password, user.password);
  }

  async updateUser(username: string, updates: Partial<User>): Promise<User | undefined> {
    const users = await this.getUsers();
    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex === -1) return undefined;
    
    users[userIndex] = { ...users[userIndex], ...updates };
    await fs.writeJson(this.usersPath, { users }, { spaces: 2 });
    return users[userIndex];
  }

  private async getUsers(): Promise<User[]> {
    try {
      const data = await fs.readJson(this.usersPath);
      const users = data.users || [];
      
      // 檢查並修復缺少 createdAt 的用戶
      let needsUpdate = false;
      users.forEach((user: User) => {
        if (!user.createdAt) {
          user.createdAt = new Date();
          needsUpdate = true;
        }
      });
      
      // 如果有更新，寫回檔案
      if (needsUpdate) {
        await fs.writeJson(this.usersPath, { users }, { spaces: 2 });
      }
      
      return users;
    } catch (error) {
      console.error('讀取用戶資料失敗:', error);
      return [];
    }
  }

  async getModels(userId?: string, userRole?: string): Promise<Model[]> {
    try {
      const data = await fs.readJson(this.modelsPath);
      let models = data.models || [];
      
      if (userId) {
        if (userRole === "admin") {
          // 管理員可以看到所有模型
          // models 保持不變，返回所有模型
        } else {
          // 普通用戶：看到自己的模型 + global 模型 + 分享的模型
          models = models.filter((m: Model) => 
            m.userId === userId || 
            m.userId === "global" || 
            m.isShared === true
          );
        }
      } else {
        // 訪客用戶：只能看到 global 模型和分享的模型
        models = models.filter((m: Model) => 
          m.userId === "global" || 
          m.isShared === true
        );
      }
      
      return models;
    } catch (error) {
      console.error('讀取模特資料失敗:', error);
      return [];
    }
  }

  async getModel(id: number | string): Promise<Model | undefined> {
    const models = await this.getModels();
    return models.find(m => m.id === id.toString() || m.id === id);
  }

  async createModel(insertModel: InsertModel): Promise<Model> {
    const models = await this.getModels();
    const newModel: Model = {
      ...insertModel,
      userId: insertModel.userId || "global", // 默認為 global
      id: Date.now().toString(), // 使用時間戳作為 ID
      createdAt: new Date(),
    };
    
    models.push(newModel);
    await fs.writeJson(this.modelsPath, { models }, { spaces: 2 });
    return newModel;
  }

  async updateModel(id: number | string, updates: Partial<Model>): Promise<Model | undefined> {
    const models = await this.getModels();
    const index = models.findIndex(m => m.id === id.toString() || m.id === id);
    if (index === -1) return undefined;
    
    models[index] = { ...models[index], ...updates, updatedAt: new Date() };
    await fs.writeJson(this.modelsPath, { models }, { spaces: 2 });
    return models[index];
  }

  async deleteModel(id: number | string): Promise<boolean> {
    const models = await this.getModels();
    const index = models.findIndex(m => m.id === id.toString() || m.id === id);
    if (index === -1) return false;
    
    models.splice(index, 1);
    await fs.writeJson(this.modelsPath, { models }, { spaces: 2 });
    return true;
  }

  async getGeneratedContent(userId?: string): Promise<GeneratedContent[]> {
    try {
      const data = await fs.readJson(this.videosPath);
      let content = data.videos || [];
      
      if (userId) {
        // 返回該用戶的內容 + global 內容 + 分享的內容（isFavorite=true）
        content = content.filter((c: GeneratedContent) => 
          c.userId === userId || 
          c.userId === "global" || 
          c.isFavorite === true
        );
      }
      
      return content;
    } catch (error) {
      console.error('讀取影片資料失敗:', error);
      return [];
    }
  }

  async getGeneratedContentByModel(modelId: number): Promise<GeneratedContent[]> {
    const content = await this.getGeneratedContent();
    return content.filter(c => c.modelId === modelId);
  }

  async createGeneratedContent(insertContent: InsertGeneratedContent): Promise<GeneratedContent> {
    const content = await this.getGeneratedContent();
    const newContent: GeneratedContent = {
      ...insertContent,
      userId: insertContent.userId || "global", // 默認為 global
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    content.push(newContent);
    await fs.writeJson(this.videosPath, { videos: content }, { spaces: 2 });
    return newContent;
  }

  async updateGeneratedContent(id: number | string, updates: Partial<GeneratedContent>): Promise<GeneratedContent | undefined> {
    const content = await this.getGeneratedContent();
    const index = content.findIndex(c => c.id === id || c.id === id.toString());
    if (index === -1) return undefined;
    
    content[index] = { ...content[index], ...updates, updatedAt: new Date() };
    await fs.writeJson(this.videosPath, { videos: content }, { spaces: 2 });
    return content[index];
  }

  async deleteGeneratedContent(id: number | string): Promise<boolean> {
    const content = await this.getGeneratedContent();
    const index = content.findIndex(c => c.id === id || c.id === id.toString());
    if (index === -1) return false;
    
    content.splice(index, 1);
    await fs.writeJson(this.videosPath, { videos: content }, { spaces: 2 });
    return true;
  }
}

export const storage = new JsonStorage();
