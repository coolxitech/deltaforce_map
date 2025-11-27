<template>
  <div v-if="localPlayers.length" class="cheat-card" role="region" aria-label="作弊玩家列表">
    <div class="card">
      <header class="card-header">作弊玩家</header>
      <div class="buttons">
        <button
            v-for="player in localPlayers"
            :key="player.name"
            :class="['player-btn', { active: player.name === selectedId }]"
            @click="onClick(player)">
          {{ player.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  players: {
    type: Array,
    default: () => []
  },
  glass: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['select', 'action'])

const selectedId = ref(null)

const localPlayers = computed(() => props.players.slice(0, 3))

function onClick(player) {
  selectedId.value = player.name
  emit('select', { name: player.name })
}
</script>

<style scoped>
.cheat-card {
  position: fixed;
  left: 20px;
  bottom: 20px;
  z-index: 1000;
}

.card {
  min-width: 170px;
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.25);
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: #fff;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
}

.card-header {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px;
}

.buttons {
  display: flex;
  gap: 8px;
  justify-content: space-between;
}

.player-btn {
  flex: 1 1 0;
  padding: 8px 10px;
  border-radius: 8px;
  border: none;
  background: rgba(255,255,255,0.06);
  color: inherit;
  cursor: pointer;
  font-weight: 500;
  transition: transform 120ms ease, background 120ms ease;
}

.player-btn:hover {
  transform: translateY(-2px);
}

.player-btn.active {
  background: rgba(255,255,255,0.14);
  box-shadow: 0 4px 10px rgba(0,0,0,0.25);
}

@media (max-width: 420px) {
  .buttons {
    flex-direction: column;
  }
}
</style>
