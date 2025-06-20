<template>
  <div class="banner-content-box">
    <div class="banner-left" @click="action.handleCreateVideo">
      <div class="left-text">
        <div class="title-box">
          <div class="h1"> {{$t('common.banner0.title') }}</div>
          <div class="text">{{$t('common.banner0.subTitle') }}</div>
        </div>
      </div>
      <div class="right-img">
        <div class="text" :style="locale === 'en' ?  'font-size: 13px;' : ''">{{$t('common.banner0.buttonText') }}</div>
      </div>
    </div>
    <div class="banner-right" @click="action.handleCreateModel">
      <div class="title-box" :style="locale === 'zh' ? '' : 'padding: 12px 0px 0px 32px;'">
        <div class="h1">{{$t('common.banner1.buttonText') }}</div>
        <div class="text" :style="locale === 'zh' ? '' : ' width: 60%;'">{{$t('common.banner1.subTitle') }}</div>
        <div class="link">
          <div class="link-text" :style="locale === 'en' ?  'font-size: 12px;' : ''">{{$t('common.banner1.buttonText') }}</div>
          <img src="../../../assets/images/home/go.svg" />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { createModel } from "@renderer/components/model-create";
import { useRouter } from "vue-router";
import { useI18n } from 'vue-i18n'
const { locale } = useI18n()
const router = useRouter();
const emit = defineEmits(["SubmitOK"]);
const action = {
  async handleCreateVideo() {
    router.push("/video/edit");
  },
  async handleCreateModel() {
    const { isSubmitOK } = await createModel();
    // 提交成功
    if (isSubmitOK) {
      emit("submitOK");
    }
  },
};
</script>
<style lang="less" scoped>
.banner-content-box {
  display: flex;
  width: 100%;
  margin-bottom: 18px;

  .banner-left {
    width: 65%;
    border-radius: 8px;
    display: flex;
    height: 160px;
    background-image: url("@renderer/assets/images/home/banner01.svg");
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    cursor: pointer;

    .left-text {
      flex: 0.95;

      .title-box {
        padding: 32px 0px 0px 32px;

        .h1 {
          font-family: Alimama FangYuanTi VF-Bold, Alimama FangYuanTi VF-Bold;
          font-weight: normal;
          font-size: 32px;

          color: #ffffff;
          line-height: 48px;
          letter-spacing: 4px;
          font-style: normal;
        }

        .text {
          font-family: HarmonyOS Sans SC, HarmonyOS Sans SC;
          font-weight: 400;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
          line-height: 20px;
          letter-spacing: 2px;
          font-style: normal;
          margin-top: 4px;
        }
      }
    }

    .right-img {
      background-image: url("@renderer/assets/images/home/banner01_right.svg");
      background-size: 100% 100%;
      background-repeat: no-repeat;
      width: 266px;
      margin-top: 25px;
      height: 114px;
      cursor: pointer;
      background-position: center;

      .text {
        font-family: HarmonyOS Sans SC, HarmonyOS Sans SC;
        font-weight: bold;
        font-size: 18px;
        color: #8d33ff;
        line-height: 22px;
        text-align: center;
        font-style: normal;
        position: relative;
        top: 55px;
        left: 30px;
      }
    }
  }

  .banner-right {
    width: calc(35% - 20px);
    border-radius: 8px;
    margin-left: auto;
    background-repeat: no-repeat;
    height: 160px;
    /* 固定高度 */
    background-image: url("@renderer/assets/images/home/banner02.svg");
    background-size: cover;
    background-position: center;
    cursor: pointer;

    .title-box {
      padding: 32px 0px 0px 32px;

      .h1 {
        font-family: Alimama FangYuanTi VF-Bold, Alimama FangYuanTi VF-Bold;
        font-weight: normal;
        font-size: 32px;

        color: #ffffff;
        line-height: 48px;
        letter-spacing: 4px;
        font-style: normal;
      }

      .text {
        font-family: HarmonyOS Sans SC, HarmonyOS Sans SC;
        font-weight: 400;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.8);
        line-height: 20px;
        letter-spacing: 2px;
        font-style: normal;
        margin-top: 4px;


      }

      .link {
        width: 108px;
        height: 32px;
        background: #ffffff;
        cursor: pointer;
        border-radius: 27px;
        justify-content: center;
        align-items: center;
        display: flex;
        margin-top: 10px;

        .link-text {
          font-family: HarmonyOS Sans SC, HarmonyOS Sans SC;
          font-weight: bold;
          font-size: 14px;
          color: #2f80ed;
          line-height: 20px;
          font-style: normal;
          text-transform: none;
        }

        img {
          margin-left: 4px;
          width: 12px;
        }
      }
    }
  }
}
</style>
