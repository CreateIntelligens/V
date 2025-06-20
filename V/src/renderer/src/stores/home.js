import { reactive } from 'vue'
import { defineStore } from 'pinia'

export const useHomeStore = defineStore('home', () => {
  const homeState = reactive({
    modelNum: 0,
    videoNum: 0,
    agreementVisible: false,
    language: 'zh',
    isAgree: false
  })
  const setModelNum = (data) => {
    homeState.modelNum = data
  }

  const setVideoNum = (data) => {
    homeState.videoNum = data
  }

  const setAgreementVisible = (data) => {
    homeState.agreementVisible = data
  }
  const setLanguage = (data) => {
    homeState.language = data
  }
  const setIsAgree = (data) => {
    homeState.isAgree = data
  }
  return {
    homeState,
    setModelNum,
    setVideoNum,
    setAgreementVisible,
    setLanguage,
    setIsAgree
  }
})
