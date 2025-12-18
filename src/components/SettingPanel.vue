<script setup>
import {Close} from "@element-plus/icons-vue";
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faCog,
  faUser,
  faRobot,
  faBox,
  faCube,
  faCogs,
  faBars,
  faTimes
} from '@fortawesome/free-solid-svg-icons'
library.add(faCog, faUser, faRobot, faBox, faCube, faCogs, faBars, faTimes);
import {computed, ref, toRefs} from "vue";
import {SettingStore} from "@/store/settingStore";
import {storeToRefs} from "pinia";

const settings = SettingStore()
const {
  playerSetting,
  botSetting,
  itemSetting,
  boxSetting,
  otherSetting,
} = storeToRefs(settings)
defineProps({
  modelValue: Boolean
})
defineEmits(['update:modelValue'])


const activeTab = ref('match')


const dialogWidth = computed(() => {
  const width = window.innerWidth;
  if (width <= 480) {
    return "95%";
  } else {
    if (width <= 768) return "90%"; else {
      if (width <= 1024) return "70%"; else {
        if (width <= 1440) return "60%"; else {
          return "50%";
        }
      }
    }
  }
});

const isMobile = computed(() => {
  const ua = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  return ua || window.innerWidth <= 768;   // ← 768 是最安全的移动端阈值
});

const showMobileMenu = ref(false);
</script>

