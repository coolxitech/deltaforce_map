<template>
  <div class="denied-container" v-if="isWebViewDetected">
    <div class="denied-card">
      <h1 class="title">访问被拒绝</h1>
      <p class="message">
        抱歉，本页面不允许在 App 内嵌浏览器（WebView）中访问。
      </p>
      <p class="tip">
        请使用标准浏览器（如 Chrome、Safari、Edge 等）打开本页面。
      </p>
      <p class="tip">
        此措施是为了防止网页内容被恶意利用换取利益。
      </p>
      <div class="icon">🚫</div>
    </div>
  </div>
  <router-view v-else-if="isSafeToRender" />
</template>

<script setup>
import { onMounted, watch, ref } from "vue";
import { useRouter } from "vue-router";
import { SettingStore } from '@/store/settingStore';
import { storeToRefs } from 'pinia';
import axios from "axios";
import { useWebViewDetector } from "@/utils/antiWebView.ts";

const router = useRouter();
const store = SettingStore();
const { itemsInfo } = storeToRefs(store);

const isWebViewDetected = ref(false); // 是否确认是 WebView
const isSafeToRender = ref(false);    // 是否可以安全渲染业务页面

const { checkResult, data } = useWebViewDetector();

/**
 * 核心拦截跳转函数
 */
const handleWebViewBlocking = () => {
  isWebViewDetected.value = true;
  isSafeToRender.value = false;
  console.error('[Security] 检测WebView嵌套. 终止渲染.');
};

/**
 * 原生 UA 检查 (针对 HTTP 环境最可靠)
 */
const checkIsWebViewUA = () => {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('wv') ||
      ua.includes('webview') ||
      (ua.includes('android') && ua.includes('version/')) ||
      (/(iphone|ipod|ipad).*applewebkit(?!.*safari)/i.test(ua));
};

/**
 * 监听指纹库数据
 */
watch(data, (newVal) => {
  if (newVal && checkResult.value.isWebView) {
    handleWebViewBlocking();
  }
}, { immediate: true, deep: true });

onMounted(async () => {
  // 1. 第一时间进行原生 UA 检查 (不等待任何异步)
  if (checkIsWebViewUA()) {
    handleWebViewBlocking();
    return; // 彻底终止后续逻辑
  }

  // 2. 如果初步检查不是 WebView，才允许渲染
  isSafeToRender.value = true;

  // 3. 执行业务请求
  if (itemsInfo.value === null) {
    try {
      const response = await axios.get('http://deltaforce.coolxi.eu.org/api/items');
      const dataResponse = await axios.get(response.data.data.url);
      store.setItemsInfo(dataResponse.data);
    } catch (error) {
      console.error('获取物品数据信息失败:', error);
    }
  }
});
</script>

<style scoped>
.denied-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
  box-sizing: border-box;
}

.denied-card {
  max-width: 500px;
  width: 100%;
  background: #ffffff;
  border-radius: 12px;
  padding: 40px 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.title {
  font-size: 28px;
  color: #d9534f;
  margin-bottom: 20px;
  font-weight: 600;
}

.message {
  font-size: 18px;
  color: #333;
  margin: 15px 0;
  line-height: 1.6;
}

.tip {
  font-size: 16px;
  color: #666;
  margin: 20px 0 30px;
  line-height: 1.6;
}

.icon {
  font-size: 80px;
  margin-top: 20px;
}
</style>