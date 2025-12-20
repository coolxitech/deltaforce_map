<template>
  <div v-if="show" class="splash-wrapper" :class="{ 'fade-out': fading }">
    <video
        ref="videoEl"
        class="splash-video"
        autoplay
        muted
        playsinline
        :src="videoSrc"
        @ended="onVideoEnd"
        @click="skip"
    >
      您的浏览器不支持视频播放。
    </video>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// 正确引用 src/assets/video/intro.mp4
const videoUrl = new URL('@/assets/video/intro.webm', import.meta.url).href

const props = defineProps({
  // 可选：外部传入
  // videoSrc: { type: String, default: videoUrl }
})

const emit = defineEmits(['done'])

const videoSrc = videoUrl  // 使用 import.meta.url 解析的路径

const show = ref(true)
const fading = ref(false)
const videoEl = ref(null)

const onVideoEnd = () => fadeOutAndDone()
const skip = () => {
  videoEl.value?.pause()
  videoEl.mute = false;
  fadeOutAndDone()
}

const fadeOutAndDone = () => {
  if (fading.value) return
  fading.value = true
  setTimeout(() => {
    show.value = false
    emit('done')
  }, 500)
}

onMounted(() => {
  const video = videoEl.value
  const fallback = setTimeout(fadeOutAndDone, 1000)
  const clear = () => clearTimeout(fallback)

  video.addEventListener('loadeddata', clear)
  video.addEventListener('error', () => {
    clear()
    fadeOutAndDone()
  })
})
</script>

<style scoped>
.splash-wrapper {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: #000;
  z-index: 9999;
  overflow: hidden;
  transition: opacity 0.6s ease-out;
}
.splash-wrapper.fade-out { opacity: 0; }

.splash-video {
  position: absolute;
  top: 50%; left: 50%;
  min-width: 100%; min-height: 100%;
  width: auto; height: auto;
  transform: translate(-50%, -50%);
  object-fit: cover;
  cursor: pointer;
}
</style>