<template>
  <teleport to="body">
    <transition name="fade">
      <div
          v-if="modelValue"
          class="custom-dialog-overlay"
          @click.self="$emit('update:modelValue', false)"
      >
        <div
            class="settings-container"
            @click.stop
            :style="{ width: dialogWidth }"
        >
          <!-- 关闭按钮 - 移动端隐藏 -->
          <div class="close-button" @click="$emit('update:modelValue', false)">
            <el-icon>
              <Close />
            </el-icon>
          </div>

          <!-- 左侧图标导航栏 -->
          <div class="settings-sidebar">
            <!-- Logo -->
            <div class="sidebar-logo">
              <img src="@/assets/images/logo_small.png" alt="Logo"/>
            </div>

            <div class="sidebar-icon" @click="activeTab = 'match'"
                 :class="{ active: activeTab === 'match' }">
              <FontAwesomeIcon icon="fa-solid fa-cog"></FontAwesomeIcon>
            </div>
            <div class="sidebar-icon" @click="activeTab = 'character'"
                 :class="{ active: activeTab === 'character' }">
              <FontAwesomeIcon icon="fa-solid fa-user"></FontAwesomeIcon>
            </div>
            <div class="sidebar-icon" @click="activeTab = 'ai'"
                 :class="{ active: activeTab === 'ai' }">
              <FontAwesomeIcon icon="fa-solid fa-robot"></FontAwesomeIcon>
            </div>
            <div class="sidebar-icon" @click="activeTab = 'materials'"
                 :class="{ active: activeTab === 'materials' }">
              <FontAwesomeIcon icon="fa-solid fa-box"></FontAwesomeIcon>
            </div>
            <div class="sidebar-icon" @click="activeTab = 'box'"
                 :class="{ active: activeTab === 'box' }">
              <FontAwesomeIcon icon="fa-solid fa-cube"></FontAwesomeIcon>
            </div>
            <div class="sidebar-icon" @click="activeTab = 'misc'"
                 :class="{ active: activeTab === 'misc' }">
              <FontAwesomeIcon icon="fa-solid fa-cogs"></FontAwesomeIcon>
            </div>
          </div>

          <!-- 右侧内容区域 -->
          <div class="settings-right">
            <!-- 移动端标题栏 - 使用计算属性 -->
            <div class="mobile-header" v-if="isMobile">
              <div class="mobile-header-left">
                <button class="mobile-menu-btn" @click="showMobileMenu = !showMobileMenu">
                  <FontAwesomeIcon icon="fa-solid fa-bars"></FontAwesomeIcon>
                </button>
                <div class="mobile-header-title">雷达设置</div>
              </div>
              <button class="mobile-close-btn" @click="$emit('update:modelValue', false)">
                <FontAwesomeIcon icon="fa-solid fa-times"></FontAwesomeIcon>
              </button>
            </div>

            <!-- 移动端菜单 -->
            <div class="mobile-menu" v-if="showMobileMenu">
              <div class="mobile-menu-item"
                   @click="activeTab = 'match'; showMobileMenu = false">
                <FontAwesomeIcon icon="fa-solid fa-cog"></FontAwesomeIcon>
                <span>对局信息</span>
              </div>
              <div class="mobile-menu-item"
                   @click="activeTab = 'character'; showMobileMenu = false">
                <FontAwesomeIcon icon="fa-solid fa-user"></FontAwesomeIcon>
                <span>角色信息</span>
              </div>
              <div class="mobile-menu-item" @click="activeTab = 'ai'; showMobileMenu = false">
                <FontAwesomeIcon icon="fa-solid fa-robot"></FontAwesomeIcon>
                <span>AI信息</span>
              </div>
              <div class="mobile-menu-item"
                   @click="activeTab = 'materials'; showMobileMenu = false">
                <FontAwesomeIcon icon="fa-solid fa-box"></FontAwesomeIcon>
                <span>物资显示</span>
              </div>
              <div class="mobile-menu-item"
                   @click="activeTab = 'box'; showMobileMenu = false">
                <FontAwesomeIcon icon="fa-solid fa-cube"></FontAwesomeIcon>
                <span>盒子显示</span>
              </div>
              <div class="mobile-menu-item"
                   @click="activeTab = 'misc'; showMobileMenu = false">
                <FontAwesomeIcon icon="fa-solid fa-cogs"></FontAwesomeIcon>
                <span>杂项</span>
              </div>
            </div>


            <!-- 主内容区域 -->
            <div class="settings-main">
              <!-- 顶部标签页导航 -->
              <div class="tab-navigation">
                <div class="tab-item" :class="{ active: activeTab === 'match' }"
                     @click="activeTab = 'match'">对局信息
                </div>
                <div class="tab-item" :class="{ active: activeTab === 'character' }"
                     @click="activeTab = 'character'">角色信息
                </div>
                <div class="tab-item" :class="{ active: activeTab === 'ai' }"
                     @click="activeTab = 'ai'">AI信息
                </div>
                <div class="tab-item" :class="{ active: activeTab === 'materials' }"
                     @click="activeTab = 'materials'">物资显示
                </div>
                <div class="tab-item" :class="{ active: activeTab === 'box' }"
                     @click="activeTab = 'box'">盒子显示
                </div>
                <div class="tab-item" :class="{ active: activeTab === 'misc' }"
                     @click="activeTab = 'misc'">杂项
                </div>
              </div>

              <!-- 内容区域 -->
              <div class="settings-content">
                <div class="content-columns">
                  <!-- 左列 -->
                  <div class="content-left">
                    <!-- 对局信息 -->
                    <div v-if="activeTab === 'match'" class="settings-section">
                      <el-card class="settings-card">
                        <template #header>
                          <div class="card-header">
                            <span>对局信息:</span>
                          </div>
                        </template>
                        <div class="switch-group">
                          <div>
                            <el-text class="mx-1">角度跟随:</el-text>
                            <el-switch v-model="playerSetting.info.angle"/>
                          </div>
                          <div>
                            <el-text class="mx-1">视线跟随:</el-text>
                            <el-switch v-model="playerSetting.info.sightFollow"/>
                          </div>
                        </div>
                      </el-card>
                    </div>

                    <!-- 角色信息 -->
                    <div v-if="activeTab === 'character'" class="settings-section">
                      <el-card class="settings-card">
                        <template #header>
                          <div class="card-header">
                            <span>角色信息:</span>
                          </div>
                        </template>
                        <div class="switch-group">
                          <div>
                            <el-text class="mx-1">名字:</el-text>
                            <el-switch v-model="playerSetting.info.name"/>
                          </div>
                          <div>
                            <el-text class="mx-1">武器:</el-text>
                            <el-switch v-model="playerSetting.info.weapon"/>
                          </div>
                          <div>
                            <el-text class="mx-1">血量:</el-text>
                            <el-switch v-model="playerSetting.info.health"/>
                          </div>
                          <div>
                            <el-text class="mx-1">护甲:</el-text>
                            <el-switch v-model="playerSetting.info.armor"/>
                          </div>
                          <div>
                            <el-text class="mx-1">队友:</el-text>
                            <el-switch v-model="playerSetting.info.teammate"/>
                          </div>
                          <div>
                            <el-text class="mx-1">视角线:</el-text>
                            <el-switch v-model="playerSetting.info.angleViewLine"/>
                          </div>
                          <div>
                            <el-text class="mx-1">层高:</el-text>
                            <el-switch v-model="playerSetting.info.storyHeight"/>
                          </div>
                        </div>
                      </el-card>
                    </div>

                    <!-- AI信息 -->
                    <div v-if="activeTab === 'ai'" class="settings-section">
                      <el-card class="settings-card">
                        <template #header>
                          <div class="card-header">
                            <span>AI信息:</span>
                          </div>
                        </template>
                        <div class="switch-group">
                          <div>
                            <el-text class="mx-1">显示AI:</el-text>
                            <el-switch v-model="botSetting.info.display"/>
                          </div>
                          <div>
                            <el-text class="mx-1">显示BOSS:</el-text>
                            <el-switch v-model="botSetting.info.displayBoss"/>
                          </div>
                          <div>
                            <el-text class="mx-1">AI名称:</el-text>
                            <el-switch v-model="botSetting.info.name"/>
                          </div>
                          <div>
                            <el-text class="mx-1">血量:</el-text>
                            <el-switch v-model="botSetting.info.health"/>
                          </div>
                        </div>
                      </el-card>
                    </div>

                    <!-- 物资显示 -->
                    <div v-if="activeTab === 'materials'" class="settings-section">
                      <el-card class="settings-card">
                        <template #header>
                          <div class="card-header">
                            <span>物资显示:</span>
                          </div>
                        </template>
                        <div class="switch-group">
                          <div>
                            <el-text class="mx-1">显示物品:</el-text>
                            <el-switch v-model="itemSetting.info.display"/>
                          </div>
                          <div>
                            <el-text class="mx-1">物品名称:</el-text>
                            <el-switch v-model="itemSetting.info.name"/>
                          </div>
                          <div>
                            <el-text class="mx-1">物品价值:</el-text>
                            <el-switch v-model="itemSetting.info.price"/>
                          </div>
                        </div>
                        <div class="divider"></div>
                        <el-text class="mx-1">物品过滤价值:</el-text>
                        <div class="divider"></div>
                        <el-input-number v-model="itemSetting.info.filter" :step="1" step-strictly/>
                      </el-card>
                    </div>

                    <!-- 盒子显示 -->
                    <div v-if="activeTab === 'box'" class="settings-section">
                      <el-card class="settings-card">
                        <template #header>
                          <div class="card-header">
                            <span>盒子显示:</span>
                          </div>
                        </template>
                        <div class="switch-group">
                          <div>
                            <el-text class="mx-1">显示玩家盒子:</el-text>
                            <el-switch v-model="boxSetting.player"/>
                          </div>
                          <div>
                            <el-text class="mx-1">显示AI盒子:</el-text>
                            <el-switch v-model="boxSetting.bot"/>
                          </div>
                        </div>
                      </el-card>
                    </div>

                    <!-- 杂项设置 -->
                    <div v-if="activeTab === 'misc'" class="settings-section">
                      <el-card class="settings-card">
                        <template #header>
                          <div class="card-header">
                            <span>杂项设置:</span>
                          </div>
                        </template>
                        <div class="slider-group">
                          <div class="slider-item">
                            <el-text class="mx-1">玩家头像大小:
                              {{ otherSetting.playerAvatarSize }}px
                            </el-text>
                            <el-slider v-model="otherSetting.playerAvatarSize" :min="25"
                                       :max="30" :step="1" show-input/>
                          </div>
                          <div class="slider-item">
                            <el-text class="mx-1">射线长度: {{ otherSetting.rayLength }}px
                            </el-text>
                            <el-slider v-model="otherSetting.rayLength" :min="1" :max="30"
                                       :step="1" show-input/>
                          </div>
                        </div>
                        <div class="divider"></div>
                        <div class="slider-group">
                          <div class="slider-item">
                            <el-text class="mx-1">射线透明度: {{ otherSetting.rayOpacity }}
                            </el-text>
                            <el-slider v-model="otherSetting.rayOpacity" :min="0.1"
                                       :max="1.0" :step="0.05" :precision="2"
                                       show-input/>
                          </div>
                          <div class="slider-item">
                            <el-text class="mx-1">射线宽度: {{ otherSetting.rayWidth }}px
                            </el-text>
                            <el-slider v-model="otherSetting.rayWidth" :min="1" :max="8"
                                       :step="1" show-input/>
                          </div>
                        </div>
                        <div class="divider"></div>
                        <div class="slider-group">
                          <div class="slider-item">
                            <el-text class="mx-1">队友选择器大小:
                              {{ otherSetting.teammateSelectorSize }}%
                            </el-text>
                            <el-slider v-model="otherSetting.teammateSelectorSize" :min="50"
                                       :max="150" :step="5" show-input/>
                          </div>
                        </div>
                      </el-card>
                    </div>
                  </div>

                  <!-- 右列 -->
                  <div class="content-right">
                    <!-- 对局信息颜色设置 -->
                    <div v-if="activeTab === 'match'" class="settings-section">
                      <el-card class="settings-card">
                        <template #header>
                          <div class="card-header">
                            <span>颜色设置:</span>
                          </div>
                        </template>
                        <div class="color-settings">
                          <!-- 对局信息暂时没有颜色设置 -->
                          <div class="empty-state">
                            <el-text class="mx-1">暂无颜色设置</el-text>
                          </div>
                        </div>
                      </el-card>
                    </div>

                    <!-- 角色信息颜色设置 -->
                    <div v-if="activeTab === 'character'" class="settings-section">
                      <el-card class="settings-card">
                        <template #header>
                          <div class="card-header">
                            <span>颜色设置:</span>
                          </div>
                        </template>
                        <div class="color-settings">
                          <div class="color-item">
                            <label>视角线颜色</label>
                            <el-color-picker v-model="playerSetting.color.angleViewLine"/>
                          </div>
                        </div>
                      </el-card>
                    </div>

                    <!-- AI信息颜色设置 -->
                    <div v-if="activeTab === 'ai'" class="settings-section">
                      <el-card class="settings-card">
                        <template #header>
                          <div class="card-header">
                            <span>颜色设置:</span>
                          </div>
                        </template>
                        <div class="color-settings">
                          <!-- AI信息暂时没有颜色设置 -->
                          <div class="empty-state">
                            <el-text class="mx-1">暂无颜色设置</el-text>
                          </div>
                        </div>
                      </el-card>
                    </div>

                    <!-- 物资显示颜色设置 -->
                    <div v-if="activeTab === 'materials'" class="settings-section">
                      <el-card class="settings-card">
                        <template #header>
                          <div class="card-header">
                            <span>颜色设置:</span>
                          </div>
                        </template>
                        <div class="color-settings">
                          <div class="color-item">
                            <label>白色物品</label>
                            <el-color-picker v-model="itemSetting.color[1]"/>
                          </div>
                          <div class="color-item">
                            <label>绿色物品</label>
                            <el-color-picker v-model="itemSetting.color[2]"/>
                          </div>
                          <div class="color-item">
                            <label>蓝色物品</label>
                            <el-color-picker v-model="itemSetting.color[3]"/>
                          </div>
                          <div class="color-item">
                            <label>紫色物品</label>
                            <el-color-picker v-model="itemSetting.color[4]"/>
                          </div>
                          <div class="color-item">
                            <label>金色物品</label>
                            <el-color-picker v-model="itemSetting.color[5]"/>
                          </div>
                          <div class="color-item">
                            <label>红色物品</label>
                            <el-color-picker v-model="itemSetting.color[6]"/>
                          </div>
                        </div>
                      </el-card>
                    </div>

                    <!-- 盒子显示颜色设置 -->
                    <div v-if="activeTab === 'box'" class="settings-section">
                      <el-card class="settings-card">
                        <template #header>
                          <div class="card-header">
                            <span>颜色设置:</span>
                          </div>
                        </template>
                        <div class="color-settings">
                          <div class="color-item">
                            <label>玩家盒子颜色</label>
                            <el-color-picker v-model="boxSetting.color.player"/>
                          </div>
                          <div class="color-item">
                            <label>AI盒子颜色</label>
                            <el-color-picker v-model="boxSetting.color.bot"/>
                          </div>
                        </div>
                      </el-card>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div class="settings-footer">
                <div class="footer-text">你强任你强，大哥背行囊</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>

