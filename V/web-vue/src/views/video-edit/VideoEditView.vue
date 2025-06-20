<template>
  <div class="video-edit-container">
    <!-- 頭部導航 -->
    <header class="header">
      <div class="header-content">
        <h1 class="logo">🎬 {{ $t('videoEdit.title') }}</h1>
        <nav class="nav">
          <router-link to="/home" class="nav-item">{{ $t('nav.home') }}</router-link>
          <router-link to="/video/edit" class="nav-item active">{{ $t('nav.videoEdit') }}</router-link>
          <router-link to="/models" class="nav-item">{{ $t('nav.models') }}</router-link>
          <router-link to="/videos" class="nav-item">{{ $t('nav.videos') }}</router-link>
        </nav>
      </div>
    </header>

    <!-- 主要編輯區域 -->
    <main class="edit-main">
      <div class="edit-layout">
        <!-- 左側：模特選擇 -->
        <aside class="edit-sidebar">
          <div class="sidebar-section">
            <h3>{{ $t('videoEdit.selectModel') }}</h3>
            <div class="model-list">
              <div v-if="models.length === 0" class="empty-models">
                <p>還沒有模特，請先創建模特</p>
                <t-button size="small" @click="goToModels">創建模特</t-button>
              </div>
              <div 
                v-for="model in models" 
                :key="model.id"
                class="model-item"
                :class="{ active: selectedModel?.id === model.id }"
                @click="selectModel(model)"
              >
                <div class="model-avatar">
                  <video v-if="getVideoUrl(model)" :src="getVideoUrl(model)" muted></video>
                  <div v-else class="placeholder">🎭</div>
                </div>
                <div class="model-info">
                  <h4>{{ model.name }}</h4>
                  <p>{{ model.createdAt ? new Date(model.createdAt).toLocaleDateString() : '' }}</p>
                  <div class="model-type">{{ model.type === 'face' ? '人物' : '🎤 聲音' }}</div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <!-- 中間：預覽區域 -->
        <section class="edit-preview">
          <div class="preview-container">
            <h3>{{ $t('videoEdit.preview') }}</h3>
            <div class="preview-area">
              <div v-if="!selectedModel" class="preview-placeholder">
                <div class="placeholder-icon">🎭</div>
                <p>請選擇一個模特開始創建</p>
              </div>
              <div v-else class="model-preview">
                <video 
                  v-if="getVideoUrl(selectedModel)" 
                  :src="getVideoUrl(selectedModel)" 
                  controls 
                  muted
                  class="preview-video"
                ></video>
                <div class="model-name">{{ selectedModel.name }}</div>
              </div>
            </div>
          </div>
        </section>

        <!-- 右側：內容編輯 -->
        <section class="edit-content">
          <div class="content-section">
            <h3>內容設置</h3>
            
            <!-- 項目名稱 -->
            <div class="form-group">
              <label>項目名稱</label>
              <t-input v-model="projectForm.name" placeholder="請輸入項目名稱" />
            </div>

            <!-- 內容類型選擇 -->
            <div class="form-group">
              <label>內容類型</label>
              <t-radio-group v-model="contentType">
                <t-radio value="text">{{ $t('videoEdit.inputText') }}</t-radio>
                <t-radio value="audio">{{ $t('videoEdit.uploadAudio') }}</t-radio>
              </t-radio-group>
            </div>

            <!-- 文字輸入 -->
            <div v-if="contentType === 'text'" class="form-group">
              <label>輸入文字</label>
              <t-textarea 
                v-model="projectForm.text" 
                placeholder="請輸入要合成的文字內容..."
                :autosize="{ minRows: 4, maxRows: 8 }"
              />
              <div class="text-actions">
                <t-button size="small" @click="previewTTS" :disabled="!projectForm.text.trim()">
                  試聽語音
                </t-button>
              </div>
            </div>

            <!-- 音頻上傳 -->
            <div v-if="contentType === 'audio'" class="form-group">
              <label>上傳音頻</label>
              <t-upload
                v-model="audioFiles"
                theme="file"
                :auto-upload="false"
                accept="audio/*"
                :max="1"
                @change="handleAudioChange"
              >
                <t-button>選擇音頻文件</t-button>
              </t-upload>
              <div v-if="uploadedAudio" class="audio-preview">
                <audio :src="uploadedAudio" controls></audio>
              </div>
            </div>

            <!-- 高級設置 -->
            <div class="form-group">
              <t-collapse>
                <t-collapse-panel header="高級設置">
                  <div class="advanced-settings">
                    <div class="setting-item">
                      <label>超分辨率</label>
                      <t-switch v-model="projectForm.chaofen" />
                    </div>
                    <div class="setting-item">
                      <label>水印</label>
                      <t-switch v-model="projectForm.watermark" />
                    </div>
                  </div>
                </t-collapse-panel>
              </t-collapse>
            </div>

            <!-- 操作按鈕 -->
            <div class="action-buttons">
              <t-button @click="saveProject" variant="outline">
                <template #icon><t-icon name="save" /></template>
                {{ $t('videoEdit.save') }}
              </t-button>
              <t-button theme="primary" @click="generateVideo" :loading="generating">
                <template #icon><t-icon name="play-circle" /></template>
                {{ generating ? $t('videoEdit.generating') : $t('videoEdit.generate') }}
              </t-button>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- 生成進度對話框 -->
    <t-dialog
      v-model:visible="showProgress"
      header="正在生成影片"
      :close-btn="false"
      :close-on-overlay-click="false"
      width="500px"
    >
      <div class="progress-content">
        <t-progress :percentage="progress" />
        <p class="progress-text">{{ progressText }}</p>
        <div class="progress-details">
          <p>任務ID: {{ currentTaskCode }}</p>
          <p>預計時間: 3-8 分鐘</p>
        </div>
      </div>
    </t-dialog>

    <!-- 完成對話框 -->
    <t-dialog
      v-model:visible="showComplete"
      header="🎉 影片生成完成"
      width="500px"
      @confirm="goToHome"
    >
      <div class="complete-content">
        <p>您的數字人影片已經生成完成！</p>
        <div v-if="resultVideo" class="result-preview">
          <video :src="resultVideo" controls style="width: 100%; max-height: 300px;"></video>
        </div>
        <div class="complete-actions">
          <t-button @click="downloadVideo" v-if="resultVideo">下載影片</t-button>
          <t-button theme="primary" @click="goToHome">查看我的作品</t-button>
        </div>
      </div>
    </t-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { MessagePlugin } from 'tdesign-vue-next'
