<script setup lang="ts">
import {h, ref, Ref, computed} from 'vue'
import {SettingStore} from '@/store/settingStore'
import {storeToRefs} from 'pinia'
import {useRem} from '@/hooks/useRem.ts';
import {ElNotification} from 'element-plus'
import {useDark} from '@vueuse/core'
import Maps from '@/components/map.vue'
import {Setting, UserFilled} from "@element-plus/icons-vue";
import SettingPanel from "@/components/SettingPanel.vue";
import PlayerList from '@/components/PlayerList.vue';  // 已存在
import { getUrlParam } from "@/utils/url.ts";
import VideoSplash from "@/components/VideoSplash.vue";
import {Box, Item, Player, BoxHandler, ItemHandler, PlayerHandler} from "@/interface/GameData.ts";
import {convert_un, convert_ray, convert_other} from "@/utils/convert.ts";
import pako from "pako";
import { decode as msg_decode } from "@msgpack/msgpack";
import type { RawData as RawData_ray } from "@/interface/ray/RawData.ts";
import request from "@/api/request.ts";


useRem()
const settings = SettingStore()
const { itemsInfo } = storeToRefs(settings)
const loading = ref(true);
const loadingMessage = ref('挂狗还没进游戏，去找找其他房间吧...');
let boxes:Ref<Box[]> = ref([]);
let items:Ref<Item[]> = ref([]);
let players: Ref<Player[]> = ref([]);
let rawBots: Ref<Player[]> = ref([]); // 直接存储机器人数据
let token: string;
let cheatTeamId: number = 0;
const cheatTeam: Ref<Player[]> = ref([]);
const itemHandlerInstance = new ItemHandler();
const boxHandlerInstance = new BoxHandler();
const playerHandlerInstance = new PlayerHandler();

// 新增：选中的队伍ID
const selectedTeam = ref<number | null>(null);

// 地图组件引用
const mapRef = ref<InstanceType<typeof Maps> | null>(null);

// 跟随状态
const isFollowingPlayer = ref(false);
const followedPlayer = ref<Player | null>(null);


// ==================== 新增：计算队伍列表 ====================
const teamGroups = computed(() => {
  if (players.value.length === 0) return [];

  const map = new Map<number, number>(); // teamId -> 人数

  players.value.forEach(p => {
    const count = map.get(p.teamId) || 0;
    map.set(p.teamId, count + 1);
  });

  // 排序：作弊队伍优先放在最前，其他按 teamId 升序
  const cheatTeamIds = new Set(cheatTeam.value.map(p => p.teamId));

  const list = Array.from(map.entries()).map(([teamId, count]) => ({
    teamId,
    count,
    isCheaterTeam: cheatTeamIds.has(teamId)
  }));

  list.sort((a, b) => {
    if (a.isCheaterTeam && !b.isCheaterTeam) return -1;
    if (!a.isCheaterTeam && b.isCheaterTeam) return 1;
    return a.teamId - b.teamId;
  });

  return list;
});
// ===========================================================

// 处理玩家选择事件
const handlePlayerSelected = (player: Player) => {
  if (mapRef.value) {
    mapRef.value.handlePlayerSelected(player);
    isFollowingPlayer.value = true;
    followedPlayer.value = player;
  }
};