</template>

<style scoped>
.refresh-button {
  margin-left: 5px;
}

.switch-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.switch-group div {
  display: flex;
  align-items: center;
  gap: 5px;
}

.divider {
  margin-top: 5px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.radar_settings {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
}

/* 地图左下角队友选择器 */
.teammate-selector {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 1000;
}

.teammate-card {
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid #333;
  border-radius: 8px;
  padding: 15px;
  min-width: 200px;
  position: relative;
}

.teammate-title {
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 10px;
  text-align: center;
}

.teammate-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.teammate-item {
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 8px 12px;
  color: #fff;
  cursor: pointer;
  text-align: center;
  transition: all 0.3s;
  font-size: 12px;
}

.teammate-item:hover {
  background: #3a3a3a;
  border-color: #555;
}

.teammate-item.active {
  background: #8b5cf6;
  border-color: #7c3aed;
  color: #fff;
}

.teammate-item.active:hover {
  background: #7c3aed;
}

/* 弹窗样式 */
.settings-dialog .el-dialog {
  background: transparent !important;
  border-radius: 8px;
  box-shadow: none !important;
  --el-dialog-box-shadow: none !important;
  margin: 0 auto !important;
}

/* 强制删除所有可能的阴影 */
.settings-dialog .el-dialog,
.settings-dialog .el-dialog__wrapper,
.settings-dialog .el-overlay {
  box-shadow: none !important;
  --el-dialog-box-shadow: none !important;
  --el-box-shadow: none !important;
}

/* 对话框居中样式 */
.settings-dialog .el-dialog__wrapper {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.settings-dialog .el-dialog__title {
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
}

.settings-dialog .el-dialog__body {
  padding: 5px;
}

.settings-container {
  display: flex;
  height: 600px;
  background: #101318;
  border-radius: 15px;
  overflow: hidden;
  position: relative;
}

/* 左侧导航栏 */
.settings-sidebar {
  width: 60px;
  background: #14181F;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
  border-right: 1px solid #404040;
}

/* Logo样式 */
.sidebar-logo {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
  border-radius: 8px;
  overflow: hidden;
}

.sidebar-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.sidebar-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 8px 0;
  border-radius: 6px;
  cursor: pointer;
  color: #888;
  transition: all 0.3s ease;
}

.sidebar-icon:hover {
  background: #404040;
  color: #ffffff;
}

.sidebar-icon.active {
  background: #7c3aed;
  color: #ffffff;
}

.sidebar-icon i {
  font-size: 18px;
}

/* 右侧内容区域 */
.settings-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #101318;
  position: relative;
}

