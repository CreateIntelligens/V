import { createI18n } from 'vue-i18n'

// 中文語言包
const zh = {
  common: {
    tab: {
      myWorksText: '我的作品',
      myAvatarsText: '我的模特'
    },
    banner0: {
      title: '創建影片',
      subTitle: '選擇模特，輸入文字或上傳音頻，生成數字人影片',
      buttonText: '開始創建'
    },
    banner1: {
      title: '創建模特',
      subTitle: '上傳影片文件，創建專屬數字人模特',
      buttonText: '創建模特'
    },
    selectView: {
      modalFinishedObj: {
        text1: '影片生成完成！',
        text2: '查看我的作品',
        text3: '或繼續創建新影片',
        rightBtnText: '查看作品'
      }
    },
    modelCreateView: {
      videoName: '我的影片'
    },
    message: {
      selectModelsTextError: '請選擇模特',
      VideoTextError: '請輸入影片名稱',
      VideoCopywritingTextError: '請輸入文字內容或上傳音頻',
      initEditVideoPageFailed: '初始化影片編輯頁面失敗',
      videoSynthesisTextError: '影片合成失敗'
    }
  },
  nav: {
    home: '首頁',
    videoEdit: '影片編輯',
    models: '模特管理',
    videos: '作品管理'
  },
  home: {
    title: 'HeyGem 數字人生成器',
    subtitle: '創建專屬數字人，生成個性化影片內容',
    createVideo: '創建影片',
    createModel: '創建模特',
    myWorks: '我的作品',
    myModels: '我的模特'
  },
  models: {
    title: '模特管理',
    create: '創建新模特',
    name: '模特名稱',
    video: '模特影片',
    upload: '上傳影片',
    creating: '正在創建模特...',
    created: '模特創建成功',
    failed: '模特創建失敗',
    delete: '刪除',
    preview: '預覽',
    noModels: '還沒有創建任何模特'
  },
  videos: {
    title: '作品管理',
    name: '影片名稱',
    status: '狀態',
    createTime: '創建時間',
    actions: '操作',
    edit: '編輯',
    delete: '刪除',
    download: '下載',
    preview: '預覽',
    noVideos: '還沒有創建任何作品'
  },
  videoEdit: {
    title: '影片編輯',
    selectModel: '選擇模特',
    inputText: '輸入文字',
    uploadAudio: '上傳音頻',
    preview: '預覽',
    generate: '生成影片',
    save: '保存',
    generating: '正在生成影片...',
    progress: '進度'
  }
}

// 英文語言包
const en = {
  common: {
    tab: {
      myWorksText: 'My Works',
      myAvatarsText: 'My Avatars'
    },
    banner0: {
      title: 'Create Video',
      subTitle: 'Select avatar, input text or upload audio to generate digital human video',
      buttonText: 'Start Creating'
    },
    banner1: {
      title: 'Create Avatar',
      subTitle: 'Upload video file to create exclusive digital human avatar',
      buttonText: 'Create Avatar'
    },
    selectView: {
      modalFinishedObj: {
        text1: 'Video generation completed!',
        text2: 'View My Works',
        text3: 'or continue creating new video',
        rightBtnText: 'View Works'
      }
    },
    modelCreateView: {
      videoName: 'My Video'
    },
    message: {
      selectModelsTextError: 'Please select a model',
      VideoTextError: 'Please enter video name',
      VideoCopywritingTextError: 'Please enter text content or upload audio',
      initEditVideoPageFailed: 'Failed to initialize video edit page',
      videoSynthesisTextError: 'Video synthesis failed'
    }
  },
  nav: {
    home: 'Home',
    videoEdit: 'Video Edit',
    models: 'Models',
    videos: 'Videos'
  },
  home: {
    title: 'HeyGem Digital Human Generator',
    subtitle: 'Create exclusive digital humans and generate personalized video content',
    createVideo: 'Create Video',
    createModel: 'Create Model',
    myWorks: 'My Works',
    myModels: 'My Models'
  },
  models: {
    title: 'Model Management',
    create: 'Create New Model',
    name: 'Model Name',
    video: 'Model Video',
    upload: 'Upload Video',
    creating: 'Creating model...',
    created: 'Model created successfully',
    failed: 'Model creation failed',
    delete: 'Delete',
    preview: 'Preview',
    noModels: 'No models created yet'
  },
  videos: {
    title: 'Video Management',
    name: 'Video Name',
    status: 'Status',
    createTime: 'Create Time',
    actions: 'Actions',
    edit: 'Edit',
    delete: 'Delete',
    download: 'Download',
    preview: 'Preview',
    noVideos: 'No videos created yet'
  },
  videoEdit: {
    title: 'Video Edit',
    selectModel: 'Select Model',
    inputText: 'Input Text',
    uploadAudio: 'Upload Audio',
    preview: 'Preview',
    generate: 'Generate Video',
    save: 'Save',
    generating: 'Generating video...',
    progress: 'Progress'
  }
}

const i18n = createI18n({
  legacy: false,
  locale: 'zh',
  fallbackLocale: 'en',
  messages: {
    zh,
    en
  }
})

export default i18n