import { modelAPI, uploadFile, videoAPI, ttsAPI } from '@/api'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

// 響應式數據
const models = ref([])
const selectedModel = ref(null)
const contentType = ref('text')
const audioFiles = ref([])
const uploadedAudio = ref('')
const generating = ref(false)
const showProgress = ref(false)
const showComplete = ref(false)
const progress = ref(0)
const progressText = ref('')
const currentTaskCode = ref('')
const resultVideo = ref('')

const projectForm = reactive({
  name: `我的影片${new Date().toLocaleString().replace(/\/|:| /g, '')}`,
  text: '',
  chaofen: false,
  watermark: false
})

// 方法
const goBack = () => {
  router.go(-1)
}

const goToModels = () => {
  router.push('/models')
}

const goToHome = () => {
  router.push('/home')
}

const selectModel = (model) => {
  selectedModel.value = model
}

const handleAudioChange = async (files) => {
  if (files.length > 0) {
    try {
      const result = await uploadFile(files[0].raw, 'audio')
      uploadedAudio.value = `/uploads/${result.filename}`
      MessagePlugin.success('音頻上傳成功')
    } catch (error) {
      MessagePlugin.error(`音頻上傳失敗: ${error.message}`)
    }
  }
}

const previewTTS = async () => {
  if (!selectedModel.value) {
    MessagePlugin.error('請先選擇模特')
    return
  }

  try {
    MessagePlugin.loading('正在生成語音預覽...')
    const result = await ttsAPI.generate({
      text: projectForm.text,
      voiceConfig: {
        voiceId: selectedModel.value.voice_id
      }
    })
    
    if (result.success) {
      // 播放生成的音頻
      const audio = new Audio(result.audioUrl)
      audio.play()
      MessagePlugin.success('語音生成成功')
    }
  } catch (error) {
    MessagePlugin.error(`語音生成失敗: ${error.message}`)
  }
}

const saveProject = () => {
  // TODO: 實現項目保存
  MessagePlugin.success('項目已保存')
}

const generateVideo = async () => {
  // 驗證表單
  if (!selectedModel.value) {
    MessagePlugin.error('請選擇模特')
    return
  }

  if (!projectForm.name.trim()) {
    MessagePlugin.error('請輸入項目名稱')
    return
  }

  if (contentType.value === 'text' && !projectForm.text.trim()) {
    MessagePlugin.error('請輸入文字內容')
    return
  }

  if (contentType.value === 'audio' && !uploadedAudio.value) {
    MessagePlugin.error('請上傳音頻文件')
    return
  }

  try {
    generating.value = true
    showProgress.value = true
    progress.value = 0
    progressText.value = '正在準備...'

    let audioPath = ''
    
    // 處理音頻
    if (contentType.value === 'text') {
      // 生成TTS音頻
      progressText.value = '正在生成語音...'
      const ttsResult = await ttsAPI.generate({
        text: projectForm.text,
        voiceConfig: {
          voiceId: selectedModel.value.voice_id
        }
      })
      audioPath = ttsResult.audioUrl
    } else {
      audioPath = uploadedAudio.value
    }

    // 提交影片生成任務
    progressText.value = '正在提交任務...'
    const submitResult = await videoAPI.submit({
      audioPath: audioPath.replace('/uploads/', '/code/shared/'),
      videoPath: selectedModel.value.video_path,
      options: {
        chaofen: projectForm.chaofen ? 1 : 0,
        watermark: projectForm.watermark ? 1 : 0
      }
    })

    if (submitResult.success) {
      currentTaskCode.value = submitResult.taskCode
      progressText.value = '任務已提交，正在處理...'
      
      // 輪詢任務狀態
      await pollTaskStatus(submitResult.taskCode)
    }
  } catch (error) {
    MessagePlugin.error(`生成失敗: ${error.message}`)
    generating.value = false
    showProgress.value = false
  }
}