/* 关闭按钮 */
.close-button {
  position: absolute;
  top: 8px;
  right: 15px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  color: #888;
  transition: all 0.3s ease;
  z-index: 1000;
}

.close-button:hover {
  background: #ff4444;
  color: #ffffff;
}

.close-button i {
  font-size: 14px;
}

/* 主内容区域 */
.settings-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #101318;
}

/* 标签页导航 */
.tab-navigation {
  display: flex;
  background: #14181F;
  border-bottom: 1px solid #404040;
  padding: 0 20px;
}

.tab-item {
  padding: 12px 20px;
  color: #888;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
  font-size: 14px;
}

.tab-item:hover {
  color: #ffffff;
}

.tab-item.active {
  color: #7c3aed;
  border-bottom-color: #7c3aed;
}

/* 内容区域 */
.settings-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.content-columns {
  display: flex;
  gap: 30px;
  height: 100%;
}

.content-left {
  flex: 1;
}

.content-right {
  flex: 1;
}

/* 设置区域 */
.settings-section {
  margin-bottom: 30px;
}

.settings-section h3 {
  color: #ffffff;
  font-size: 16px;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 1px solid #404040;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #333;
}

.setting-item label {
  color: #cccccc;
  font-size: 14px;
  flex: 1;
}

.setting-item .el-switch {
  margin-left: 15px;
}

