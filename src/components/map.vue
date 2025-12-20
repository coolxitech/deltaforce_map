<script setup lang="ts">
import 'leaflet-polylinedecorator';
import * as L from 'leaflet';
import 'leaflet.zoomslider/src/L.Control.Zoomslider.js';
import 'leaflet-rotate/dist/leaflet-rotate';

import { nextTick, onMounted, ref, watch, onUnmounted } from "vue";
import { SettingStore } from "@/store/settingStore";
import { storeToRefs } from "pinia";
import { Box, Item, Player } from "@/interface/GameData.ts";
import { getUrlParam } from "@/utils/url.ts";

const settings = SettingStore();
const { playerSetting, botSetting, itemSetting, boxSetting, otherSetting, itemsInfo } = storeToRefs(settings);

const props = defineProps({
  map: {
    type: String,
    default: 'daba'
  },
  players: {
    type: Array as () => Player[],
    default: () => [],
  },
  items: {
    type: Array as () => Item[],
    default: () => [],
  },
  boxes: {
    type: Array as () => Box[],
    default: () => [],
  }
});

const MAP_ALIAS = {
  daba: '00',
  cgxg: '10',
  htjd: '21',
  bks: '31',
  cxjy: '42'
};

// 浏览器检测（保持原逻辑）
const browser = {
  versions: (function () {
    const u = navigator.userAgent;
    return {
      mobile: !!u.match(/AppleWebKit.*Mobile.*/),
      Tablet: u.indexOf('Tablet') > -1 || u.indexOf('Pad') > -1 || u.indexOf('Nexus 7') > -1,
      ios: u.indexOf('like Mac OS X') > -1,
      android: u.indexOf('Android') > -1 || u.indexOf('Adr') > -1,
      Safari: u.indexOf('Safari') > -1,
      Chrome: u.indexOf('Chrome') > -1 || u.indexOf('CriOS') > -1,
      IE: u.indexOf('MSIE') > -1 || u.indexOf('Trident') > -1,
      Edge: u.indexOf('Edge') > -1,
      QQBrowser: u.indexOf('QQBrowser') > -1,
      QQ: u.indexOf('QQ/') > -1,
      Wechat: u.indexOf('MicroMessenger') > -1,
      Weibo: u.indexOf('Weibo') > -1,
      360: u.indexOf('QihooBrowser') > -1,
      UC: u.indexOf('UC') > -1 || u.indexOf(' UBrowser') > -1,
      Taobao: u.indexOf('AliApp(TB') > -1,
      Alipay: u.indexOf('AliApp(AP') > -1,
      isMac: /macintosh|mac os x/i.test(navigator.userAgent),
      isSafari: /Safari/.test(u) && !/Chrome/.test(u)
    };
  })(),
  language: navigator.language.toLowerCase()
};

const mapContainer = ref<HTMLElement | null>(null);
const scaleAutoRef = ref<HTMLElement | null>(null);
const selectMapVideoRef = ref<HTMLElement | null>(null);
const regionList = ref<{ name: string; x: number; y: number; index: number }[]>([]);

const handleResize = () => {
  if (browser.versions.mobile) return;
  if (!selectMapVideoRef.value || !scaleAutoRef.value) return;

  const ratio = window.innerWidth / window.innerHeight;
  const designRatio = 1920 / 1080;

  if (window.innerHeight > window.innerWidth) return;

  if (ratio > designRatio) {
    // 宽屏
    selectMapVideoRef.value.style.width = '100%';
    selectMapVideoRef.value.style.height = 'auto';
  } else {
    // 高屏
    selectMapVideoRef.value.style.width = 'auto';
    selectMapVideoRef.value.style.height = '100%';
    scaleAutoRef.value.style.bottom = '0px';
  }
};

