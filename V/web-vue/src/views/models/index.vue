<template>
  <div class="models-container">
    <!-- 頭部導航 -->
    <header class="header">
      <div class="header-content">
        <h1 class="logo">{{ $t('models.title') }}</h1>
        <nav class="nav">
          <router-link to="/home" class="nav-item">{{ $t('nav.home') }}</router-link>
          <router-link to="/video/edit" class="nav-item">{{ $t('nav.videoEdit') }}</router-link>
          <router-link to="/models" class="nav-item active">{{ $t('nav.models') }}</router-link>
          <router-link to="/videos" class="nav-item">{{ $t('nav.videos') }}</router-link>
        </nav>
      </div>
    </header>

    <!-- 主要內容 -->
    <main class="main-content">
      <!-- 操作欄 -->
      <section class="action-bar">
        <div class="action-content">
          <div class="search-box">
            <t-input
              v-model="searchTerm"
              placeholder="搜索模特..."
              @input="handleSearch"
            >
              <template #prefix-icon>
                <t-icon name="search" />
              </template>
            </t-input>
          </div>
          <t-button theme="primary" @click="showCreateDialog = true">
            <template #icon><t-icon name="add" /></template>
            {{ $t('models.create') }}
          </t-button>
        </div>
      </section>

      <!-- 模特列表 -->
      <section class="models-section">
        <div v-if="loading" class="loading-state">
          <t-loading size="large" />
          <p>載入中...</p>
        </div>

        <div v-else-if="filteredModels.length === 0" class="empty-state">
          <div class="empty-icon">👤</div>
          <h3>{{ $t('models.noModels') }}</h3>
          <p>開始創建你的第一個數字人模特</p>
          <t-button theme="primary" @click="showCreateDialog = true">
            {{ $t('models.create') }}
          </t-button>
        </div>

        <div v-else>
          <!-- 人物模特 -->
          <div class="model-category">
            <h3 class="category-title">人物模特 ({{ faceModels.length }})</h3>
            <div class="models-grid">
              <div
                v-for="model in faceModels"
                :key="model.id"
                class="model-card face-model"
              >
                <div class="model-thumbnail">
                  <video
                    v-if="getVideoUrl(model)"
                    :src="getVideoUrl(model)"
                    muted
                    @click="showModelPreview(model)"
                  ></video>
                  <div v-else class="placeholder" @click="showModelPreview(model)">
                    🎭
                  </div>
                  <div class="model-overlay">
                    <t-button size="small" variant="text" @click="showModelPreview(model)">
                      <t-icon name="play-circle" />
                    </t-button>
                  </div>
                  <div class="model-type-badge face">人物</div>
                </div>

                <div class="model-info">
                  <h3>{{ model.name }}</h3>
                  <p class="model-meta">
                    創建時間: {{ formatDate(model.createdAt) }}
                  </p>
                  <p class="model-meta" v-if="model.audioCheck">
                    音頻檢測: {{ model.audioCheck.hasAudio ? '✅ 有音頻' : '❌ 無音頻' }}
                  </p>

                  <div class="model-actions">
                    <t-button size="small" @click="editModel(model)">
                      編輯
                    </t-button>
                    <t-button size="small" @click="useModel(model)">
                      使用
                    </t-button>
                    <t-button
                      size="small"
                      theme="danger"
                      @click="confirmDelete(model)"
                    >
                      {{ $t('models.delete') }}
                    </t-button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 聲音模特 -->
          <div class="model-category" v-if="voiceModels.length > 0">
            <h3 class="category-title">🎤 聲音模特 ({{ voiceModels.length }})</h3>
            <div class="models-grid">
              <div
                v-for="model in voiceModels"
                :key="model.id"
                class="model-card voice-model"
              >
                <div class="model-thumbnail">
                  <div class="voice-placeholder" @click="showModelPreview(model)">
                    🎤
                  </div>
                  <div class="model-overlay">
                    <t-button size="small" variant="text" @click="playVoicePreview(model)">
                      <t-icon name="sound" />
                    </t-button>
                  </div>
                  <div class="model-type-badge voice">聲音</div>
                </div>

                <div class="model-info">
                  <h3>{{ model.name }}</h3>
                  <p class="model-meta">
                    創建時間: {{ formatDate(model.createdAt) }}
                  </p>
                  <p class="model-meta" v-if="model.audioQuality">
                    音頻質量: {{ model.audioQuality.quality }}
                  </p>

                  <div class="model-actions">
                    <t-button size="small" @click="editModel(model)">
                      編輯
                    </t-button>
                    <t-button size="small" @click="testVoice(model)">
                      試聽
                    </t-button>
                    <t-button
                      size="small"
                      theme="danger"
                      @click="confirmDelete(model)"
                    >
                      {{ $t('models.delete') }}
                    </t-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 創建模特對話框 -->
    <t-dialog
      v-model:visible="showCreateDialog"
      header="創建新模特"
      width="600px"
      @confirm="submitCreateModel"
    >
      <div class="create-form">
        <t-form :data="createForm" label-width="100px">
          <t-form-item label="模特名稱" name="name">
            <t-input
              v-model="createForm.name"
              placeholder="請輸入模特名稱"
            />
          </t-form-item>
          <t-form-item label="模特影片" name="video">
            <t-upload
              v-model="createForm.files"
              theme="file"
              :auto-upload="false"
              accept="video/*"
              :max="1"
            >
              <t-button>選擇影片文件</t-button>
            </t-upload>
            <div class="upload-tips">
              <p>• 支援 MP4、AVI、MOV 格式</p>
              <p>• 建議影片長度 10-60 秒</p>
              <p>• 確保人物面部清晰可見</p>
            </div>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <!-- 預覽對話框 -->
    <t-dialog
      v-model:visible="showPreviewDialog"
      :header="previewModel?.name || '模特預覽'"
      width="800px"
    >
      <div class="preview-content" v-if="previewModel">
        <video
          v-if="getVideoUrl(previewModel)"
          :src="getVideoUrl(previewModel)"
          controls
          style="width: 100%; max-height: 400px;"
        ></video>
        <div class="preview-info">
          <h4>模特信息</h4>
          <p><strong>名稱：</strong>{{ previewModel.name }}</p>
          <p><strong>創建時間：</strong>{{ formatDate(previewModel.createdAt) }}</p>
          <p v-if="previewModel.audioPath"><strong>音頻路徑：</strong>{{ previewModel.audioPath }}</p>
          <p><strong>類型：</strong>{{ previewModel.type === 'person' ? '人物模特' : '🎤 聲音模特' }}</p>
        </div>
      </div>
    </t-dialog>

    <!-- 刪除確認對話框 -->
    <t-dialog
      v-model:visible="showDeleteDialog"
      header="確認刪除"
      @confirm="deleteModel"
    >
      <p>確定要刪除模特「{{ deleteTarget?.name }}」嗎？</p>
      <p class="warning-text">此操作不可撤銷！</p>
    </t-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { MessagePlugin } from 'tdesign-vue-next'