.setting-item .el-select {
  width: 150px;
  margin-left: 15px;
}

.setting-item .el-input-number {
  margin-left: 15px;
}

/* 颜色设置 */
.color-settings {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.color-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #333;
}

.color-item label {
  color: #cccccc;
  font-size: 14px;
  flex: 1;
}

.color-item .el-color-picker {
  margin-left: 15px;
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 20px;
  color: #888;
}

.card-header span {
  color: #ffffff;
  font-weight: 600;
}

/* 覆盖Element Plus默认的白色背景 */
.settings-dialog .el-card {
  background: #101318 !important;
  border: 1px solid #404040 !important;
  margin-bottom: 10px;
}

.settings-dialog .el-card__header {
  background: #14181F !important;
  border-bottom: 1px solid #404040 !important;
}

.settings-dialog .el-card__body {
  background: #101318 !important;
}

.mx-1 {
  color: #cccccc;
}

.demonstration {
  color: #cccccc;
}

/* Element Plus 组件样式覆盖 */
.settings-dialog .el-switch__core {
  background-color: #404040;
  border-color: #404040;
}

.settings-dialog .el-switch.is-checked .el-switch__core {
  background-color: #7c3aed;
  border-color: #7c3aed;
}

.settings-dialog .el-slider__runway {
  background-color: #404040;
}

.settings-dialog .el-slider__bar {
  background-color: #7c3aed;
}

.settings-dialog .el-slider__button {
  background-color: #7c3aed;
  border-color: #7c3aed;
}

.settings-dialog .el-select .el-input__inner {
  background-color: #101318;
  border-color: #404040;
  color: #ffffff;
}

.settings-dialog .el-select .el-input__inner:focus {
  border-color: #7c3aed;
}

.settings-dialog .el-input-number .el-input__inner {
  background-color: #101318;
  border-color: #404040;
  color: #ffffff;
}

.settings-dialog .el-input-number .el-input__inner:focus {
  border-color: #7c3aed;
}

.settings-dialog .el-button {
  background-color: #101318;
  border-color: #404040;
  color: #ffffff;
}

.settings-dialog .el-button:hover {
  background-color: #7c3aed;
  border-color: #7c3aed;
}

.settings-dialog .el-button--primary {
  background-color: #7c3aed;
  border-color: #7c3aed;
}

.settings-dialog .el-button--primary:hover {
  background-color: #8b5cf6;
  border-color: #8b5cf6;
}

/* 滚动条样式 */
.settings-content::-webkit-scrollbar {
  width: 6px;
}

.settings-content::-webkit-scrollbar-track {
  background: #101318;
}

.settings-content::-webkit-scrollbar-thumb {
  background: #404040;
  border-radius: 3px;
}

.settings-content::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* 强制覆盖所有 el-dialog 背景和阴影 */
.el-dialog {
  background: transparent !important;
  box-shadow: none !important;
  --el-dialog-box-shadow: none !important;
  --el-box-shadow: none !important;
}

/* 全局删除所有对话框阴影 */
.el-dialog__wrapper {
  box-shadow: none !important;
}

.el-overlay {
  box-shadow: none !important;
}

/* Footer样式 */
.settings-footer {
  background: #14181F;
  border-top: 1px solid #404040;
  padding: 10px 20px;
  text-align: center;
  margin-top: auto;
}

.footer-text {
  color: #888;
  font-size: 12px;
  font-weight: 500;
}