onMounted(() => {
  handleResize();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

const bksTop = ['-461305', '-460454', '-459334', '-460257', '-459631', '-459328.9688', '-458885', '-459003', '-458692'];
const bksBom = ['-458000', '-457863', '-457854', '-457554', '-457310', '-457776', '-457320', '-457322', '-457830'];

let mapScaleInfo: any = (window as any).dabaInfo;
let currLayer: any;
let playerArrowDecorators = new Map<string, L.PolylineDecorator>();

const getMapPos = (posX: number, posY: number) => {
  if (currLayer?.name === 'bks_1f' || currLayer?.name === 'map_bks2') {
    if (bksTop.includes(String(posY))) {
      posX = Number(posX) + 700;
      posY = Number(posY) - 200;
    }
    if (bksBom.includes(String(posY))) {
      posX = Number(posX) + 900;
      posY = Number(posY) + 200;
    }
    if (posY === -459085) {
      posX = Number(posX) + 300;
    }
  }

  const x = Number(posX);
  const y = Number(posY);
  const bj = 128;
  const xB2 = mapScaleInfo.width / bj;
  const yB2 = mapScaleInfo.height / bj;

  if (currLayer?.name?.indexOf('cgxg') !== -1 || currLayer?.name === 'map_yc2' || currLayer?.name === 'map_yc' || mapScaleInfo.rotate) {
    return { x: bj - (mapScaleInfo.centerY + y) / yB2, y: -bj + (mapScaleInfo.centerX - x) / xB2 };
  } else {
    return { x: bj - (mapScaleInfo.centerX - x) / xB2, y: -bj - (mapScaleInfo.centerY + y) / yB2 };
  }
};

let poiInfo = (window as any).selectRegion;
let poiList: L.Marker[] = [];

let map: L.Map;
let playerMarkers = new Map<string, L.Marker>();
let playerViewLines = new Map<string, L.Polyline>();
let boxMarkers = new Map<string, L.Marker>();
let itemMarkers = new Map<string, L.Marker>();

/**
 * 检查当前玩家的瞄准射线是否击中任何其他玩家
 */
const checkAimHit = (aimingPlayer: Player): string | null => {
  if (aimingPlayer.position.angle == null) return null;

  const { x: startX, y: startY } = getMapPos(aimingPlayer.position.x, aimingPlayer.position.y);
  const angle = Number(aimingPlayer.position.angle) || 0;
  const offset = currLayer.name === 'map_yc' ? -angle - 90 : -angle;
  const rad = offset * Math.PI / 180;

  const dirX = Math.cos(rad);
  const dirY = Math.sin(rad);

  let closestTarget: string | null = null;
  let closestDist = Infinity;

  for (const [targetName, targetMarker] of playerMarkers.entries()) {
    if (targetName === aimingPlayer.name) continue;

    const targetPos = targetMarker.getLatLng();
    const tx = targetPos.lng;
    const ty = targetPos.lat;

    const toTargetX = tx - startX;
    const toTargetY = ty - startY;

    const proj = toTargetX * dirX + toTargetY * dirY;
    if (proj < 0) continue;

    const closestX = startX + proj * dirX;
    const closestY = startY + proj * dirY;

    const distX = tx - closestX;
    const distY = ty - closestY;
    const distance = Math.sqrt(distX * distX + distY * distY);

    const HIT_RADIUS = 6;

    if (distance < HIT_RADIUS && proj < closestDist) {
      closestDist = proj;
      closestTarget = targetName;
    }
  }

  return closestTarget;
};

const init = async () => {
  const mapWidth = mapScaleInfo.boundsW;
  const mapHeight = mapScaleInfo.boundsH;
  const mapOrigin = new L.LatLng(0, 0);
  const pixelToLatLngRatio = -1;
  const southWest = mapOrigin;
  const northEast = new L.LatLng((mapHeight - 70) * pixelToLatLngRatio, mapWidth * pixelToLatLngRatio);
  const bounds = new L.LatLngBounds(southWest, northEast);

  map = new L.Map('MapContainer', {
    crs: L.CRS.Simple,
    attributionControl: false,
    zoomControl: false,
    maxBounds: bounds,
    maxBoundsViscosity: 1.0,
    minZoom: mapScaleInfo.minZoom,
    maxZoom: 8,
    preferCanvas: true,
    wheelDebounceTime: 10,
    zoomAnimation: true,
    fadeAnimation: true,
    markerZoomAnimation: true,
    zoomAnimationThreshold: 2,
    transform3DLimit: 8388608,
    zoomSnap: 0.25,
    zoomDelta: 0.25,
    trackResize: true
  }).setView([mapScaleInfo.initX, mapScaleInfo.initY], mapScaleInfo.initZoom);

  const control = new (L.Control as any).Zoomslider();
  map.addControl(control);

  addLayer('map_db');
};

const addLayer = (mapName: string) => {
  let mapWidth = mapScaleInfo.boundsW;
  let mapHeight = mapScaleInfo.boundsH;
  let minZoom = mapScaleInfo.minZoom;
  let pixelToLatLngRatio = -1;
  const southWest = new L.LatLng(0, 0);
  const northEast = new L.LatLng((mapHeight - 70) * pixelToLatLngRatio, mapWidth * pixelToLatLngRatio);
  let href: string;

  if (mapScaleInfo.href) {
    href = mapScaleInfo.href;
  } else {
    href = '//game.gtimg.cn/images/dfm/cp/a20240729directory/img/';
  }

  const bounds = new L.LatLngBounds(southWest, northEast);

  currLayer = new L.TileLayer(`${href}${mapName}/{z}_{x}_{y}.jpg`, {
    minZoom,
    maxZoom: 8,
    maxNativeZoom: 4,
    noWrap: false,
    attribution: '© OpenStreetMap contributors',
    bounds,
    errorTileUrl: `${href}${mapName}/0_0_0.jpg`,
    tileSize: 256,
    zoomOffset: 0,
  }).addTo(map);

  currLayer.name = mapName;
  map.setMaxBounds(bounds);
  map.options.minZoom = minZoom;

  // 清除旧 POI 标记
  poiList.forEach(m => m.remove());
  poiList = [];
  regionList.value = [];

  if (poiInfo && poiInfo.length > 0) {
    poiInfo.forEach((item: any, index: number) => {
      if (item.name === '行政西楼' || item.name === '行政东楼') return;

      const pos = getMapPos(Number(item.x), Number(item.y));
      const marker = new L.Marker([pos.y, pos.x], {
        icon: new L.DivIcon({
          className: 'map-region-name',
          html: `<div class="region-item" data-x="${item.x}" data-y="${item.y}">${item.name}</div>`,
        })
      }).addTo(map);

      poiList.push(marker);
      regionList.value.push({ name: item.name, x: item.x, y: item.y, index });
    });
  }
};

const changeMapLv = (type: string) => {
  switch (type) {
    case "00":
    case "01":
      mapScaleInfo = (window as any).dabaInfo;
      poiInfo = (window as any).selectRegion;
      if (currLayer?.name !== "map_db") addLayer("map_db");
      break;
    case "10":
    case "11":
      mapScaleInfo = (window as any).cgxgInfo;
      poiInfo = (window as any).selectRegion_cgxg;
      map.removeLayer(currLayer);
      if (currLayer?.name !== "map_yc") addLayer("map_yc");
      map.addLayer(currLayer);
      break;
    case "10_s":
    case "11_s":
      mapScaleInfo = (window as any).cgxgInfo;
      poiInfo = (window as any).selectRegion_cgxg;
      map.removeLayer(currLayer);
      if (currLayer?.name !== "map_yc2") addLayer("map_yc2");
      map.addLayer(currLayer);
      break;
    case "21":
    case "22":
      mapScaleInfo = (window as any).htjdInfo;
      poiInfo = (window as any).selectRegion_htjd;
      map.removeLayer(currLayer);
      if (currLayer?.name !== "map_htjd") addLayer("map_htjd");
      map.addLayer(currLayer);
      break;
    case "31":
    case "32":
      mapScaleInfo = (window as any).bksInfo;
      poiInfo = (window as any).selectRegion_bks;
      map.removeLayer(currLayer);
      if (currLayer?.name !== "map_bks2") addLayer("map_bks2");
      map.addLayer(currLayer);
      break;
    case "42":
      mapScaleInfo = (window as any).cxjyInfo;
      poiInfo = (window as any).selectRegion_cxjy;
      map.removeLayer(currLayer);
      if (currLayer?.name !== "map_cxjy") addLayer("map_cxjy");
      map.addLayer(currLayer);
      break;
    default:
      break;
  }
};

const createPlayerDivIcon = (player: Player): L.DivIcon => {
  // 此函数内容保持原样（非常长，这里省略以节省篇幅，实际使用时请粘贴原完整实现）
  // ...（原 createPlayerDivIcon 完整代码）
  let teamColor: string;
  let content: string = '';
  const playerAvatarSize = otherSetting.value.playerAvatarSize;
  const playerAvatarRadius = playerAvatarSize / 30;
  const playerAvatarBgHeight = Math.round(12 * playerAvatarRadius);
  const playerAvatarBgWidth = Math.round(4 * playerAvatarRadius);
  const playerHealthBarWidth = Math.round(playerAvatarSize * 1.2);
  const teamIdFontSize = Math.round(10 * playerAvatarRadius);
  const playerAvatarBorderWidth = Math.round(2 * playerAvatarRadius);

  const borderColor = (roleId: number) => {
    switch (roleId) {
      case 0: case 1: return "#FFFFFF";
      case 2: return "#54FF9F";
      case 3: return "#5FEEFF";
      case 4: return "#B07EFF";
      case 5: return "#FFF900";
      default: return "#FF2802";
    }
  };

  if (player.isCheater) {
    teamColor = 'green';
  } else {
    switch (player.teamId) {
      case 1: teamColor = 'red'; break;
      case 2: teamColor = 'blue'; break;
      case 3: teamColor = 'green'; break;
      case 4: teamColor = 'yellow'; break;
      case 5: teamColor = 'purple'; break;
      case 6: teamColor = 'orange'; break;
      case 7: teamColor = 'cyan'; break;
      case 8: teamColor = 'pink'; break;
      case 9: teamColor = 'brown'; break;
      case 10: teamColor = 'gray'; break;
      case 11: teamColor = 'white'; break;
      case 12: teamColor = 'black'; break;
      default: teamColor = 'black'; break;
    }
  }

  const headDiv = `<div style="transform: scale(${playerAvatarRadius}); transform-origin: center;">`;
  const teamIdDiv = `<div class='team-id' style="background-color: ${teamColor}; color: white; width: ${playerAvatarBgHeight}px; height: ${playerAvatarBgHeight}px; font-size: ${teamIdFontSize}px; line-height: ${playerAvatarBgHeight}px;">${player.teamId}</div>`;

  const displayArmor = () => playerSetting.value.info.armor
      ? `style="border-left: ${playerAvatarBorderWidth}px solid ${borderColor(player.helmet)}; border-right: ${playerAvatarBorderWidth}px solid ${borderColor(player.armor)};"`
      : `style="width: ${playerAvatarSize}px; height: ${playerAvatarSize}px; border: ${playerAvatarBorderWidth}px solid ${teamColor};"`;

  const avatar = (roleName: string) => new URL(`../assets/images/${roleName}.png`, import.meta.url).href;

  const playerAvatarDiv = `<div class="map-icon-bg2" ${displayArmor()}>
        <img src="${avatar(player.roleName)}" style="width: ${playerAvatarSize}px; height: ${playerAvatarSize}px; transform: scale(${1 / playerAvatarRadius});" alt="${player.roleAlias}"/>
    </div>`;

  const storyHeightDiv = () => {
    if (!playerSetting.value.info.storyHeight) return '';
    let directionColor = 'gray', direction = '0';
    if (player.position.z > 0) { directionColor = 'green'; direction = '▲'; }
    if (player.position.z < 0) { directionColor = 'red'; direction = '▼'; }
    return `<div class="height-indicator" style="color: ${directionColor};">${direction}</div>`;
  };

  const healthBarDiv = () => playerSetting.value.info.health ? `
      <div class="health-bar" style="width: ${playerHealthBarWidth}px; height: ${playerAvatarBgWidth}px;">
         <div class="health-bar-inner" style="width: ${player.health}%; background-color: ${player.health > 80 ? 'green' : player.health > 40 ? 'yellow' : 'red'};"></div>
      </div>` : '';

  const nameDiv = () => {
    if (player.isBot) return botSetting.value.info.name ? `<div class='detail-text' style="font-size: ${teamIdFontSize}px;">名称:AI</div>` : '';
    return playerSetting.value.info.name ? `<div class='detail-text' style="font-size: ${teamIdFontSize}px;">名称:${player.name}</div>` : '';
  };

  const roleNameDiv = () => player.isBot ? '' : `<div class='detail-text' style="font-size: ${teamIdFontSize}px;">角色:${player.roleAlias}</div>`;

  const healthDiv = () => {
    if (player.isBot) return botSetting.value.info.health ? `<div class='detail-text' style="font-size: ${teamIdFontSize}px;">血量:${player.health}</div>` : '';
    return playerSetting.value.info.health ? `<div class='detail-text' style="font-size: ${teamIdFontSize}px;">血量:${player.health}</div>` : '';
  };

  const weaponDiv = () => playerSetting.value.info.weapon && !player.isBot ? `<div class='detail-text' style="font-size: ${teamIdFontSize}px;">武器:${player.weapon}</div>` : '';

  const isCheatDiv = () => player.isCheater ? `<div class='detail-text' style="font-weight: bold;color: red;font-size: 2vh">挂狗队</div>` : '';

  const footerDiv = `</div>`;

  if (player.isBot) {
    content = botSetting.value.info.display ? headDiv + playerAvatarDiv + nameDiv() + footerDiv : '';
  } else {
    content = headDiv + teamIdDiv + playerAvatarDiv + storyHeightDiv() + healthBarDiv() + nameDiv() + roleNameDiv() + healthDiv() + weaponDiv() + isCheatDiv() + footerDiv;
  }

  return new L.DivIcon({
    className: "map-icon",
    html: content,
    iconSize: [1, 1],
    iconAnchor: [0, 0],
  });
};

const createBoxDivIcon = (box: Box): L.DivIcon => {
  let content = '';
  const boxImage = new URL(`../assets/images/box.png`, import.meta.url).href;
  const playerBoxImage = new URL(`../assets/images/player_box.png`, import.meta.url).href;

  if (box.isBot) {
    if (boxSetting.value.bot) {
      content = `<div class="map-icon-bg" style="border-color: ${boxSetting.value.color.bot}">
            <img src="${boxImage}" alt="人机盒子" />
        </div>`;
    }
  } else {
    if (boxSetting.value.player) {
      content = `<div class="map-icon-bg" style="border-color: ${boxSetting.value.color.player}">
            <img src="${playerBoxImage}" alt="玩家盒子" />
        </div>`;
    }
  }

  return new L.DivIcon({
    className: "map-item-name",
    html: content,
    iconAnchor: [0, 0],
  });
};

const createItemDivIcon = (item: Item): L.DivIcon | null => {
  const itemId = item.id;
  const inItems = itemsInfo.value.some(p => p.objectID == itemId);
  const itemGrade = inItems ? itemsInfo.value.find(p => p.objectID == itemId)!.grade : item.grade;
  const itemPrice = (inItems ? itemsInfo.value.find(p => p.objectID == itemId)!.avgPrice / 1000 : item.price / 1000).toFixed(1) + 'K';
  const itemImgUrl = inItems ? `https://playerhub.df.qq.com/playerhub/60004/object/${itemId}.png` : '';

  const showName = itemSetting.value.info.name;
  const showPrice = itemSetting.value.info.price;
  if (!showName && !showPrice) return null;

  const itemColor = (grade: number) => {
    switch (grade) {
      case 1: return '#ffffff';
      case 2: return '#54ff9f';
      case 3: return '#5feeff';
      case 4: return '#b07eff';
      case 5: return '#fff900';
      case 6: return '#ff2802';
      default: return '#ffffff';
    }
  };

  const nameHtml = showName ? item.name : '';
  const priceHtml = showPrice ? `(${itemPrice})` : '';
  const textHtml = `<div class="itemName" style="font-size: 0.12rem; color: ${itemColor(itemGrade)}">${nameHtml}${priceHtml}</div>`;

  const itemImg = itemImgUrl ? `<div class="map-icon-bg map-item-icon"><img src="${itemImgUrl}" alt="物品图标" /></div>` : '';

  return new L.DivIcon({
    className: "map-item-name",
    html: itemImg + textHtml,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const getBoxKey = (box: Box) => `${Math.round(box.position.x * 10)}_${Math.round(box.position.y * 10)}_${box.isBot ? 'bot' : 'player'}`;
const getItemKey = (item: Item) => `${Math.round(item.position.x * 10)}_${Math.round(item.position.y * 10)}_${item.name}_${item.id}`;

watch(() => props.map, (newMap) => {
  const type = MAP_ALIAS[newMap as keyof typeof MAP_ALIAS] || newMap;
  if (type) changeMapLv(type);
});

watch(() => props.players as Player[], async (newPlayers) => {
  if (!map) return;
  await nextTick();

  const currentNames = new Set<string>();

  for (const player of newPlayers) {
    if (!player.position?.x || !player.name) continue;
    if (player.isBot && !botSetting.value.info.display) continue;

    currentNames.add(player.name);

    const { x, y } = getUrlParam('type') !== 'ray'
        ? getMapPos(player.position.x, player.position.y)
        : { x: player.position.x, y: player.position.y };
    const latlng = new L.LatLng(y, x);

    // 玩家 Marker
    let marker = playerMarkers.get(player.name);
    if (marker) {
      marker.setLatLng(latlng);
      marker.setIcon(createPlayerDivIcon(player));
    } else {
      marker = new L.Marker(latlng, { icon: createPlayerDivIcon(player), zIndexOffset: 1000 }).addTo(map);
      playerMarkers.set(player.name, marker);
    }

    // 视角线与箭头
    if (playerSetting.value.info.angleViewLine && player.position.angle != null) {
      const offset = currLayer.name === 'map_yc' ? -player.position.angle - 90 : -player.position.angle;
      const rad = offset * Math.PI / 180;
      const shortRayLength = otherSetting.value.rayLength;
      const pos = getMapPos(player.position.x, player.position.y);
      const shortEndX = pos.x + shortRayLength * Math.cos(rad);
      const shortEndY = pos.y + shortRayLength * Math.sin(rad);

      const targetName = checkAimHit(player);
      let isAimingEnemy = false;
      let targetLatLng: L.LatLng | null = null;

      if (targetName) {
        const targetPlayer = newPlayers.find(p => p.name === targetName);
        if (targetPlayer && targetPlayer.teamId !== player.teamId) {
          isAimingEnemy = true;
          const m = playerMarkers.get(targetName);
          if (m) targetLatLng = m.getLatLng();
        }
      }

      const lineStart: [number, number] = [pos.y, pos.x];
      const lineEnd: [number, number] = isAimingEnemy && targetLatLng ? [targetLatLng.lat, targetLatLng.lng] : [shortEndY, shortEndX];

      const baseLineOptions: L.PolylineOptions = {
        color: isAimingEnemy ? '#FF0000' : playerSetting.value.color.angleViewLine,
        weight: isAimingEnemy ? otherSetting.value.rayWidth + 2 : otherSetting.value.rayWidth,
        opacity: isAimingEnemy ? 1.0 : otherSetting.value.rayOpacity,
        interactive: false,
        dashArray: isAimingEnemy ? '25, 15' : undefined,
      };

      let line = playerViewLines.get(player.name);
      if (line) {
        line.setLatLngs([lineStart, lineEnd]);
        line.setStyle(baseLineOptions);
      } else {
        line = new L.Polyline([lineStart, lineEnd], baseLineOptions).addTo(map);
        playerViewLines.set(player.name, line);
      }

      let decorator = playerArrowDecorators.get(player.name);
      if (isAimingEnemy) {
        const arrowPattern = {
          offset: '100%',
          repeat: 0,
          symbol: L.Symbol.arrowHead({
            pixelSize: 20,
            pathOptions: { fillOpacity: 1, color: '#FF0000', weight: 0 }
          })
        };
        if (decorator) {
          decorator.setPatterns([arrowPattern]);
        } else {
          decorator = L.polylineDecorator(line, { patterns: [arrowPattern] }).addTo(map);
          playerArrowDecorators.set(player.name, decorator);
        }
      } else if (decorator) {
        map.removeLayer(decorator);
        playerArrowDecorators.delete(player.name);
      }
    } else {
      // 关闭视角线
      const line = playerViewLines.get(player.name);
      if (line) { map.removeLayer(line); playerViewLines.delete(player.name); }
      const decorator = playerArrowDecorators.get(player.name);
      if (decorator) { map.removeLayer(decorator); playerArrowDecorators.delete(player.name); }
    }
  }

  // 清理下线玩家
  for (const name of playerMarkers.keys()) {
    if (!currentNames.has(name)) {
      const marker = playerMarkers.get(name);
      if (marker) map.removeLayer(marker);
      playerMarkers.delete(name);

      const line = playerViewLines.get(name);
      if (line) map.removeLayer(line);
      playerViewLines.delete(name);

      const decorator = playerArrowDecorators.get(name);
      if (decorator) map.removeLayer(decorator);
      playerArrowDecorators.delete(name);
    }
  }
}, { immediate: true });

watch(() => props.boxes as Box[], async (newBoxes) => {
  if (!map) return;
  await nextTick();

  const currentKeys = new Set<string>();

  for (const box of newBoxes) {
    if (!box.position?.x || box.position.y === undefined) continue;

    const key = getBoxKey(box);
    currentKeys.add(key);

    const pos = getMapPos(box.position.x, box.position.y);
    const latlng = new L.LatLng(pos.y, pos.x);

    let marker = boxMarkers.get(key);
    if (marker) {
      marker.setLatLng(latlng);
      marker.setIcon(createBoxDivIcon(box));
    } else {
      if ((box.isBot && !boxSetting.value.bot) || (!box.isBot && !boxSetting.value.player)) continue;
      marker = new L.Marker(latlng, {
        icon: createBoxDivIcon(box),
        zIndexOffset: box.isBot ? 600 : 610,
      }).addTo(map);
      boxMarkers.set(key, marker);
    }
  }

  for (const key of boxMarkers.keys()) {
    if (!currentKeys.has(key)) {
      const marker = boxMarkers.get(key);
      if (marker) map.removeLayer(marker);
      boxMarkers.delete(key);
    }
  }
}, { immediate: true });

watch(() => props.items as Item[], async (newItems) => {
  if (!map) return;
  await nextTick();

  const currentKeys = new Set<string>();

  for (const item of newItems) {
    if (!item.position?.x || item.position.y === undefined) continue;
    if (!itemSetting.value.info.display) continue;

    const price = item.price || 0;
    if (price < (itemSetting.value.info.filter || 0)) continue;

    const key = getItemKey(item);
    currentKeys.add(key);

    const pos = getMapPos(item.position.x, item.position.y);
    const latlng = new L.LatLng(pos.y, pos.x);

    const icon = createItemDivIcon(item);
    if (!icon || !icon.options.html || typeof icon.options.html !== "string" || icon.options.html?.trim() === '') continue;

    let marker = itemMarkers.get(key);
    if (marker) {
      marker.setLatLng(latlng);
      marker.setIcon(icon);
    } else {
      marker = new L.Marker(latlng, { icon, zIndexOffset: 500 }).addTo(map);
      itemMarkers.set(key, marker);
    }
  }

  for (const key of itemMarkers.keys()) {
    if (!currentKeys.has(key)) {
      const marker = itemMarkers.get(key);
      if (marker) map.removeLayer(marker);
      itemMarkers.delete(key);
    }
  }
}, { immediate: true });

onMounted(async () => {
  await nextTick();
  if (!mapContainer.value) {
    console.error('Map container not found!');
    return;
  }
  await init();
  if (props.map) {
    changeMapLv(MAP_ALIAS[props.map as keyof typeof MAP_ALIAS]);
  }
});
</script>

<template>
  <div class="map-wrapper">
    <div ref="mapContainer" id="MapContainer" class="map"></div>

    <!-- 对应原来的 .scaleAuto -->
    <div ref="scaleAutoRef" class="scaleAuto"></div>

    <!-- 对应原来的 .select_map_video（如果项目中有此元素） -->
    <div ref="selectMapVideoRef" class="select_map_video"></div>

    <!-- POI 区域列表（替代原来的 region-list jQuery 操作） -->
    <div class="region-list">
      <div
          v-for="item in regionList"
          :key="item.index"
          class="region-item"
          :data-x="item.x"
          :data-y="item.y"
      >
        {{ item.name }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.map {
  width: 100%;
  height: 100%;
}

/* 根据项目实际情况保留或调整以下样式 */
.scaleAuto,
.select_map_video,
.region-list {
  position: absolute;
  /* 其他原有样式请自行补充 */
}
</style>