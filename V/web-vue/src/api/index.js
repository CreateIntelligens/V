import axios from 'axios'

// 創建 axios 實例
const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 請求攔截器
api.interceptors.request.use(
  config => {
    // 可以在這裡添加認證 token
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 響應攔截器
api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('API錯誤:', error)
    
    if (error.response) {
      // 服務器響應錯誤
      const message = error.response.data?.message || error.response.data?.error || '請求失敗'
      return Promise.reject(new Error(message))
    } else if (error.request) {
      // 網絡錯誤
      return Promise.reject(new Error('網絡連接失敗'))
    } else {
      // 其他錯誤
      return Promise.reject(error)
    }
  }
)

// 文件上傳
export function uploadFile(file, type) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  
  return api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 影片生成相關 API
export const videoAPI = {
  // 提交影片生成任務
  submit(data) {
    return api.post('/video/submit', data)
  },
  
  // 查詢任務狀態
  getStatus(taskCode) {
    return api.get(`/video/status/${taskCode}`)
  },
  
  // 獲取影片列表
  getList(params) {
    return api.get('/videos', { params })
  }
}

// 模特管理相關 API
export const modelAPI = {
  // 創建模特
  create(data) {
    return api.post('/model/create', data)
  },
  
  // 獲取模特列表
  getList(params) {
    return api.get('/models', { params })
  },
  
  // 刪除模特
  delete(id) {
    return api.delete(`/model/${id}`)
  }
}

// TTS 相關 API
export const ttsAPI = {
  // 生成語音
  generate(data) {
    return api.post('/tts/generate', data)
  }
}

// 兼容原有的 API 函數名
export function videoPage(params) {
  return videoAPI.getList(params)
}

export function findVideo(id) {
  return api.get(`/videos/${id}`)
}

export function removeVideo(id) {
  return api.delete(`/videos/${id}`)
}

export function saveVideo(video) {
  return api.post('/videos', video)
}

export function makeVideo(id) {
  return api.post(`/videos/${id}/make`)
}

export function exportVideo(id, outputPath) {
  return api.post(`/videos/${id}/export`, { outputPath })
}

export function modifyVideo(video) {
  return api.put(`/videos/${video.id}`, video)
}

export function countVideo(name = '') {
  return api.get('/videos/count', { params: { name } })
}

export function modelPage(params) {
  return modelAPI.getList(params)
}

export function findModel(id) {
  return api.get(`/models/${id}`)
}

export function addModel(data) {
  return modelAPI.create(data)
}

export function countModel(name = '') {
  return api.get('/models/count', { params: { name } })
}

export function removeModel(id) {
  return modelAPI.delete(id)
}

export function getContext(key) {
  return api.get(`/context/${key}`)
}

export function saveContext(key, val) {
  return api.post('/context', { key, val })
}

export function audition(voiceId, text) {
  return ttsAPI.generate({ text, voiceConfig: { voiceId } })
}

export default api