/* 移动端适配 - 简化版本 */
@media (max-width: 768px) {
  /* 隐藏桌面版设置按钮 */
  .map-change-text {
    display: none !important;
  }

  /* 移动端设置按钮 */
  .mobile-settings-btn {
    position: fixed !important;
    top: 20px !important;
    right: 20px !important;
    width: 50px !important;
    height: 50px !important;
    background: #7c3aed !important;
    border: none !important;
    border-radius: 50% !important;
    color: white !important;
    font-size: 20px !important;
    cursor: pointer !important;
    z-index: 1000 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3) !important;
  }

  .mobile-settings-btn:hover {
    background: #8b5cf6 !important;
    transform: scale(1.05) !important;
  }


  /* 移动端设置面板 - 强制全屏 */
  .settings-dialog .el-dialog {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    margin: 0 !important;
    padding: 0 !important;
    border-radius: 0 !important;
    transform: none !important;
    max-width: none !important;
    max-height: none !important;
    background: #101318 !important;
    z-index: 9999 !important;
  }

  .settings-dialog .el-dialog__wrapper {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #101318 !important;
    z-index: 9998 !important;
  }

  .settings-dialog .el-dialog__body {
    padding: 0 !important;
    margin: 0 !important;
    height: 100vh !important;
    width: 100vw !important;
    overflow: hidden !important;
    background: #101318 !important;
  }

  /* 移动端容器 - 强制全屏 */
  .settings-container {
    display: flex !important;
    flex-direction: column !important;
    height: 100vh !important;
    width: 100vw !important;
    background: #101318 !important;
    border-radius: 0 !important;
    overflow: hidden !important;
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    z-index: 10000 !important;
  }

  /* 隐藏左侧导航栏 */
  .settings-sidebar {
    display: none !important;
  }

  /* 隐藏移动端关闭按钮 */
  .close-button {
    display: none !important;
  }

  /* 移动端主内容区域 - 全屏显示 */
  .settings-right {
    flex: 1 !important;
    display: flex !important;
    flex-direction: column !important;
    height: 100vh !important;
    width: 100vw !important;
    background: #101318 !important;
    overflow: hidden !important;
    padding: 0 !important;
    position: relative !important;
    z-index: 1000 !important;
  }

  /* 强制显示移动端所有内容 */
  .settings-right * {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
  }

  .settings-right .el-card {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
  }

  .settings-right .el-card__header {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
  }

  .settings-right .el-card__body {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
  }

  /* 隐藏移动端标签页导航 */
  .tab-navigation {
    display: none !important;
  }

  /* 移动端标题栏 - 强制显示 */
  .mobile-header {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    padding: 15px 20px !important;
    background: #14181F !important;
    border-bottom: 1px solid #404040 !important;
    height: 60px !important;
    flex-shrink: 0 !important;
    position: relative !important;
    z-index: 1000 !important;
    visibility: visible !important;
    opacity: 1 !important;
    width: 100% !important;
    margin: 0 !important;
    border: none !important;
    left: auto !important;
    top: auto !important;
    overflow: visible !important;
    clip: auto !important;
  }


  .mobile-header-left {
    display: flex !important;
    align-items: center !important;
    gap: 15px !important;
    visibility: visible !important;
    opacity: 1 !important;
    width: auto !important;
    height: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    position: relative !important;
    left: auto !important;
    top: auto !important;
    overflow: visible !important;
    clip: auto !important;
  }

  .mobile-menu-btn {
    width: 35px !important;
    height: 35px !important;
    background: transparent !important;
    border: none !important;
    border-radius: 50% !important;
    color: #888 !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 16px !important;
    visibility: visible !important;
    opacity: 1 !important;
    margin: 0 !important;
    padding: 0 !important;
    position: relative !important;
    left: auto !important;
    top: auto !important;
    overflow: visible !important;
    clip: auto !important;
  }

  .mobile-menu-btn:hover {
    background: #404040 !important;
    color: #fff !important;
  }

  .mobile-header-title {
    color: #fff !important;
    font-size: 18px !important;
    font-weight: 600 !important;
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    width: auto !important;
    height: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    position: relative !important;
    left: auto !important;
    top: auto !important;
    overflow: visible !important;
    clip: auto !important;
  }

  .mobile-close-btn {
    width: 35px !important;
    height: 35px !important;
    background: transparent !important;
    border: none !important;
    border-radius: 50% !important;
    color: #888 !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 16px !important;
    visibility: visible !important;
    opacity: 1 !important;
    margin: 0 !important;
    padding: 0 !important;
    position: relative !important;
    left: auto !important;
    top: auto !important;
    overflow: visible !important;
    clip: auto !important;
  }

  .mobile-close-btn:hover {
    background: #ff4444 !important;
    color: #fff !important;
  }

  /* 移动端菜单 */
  .mobile-menu {
    position: absolute !important;
    top: 60px !important;
    left: 0 !important;
    right: 0 !important;
    background: #14181F !important;
    border: 1px solid #404040 !important;
    border-top: none !important;
    z-index: 99999 !important;
    max-height: 300px !important;
    overflow-y: auto !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
  }

  .mobile-menu-item {
    display: flex !important;
    align-items: center !important;
    gap: 15px !important;
    padding: 15px 20px !important;
    color: #ccc !important;
    cursor: pointer !important;
    border-bottom: 1px solid #333 !important;
    font-size: 16px !important;
    transition: all 0.3s ease !important;
  }

  .mobile-menu-item:hover {
    background: #404040 !important;
    color: #fff !important;
  }

  .mobile-menu-item:last-child {
    border-bottom: none !important;
  }

  .mobile-menu-item i {
    width: 20px !important;
    text-align: center !important;
  }

  /* 调试：确保菜单可见 */
  .mobile-menu[style*="display: none"] {
    display: none !important;
  }

  .mobile-menu:not([style*="display: none"]) {
    display: block !important;
  }


  /* 移动端内容区域 */
  .settings-content {
    flex: 1 !important;
    overflow-y: auto !important;
    padding: 10px !important;
    width: 100% !important;
    background: #101318 !important;
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    height: auto !important;
    min-height: calc(100vh - 60px) !important;
  }

  .content-columns {
    display: flex !important;
    flex-direction: column !important;
    gap: 10px !important;
    width: 100% !important;
  }

  .content-left,
  .content-right {
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .settings-card {
    width: 100% !important;
    margin-bottom: 10px !important;
    background: #14181F !important;
    border: 1px solid #404040 !important;
    border-radius: 12px !important;
    overflow: hidden !important;
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
  }

  .settings-card .el-card__header {
    background: #14181F !important;
    border-bottom: 1px solid #404040 !important;
    padding: 20px !important;
  }

  .settings-card .el-card__body {
    background: #101318 !important;
    padding: 20px !important;
  }

  .switch-group {
    display: flex !important;
    flex-direction: column !important;
    gap: 20px !important;
    width: 100% !important;
  }

  .switch-group > div {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    width: 100% !important;
    padding: 15px 0 !important;
    border-bottom: 1px solid #333 !important;
    font-size: 16px !important;
  }

  /* 移动端Footer */
  .settings-footer {
    width: 100% !important;
    background: #14181F !important;
    border-top: 1px solid #404040 !important;
    padding: 15px 20px !important;
    text-align: center !important;
    flex-shrink: 0 !important;
  }

  .footer-text {
    color: #888 !important;
    font-size: 12px !important;
  }

  /* 队友选择器 - 移动端适配 */
  .teammate-selector {
    width: 100% !important;
    margin-bottom: 15px !important;
    max-width: 300px !important;
    margin-left: auto !important;
    margin-right: auto !important;
  }

  .teammate-card {
    width: 60% !important;
    background: #14181F !important;
    border: 1px solid #404040 !important;
    border-radius: 8px !important;
    padding: 12px !important;
    max-width: 100% !important;
  }

  .teammate-title {
    font-size: 14px !important;
    color: #fff !important;
    margin-bottom: 8px !important;
    font-weight: 600 !important;
  }

  .teammate-list {
    display: flex !important;
    flex-direction: column !important;
    gap: 6px !important;
    width: 100% !important;
  }

  .teammate-item {
    width: 90% !important;
    padding: 10px 12px !important;
    background: #101318 !important;
    border: 1px solid #404040 !important;
    border-radius: 6px !important;
    color: #ccc !important;
    cursor: pointer !important;
    text-align: left !important;
    font-size: 13px !important;
    transition: all 0.3s ease !important;
    line-height: 1.3 !important;
  }

  .teammate-item.active {
    background: #7c3aed !important;
    border-color: #7c3aed !important;
    color: #fff !important;
  }

  .teammate-item:hover {
    background: #404040 !important;
  }


  /* 滑块组件 */
  .slider-group {
    display: flex !important;
    flex-direction: column !important;
    gap: 20px !important;
    width: 100% !important;
  }

  .slider-item {
    width: 100% !important;
    padding: 15px 0 !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 10px !important;
  }

  /* 滑块容器布局优化 */
  .slider-item .el-slider {
    flex: 1 !important;
    margin-right: 0 !important;
  }

  /* 移动端滑块全宽显示 */
  .slider-item .el-slider__wrapper {
    width: 100% !important;
  }

  .slider-item .el-slider__runway {
    width: 100% !important;
    margin-right: 0 !important;
  }

  /* 移动端滑块优化 */
  .el-slider {
    width: 100% !important;
    margin: 10px 0 !important;
  }

  .el-slider__runway {
    height: 8px !important;
    background-color: #404040 !important;
    border-radius: 4px !important;
    width: 100% !important;
  }

  .el-slider__bar {
    height: 8px !important;
    background-color: #7c3aed !important;
    border-radius: 4px !important;
  }

  .el-slider__button {
    width: 20px !important;
    height: 20px !important;
    background-color: #7c3aed !important;
    border: 2px solid #fff !important;
    border-radius: 50% !important;
    box-shadow: 0 2px 6px rgba(124, 58, 237, 0.3) !important;
    cursor: pointer !important;
    transition: all 0.3s ease !important;
    position: absolute !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
  }

  .el-slider__button:hover {
    transform: translateY(-50%) scale(1.1) !important;
    box-shadow: 0 4px 12px rgba(124, 58, 237, 0.5) !important;
  }

  .el-slider__button:active {
    transform: translateY(-50%) scale(0.95) !important;
  }

  /* 移动端隐藏滑块输入框 */
  .el-slider__input {
    display: none !important;
  }

  .el-input-number.is-center .el-slider__input {
    display: none !important;
  }

  /* 超小屏幕滑块优化 */
  .el-slider {
    width: 100% !important;
    margin: 15px 0 !important;
  }

  .el-slider__runway {
    height: 10px !important;
    background-color: #404040 !important;
    border-radius: 5px !important;
    width: 100% !important;
  }

  .el-slider__bar {
    height: 10px !important;
    background-color: #7c3aed !important;
    border-radius: 5px !important;
  }

  .el-slider__button {
    width: 24px !important;
    height: 24px !important;
    background-color: #7c3aed !important;
    border: 3px solid #fff !important;
    border-radius: 50% !important;
    box-shadow: 0 3px 8px rgba(124, 58, 237, 0.4) !important;
    cursor: pointer !important;
    transition: all 0.3s ease !important;
    touch-action: manipulation !important;
    position: absolute !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
  }

  .el-slider__button:hover {
    transform: translateY(-50%) scale(1.15) !important;
    box-shadow: 0 5px 15px rgba(124, 58, 237, 0.6) !important;
  }

  .el-slider__button:active {
    transform: translateY(-50%) scale(0.9) !important;
  }

  /* 超小屏幕隐藏滑块输入框 */
  .el-slider__input {
    display: none !important;
  }

  .el-input-number.is-center .el-slider__input {
    display: none !important;
  }

  /* 滑块标签优化 */
  .slider-item .el-text {
    font-size: 16px !important;
    font-weight: 500 !important;
    color: #fff !important;
    margin-bottom: 8px !important;
    display: block !important;
  }

  /* 强制重置所有样式 */
  .settings-dialog * {
    box-sizing: border-box !important;
  }
}

