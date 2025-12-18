<template>
  <router-view />
</template>

<script setup>
import {onMounted} from "vue";
import {SettingStore} from '@/store/settingStore'
import {storeToRefs} from 'pinia'
import axios from "axios";
const store = SettingStore();
const { itemsInfo } = storeToRefs(store);
onMounted( async () => {
  document.documentElement.style.height = '100%'
  document.body.style.height = '100%'
  if (itemsInfo.value.length === 0) {
    try {
      const response = await axios.get('http://deltaforce.coolxi.eu.org/api/items');
      const dataResponse = await axios.get(response.data.data.url);
      store.setItemsInfo(dataResponse.data);
    } catch (error) {
      console.error('获取物品数据信息失败:', error);
    }
  }
})
</script>
<style scoped></style>