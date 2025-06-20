<template>
  <div class="home-container">
    <!-- 導航欄 -->
    <header class="header">
      <div class="header-content">
        <h1 class="logo">HeyGem 數字人生成器</h1>
        <nav class="nav">
          <router-link to="/home" class="nav-item active">{{ $t('nav.home') }}</router-link>
          <router-link to="/video/edit" class="nav-item">{{ $t('nav.videoEdit') }}</router-link>
          <router-link to="/models" class="nav-item">{{ $t('nav.models') }}</router-link>
          <router-link to="/videos" class="nav-item">{{ $t('nav.videos') }}</router-link>
        </nav>
      </div>
    </header>

    <!-- 主要內容 -->
    <main class="main-content">
      <!-- Banner 區域 -->
      <section class="banner-section">
        <div class="banner-grid">
          <!-- 創建影片 -->
          <div class="banner-card primary" @click="handleCreateVideo">
            <div class="banner-content">
              <h2>{{ $t('common.banner0.title') }}</h2>
              <p>{{ $t('common.banner0.subTitle') }}</p>
              <div class="banner-button">
                {{ $t('common.banner0.buttonText') }}
              </div>
            </div>
            <div class="banner-icon">🎬</div>
          </div>

          <!-- 創建模特 -->
          <div class="banner-card secondary" @click="handleCreateModel">
            <div class="banner-content">
              <h2>{{ $t('common.banner1.title') }}</h2>
              <p>{{ $t('common.banner1.subTitle') }}</p>
              <div class="banner-button">
                {{ $t('common.banner1.buttonText') }}
              </div>
            </div>
            <div class="banner-icon">👤</div>
          </div>
        </div>
      </section>

      <!-- 統計和列表區域 -->
      <section class="content-section">
        <div class="tabs">
          <div 
            class="tab-item"
            :class="{ active: activeTab === 'works' }"
            @click="activeTab = 'works'"
          >
            {{ $t('common.tab.myWorksText') }} ({{ home.homeState.videoNum }})
          </div>
          <div 
            class="tab-item"
            :class="{ active: activeTab === 'models' }"
            @click="activeTab = 'models'"
          >
            {{ $t('common.tab.myAvatarsText') }} ({{ home.homeState.modelNum }})
          </div>
        </div>

        <div class="tab-content">
          <!-- 我的作品 -->
          <div v-if="activeTab === 'works'" class="works-list">
            <div v-if="videos.length === 0" class="empty-state">
              <div class="empty-icon">📹</div>
              <p>{{ $t('videos.noVideos') }}</p>
              <t-button theme="primary" @click="handleCreateVideo">
                {{ $t('home.createVideo') }}
              </t-button>
            </div>
            <div v-else class="video-grid">
              <div v-for="video in videos" :key="video.id" class="video-card">
                <div class="video-thumbnail">
                  <video v-if="video.preview" :src="video.preview" controls></video>
                  <div v-else class="placeholder">📹</div>
                </div>
                <div class="video-info">
                  <h3>{{ video.name }}</h3>
                  <p>{{ video.status }}</p>
                  <div class="video-actions">
                    <t-button size="small" @click="editVideo(video)">{{ $t('videos.edit') }}</t-button>
                    <t-button size="small" theme="danger" @click="deleteVideo(video)">{{ $t('videos.delete') }}</t-button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 我的模特 -->
          <div v-if="activeTab === 'models'" class="models-list">
            <div v-if="models.length === 0" class="empty-state">
              <div class="empty-icon">👤</div>
              <p>{{ $t('models.noModels') }}</p>
              <t-button theme="primary" @click="handleCreateModel">
                {{ $t('home.createModel') }}
              </t-button>
            </div>
            <div v-else class="model-grid">
              <div v-for="model in models" :key="model.id" class="model-card">
                <div class="model-thumbnail">
                  <video v-if="model.video_path" :src="model.video_path" controls></video>
                  <div v-else class="placeholder">👤</div>
                </div>
                <div class="model-info">
                  <h3>{{ model.name }}</h3>
                  <div class="model-actions">
                    <t-button size="small" @click="previewModel(model)">{{ $t('models.preview') }}</t-button>
                    <t-button size="small" theme="danger" @click="deleteModel(model)">{{ $t('models.delete') }}</t-button>
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
      v-model:visible="showCreateModel"
      header="創建新模特"
      width="600px"
      @confirm="submitCreateModel"
    >
      <div class="create-model-form">
        <t-form :data="modelForm" label-width="100px">
          <t-form-item label="模特名稱" name="name">
            <t-input v-model="modelForm.name" placeholder="請輸入模特名稱" />
          </t-form-item>
          <t-form-item label="模特影片" name="video">
            <t-upload
              v-model="modelForm.files"
              theme="file"
              :auto-upload="false"
              accept="video/*"
              :max="1"
            >
              <t-button>選擇影片文件</t-button>
            </t-upload>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { MessagePlugin } from 'tdesign-vue-next'