/* 超小屏幕适配 */
@media (max-width: 480px) {
  .settings-dialog .el-dialog {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    margin: 0 !important;
    padding: 0 !important;
    border-radius: 0 !important;
    transform: none !important;
    max-width: none !important;
    max-height: none !important;
    background: #101318 !important;
  }

  .settings-container {
    height: 100vh !important;
    width: 100vw !important;
    border-radius: 0 !important;
  }

  .settings-sidebar {
    height: 60px !important;
    padding: 8px !important;
  }

  .sidebar-logo {
    width: 35px !important;
    height: 35px !important;
    margin: 0 3px !important;
  }

  .sidebar-icon {
    width: 35px !important;
    height: 35px !important;
    margin: 0 3px !important;
  }

  .sidebar-icon i {
    font-size: 14px !important;
  }

  .settings-right {
    height: calc(100vh - 60px) !important;
  }

  .tab-navigation {
    height: 45px !important;
  }

  .tab-item {
    padding: 0 12px !important;
    font-size: 11px !important;
    min-width: 70px !important;
  }

  .settings-content {
    padding: 12px !important;
  }

  .settings-card {
    margin-bottom: 12px !important;
  }

  .settings-card .el-card__header {
    padding: 12px !important;
  }

  .settings-card .el-card__body {
    padding: 12px !important;
  }

  .switch-group > div {
    padding: 8px 0 !important;
    font-size: 13px !important;
  }

  .teammate-item {
    padding: 8px 10px !important;
    font-size: 12px !important;
  }

  /* 队友选择器超小屏幕适配 */
  .teammate-selector {
    max-width: 280px !important;
  }

  .teammate-card {
    padding: 10px !important;
  }

  .teammate-title {
    font-size: 13px !important;
    margin-bottom: 6px !important;
  }

  .teammate-list {
    gap: 4px !important;
  }

  .teammate-item {
    padding: 8px 10px !important;
    font-size: 12px !important;
    line-height: 1.2 !important;
  }


  .settings-footer {
    padding: 8px 12px !important;
  }

  .footer-text {
    font-size: 10px !important;
  }

  .close-button {
    top: 8px !important;
    right: 8px !important;
    width: 28px !important;
    height: 28px !important;
  }

  .close-button i {
    font-size: 12px !important;
  }
}

.custom-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ===== 彻底让所有 el-card 跟随你的深色主题（永不翻车）===== */
.settings-container .el-card,
.settings-container .el-card__header,
.settings-container .el-card__body {
  background-color: #101318 !important;
  border-color: #404040 !important;
}

/* 卡片标题文字颜色也顺便提亮一下 */
.settings-container .el-card__header .card-header span {
  color: #ffffff !important;
}

/* 如果你还用了 el-divider（你代码里有 .divider） */
.settings-container .el-divider--horizontal {
  background-color: #404040 !important;
}

</style>