<script setup lang="ts">
/* eslint-disable */
import L, {DomUtil} from 'leaflet';
import 'leaflet.zoomslider/src/L.Control.Zoomslider.js';
import 'leaflet-rotate';
//地图
import {nextTick, onMounted, ref, watch} from "vue";
import {
  dabaInfo,
  selectRegion
} from "@/lib/map_article.js";
import {
  bksInfo,
  selectRegion_bks
} from "@/lib/map_bks.js";
import {cxjyInfo, selectRegion_cxjy} from "@/lib/map_cxjy.js";
import {
  htjdInfo,
  selectRegion_htjd
} from "@/lib/map_htjd.js";
import {
  cgxgInfo,
  selectRegion_cgxg
} from "@/lib/map_cgxg.js";
import {Settings} from "@/store/settings.js";
import {storeToRefs} from "pinia";
import $ from "jquery";
import {Box, Item, Player} from "@/interface/GameData.ts";
import getPosition = DomUtil.getPosition;

/* eslint-disable */
const settings = Settings();
const {playerSetting, botSetting, itemSetting, boxSetting, otherSetting} = storeToRefs(settings);
const props = defineProps({
  map: {
    type: String,
    default: 'daba'
  },
  players: {
    type: Array,
    default: () => [],
  },
  items: {
    type: Array,
    default: () => [],
  },
  boxes: {
    type: Array,
    default: () => [],
  }
});
const MAP_ALIAS = {
  daba: '00',
  cgxg: '10',
  htjd: '21',
  bks: '31',
  cxjy: '42'
}
const browser = {
  versions: (function () {
    const u = navigator.userAgent;
    return {
      mobile: !!u.match(/AppleWebKit.*Mobile.*/), // 移动终端
      Tablet: u.indexOf('Tablet') > -1 || u.indexOf('Pad') > -1 || u.indexOf('Nexus 7') > -1, // 平板
      ios: u.indexOf('like Mac OS X') > -1, // ios终端
      android: u.indexOf('Android') > -1 || u.indexOf('Adr') > -1, // android终端
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
window.viewChange = true; // 进攻方视角
window.occupy = false; // 占领模式
window.warLv = 0; // 阶段
window.isLvChange = false;
window.warSwiper = null; // 部署swiper
window.pervInitX = 0 // 上一次位移
const regionList = $('.region-list');

function Page() {
  const _this = this;
  _this.$page = $('.m-index')

  // _this.$page.css('height', window.innerHeight)
  _this.init = function () {
    if (!browser.versions.mobile) {
      _this.resizeDom();
      if (window.innerWidth / window.innerHeight > 1920 / 1080) {
        $('.select_map_video').css({'width': '100%', 'height': 'auto'})
      } else {
        $('.select_map_video').css({'width': 'auto', 'height': '100%'})
      }
    }

    _this.isInit = true;
  }
  _this.sizeList = {'ar': true, 'en': true, 'zh-tw': true, 'ko': true, 'tr': true}
  const scaleAutoList = $('.scaleAuto');
  _this.resizeDom = () => {
    if (window.innerHeight > window.innerWidth) return;
    if (window.innerWidth / window.innerHeight - 1920 / 1080 > 0) {
      // let scale = window.innerWidth / window.innerHeight - 1920 / 1080
      // scaleAutoList.css('bottom', `${scale * 250}px`)
      // topCtn[0].style.top = `${scale * 250}px`
    } else {
      scaleAutoList.css('bottom', '0px')
    }


  };

  window.onresize = () => {
    if (!browser.versions.mobile) {
      _this.resizeDom();
    }
  }


}

const bksTop = ['-461305', '-460454', '-459334', '-460257', '-459631', '-459328.9688', '-458885', '-459003', '-458692'];
const bksBom = ['-458000', '-457863', '-457854', '-457554', '-457310', '-457776', '-457320', '-457322', '-457830'];
let mapScaleInfo: any = dabaInfo;
// 当前地图
let currLayer: any;
let isFloor: boolean;
const getMapPos = (posX: number, posY: number) => {
  if (currLayer.name === 'bks_1f' || currLayer.name === 'map_bks2') {
    // console.log(posX, posY);

    if (bksTop.includes(String(posY))) {
      posX = Number(posX) + 700
      posY = Number(posY) - 200
    }
    if (bksBom.includes(String(posY))) {
      posX = Number(posX) + 900
      posY = Number(posY) + 200
    }
    if (posY === -459085) {
      posX = Number(posX) + 300
    }

  }
  const x = Number(posX);
  const y = Number(posY);
  const bj = isFloor ? mapScaleInfo.floorInfo.info.bj : 128;
  // x轴转换计算公式：世界轴 / 设计稿宽度/2
  // x轴倍率：81086.304688 / 4096 = 19.79646110546875
  // var xB = 81086.304688 / 4096
  // 81086.304688 / 128
  const xB2 = mapScaleInfo.width / bj;

  // y轴计算公式：世界轴 / 设计稿宽度/2
  // y轴倍率：80988.500000 / 4096 = 19.7725830078125
  // var yB = 80988.500000 / 4096 / -bj
  const yB2 = mapScaleInfo.height / bj;

  // 世界中心轴x： 358155.687500； y： 750191.750000
  // return {x: bj - (mapScaleInfo.centerX - x ) / xB2, y: -bj - (mapScaleInfo.centerY + y ) / yB2}
  // currLayer.name === 'map_gc'|| currLayer.name === 'map_pc'

  if (currLayer.name.indexOf('cgxg') !== -1 || currLayer.name === 'map_yc2' || currLayer.name === 'map_yc' || mapScaleInfo.rotate) {

    return {x: bj - (mapScaleInfo.centerY + y) / yB2, y: -bj + (mapScaleInfo.centerX - x) / xB2}
  } else {
    return {x: bj - (mapScaleInfo.centerX - x) / xB2, y: -bj - (mapScaleInfo.centerY + y) / yB2}
  }
}
new Page().init();
let poiInfo = selectRegion;
let poiList: any = [];

// 全面战场模式
let isWar: boolean = false;

// 标点
let map: L.Map;

let playerMarkers = new Map<string, L.Marker>();
let playerViewLines = new Map<string, L.Polyline>();
let boxMarkers = new Map<string, L.Marker>();
let itemMarkers = new Map<string, L.Marker>();

const init = () => {
  return new Promise(() => {
    const mapWidth = isFloor ? mapScaleInfo.floorInfo.info.boundsW : mapScaleInfo.boundsW;
    const mapHeight = isFloor ? mapScaleInfo.floorInfo.info.boundsH : mapScaleInfo.boundsH;
    const mapOrigin = isWar ? L.latLng(0, -80) : L.latLng(0, 0);
    const pixelToLatLngRatio = -1;
    const southWest = mapOrigin; // 左上角
    const northEast = L.latLng((mapHeight - 70) * pixelToLatLngRatio, mapWidth * pixelToLatLngRatio); // 右下角
    const bounds = L.latLngBounds(southWest, northEast);
    map = L.map('MapContainer', {
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
      trackResize: !0
    }).setView([mapScaleInfo.initX, mapScaleInfo.initY], mapScaleInfo.initZoom);
    let control: L.Control = new L.Control.Zoomslider()
    map.addControl(control);
    window.pervInitX = mapScaleInfo.initX

    addLayer('map_db');
  });
};

const addLayer = (mapName: string) => {
  let mapWidth: number;
  let mapHeight: number;
  let minZoom: number;
  let pixelToLatLngRatio: number;
  let southWest: any; // 左上角
  if (window.occupy) {
    mapWidth = mapScaleInfo.boundsW_s
    mapHeight = mapScaleInfo.boundsH_s
    southWest = L.latLng(0, 0)
    pixelToLatLngRatio = -1
  } else {
    mapWidth = mapScaleInfo.boundsW
    mapHeight = mapScaleInfo.boundsH
    southWest = L.latLng(0, 0)
    pixelToLatLngRatio = -1
  }
  const northEast = L.latLng((mapHeight - 70) * pixelToLatLngRatio, mapWidth * pixelToLatLngRatio); // 右下角
  let href: string;
  if (!isFloor && mapScaleInfo.href) {
    href = mapScaleInfo.href
  } else if (isFloor && mapScaleInfo.floorInfo?.info?.href) {
    href = mapScaleInfo.floorInfo?.info?.href
  } else {
    href = '//game.gtimg.cn/images/dfm/cp/a20240729directory/img/'
  }

  if (window.occupy) {
    minZoom = mapScaleInfo.minZoom_s
  } else {
    minZoom = mapScaleInfo.minZoom
  }
  // console.log(minZoom, initZoom);
  const bounds = L.latLngBounds(southWest, northEast);
  currLayer = L.tileLayer(href + `${mapName}/{z}_{x}_{y}.jpg`, {
    minZoom: minZoom,
    maxZoom: 8,
    maxNativeZoom: isFloor ? (mapScaleInfo.floorInfo.info?.maxZomm || 6) : 4,
    noWrap: false,
    attribution: '© OpenStreetMap contributors',
    bounds: bounds,
    errorTileUrl: href + `${mapName}/0_0_0.jpg`,
    tileSize: isFloor ? 512 : 256,
    zoomOffset: isFloor ? -1 : 0
  }).addTo(map);
  currLayer.name = mapName
  map.setMaxBounds(bounds)
  map.options.minZoom = minZoom;
  window.pervInitX = window.occupy ? mapScaleInfo.initX_s : mapScaleInfo.initX

  $.each(poiList, function () {
    this.remove();
  });
  poiList = [];
  let html = ''
  if (poiInfo && poiInfo.length > 0) {
    // console.log('poiInfo', poiInfo);

    poiInfo?.forEach((item, index) => {
      if (item.name === '行政西楼' || item.name === '行政东楼') return;
      const myIcon = L.divIcon({
        className: ` map-region-name`,
        html: `<div class="region-item" data-x="${item.x}" data-y="${item.y}">${item.name}</div>`,
      });
      html += `<div class="region-item region-item-${index}" data-x="${item.x}" data-y="${item.y}">${item.name}</div>`
      const pos = getMapPos(Number(item.x), Number(item.y));
      // // console.log(item.x, item.y);


      // regionList.append(`<div class="region-item region-item-${index}" data-x="${item.x}" data-y="${item.y}">${item.name}</div>`)

      poiList.push(L.marker([pos.y, pos.x], {icon: myIcon}).addTo(map))
    })
  }
  // 锚点定位
  regionList.html(html)
}

// 地图难度切换
const changeMapLv = (type: string) => {
  switch (type) {
    case "00":
      mapScaleInfo = dabaInfo;
      poiInfo = selectRegion;
      currLayer.name !== "map_db" && addLayer("map_db");
      break;
    case "01":
      mapScaleInfo = dabaInfo;
      poiInfo = selectRegion;
      currLayer.name !== "map_db" && addLayer("map_db");
      break;
    case "10":
      mapScaleInfo = cgxgInfo;
      poiInfo = selectRegion_cgxg;
      map.removeLayer(currLayer);
      currLayer.name !== "map_yc" && addLayer("map_yc");
      map.addLayer(currLayer);
      break;
    case "10_s":
      mapScaleInfo = cgxgInfo;
      poiInfo = selectRegion_cgxg;
      map.removeLayer(currLayer);
      currLayer.name !== "map_yc2" && addLayer("map_yc2");
      map.addLayer(currLayer);
      break;
    case "11":
      mapScaleInfo = cgxgInfo;
      poiInfo = selectRegion_cgxg;
      map.removeLayer(currLayer);
      currLayer.name !== "map_yc" && addLayer("map_yc");
      map.addLayer(currLayer);
      break;
    case "11_s":
      mapScaleInfo = cgxgInfo;
      poiInfo = selectRegion_cgxg;
      map.removeLayer(currLayer);
      currLayer.name !== "map_yc2" && addLayer("map_yc2");
      map.addLayer(currLayer);
      break;
    case "21":
      mapScaleInfo = htjdInfo;
      poiInfo = selectRegion_htjd;
      map.removeLayer(currLayer);
      currLayer.name !== "map_htjd" && addLayer("map_htjd");
      map.addLayer(currLayer);
      break;
    case "22":
      mapScaleInfo = htjdInfo;
      poiInfo = selectRegion_htjd;
      map.removeLayer(currLayer);
      currLayer.name !== "map_htjd" && addLayer("map_htjd");
      map.addLayer(currLayer);
      break;
    case "31":
      mapScaleInfo = bksInfo;
      poiInfo = selectRegion_bks;
      map.removeLayer(currLayer);
      currLayer.name !== "map_bks" && addLayer("map_bks2");
      map.addLayer(currLayer);
      break;
    case "32":
      mapScaleInfo = bksInfo;
      poiInfo = selectRegion_bks;
      map.removeLayer(currLayer);
      currLayer.name !== "map_bks" && addLayer("map_bks2");
      map.addLayer(currLayer);
      break;
    case "42":
      mapScaleInfo = cxjyInfo;
      poiInfo = selectRegion_cxjy;
      map.removeLayer(currLayer);
      currLayer.name !== "map_cxjy" && addLayer("map_cxjy");
      map.addLayer(currLayer);
      break;
    default:
      break;
  }
}

const mapContainer = ref(null);

const createPlayerDivIcon = (player: Player,): L.DivIcon => {
  let teamColor: string;
  let content: string = '';
  const playerAvatarSize = otherSetting.value.playerAvatarSize
  const playerAvatarRadius = playerAvatarSize / 30;
  const playerAvatarBgHeight = Math.round(12 * playerAvatarRadius);
  const playerAvatarBgWidth = Math.round(4 * playerAvatarRadius);
  const playerHealthBarWidth = Math.round(playerAvatarSize * 1.2);
  const teamIdFontSize = Math.round(10 * playerAvatarRadius);
  const playerAvatarBorderWidth = Math.round(2 * playerAvatarRadius);
  const borderColor = (roleId: number) => {
    switch (roleId) {
      case 0:
      case 1:
        return "#FFFFFF";
      case 2:
        return "#54FF9F";
      case 3:
        return "#5FEEFF";
      case 4:
        return "#B07EFF";
      case 5:
        return "#FFF900";
      default:
        return "#FF2802";
    }
  };
  if (player.isCheater) {
    teamColor = 'green';
  } else {
    switch (player.teamId) {
      case 1:
        teamColor = 'red';
        break;
      case 2:
        teamColor = 'blue';
        break;
      case 3:
        teamColor = 'green';
        break;
      case 4:
        teamColor = 'yellow';
        break;
      case 5:
        teamColor = 'purple';
        break;
      case 6:
        teamColor = 'orange';
        break;
      case 7:
        teamColor = 'cyan';
        break;
      case 8:
        teamColor = 'pink';
        break;
      case 9:
        teamColor = 'brown';
        break;
      case 10:
        teamColor = 'gray';
        break;
      case 11:
        teamColor = 'white';
        break;
      case 12:
        teamColor = 'black';
        break;
      default:
        teamColor = 'black';
        break;
    }
  }
  const headDiv = `
    <div style="transform: scale(${playerAvatarRadius}); transform-origin: center;">
  `;
  const teamIdDiv = `<div class='team-id' style="background-color: ${teamColor}; color: white; width: ${playerAvatarBgHeight}px; height: ${playerAvatarBgHeight}px; font-size: ${teamIdFontSize}px; line-height: ${playerAvatarBgHeight}px;">${player.teamId}</div>`;

  const displayArmor = () => {
    return playerSetting.value.info.armor ? `style="border-left: ${playerAvatarBorderWidth}px solid ${borderColor(player.helmet)}; border-right: ${playerAvatarBorderWidth}px solid ${borderColor(player.armor)};"` : `style="width: ${playerAvatarSize}px; height: ${playerAvatarSize}px; border: ${playerAvatarBorderWidth}px solid ${teamColor};"`;

  };
  const avatar = (roleName) => {
    return new URL(`../assets/images/${roleName}.png`, import.meta.url).href
  };
  const playerAvatarDiv = `
    <div class="map-icon-bg2" ${displayArmor()}>
        <img src="${avatar(player.roleName)}" style="width: ${playerAvatarSize}px; height: ${playerAvatarSize}px; transform: scale(${1 / playerAvatarRadius});" alt="${player.roleAlias}"/>
    </div>
  `;

  const storyHeightDiv = () => {
    let div: string = '';
    if (playerSetting.value.info.storyHeight) {
      let directionColor: string;
      let direction: string;
      if (player.position.z > 0) {
        directionColor = 'green';
        direction = '▲';
      }
      if (player.position.z < 0) {
        directionColor = 'red';
        direction = '▼';
      }
      if (player.position.z === 0) {
        directionColor = 'gray';
        direction = '0';
      }
      div = `<div class="height-indicator" style="color: ${directionColor};">${direction}</div>`;
    }
    return div;
  };

  const healthBarDiv = () => {
    const healthBar = `
      <div class="health-bar" style="width: ${playerHealthBarWidth}px; height: ${playerAvatarBgWidth}px;">
         <div class="health-bar-inner" style="width: ${player.health}%; background-color: ${player.health > 80 ? 'green' : player.health > 40 ? 'yellow' : 'red'};"></div>
      </div>
    `;
    return playerSetting.value.info.health ? healthBar : '';
  };

  const nameDiv = () => {
    const nameDivCode = `
      <div class='detail-text' style="font-size: ${teamIdFontSize}px;">
        名称:${player.isBot ? "AI" : player.name}
      </div>
    `;
    if (player.isBot) {
      if (botSetting.value.info.name) {
        return nameDivCode;
      } else {
        return '';
      }
    }
    if (playerSetting.value.info.name) {
      return nameDivCode;
    } else {
      return '';
    }
  };

  const roleNameDiv = () => {
    let div: string = '';
    if (!player.isBot) {
      div = `<div class='detail-text' style="font-size: ${teamIdFontSize}px;">角色:${player.roleAlias}</div>`;
    }
    return div;
  };

  const healthDiv = () => {
    let div: string = '';
    if (player.isBot) {
      if (botSetting.value.info.health) {
        div = `<div class='detail-text' style="font-size: ${teamIdFontSize}px;">血量:${player.health}</div>`;
      }
    } else {
      if (playerSetting.value.info.health) {
        div = `<div class='detail-text' style="font-size: ${teamIdFontSize}px;">血量:${player.health}</div>`;
      }
    }
    return div;
  };

  const weaponDiv = () => {
    let div: string = '';
    if (playerSetting.value.info.weapon && !player.isBot) {
      div = `<div class='detail-text' style="font-size: ${teamIdFontSize}px;">武器:${player.weapon}</div>`;
    } else {
      div = '';
    }
    return div;
  };

  const isCheatDiv = () => {
    let div: string = '';
    if (player.isCheater) {
      div = `<div class='detail-text' style="font-weight: bold;color: red;font-size: 2vh">挂狗队</div>`;
    } else {
      div = '';
    }
    return div;
  }

  const footerDiv = `
    </div>
  `;

  if (player.isBot) {
    if (botSetting.value.info.display) {
      content = headDiv + playerAvatarDiv + nameDiv() + footerDiv;
    }
  } else {
    content = headDiv + teamIdDiv + playerAvatarDiv + storyHeightDiv() + healthBarDiv() + nameDiv() + roleNameDiv() + healthDiv() + weaponDiv() + isCheatDiv() + footerDiv;
  }
  return L.divIcon({
    className: "map-icon",
    html: content,
    "iconSize": [1, 1],
    "iconAnchor": [0, 0],
  });
};
const createBoxDivIcon = (box: Box): L.DivIcon => {
  let content: string = '';
  const boxImage = new URL(`../assets/images/box.png`, import.meta.url).href
  const playerBoxImage = new URL(`../assets/images/player_box.png`, import.meta.url).href
  if (box.isBot) {
    if (boxSetting.value.bot) {
      content = `
        <div class="map-icon-bg" style="border-color: ${boxSetting.value.color.bot}">
            <img src="${boxImage}" alt="人机盒子" />
        </div>
    `;
    } else {
      content = '';
    }
  } else {
    if (boxSetting.value.player) {
      content = `
        <div class="map-icon-bg" style="border-color: ${boxSetting.value.color.player}">
            <img src="${playerBoxImage}" alt="玩家盒子" />
        </div>
    `;
    } else {
      content = '';
    }
  }
  // console.debug("createBoxDivIcon", box.isBot, box);
  return L.divIcon({
    className: "map-item-name",
    html: content,
    iconAnchor: [0, 0],
  });
};
const createItemDivIcon = (item: Item): L.DivIcon | null => {
  // 全局开关已经在 watch 里判断了，这里可以不再判断
  const itemId = item.id;
  const itemGrade = item.grade || 1;
  const itemPrice = item.price ? (item.price / 1000).toFixed(1) + "K" : "";
  let itemImgUrl = `https://playerhub.df.qq.com/playerhub/60004/object/${itemId}.png`;
  if (itemId === '15080050152' || itemId === '15080050153' || itemId === '15080050154' || itemId === '15080050155' || itemId === '15080050156' || itemId === '15080050157' || itemId === '15080050158') {
    itemImgUrl = `https://playerhub.df.qq.com/playerhub/60004/object/15080050161.png`;
  }
  if (itemId === '15080050160') {
    itemImgUrl = `https://playerhub.df.qq.com/playerhub/60004/object/15200000031.png`;
  }


  const showName = itemSetting.value.info.name;
  const showPrice = itemSetting.value.info.price;

  // 如果什么都不显示，直接返回 null
  if (!showName && !showPrice) {
    return null;
  }

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
  const textHtml = `<div class="itemName" style="font-size: 0.12rem; color: ${itemColor(itemGrade)}">
                     ${nameHtml}${priceHtml}
                   </div>`;

  const content = `
    <div class="map-icon-bg map-item-icon">
      <img src="${itemImgUrl}" alt="${item.name}" />
    </div>
    ${textHtml}
  `;

  return L.divIcon({
    className: "map-item-name",
    html: content,
    iconSize: [40, 40],       // 建议给个正常大小，或者 null 自动
    iconAnchor: [20, 20],
  });
};
const getBoxKey = (box: Box) => {
  // 坐标取整到厘米级 + 是否人机，基本不可能撞
  const x = Math.round(box.position.x * 10);
  const y = Math.round(box.position.y * 10);
  return `${x}_${y}_${box.isBot ? 'bot' : 'player'}`;
};
const getItemKey = (item: Item) => {
  // 坐标取整到厘米级 + 是否人机，基本不可能撞
  const x = Math.round(item.position.x * 10);
  const y = Math.round(item.position.y * 10);
  return `${x}_${y}_${item.name}_${item.id}`;
};

watch(
    () => props.map,
    (newMap) => {
      const type = MAP_ALIAS[newMap] || newMap
      if (type) {
        changeMapLv(type)
      }
    },
);

watch(
    () => props.players as Player[],
    async (newPlayers: Player[]) => {
      if (!map) return
      await nextTick()

      const currentNames = new Set<string>()

      for (const player of newPlayers) {
        // 基础过滤：坐标和名字必须有（角度可有可无！）
        if (!player.position?.x || !player.name) continue;
        if (player.isBot && !botSetting.value.info.display) continue;

        // 这一步必须提前！不管是否画线，都要记录这个玩家存在
        currentNames.add(player.name)

        const {x, y} = getMapPos(player.position.x, player.position.y)
        const latlng = L.latLng(y, x)

        // ========= 1. 玩家 Marker：永远更新，与视角线开关无关 =========
        const oldMarker = playerMarkers.get(player.name)
        if (oldMarker) {
          oldMarker.setLatLng(latlng)
          oldMarker.setIcon(createPlayerDivIcon(player))
        } else {
          const marker = L.marker(latlng, {
            icon: createPlayerDivIcon(player),
            zIndexOffset: 1000
          }).addTo(map)
          playerMarkers.set(player.name, marker)
        }

        // ========= 2. 视角线：只有开关开 + 有角度 才画 =========
        if (
            playerSetting.value.info.angleViewLine &&
            player.position.angle != null
        ) {
          const offset = currLayer.name === 'map_yc'
              ? -parseFloat(String(player.position.angle)) - 90
              : -parseFloat(String(player.position.angle));

          const rayLength = otherSetting.value.rayLength;
          const position = getMapPos(player.position.x, player.position.y);
          const rayX = position.x;
          const rayY = position.y;  // ← 注意：你之前写成 ratY，拼写错了！

          const rad = offset * Math.PI / 180;
          const endX = rayX + rayLength * Math.cos(rad);
          const endY = rayY + rayLength * Math.sin(rad);

          const oldLine = playerViewLines.get(player.name)
          if (oldLine) {
            oldLine.setLatLngs([[rayY, rayX], [endY, endX]])
          } else {
            const line = L.polyline([[rayY, rayX], [endY, endX]], {
              color: playerSetting.value.color.angleViewLine,
              opacity: otherSetting.value.rayOpacity,
              weight: otherSetting.value.rayWidth,
              interactive: false
            }).addTo(map)
            playerViewLines.set(player.name, line)
          }
        } else {
          // 开关关闭 或 无角度 → 只删除线，不影响玩家
          const oldLine = playerViewLines.get(player.name)
          if (oldLine) {
            map.removeLayer(oldLine)
            playerViewLines.delete(player.name)
          }
        }
      }

      // ========= 3. 清理下线玩家（marker + 线一起删）=========
      for (const name of playerMarkers.keys()) {
        if (!currentNames.has(name)) {
          map.removeLayer(playerMarkers.get(name)!)
          playerMarkers.delete(name)

          const line = playerViewLines.get(name)
          if (line) {
            map.removeLayer(line)
            playerViewLines.delete(name)
          }
        }
      }
    },
    {immediate: true}
    // deep: true 可以保留，也可以去掉（props.players 引用变了就会触发）
)

watch(
    () => props.boxes as Box[],
    async (newBoxes: Box[]) => {
      if (!map) return;
      await nextTick(); // 确保 DOM 和 map 就绪

      const currentKeys = new Set<string>();

      for (const box of newBoxes) {
        if (!box.position?.x || box.position.y === undefined) continue;

        const key = getBoxKey(box);
        currentKeys.add(key);

        const pos = getMapPos(box.position.x, box.position.y);
        const latlng = L.latLng(pos.y, pos.x);

        const oldMarker = boxMarkers.get(key);
        if (oldMarker) {
          // 更新位置（盒子极少移动，但保险）
          oldMarker.setLatLng(latlng);
          // 更新图标（开关或颜色变了也能实时刷新）
          oldMarker.setIcon(createBoxDivIcon(box));
        } else {
          // 新盒子：只在需要显示时才创建
          if (box.isBot && !boxSetting.value.bot) continue;
          if (!box.isBot && !boxSetting.value.player) continue;

          const marker = L.marker(latlng, {
            icon: createBoxDivIcon(box),
            zIndexOffset: box.isBot ? 600 : 610,
          }).addTo(map);

          boxMarkers.set(key, marker);
        }
      }

      for (const key of boxMarkers.keys()) {
        if (!currentKeys.has(key)) {
          const marker = boxMarkers.get(key)!;
          map.removeLayer(marker);
          boxMarkers.delete(key);
        }
      }
    },
    {immediate: true}
);

watch(
    () => props.items as Item[],
    async (newItems: Item[]) => {
      if (!map) return;
      await nextTick();

      const currentKeys = new Set<string>();

      for (const item of newItems) {
        if (!item.position?.x || item.position.y === undefined) continue;

        // ===== 关键：先判断是否需要显示 =====
        if (!itemSetting.value.info.display) continue;

        // 价格过滤（注意：price 可能为 0 或 undefined）
        const price = item.price || 0;
        if (price < (itemSetting.value.info.filter || 0)) continue;

        const key = getItemKey(item);
        currentKeys.add(key);

        const pos = getMapPos(item.position.x, item.position.y);
        const latlng = L.latLng(pos.y, pos.x);

        const icon = createItemDivIcon(item);
        // 关键：如果 icon.html 是空的，直接跳过创建/更新
        if (!icon.options.html || typeof icon.options.html !== "string" || icon.options.html?.trim() === '') {
          // 即使价格够了，但用户可能关掉了“显示名称”等，导致 html 为空
          continue;
        }

        const oldMarker = itemMarkers.get(key);
        if (oldMarker) {
          oldMarker.setLatLng(latlng);
          oldMarker.setIcon(icon);
        } else {
          const marker = L.marker(latlng, {
            icon: icon,
            zIndexOffset: 500, // 一般比盒子低一点
          }).addTo(map);
          itemMarkers.set(key, marker);
        }
      }

      // 清理消失的物品
      for (const key of itemMarkers.keys()) {
        if (!currentKeys.has(key)) {
          const marker = itemMarkers.get(key)!;
          map.removeLayer(marker);
          itemMarkers.delete(key);
        }
      }
    },
    { immediate: true }
);

onMounted(async () => {
  await nextTick();
  if (!mapContainer.value) {
    console.error('Map container not found!')
    return
  }
  await init();
  if (props.map) {
    changeMapLv(MAP_ALIAS[props.map]);
  }
});
</script>

<template>
  <div ref="mapContainer" id="MapContainer" class="map"></div>
</template>

<style scoped>
</style>