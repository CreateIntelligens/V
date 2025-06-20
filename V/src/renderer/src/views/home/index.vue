<template>
  <div class="home-content-box">
    <BannerList @submitOK="submitOKFun" />
    <div class="form-list-content-box">
      <div class="tab-box">
        <li
          v-for="(item, index) in state.tabList"
          :key="index"
          :class="item.active ? 'active' : ''"
          @click="tabClick(index)"
        >
          {{ item.name }}
          <span class="total"
            >({{
              item.id === "worksList" ? home.homeState.videoNum : home.homeState.modelNum
            }})</span
          >
          <div class="line-box">
            <div class="line"></div>
          </div>
        </li>
        <div @click="debug">debug</div>
      </div>
      <div class="list-data">
        <WorksList v-show="state.tabValue === 'worksList'" />
        <MyModelList ref="myModelListRef" v-show="state.tabValue === 'myModelList'" />
      </div>
    </div>
  </div>
</template>
<script setup>
import BannerList from "@renderer/views/home/components/bannerList.vue";
import WorksList from "@renderer/views/home/components/worksList.vue";
import MyModelList from "@renderer/views/home/components/myModelList.vue";
import { reactive, onMounted, watch, ref } from "vue";
import { useHomeStore } from "@renderer/stores/home.js";
import { countVideo, countModel } from "@renderer/api/index.js";
import { useRoute } from "vue-router";
import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n()
const unRoute = useRoute();
const home = useHomeStore();
const myModelListRef = ref(null);
const state = reactive({
  tabList: [
    {
      key: 'common.tab.myWorksText',
      name: t('common.tab.myWorksText'),
      active: true,
      id: "worksList",
    },
    {
      key: 'common.tab.myAvatarsText',
      name: t('common.tab.myAvatarsText'),
      active: false,
      id: "myModelList",
    },
  ],
  teType: "",
  tabValue: "worksList",
});

onMounted(() => {
  const { type } = unRoute.query;
  state.teType = type;
  if (type === "model") state.tabValue = "myModelList";
  countTotal();
});
watch(locale, () => {
  state.tabList.forEach((el) => {
    el.name = t(el.key)
  })
})
watch(
  () => state.tabValue,
  (tabValue) => {
    state.tabList.forEach((yItem) => {
      if (yItem.id === tabValue) {
        yItem.active = true;
      } else {
        yItem.active = false;
      }
    });
  }
);
const submitOKFun = () => {
  state.tabValue = "myModelList";
  countTotal();
  if (myModelListRef.value && myModelListRef.value.modelPageAJax) {
    myModelListRef.value.modelPageAJax();
  }
};
const debug = () => {
  window.electron.ipcRenderer.send("open-devtools");
};
const tabClick = (index) => {
  state.tabList.forEach((yItem, yIndex) => {
    if (index === yIndex) {
      yItem.active = true;
      state.tabValue = yItem.id;
    } else {
      yItem.active = false;
    }
  });
};

const countTotal = async () => {
  try {
    const res = await countVideo();
    if (res) {
      home.setVideoNum(res);
    }
  } catch (error) {
    console.log(error);
  }
  try {
    const res = await countModel();
    if (res) {
      home.setModelNum(res);
    }
  } catch (error) {
    console.log(error);
  }
};
</script>
<style lang="less" scoped>
.home-content-box {
  height: calc(100vh - 60px);
  padding: 20px;
  background-color: #f4f4f6;
  overflow: auto;

  .form-list-content-box {
    padding: 16px;
    border-radius: 8px;
    background-color: #fff;

    .list-data {
      position: relative;
      margin-top: 10px;
    }

    .tab-box {
      display: flex;
      li {
        cursor: pointer;
        list-style: none;
        font-family: HarmonyOS Sans SC, HarmonyOS Sans SC;
        font-weight: 500;
        font-size: 16px;
        color: #696f7a;
        line-height: 22px;
        margin-right: 34px;
        position: relative;
        padding-bottom: 10px;

        .total {
          font-size: 12px;
          color: #696f7a;
        }

        .line-box {
          position: absolute;
          bottom: 0;
          display: flex;
          justify-content: center;
          width: 100%;

          .line {
            width: 32px;
            height: 4px;
            background: linear-gradient(360deg, #3c73ff 0%, #434af9 100%), #d9d9d9;
            border-radius: 100px;
            display: none;
          }
        }
      }

      .active {
        color: #000000 !important;
        font-weight: bold !important;

        .total {
          font-weight: bold !important;
          font-size: 12px !important;
          color: #000000 !important;
        }

        .line {
          display: block !important;
        }
      }
    }
  }
}
</style>