import { useHomeStore } from '@/stores/home'
import { countVideo, countModel, videoPage, modelPage, uploadFile, modelAPI } from '@/api'

const { t } = useI18n()
const router = useRouter()
const home = useHomeStore()

// 響應式數據
const activeTab = ref('works')
const videos = ref([])
const models = ref([])
const showCreateModel = ref(false)

const modelForm = reactive({
  name: '',
  files: []
})

// 方法
const handleCreateVideo = () => {
  router.push('/video/edit')
}

const handleCreateModel = () => {
  showCreateModel.value = true
  modelForm.name = ''
  modelForm.files = []
}

const submitCreateModel = async () => {
  if (!modelForm.name.trim()) {
    MessagePlugin.error('請輸入模特名稱')
    return
  }
  
  if (!modelForm.files.length) {
    MessagePlugin.error('請選擇影片文件')
    return
  }

  try {
    MessagePlugin.loading('正在創建模特...')
    
    // 上傳影片文件
    const uploadResult = await uploadFile(modelForm.files[0].raw, 'video')
    
    // 創建模特
    const result = await modelAPI.create({
      name: modelForm.name,
      videoPath: uploadResult.sharedPath
    })
    
    MessagePlugin.success('模特創建成功！')
    showCreateModel.value = false
    loadData()
  } catch (error) {
    MessagePlugin.error(`創建失敗: ${error.message}`)
  }
}

const editVideo = (video) => {
  router.push(`/video/edit?videoId=${video.id}`)
}

const deleteVideo = async (video) => {
  // TODO: 實現刪除功能
  MessagePlugin.info('刪除功能開發中...')
}

const previewModel = (model) => {
  // TODO: 實現預覽功能
  MessagePlugin.info('預覽功能開發中...')
}

const deleteModel = async (model) => {
  // TODO: 實現刪除功能
  MessagePlugin.info('刪除功能開發中...')
}

const loadData = async () => {
  try {
    // 載入統計數據
    const videoCount = await countVideo()
    const modelCount = await countModel()
    
    home.setVideoNum(videoCount)
    home.setModelNum(modelCount)
    
    // 載入列表數據
    const videoResult = await videoPage({ page: 1, pageSize: 20 })
    const modelResult = await modelPage({ page: 1, pageSize: 20 })
    
    videos.value = videoResult.list || []
    models.value = modelResult.list || []
  } catch (error) {
    console.error('載入數據失敗:', error)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.home-container {
  width: 100%;
  height: 100vh;
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
  overflow: auto;
  padding: 20px;
}

.banner-section {
  max-width: 1200px;
  margin: 0 auto 30px;
}

.banner-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.banner-card {
  background: linear-gradient(135deg, #434af9 0%, #6366f1 100%);
  border-radius: 12px;
  padding: 30px;
  color: white;
  cursor: pointer;
  transition: transform 0.3s;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 160px;
}

.banner-card:hover {
  transform: translateY(-2px);
}

.banner-card.secondary {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.banner-content h2 {
  font-size: 28px;
  margin: 0 0 10px;
  font-weight: bold;
}

.banner-content p {
  font-size: 14px;
  margin: 0 0 20px;
  opacity: 0.9;
}

.banner-button {
  background: rgba(255, 255, 255, 0.2);
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  display: inline-block;
}

.banner-icon {
  font-size: 60px;
  opacity: 0.3;
}

.content-section {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #e1e1e1;
}

.tab-item {
  padding: 16px 24px;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.3s;
  font-weight: 500;
}

.tab-item:hover {
  background: #f8f9fa;
}

.tab-item.active {
  color: #434af9;
  border-bottom-color: #434af9;
  background: #f0f0ff;
}

.tab-content {
  padding: 30px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.empty-state p {
  color: #666;
  margin-bottom: 20px;
}

.video-grid,
.model-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.video-card,
.model-card {
  border: 1px solid #e1e1e1;
  border-radius: 8px;
  overflow: hidden;
  transition: box-shadow 0.3s;
}

.video-card:hover,
.model-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.video-thumbnail,
.model-thumbnail {
  height: 160px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-thumbnail video,
.model-thumbnail video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder {
  font-size: 40px;
  color: #ccc;
}

.video-info,
.model-info {
  padding: 16px;
}

.video-info h3,
.model-info h3 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
}

.video-info p {
  margin: 0 0 12px;
  color: #666;
  font-size: 14px;
}

.video-actions,
.model-actions {
  display: flex;
  gap: 8px;
}

.create-model-form {
  padding: 20px 0;
}

@media (max-width: 768px) {
  .banner-grid {
    grid-template-columns: 1fr;
  }
  
  .banner-card {
    flex-direction: column;
    text-align: center;
    min-height: auto;
  }
  
  .banner-icon {
    margin-top: 20px;
  }
  
  .video-grid,
  .model-grid {
    grid-template-columns: 1fr;
  }
}
</style>
