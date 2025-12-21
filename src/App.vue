<template>
  <router-view v-if="!isLoading"/>
</template>

<script setup>
import {onMounted, watch} from "vue";
import {SettingStore} from '@/store/settingStore'
import {storeToRefs} from 'pinia'
import axios from "axios";
import {useWebViewDetector} from "@/utils/antiWebView.ts";
import router from "@/router/index.ts";

const store = SettingStore();
const { itemsInfo } = storeToRefs(store);
onMounted( async () => {
  document.documentElement.style.height = '100%'
  document.body.style.height = '100%'
  if (itemsInfo.value === null) {
    try {
      const response = await axios.get('http://deltaforce.coolxi.eu.org/api/items');
      const dataResponse = await axios.get(response.data.data.url);
      store.setItemsInfo(dataResponse.data);
    } catch (error) {
      console.error('获取物品数据信息失败:', error);
    }
  }
})
const { checkResult, isLoading } = useWebViewDetector();

// 监听计算属性的结果
watch(
    () => checkResult.value,
    (newVal) => {
      // 只有当拿到 visitorId（说明请求已完成）且检测为 WebView 时才跳转
      if (newVal.visitorId && newVal.isWebView) {
        console.log('检测到 WebView，准备跳转...');
        router.push({name: 'anti-webview'});
      }
    },
    { immediate: true, deep: true }
);
</script>
<style scoped></style>