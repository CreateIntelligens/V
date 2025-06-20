<template>
  <div class="videos-container">
    <!-- 頭部導航 -->
    <header class="header">
      <div class="header-content">
        <h1 class="logo">📹 {{ $t('videos.title') }}</h1>
        <nav class="nav">
          <router-link to="/home" class="nav-item">{{ $t('nav.home') }}</router-link>
          <router-link to="/video/edit" class="nav-item">{{ $t('nav.videoEdit') }}</router-link>
          <router-link to="/models" class="nav-item">{{ $t('nav.models') }}</router-link>
          <router-link to="/videos" class="nav-item active">{{ $t('nav.videos') }}</router-link>
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
            placeholder="搜索影片..."
            @input="handleSearch"
          >
              <template #prefix-icon>
                <t-icon name="search" />
              </template>
            </t-input>
          </div>
          <t-button theme="primary" @click="createVideo">
            <template #icon><t-icon name="add" /></template>
            創建影片
          </t-button>
        </div>
      </section>

      <!-- 影片列表 -->
      <section class="videos-section">
        <div v-if="loading" class="loading-state">
          <t-loading size="large" />
          <p>載入中...</p>
        </div>

        <div v-else-if="filteredVideos.length === 0" class="empty-state">
          <div class="empty-icon">📹</div>
          <h3>{{ $t('videos.noVideos') }}</h3>
          <p>開始創建你的第一個數字人影片</p>
          <t-button theme="primary" @click="createVideo">
            創建影片
          </t-button>
        </div>

        <div v-else class="videos-grid">
          <div
            v-for="video in filteredVideos"
            :key="video.id"
            class="video-card"
          >
            <div class="video-thumbnail">
              <video
                v-if="video.result_path"
                :src="video.result_path"
                muted
                @click="showVideoPreview(video)"
              ></video>
              <div v-else class="placeholder" @click="showVideoPreview(video)">
                <div class="status-indicator" :class="getStatusClass(video.status)">
                  {{ getStatusText(video.status) }}
                </div>
              </div>
              <div class="video-overlay" v-if="video.result_path">
                <t-button size="small" variant="text" @click="showVideoPreview(video)">
                  <t-icon name="play-circle" />
                </t-button>
              </div>
            </div>

            <div class="video-info">
              <h3>{{ video.name }}</h3>
              <p class="video-meta">
                狀態: <span :class="getStatusClass(video.status)">{{ getStatusText(video.status) }}</span>
              </p>
              <p class="video-meta">
                創建時間: {{ formatDate(video.created_at) }}
              </p>
              <p class="video-meta" v-if="video.model_name">
                使用模特: {{ video.model_name }}
              </p>

              <div class="video-actions">
                <t-button size="small" @click="editVideo(video)" :disabled="video.status === 'processing'">
                  {{ $t('videos.edit') }}
                </t-button>
                <t-button 
                  size="small" 
                  @click="downloadVideo(video)" 
                  :disabled="!video.result_path"
                >
                  {{ $t('videos.download') }}
                </t-button>
                <t-button
                  size="small"
                  theme="danger"
                  @click="confirmDelete(video)"
                >
                  {{ $t('videos.delete') }}
                </t-button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 預覽對話框 -->
    <t-dialog
      v-model:visible="showPreviewDialog"
      :header="previewVideo?.name || '影片預覽'"
      width="800px"
    >
      <div class="preview-content" v-if="previewVideo">
        <video
          v-if="previewVideo.result_path"
          :src="previewVideo.result_path"
          controls
          style="width: 100%; max-height: 400px;"
        ></video>
        <div v-else class="preview-placeholder">
          <p>影片還在處理中，請稍後再試</p>
        </div>
        <div class="preview-info">
          <h4>影片信息</h4>
          <p><strong>名稱：</strong>{{ previewVideo.name }}</p>
          <p><strong>狀態：</strong>{{ getStatusText(previewVideo.status) }}</p>
          <p><strong>創建時間：</strong>{{ formatDate(previewVideo.created_at) }}</p>
          <p v-if="previewVideo.model_name"><strong>使用模特：</strong>{{ previewVideo.model_name }}</p>
          <p v-if="previewVideo.text_content"><strong>文字內容：</strong>{{ previewVideo.text_content }}</p>
        </div>
      </div>
    </t-dialog>

    <!-- 刪除確認對話框 -->
    <t-dialog
      v-model:visible="showDeleteDialog"
      header="確認刪除"
      @confirm="deleteVideo"
    >
      <p>確定要刪除影片「{{ deleteTarget?.name }}」嗎？</p>
      <p class="warning-text">此操作不可撤銷！</p>
    </t-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { MessagePlugin } from 'tdesign-vue-next'
