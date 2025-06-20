import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useHomeStore = defineStore('home', () => {
  // 狀態
  const videoNum = ref(0)
  const modelNum = ref(0)
  
  // 動作
  function setVideoNum(num) {
    videoNum.value = num
  }
  
  function setModelNum(num) {
    modelNum.value = num
  }
  
  // 計算屬性
  const homeState = {
    get videoNum() {
      return videoNum.value
    },
    get modelNum() {
      return modelNum.value
    }
  }
  
  return {
    videoNum,
    modelNum,
    homeState,
    setVideoNum,
    setModelNum
  }
})