import { modelAPI, uploadFile } from '@/api'

const { t } = useI18n()
const router = useRouter()

// 響應式數據
const models = ref([])
const loading = ref(false)
const searchTerm = ref('')
const showCreateDialog = ref(false)
const showPreviewDialog = ref(false)
const showDeleteDialog = ref(false)
const previewModel = ref(null)
const deleteTarget = ref(null)

const createForm = reactive({
  name: '',
  files: []
})

// 計算屬性
const filteredModels = computed(() => {
  if (!searchTerm.value) return models.value
  return models.value.filter(model =>
    model.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
})

const faceModels = computed(() => {
  return filteredModels.value.filter(model => model.type === 'person')
})

const voiceModels = computed(() => {
  return filteredModels.value.filter(model => model.type === 'voice')
})

// 方法
const loadModels = async () => {
  loading.value = true
  try {
    console.log('📋 開始載入模特列表...')
    const result = await modelAPI.getList({ page: 1, pageSize: 100 })
    console.log('📋 API 返回結果:', result)
    
    const modelsList = result.data?.list || []
    models.value = modelsList
    
    console.log(`✅ 載入完成，共 ${modelsList.length} 個模特:`, modelsList.map(m => m.name))
    
  } catch (error) {
    console.error('❌ 載入模特列表失敗:', error)
    MessagePlugin.error(`載入模特列表失敗: ${error.message}`)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  // 搜索邏輯已在 computed 中處理
}

const submitCreateModel = async () => {
  if (!createForm.name.trim()) {
    MessagePlugin.error('請輸入模特名稱')
    return
  }

  if (!createForm.files.length) {
    MessagePlugin.error('請選擇影片文件')
    return
  }

  const loadingMsg = MessagePlugin.loading('正在創建模特...')
  
  try {
    console.log('🚀 開始創建模特:', createForm.name)
    console.log('📁 文件信息:', createForm.files[0])

    // 上傳影片文件
    console.log('📤 開始上傳文件...')
    const uploadResult = await uploadFile(createForm.files[0].raw, 'video')
    console.log('✅ 文件上傳成功:', uploadResult)

    // 創建模特
    console.log('開始創建模特...')
    const createResult = await modelAPI.create({
      name: createForm.name,
      videoPath: uploadResult.sharedPath,
      type: 'person',
      description: '通過網頁創建的人物模特'
    })
    console.log('✅ 模特創建成功:', createResult)

    // 關閉 loading
    loadingMsg.close()
    
    // 顯示成功消息
    MessagePlugin.success('模特創建成功！')
    
    // 關閉對話框
    showCreateDialog.value = false
    
    // 清空表單
    createForm.name = ''
    createForm.files = []
    
    // 重新載入模特列表
    console.log('🔄 重新載入模特列表...')
    await loadModels()
    console.log('✅ 模特列表已更新')
    
  } catch (error) {
    console.error('❌ 創建模特失敗:', error)
    loadingMsg.close()
    MessagePlugin.error(`創建失敗: ${error.message}`)
  }
}

const showModelPreview = (model) => {
  previewModel.value = model
  showPreviewDialog.value = true
}

const editModel = (model) => {
  // TODO: 實現編輯功能
  MessagePlugin.info('編輯功能開發中...')
}

const useModel = (model) => {
  router.push(`/video/edit?modelId=${model.id}`)
}

const confirmDelete = (model) => {
  deleteTarget.value = model
  showDeleteDialog.value = true
}

const deleteModel = async () => {
  try {
    await modelAPI.delete(deleteTarget.value.id)
    MessagePlugin.success('模特刪除成功')
    showDeleteDialog.value = false
    loadModels()
  } catch (error) {
    MessagePlugin.error(`刪除失敗: ${error.message}`)
  }
}

const getVideoUrl = (model) => {
  if (model.videoPath) {
    // 如果是完整路徑，轉換為可訪問的 URL
    if (model.videoPath.startsWith('/code/data/')) {
      return `/uploads/${model.videoPath.split('/').pop()}`
    }
    return `/uploads/${model.videoPath}`
  }
  return null
}

const playVoicePreview = (model) => {
  MessagePlugin.info('聲音預覽功能開發中...')
}

const testVoice = (model) => {
  MessagePlugin.info('語音試聽功能開發中...')
}

const formatDate = (dateString) => {
  if (!dateString) return '未知'
  return new Date(dateString).toLocaleString()
}

onMounted(() => {
  loadModels()
})
</script>

<style scoped>
.models-container {
  width: 100%;
  min-height: 100vh;
  background: #f4f4f6;
  display: flex;
  flex-direction: column;
}

.header {
  background: white;
  border-bottom: 1px solid #e1e1e1;
  padding: 0 20px;
  flex-shrink: 0;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
}

.logo {
  font-size: 20px;
  font-weight: bold;
  margin: 0;
  color: #434af9;
}

.nav {
  display: flex;
  gap: 30px;
}

.nav-item {
  text-decoration: none;
  color: #666;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.3s;
}

.nav-item:hover,
.nav-item.active {
  color: #434af9;
  background: #f0f0ff;
}

.main-content {
  flex: 1;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.action-bar {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.action-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.search-box {
  flex: 1;
  max-width: 300px;
}

.models-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.models-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.model-card {
  border: 1px solid #e1e1e1;
  border-radius: 8px;
  overflow: hidden;
  transition: box-shadow 0.3s;
}

.model-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.model-thumbnail {
  position: relative;
  height: 200px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.model-thumbnail video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder {
  font-size: 60px;
  color: #ccc;
}

.model-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity 0.3s;
}

.model-thumbnail:hover .model-overlay {
  opacity: 1;
}

.model-info {
  padding: 16px;
}

.model-info h3 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
}

.model-meta {
  margin: 4px 0;
  color: #666;
  font-size: 12px;
}

.model-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.create-form {
  padding: 20px 0;
}

.upload-tips {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.upload-tips p {
  margin: 2px 0;
}

.preview-content {
  text-align: center;
}

.preview-info {
  margin-top: 20px;
  text-align: left;
}

.preview-info h4 {
  margin: 0 0 12px;
  color: #333;
}

.preview-info p {
  margin: 8px 0;
  color: #666;
}

.warning-text {
  color: #e34d59;
  font-weight: 500;
}

/* 分類樣式 */
.model-category {
  margin-bottom: 40px;
}

.category-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #333;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 10px;
}

/* 模特類型標識 */
.model-type-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}

.model-type-badge.face {
  background: #e3f2fd;
  color: #1976d2;
}

.model-type-badge.voice {
  background: #f3e5f5;
  color: #7b1fa2;
}

/* 聲音模特專用樣式 */
.voice-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: white;
}

.voice-model .model-thumbnail {
  height: 160px;
}

/* 網格調整為更小的卡片 */
.models-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.model-card {
  border: 1px solid #e1e1e1;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
}

.model-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.face-model {
  border-left: 4px solid #1976d2;
}

.voice-model {
  border-left: 4px solid #7b1fa2;
}

.model-thumbnail {
  position: relative;
  height: 140px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.model-info {
  padding: 12px;
}

.model-info h3 {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 600;
}

.model-meta {
  margin: 3px 0;
  color: #666;
  font-size: 11px;
}

.model-actions {
  display: flex;
  gap: 6px;
  margin-top: 10px;
}

@media (max-width: 768px) {
  .action-content {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: none;
  }

  .models-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}
</style>