// 停止跟随
const stopFollowing = () => {
  if (mapRef.value) {
    mapRef.value.stopFollowing();
    isFollowingPlayer.value = false;
    followedPlayer.value = null;
  }
};


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

    currentItems.forEach((item: Item) => {
      const key = `${item.name}|${item.position.x},${item.position.y}|${item.grade}|${item.price}`;
      if (!newKeys.has(key)) {
        toRemove.push(item);
      }
    });

    toRemove.forEach((item: Item) => {
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

    incomingBoxes.forEach((box: Box) => {
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

    // 分离真实玩家和机器人
    const realPlayers = incomingPlayers.filter((p: Player) => !p.isBot);
    const bots = incomingPlayers.filter((p: Player) => p.isBot);


    // 直接存储机器人数据，不通过PlayerHandler
    rawBots.value = bots;

    const newNames = new Set();

    // 1. 只处理真实玩家数据
    realPlayers.forEach((player: Player) => {
      newNames.add(player.name);
      playerHandlerInstance.add(player);
    });

    // 2. 移除离开的真实玩家
    const currentPlayers = playerHandlerInstance.list();
    currentPlayers.forEach(p => {
      if (!newNames.has(p.name)) {
        playerHandlerInstance.remove(p);
      }
    });

    // 3. 同步到响应式数组（只包含真实玩家）
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



let socket: WebSocket;
if (address?.value) {
  if (type.value === 'un') {
    socket = new WebSocket('ws://' + address.value);
    socket.onopen = async () => {
      console.log("已连接挂狗地图,正在获取挂狗地图的鉴权...");
      const response = await request.get(`/api/token?address=${address.value}`);
      token = response.data.data.token;
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

        if (data?.type === 'auth' && data?.success) {
          console.info('挂狗服务器鉴权成功');
          return;
        }
        const gameData = convert_un(data, itemsInfo.value);
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
  }
  if (type.value === 'ray') {
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
        gameData = await convert_ray(decoded, itemsInfo.value, cheatTeamId);
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
  if (type.value === 'other') {
    socket = new WebSocket('ws://' + address.value);
    socket.binaryType = "arraybuffer";
    socket.onopen = async () => {
      console.log("已连接挂狗地图,正在获取挂狗地图的鉴权...");
    };

    socket.onmessage = async (event) => {
      let data: any;
      if (!(event.data instanceof ArrayBuffer)) return;
      try {
        data = event.data;
        const raw = new Uint8Array(data);
        const inflated = pako.inflate(raw);
        const decode = new TextDecoder('utf-8').decode(inflated);
        const jsonData = JSON.parse(decode);
        const gameData = convert_other(jsonData, itemsInfo.value);
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
  }

  socket.onclose = (event: CloseEvent) => {
    ElNotification({
      title: '提示',
      message: h('div', [
        h('p', '已断开挂狗地图'),
        h('p', '原因是:' + event.reason),
      ]),
      type: 'error',
    });
    console.log("已断开挂狗地图");
    loading.value = true;
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
      <div class="right-buttons" v-show="!settingVisible">
        <div class="right-btn" @click="settingVisible = true" title="设置">
          <el-icon color="#ffffff">
            <Setting/>
          </el-icon>
        </div>
      </div>
    </div>
    <setting-panel v-model="settingVisible"></setting-panel>
    <!-- 主内容（地图 + loading） -->
    <div class="main-content" v-loading="loading" :element-loading-text="loadingMessage">
      <div class="map-wrapper">
        <Maps 
          ref="mapRef"
          :map="currentMap" 
          :players="players" 
          :bots="rawBots" 
          :items="items" 
          :boxes="boxes"
        >
          <div class="img_map_mask"></div>
        </Maps>
      </div>

      <!-- 玩家列表（底部居中） -->
      <PlayerList
          :players="players"
          :bots="rawBots"
          :cheat-team="cheatTeam"
          :selected-team="selectedTeam"
          :is-following-player="isFollowingPlayer"
          :followed-player="followedPlayer"
          @player-selected="handlePlayerSelected"
          @stop-following="stopFollowing"
      />

      <!-- 新增：队伍下拉选择框（右下角） -->
      <div class="team-select-wrapper" v-if="teamGroups.length > 0">
        <el-select
            v-model="selectedTeam"
            placeholder="选择队伍查看"
            clearable
            popper-class="team-select-popper"
            size="large"
            style="width: 240px;"
        >
          <el-option
              v-for="item in teamGroups"
              :key="item.teamId"
              :label="`队伍 ${item.teamId} (${item.count} 人)`"
              :value="item.teamId"
          >
            <span>队伍 {{ item.teamId }} ({{ item.count }} 人)</span>
            <el-tag
                v-if="item.isCheaterTeam"
                type="danger"
                size="small"
                effect="dark"
                style="margin-left: 8px;"
            >
              作弊
            </el-tag>
          </el-option>
        </el-select>
      </div>
    </div>
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

/* 右上角按钮组 */
.right-buttons {
  display: flex;
  gap: 10px;
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
  opacity: 0 !important;
}

/* 新增：队伍下拉框定位（右下角，玩家列表上方） */
.team-select-wrapper {
  position: absolute;
  right: 20px;
  bottom: 80px; /* 距离底部80px，避开玩家列表 */
  z-index: 950; /* 高于玩家列表(900)，低于弹窗 */
  pointer-events: auto;
}

/* 下拉弹出层样式（半透明背景） */
:deep(.team-select-popper) {
  background: rgba(0, 0, 0, 0.8) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.team-select-popper .el-select-dropdown__item) {
  color: #fff;
}

:deep(.team-select-popper .el-select-dropdown__item.hover),
:deep(.team-select-popper .el-select-dropdown__item:hover) {
  background: rgba(255, 255, 255, 0.15);
}
</style>