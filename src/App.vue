<script setup lang="ts">
import {ref, onMounted, Ref} from 'vue'
import {SettingStore} from '@/store/settingStore.js'
import {storeToRefs} from 'pinia'
import {useRem} from '@/hooks/useRem'
import {ElMessage, ElNotification} from 'element-plus'
import {useDark} from '@vueuse/core'
import Maps from '@/components/map.vue'
import {Setting} from "@element-plus/icons-vue";
import SettingPanel from "@/components/SettingPanel.vue";
import { getUrlParam } from "@/utils/url.js";
import VideoSplash from "@/components/VideoSplash.vue";
import {Box, Item, Player, Map, BoxHandler, ItemHandler, PlayerHandler} from "@/interface/GameData.js";
import {convert_un, convert_ray} from "@/utils/convert.ts";
import CheatPlayerCard from "@/components/CheatPlayerCard.vue";
import axios from "axios";
import pako from "pako";
import { encode as msg_encode, decode as msg_decode } from "@msgpack/msgpack";
import type { RawData as RawData_ray } from "@/interface/ray/RawData.ts";

useRem()
const settings = SettingStore()
const {
  loading,
} = storeToRefs(settings)

const loadingMessage = ref('挂狗还没进游戏，去找找其他房间吧...');
let boxes:Ref<Box[]> = ref([]);
let items:Ref<Item[]> = ref([]);
let players: Ref<Player[]> = ref([]);
let token: string;
let cheatTeamId: number = 0;
const cheatTeam: Ref<Player[]> = ref([]);
const itemHandlerInstance = new ItemHandler();
const boxHandlerInstance = new BoxHandler();
const playerHandlerInstance = new PlayerHandler();


const itemHandler = (data: any) => {
  try {
    if (!data || !Array.isArray(data.items)) return;

    const incomingItems = data.items;
    const newKeys = new Set();

    incomingItems.forEach((item: Item) => {
      const key = `${item.name}|${item.position.x},${item.position.y}|${item.grade}|${item.price}`;
      newKeys.add(key);

      const existing = itemHandlerInstance.get({
        name: item.name,
        position: item.position,
        grade: item.grade,
        price: item.price,
      });

      if (!existing) {
        itemHandlerInstance.add(item);
      } else {
        itemHandlerInstance.remove({
          name: item.name,
          position: item.position,
          grade: item.grade,
          price: item.price,
        });
        itemHandlerInstance.add(item);
      }
    });

    const currentItems = itemHandlerInstance.list();
    const toRemove = [];

    currentItems.forEach(item => {
      const key = `${item.name}|${item.position.x},${item.position.y}|${item.grade}|${item.price}`;
      if (!newKeys.has(key)) {
        toRemove.push(item);
      }
    });

    toRemove.forEach(item => {
      itemHandlerInstance.remove({
        name: item.name,
        position: item.position,
        grade: item.grade,
        price: item.price,
      });
    });

    items.value = itemHandlerInstance.list();

  } catch (error) {
    console.error('itemHandler error:', error);
  }
};
const boxHandler = (data: any) => {
  try {
    if (!data || !Array.isArray(data.boxes)) return;

    const incomingBoxes = data.boxes;
    const newKeys = new Set();

    incomingBoxes.forEach(box => {
      const key = `${box.isBot ? 1 : 0}|${box.position.x},${box.position.y}`;
      newKeys.add(key);

      const existing = boxHandlerInstance.get(box);
      if (!existing) {
        boxHandlerInstance.add(box);
      } else {
        boxHandlerInstance.remove(box);
        boxHandlerInstance.add(box);
      }
    });

    const currentBoxes = boxHandlerInstance.list();
    const toRemove = [];

    currentBoxes.forEach(box => {
      const key = `${box.isBot ? 1 : 0}|${box.position.x},${box.position.y}`;
      if (!newKeys.has(key)) {
        toRemove.push(box);
      }
    });

    toRemove.forEach(box => boxHandlerInstance.remove(box));

    boxes.value = boxHandlerInstance.list();

  } catch (error) {
    console.error('boxHandler error:', error);
  }
};
const playerHandler = (data: any) => {
  try {
    if (!data || !Array.isArray(data.players)) return;

    const incomingPlayers = data.players;
    const newNames = new Set();

    // 1. 处理新数据
    incomingPlayers.forEach(player => {
      newNames.add(player.name);
      playerHandlerInstance.add(player);
    });

    // 2. 移除离开的玩家
    const currentPlayers = playerHandlerInstance.list();
    currentPlayers.forEach(p => {
      if (!newNames.has(p.name)) {
        playerHandlerInstance.remove(p);
      }
    });

    // 3. 同步到响应式数组
    players.value = playerHandlerInstance.list();
    cheatTeam.value = playerHandlerInstance.listCheaters();

  } catch (error) {
    console.error('playerHandler error:', error);
  }
};

