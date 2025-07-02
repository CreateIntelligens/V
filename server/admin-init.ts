import { storage } from "./storage";
import { log } from "./dev-server";

export async function initializeAdmin() {
  // 從環境變數或使用默認值
  const adminUsername = process.env.ADMIN_USERNAME || "ai360";
  const adminPassword = process.env.ADMIN_PASSWORD || "ai360";
  
  try {
    // 檢查管理員帳號是否已存在
    const existingAdmin = await storage.getUserByUsername(adminUsername);
    
    // 如果管理員帳號被誤刪，強制重建
    if (!existingAdmin) {
      log(`⚠️  管理員帳號 '${adminUsername}' 不存在，正在重建...`);
    }
    
    if (existingAdmin) {
      log(`✅ 管理員帳號 '${adminUsername}' 已存在`);
      
      // 如果管理員帳號存在但沒有備註或建立時間，更新它們
      if (!existingAdmin.note || !existingAdmin.createdAt) {
        try {
          const updates: any = {};
          if (!existingAdmin.note) {
            updates.note = "管理員";
          }
          if (!existingAdmin.createdAt) {
            updates.createdAt = new Date();
          }
          
          if (storage.updateUser) {
            await storage.updateUser(adminUsername, updates);
            log(`📝 已為管理員帳號 '${adminUsername}' 更新資料`);
          }
        } catch (error) {
          console.error("更新管理員資料失敗:", error);
        }
      }
      return;
    }
    
    // 創建管理員帳號（新建或重建）
    await storage.createUser({
      username: adminUsername,
      password: adminPassword,
      role: "admin",
      note: "管理員",
    });
    
    log(`🔧 已創建管理員帳號: ${adminUsername}/${adminPassword}`);
    log(`🛡️  管理員帳號受到保護，無法被刪除`);
    log(`⚠️  請記住管理員密碼，建議變更預設密碼`);
    
  } catch (error) {
    console.error("❌ 初始化管理員帳號失敗:", error);
  }
}