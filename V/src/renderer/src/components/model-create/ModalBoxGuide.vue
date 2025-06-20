<template>
  <div class="guide">
    <div class="guide-ok">
      <div class="guide-title">{{ $t('common.modelCreateView.guideTitle') }}</div>
      <div class="ok-list">
        <div class="ok-item" v-for="demo in state.okDemoList" :key="demo.text">
          <t-image class="image" :src="demo.img" />
        </div>
      </div>
      <div class="ok-rules">
        <p>{{ $t('common.modelCreateView.okRulesLi1') }}</p>
        <p>{{ $t('common.modelCreateView.okRulesLi2') }}</p>
        <p>{{ $t('common.modelCreateView.okRulesLi3') }}</p>
        <p>{{ $t('common.modelCreateView.okRulesLi4') }}</p>
        <p>{{ $t('common.modelCreateView.okRulesLi5') }}</p>
      </div>
    </div>
    <div class="guide-no">
      <div class="guide-title">{{ $t('common.modelCreateView.guideErrorTitle') }}</div>
      <div class="no-list" :style="locale === 'en' ? 'gap: 30px;' : ''">
        <div class="no-item" v-for="demo in state.noDemoList" :key="demo.text">
          <t-image class="image" :src="demo.img" />
          <span class="text">{{ demo.text }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { onMounted, reactive, watch } from 'vue'
import ImageFaceMore from '@renderer/assets/images/create-model/image-more-face.png'
import ImageFaceBig from '@renderer/assets/images/create-model/image-big-face.png'
import ImageFaceHalf from '@renderer/assets/images/create-model/image-half-face.png'
import ImageFaceNo from '@renderer/assets/images/create-model/image-no-face.png'
import ImageSit from '@renderer/assets/images/create-model/image-sit.png'
import ImageStand from '@renderer/assets/images/create-model/image-stand.png'

import ImageSitEn from '@renderer/assets/images/create-model/image-sit-en.svg'
import ImageStandEn from '@renderer/assets/images/create-model/image-stand-en.svg'
import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n()
const okDemoListObj = [
  {
    img: locale.value === 'zh' ? ImageStand : ImageStandEn,
    text: '站姿参考'
  },
  {
    img:  locale.value === 'zh' ? ImageSit : ImageSitEn,
    text: '坐姿参考'
  }
]

const obj = [
  {
    img: ImageFaceMore,
    key: 'common.modelCreateView.faceMore',
    text: '多张人脸'
  },
  {
    img: ImageFaceBig,
    key: 'common.modelCreateView.faceBig',
    text: '面部过大'
  },
  {
    img: ImageFaceNo,
    key: 'common.modelCreateView.faceNo',
    text: '未检测到人脸'
  },
  {
    img: ImageFaceHalf,
    key: 'common.modelCreateView.faceHalf',
    text: '五官遮挡'
  }
]
const state = reactive({
  noDemoList: obj,
  okDemoList: okDemoListObj
})
const init = () => {
  state.noDemoList.forEach((el, index) => {
    el.text = t(el.key)
  })
}
watch(locale, () => {
  init()
})
onMounted(() => {
  init()
})


</script>
<style lang="less" scoped>
.guide {
  &-title {
    font-weight: 500;
    font-size: 14px;
    color: #ffffff;
    line-height: 18px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;

    &::before {
      content: '';
      width: 16px;
      height: 16px;
      background-size: 100% 100%;
    }
  }

  &-ok {
    .guide-title::before {
      background-image: url('@renderer/assets/images/icons/icon-success.png');
    }

    .ok-list {
      display: flex;
      gap: 20px;
    }

    .ok-item {
      width: 120px;
      height: 160px;
      position: relative;
      border-radius: 8px;
      overflow: hidden;

      .image {
        width: 100%;
        height: 100%;
      }
    }

    .ok-rules {
      margin-top: 12px;

      p {
        font-weight: 400;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
        line-height: 18px;
        margin-bottom: 4px;
        white-space: nowrap;
      }
    }
  }

  &-no {
    margin-top: 20px;

    .guide-title::before {
      background-image: url('@renderer/assets/images/icons/icon-error.png');
    }

    .no-list {
      display: flex;
      gap: 40px;
    }

    .no-item {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-direction: column;

      .image {
        width: 48px;
        height: 48px;
      }

      .text {
        font-weight: 400;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
        line-height: 14px;
      }
    }
  }
}
</style>