const address = ref(getUrlParam('address'))
const type = ref(getUrlParam('type') ?? 'un');
useDark()
const currentMap = ref('daba')
const settingVisible = ref(false);
let itemsInfo = [];
onMounted( async () => {
  document.documentElement.style.height = '100%'
  document.body.style.height = '100%'
  const response = await axios.get('http://deltaforce.coolxi.eu.org/api/items');
  itemsInfo = response.data.data;
})

let socket: WebSocket;
if (address?.value) {
  if (type.value === 'un') {
    socket = new WebSocket('ws://' + address.value);
    socket.onopen = async () => {
      console.log("已连接挂狗地图,正在获取挂狗地图的鉴权...");
      // const response = await axios.get(`http://deltaforce.coolxi.eu.org/api/token?address=${address.value}`);
      // token = response.data.data.token;
      token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NjU3OTA5MzIsImV4cCI6Mjc2NTc5MDkzMSwidGltZXN0YW1wIjoxNzY1NzkwOTMyMDgyLCJpcCI6IjEyNy4wLjAuMSIsInBvcnQiOjgwODB9.D4Bdk2cIvKQYi4IXFNDHp5NRfciWQDi6G-uvfk-j5zk';
      socket.send(JSON.stringify({
        token: token,
      }));
    };

    socket.onmessage = async (event) => {
      try {
        let data: any;
        if (event.data instanceof Blob) {
          const jsonStr = await event.data.text();
          data = JSON.parse(jsonStr);
        } else {
          if (typeof event.data === 'string') {
            data = JSON.parse(event.data);
          } else {
            console.error('接收数据异常')
            return;
          }
        }

        const gameData = convert_un(data, itemsInfo);
        itemHandler(gameData);
        boxHandler(gameData);
        playerHandler(gameData);
        currentMap.value = gameData.map.name;
        loading.value = gameData.map.name === '';
        // console.log(currentMap.value);
      } catch (error) {
        console.error("解析数据时出错:", error);
      }
    };

    socket.onclose = (event: CloseEvent) => {
      console.log("服务器断开了连接:" + event.reason);
    };
  } else if (type.value === 'ray') {
    socket = new WebSocket('ws://' + address.value + '/web');
    socket.binaryType = "arraybuffer";
    socket.onopen = async () => {
      console.log("已连接挂狗地图,正在获取挂狗地图的原始数据...");
    };
    socket.onmessage = async (event) => {
      let data: any;
      let gameData: any;

      data = event.data;
      if (data.length == 1) {
        loading.value = true;
        return;
      }
      if (data?.type === 'userType') {
        if (data?.userType === 'normal') {
          ElNotification({
            title: '提示',
            message: '挂狗开房完全权限,可看全部数据',
            type: 'warning',
          });
        } else {
          ElNotification({
            title: '提示',
            message: '挂狗开房部分权限,可看部分数据',
            type: 'warning',
          });
        }
        return;
      }
      if (data?.type === 'permissions') {
        ElNotification({
          title: '提示',
          message: `
              显示玩家:${data.permissions?.normal.enablePlayers ? '同意' : '拒绝'}
              显示人机:${data.permissions?.normal.enableAI ? '同意' : '拒绝'}
              显示物资:${data.permissions?.normal.enableItems ? '同意' : '拒绝'}
            `,
          type: 'warning',
        });
        return;
      }
      if (!(event.data instanceof ArrayBuffer)) return;

      try {
        const raw = new Uint8Array(data);
        const inflated = pako.inflate(raw);
        const decoded = msg_decode(inflated) as RawData_ray;

        if (decoded.t !== undefined && decoded.t !== 0) { // 全量数据
          cheatTeamId = decoded.t;
        }
        gameData = await convert_ray(decoded, itemsInfo, cheatTeamId);
        itemHandler(gameData);
        boxHandler(gameData);
        playerHandler(gameData);
        currentMap.value = gameData.map.name;
        loading.value = false;
      } catch (error) {
        return;
      }
    };
  }



  socket.onclose = () => {
    ElNotification({
      title: '提示',
      message: '挂狗不让看了，换个房间吧.',
      type: 'error',
    });
    console.log("已断开挂狗地图");
  };
} else {
  ElNotification({
    title: 'Man!',
    message: '当前是快照版，有缺陷，正式版敬请期待.',
    type: 'warning',
  });
  loadingMessage.value = '不是哥们，找个挂狗再来看吧。'
  loading.value = false;
}