const pollTaskStatus = async (taskCode) => {
  const maxAttempts = 300 // 10分鐘
  let attempts = 0

  const poll = async () => {
    try {
      const result = await videoAPI.getStatus(taskCode)
      
      if (result.success) {
        progress.value = result.progress || 0
        progressText.value = result.message || '處理中...'

        if (result.status === 2) {
          // 完成
          resultVideo.value = `/results${result.result}`
          showProgress.value = false
          showComplete.value = true
          generating.value = false
          MessagePlugin.success('影片生成完成！')
          return
        } else if (result.status === 3) {
          // 失敗
          throw new Error(result.message || '生成失敗')
        }
      }

      attempts++
      if (attempts < maxAttempts) {
        setTimeout(poll, 2000) // 2秒後重試
      } else {
        throw new Error('任務超時')
      }
    } catch (error) {
      MessagePlugin.error(`任務失敗: ${error.message}`)
      generating.value = false
      showProgress.value = false
    }
  }

  poll()
}

const downloadVideo = () => {
  if (resultVideo.value) {
    const link = document.createElement('a')
    link.href = resultVideo.value
    link.download = `${projectForm.name}.mp4`
    link.click()
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

const loadModels = async () => {
  try {
    const result = await modelAPI.getList({ page: 1, pageSize: 100 })
    models.value = result.data?.list || []
    
    // 只顯示人物模特（用於影片生成）
    models.value = models.value.filter(model => model.type === 'person')
    
    // 如果有模特，默認選擇第一個人物模特
    if (models.value.length > 0) {
      selectedModel.value = models.value[0]
    }
  } catch (error) {
    console.error('載入模特列表失敗:', error)
  }
}

onMounted(() => {
  loadModels()
  
  // 如果有 videoId 參數，載入影片詳情
  const { videoId } = route.query
  if (videoId) {
    // TODO: 載入影片詳情
  }
})
</script>

<style scoped>
.video-edit-container {
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

.edit-main {
  flex: 1;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.edit-layout {
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  gap: 20px;
  height: calc(100vh - 120px);
}

.edit-sidebar {
  background: white;
  border-radius: 8px;
  border: 1px solid #e1e1e1;
  overflow-y: auto;
}

.sidebar-section {
  padding: 20px;
}

.sidebar-section h3 {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.model-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-models {
  text-align: center;
  padding: 20px;
  color: #666;
}

.model-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid transparent;
}

.model-item:hover {
  background: #f8f9fa;
  border-color: #e1e1e1;
}

.model-item.active {
  background: #f0f0ff;
  border-color: #434af9;
}

.model-avatar {
  width: 50px;
  height: 50px;
  border-radius: 6px;
  overflow: hidden;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.model-avatar video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.model-info h4 {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.model-info p {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.model-type {
  font-size: 10px;
  color: #434af9;
  margin-top: 2px;
}

.edit-preview {
  background: white;
  border-radius: 8px;
  border: 1px solid #e1e1e1;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.preview-container h3 {
  margin: 0 0 20px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.preview-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 8px;
  min-height: 400px;
  border: 2px dashed #e1e1e1;
}

.preview-placeholder {
  text-align: center;
  color: #666;
}

.placeholder-icon {
  font-size: 60px;
  margin-bottom: 16px;
}

.model-preview {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.preview-video {
  max-width: 100%;
  max-height: 80%;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.model-name {
  margin-top: 16px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.edit-content {
  background: white;
  border-radius: 8px;
  border: 1px solid #e1e1e1;
  overflow-y: auto;
}

.content-section {
  padding: 20px;
}

.content-section h3 {
  margin: 0 0 20px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.text-actions {
  margin-top: 8px;
}

.audio-preview {
  margin-top: 12px;
}

.audio-preview audio {
  width: 100%;
}

.advanced-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e1e1e1;
}

.progress-content {
  padding: 20px 0;
}

.progress-text {
  text-align: center;
  margin: 16px 0;
  font-weight: 500;
}

.progress-details {
  margin-top: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 14px;
  color: #666;
}

.complete-content {
  text-align: center;
  padding: 20px 0;
}

.result-preview {
  margin: 20px 0;
}

.complete-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
}

.placeholder {
  font-size: 20px;
  color: #ccc;
}

@media (max-width: 1200px) {
  .edit-layout {
    grid-template-columns: 250px 1fr 280px;
  }
}

@media (max-width: 768px) {
  .edit-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
    gap: 16px;
  }
  
  .edit-main {
    padding: 16px;
  }
}
</style>
