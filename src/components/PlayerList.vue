<script setup lang="ts">
import { Player } from '@/interface/GameData.ts'
import { SettingStore } from '@/store/settingStore'
import { computed } from 'vue'

const props = defineProps<{
  players: Player[]
  bots: Player[]
  cheatTeam: Player[]
  selectedTeam?: number | null
  isFollowingPlayer?: boolean
  followedPlayer?: Player | null
}>()

// 定义 emit 事件
const emit = defineEmits<{
  playerSelected: [player: Player]
  stopFollowing: []
}>()

const settings = SettingStore()

// 根据选中的队伍过滤玩家列表
const filteredPlayers = computed(() => {
  if (props.selectedTeam === null || props.selectedTeam === undefined) {
    return props.players // 没有选中队伍时显示所有玩家
  }
  return props.players.filter(player => player.teamId === props.selectedTeam)
})

// 处理玩家点击事件
const handlePlayerClick = (player: Player) => {
  emit('playerSelected', player)
}

// 处理停止跟随事件
const handleStopFollowing = () => {
  emit('stopFollowing')
}

// 可选：如果以后想通过设置开关控制显示，这里预留（默认始终显示）
const showPlayerList = computed(() => true)
</script>

<template>
  <div class="player-list-wrapper" v-if="showPlayerList && filteredPlayers.length > 0">
    <el-card class="player-list-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="title-section">
            <span class="title">
              玩家列表
              <span v-if="selectedTeam !== null && selectedTeam !== undefined">
                - 队伍 {{ selectedTeam }}
              </span>
              （{{ filteredPlayers.length }}）
            </span>
            <span class="click-tip">- 点击玩家跟随视角</span>
            <!-- 跟随状态显示 -->
            <div v-if="isFollowingPlayer && followedPlayer" class="following-status">
              <span class="following-text">正在跟随: {{ followedPlayer.name }}</span>
              <button 
                @click="handleStopFollowing" 
                class="stop-follow-btn"
                title="停止跟随"
              >
                ✕
              </button>
            </div>
          </div>
          <el-tag v-if="cheatTeam.length > 0" type="danger" effect="dark" size="small">
            作弊队伍：{{ cheatTeam.length }} 人
          </el-tag>
        </div>
      </template>

      <el-scrollbar max-height="40vh">
        <div
            class="player-item"
            v-for="player in filteredPlayers"
            :key="player.name"
            :class="{ 'is-cheater': player.isCheater }"
            @click="handlePlayerClick(player)"
        >
          <!-- 一行布局 -->
          <div class="player-name">
            {{ player.name }}
            <el-tag
                v-if="player.isCheater"
                type="danger"
                size="small"
                effect="dark"
                class="cheater-tag"
            >
              作弊
            </el-tag>
          </div>

          <div class="player-info-item">
            <el-tag size="small" type="success" effect="plain">
              {{ player.health }} HP
            </el-tag>
          </div>

          <div class="player-info-item">
            <el-tag size="small" type="warning" effect="plain">
              {{ player.roleAlias || player.roleName }}
            </el-tag>
          </div>

          <div class="player-info-item weapon">
            <el-tag size="small" type="info" effect="plain">
              {{ player.weapon }}
            </el-tag>
          </div>
        </div>
      </el-scrollbar>
    </el-card>
  </div>
</template>

<style scoped>
.player-list-wrapper {
  position: absolute;
  left: 50%;
  bottom: 20px;
  transform: translateX(-50%);
  width: 90%;
  max-width: 600px;
  z-index: 900;
  pointer-events: auto;
}

.player-list-card {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 12px;
  color: #ffffff;
}

.player-list-card :deep(.el-card__header) {
  background: rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 12px 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 0.16rem;
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title {
  font-size: 0.16rem;
}

.click-tip {
  font-size: 0.12rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 400;
}

.following-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.following-text {
  font-size: 0.12rem;
  color: #54ff9f;
  font-weight: 500;
}

.stop-follow-btn {
  background: rgba(255, 107, 107, 0.8);
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  color: white;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  line-height: 1;
}

.stop-follow-btn:hover {
  background: rgba(255, 107, 107, 1);
  transform: scale(1.1);
}

/* 一行布局核心 */
.player-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  margin: 6px 0;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: background 0.2s, transform 0.1s;
  flex-wrap: nowrap;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}

.player-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
}

.player-item:active {
  transform: translateY(0);
}

.player-item.is-cheater {
  border-left: 4px solid #ff6b6b;
  background: rgba(255, 107, 107, 0.15);
}

.player-name {
  flex: 1;
  min-width: 120px;
  font-weight: 600;
  font-size: 0.15rem;
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.cheater-tag {
  flex-shrink: 0;
}

.player-info-item {
  flex-shrink: 0;
  min-width: 80px;
  text-align: center;
}

.player-info-item.weapon {
  flex: 1;
  max-width: 140px;
}

.player-info-item.weapon :deep(.el-tag) {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 滚动条美化 */
:deep(.el-scrollbar__bar.is-vertical) {
  width: 6px;
}
:deep(.el-scrollbar__thumb) {
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}
:deep(.el-scrollbar__thumb):hover {
  background-color: rgba(255, 255, 255, 0.5);
}
</style>