</script>

<template>
  <VideoSplash />
  <div class="app-container">
    <!-- 透明导航栏（左上 Logo） -->
    <div
        class="navbar"
        :class="{ 'panel-open': settingVisible}"
        :style="{
          zIndex: settingVisible ? 1 : 999999,
          pointerEvents: settingVisible ? 'none' : 'auto',
        }"
    >
      <div class="logo">
        <img src="@/assets/images/logo.png" alt="logo"/>
      </div>
      <!-- 右上角普通按钮 -->
      <div class="right-btn" @click="settingVisible = true" v-show="!settingVisible">
        <el-icon color="#ffffff">
          <Setting/>
        </el-icon>
      </div>
    </div>
    <setting-panel v-model="settingVisible"></setting-panel>
    <!-- 主内容（地图 + loading） -->
    <div class="main-content" v-loading="loading" :element-loading-text="loadingMessage">
      <div class="map-wrapper">
        <Maps :map="currentMap" :players="players" :items="items" :boxes="boxes">
          <div class="img_map_mask"></div>
        </Maps>
      </div>
    </div>
    <cheat-player-card />
  </div>
</template>

<style scoped>
/* ---------- 根容器 ---------- */
.app-container {
  height: 100dvh; /* 移动端动态视口 */
  width: 100vw;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  position: relative;
  font-size: 16px;
}

/* ---------- 透明导航栏（左上+右上） ---------- */
.navbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 2vh 2vw;
  display: flex;
  justify-content: space-between; /* 左右分布 */
  align-items: flex-start;
  pointer-events: none; /* 整体穿透，子元素单独开启 */
}

/* Logo（左上） */
.logo {
  pointer-events: auto;
}

.logo img {
  width: 2.815rem;
  height: 0.325rem;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6));
  user-select: none;
  -webkit-user-drag: none;
  -webkit-touch-callout: none;
  pointer-events: auto;
}

/* 右上角普通小按钮 */
.right-btn {
  pointer-events: auto;
  width: 0.5rem;
  height: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 0.3rem;
  transition: background 0.2s ease;
  user-select: none;
  -webkit-user-drag: none;
}

/* 轻微悬停反馈（可选，去掉也行） */
.right-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* 图标颜色（白色，带阴影提升可读性） */
.right-btn svg {
  color: #fff;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.5));
}

/* ---------- 主内容 ---------- */
.main-content {
  position: relative !important;
  flex: 1;
  width: 100%;
  background: #000;
  overflow: hidden;
}

.map-wrapper {
  position: absolute;
  inset: 0;
}

.img_map_mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  pointer-events: none;
  z-index: 1;
}

/* 当设置面板打开时，强制压低 navbar 层级并隐藏 logo */
.panel-open {
  z-index: 1 !important;
  pointer-events: none !important;
}

.panel-open .logo {
  opacity: 0 !important;     /* 彻底隐藏 logo（推荐） */
  /* 或者如果你想保留一点存在感：opacity: 0.1; */
}
</style>