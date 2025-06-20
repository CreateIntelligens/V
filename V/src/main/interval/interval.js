import { loopPending } from '../service/video.js'
export function init() {
  // 轮询正在合成的视频
  loopPending()
}