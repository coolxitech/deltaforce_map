import { markRaw } from 'vue'
import L from 'leaflet'

// 全局唯一的玩家标记容器（关键！）
const playerMarkers = new Map()

// 可选：如果你想在组件卸载时清理（防内存泄漏）
const clearAllPlayers = () => {
    playerMarkers.forEach(marker => marker.remove())
    playerMarkers.clear()
}

export { playerMarkers, clearAllPlayers }