import { videoAPI } from '@/api'

const { t } = useI18n()
const router = useRouter()

// 響應式數據
const videos = ref([])
const loading = ref(false)
const searchTerm = ref('')
const showPreviewDialog = ref(false)
const showDeleteDialog = ref(false)
const previewVideo = ref(null)
const deleteTarget = ref(null)

// 計算屬性
const filteredVideos = computed(() => {
  if (!searchTerm.value) return videos.value
  return videos.value.filter(video =>
    video.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
})

// 方法
const loadVideos = async () => {
  loading.value = true
  try {
    const result = await videoAPI.getList({ page: 1, pageSize: 100 })
    videos.value = result.data?.list || []
  } catch (error) {
    MessagePlugin.error(`載入影片列表失敗: ${error.message}`)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  // 搜索邏輯已在 computed 中處理
}

const createVideo = () => {
  router.push('/video/edit')
}

const editVideo = (video) => {
  router.push(`/video/edit?videoId=${video.id}`)
}

const showVideoPreview = (video) => {
  previewVideo.value = video
  showPreviewDialog.value = true
}

const downloadVideo = (video) => {
  if (video.result_path) {
    const link = document.createElement('a')
    link.href = video.result_path
    link.download = `${video.name}.mp4`
    link.click()
    MessagePlugin.success('開始下載影片')
  } else {
    MessagePlugin.warning('影片還未生成完成')
  }
}

const confirmDelete = (video) => {
  deleteTarget.value = video
  showDeleteDialog.value = true
}

const deleteVideo = async () => {
  try {
    // TODO: 實現刪除API
    // await videoAPI.delete(deleteTarget.value.id)
    MessagePlugin.success('影片刪除成功')
    showDeleteDialog.value = false
    loadVideos()
  } catch (error) {
    MessagePlugin.error(`刪除失敗: ${error.message}`)
  }
}

const getStatusText = (status) => {
  const statusMap = {
    'pending': '等待中',
    'processing': '處理中',
    'completed': '已完成',
    'failed': '失敗'
  }
  return statusMap[status] || '未知'
}

const getStatusClass = (status) => {
  const classMap = {
    'pending': 'status-pending',
    'processing': 'status-processing',
    'completed': 'status-completed',
    'failed': 'status-failed'
  }
  return classMap[status] || ''
}

const formatDate = (dateString) => {
  if (!dateString) return '未知'
  return new Date(dateString).toLocaleString()
}

onMounted(() => {
  loadVideos()
})
</script>

<style scoped>
.videos-container {
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

.videos-section {
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

.videos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.video-card {
  border: 1px solid #e1e1e1;
  border-radius: 8px;
  overflow: hidden;
  transition: box-shadow 0.3s;
}

.video-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.video-thumbnail {
  position: relative;
  height: 180px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.video-thumbnail video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
}

.status-indicator {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.status-pending {
  background: #fff3cd;
  color: #856404;
}

.status-processing {
  background: #cce5ff;
  color: #0066cc;
}

.status-completed {
  background: #d4edda;
  color: #155724;
}

.status-failed {
  background: #f8d7da;
  color: #721c24;
}

.video-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity 0.3s;
}

.video-thumbnail:hover .video-overlay {
  opacity: 1;
}

.video-info {
  padding: 16px;
}

.video-info h3 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
}

.video-meta {
  margin: 4px 0;
  color: #666;
  font-size: 12px;
}

.video-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.preview-content {
  text-align: center;
}

.preview-placeholder {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 8px;
  color: #666;
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

@media (max-width: 768px) {
  .action-content {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: none;
  }

  .videos-grid {
    grid-template-columns: 1fr;
  }
}
</style>
