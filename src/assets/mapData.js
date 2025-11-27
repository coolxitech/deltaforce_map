// src/assets/mapData.js

import { dabaFloor } from '@/lib/daba_floor.js'
import { dabaInfo, mapArticle, navList, navListInfo, selectRegion } from '@/lib/map_article.js'
import { bksInfo, mapArticle_bks, navList_bks, navListInfo_bks, selectRegion_bks } from '@/lib/map_bks.js'
import { cxjyInfo, mapArticle_cxjy, navList_cxjy, navListInfo_cxjy, selectRegion_cxjy } from '@/lib/map_cxjy.js'
import { htjdInfo, mapArticle_htjd, navList_htjd, navListInfo_htjd, selectRegion_htjd } from '@/lib/map_htjd.js'

export const mapConfigs = {
    // 大坝
    '00': {
        key: '00',
        name: '零号大坝',
        level: 'A',
        layer: 'map_daba',
        info: dabaInfo,
        nav: navList,
        navInfo: navListInfo,
        icons: mapArticle,
        poi: selectRegion,
        floor: dabaFloor
    },

    // 长弓溪谷
    '10': {
        key: '10',
        name: '长弓溪谷',
        level: 'B',
        layer: 'map_cgxg',
        info: bksInfo,
        nav: navList_bks,
        navInfo: navListInfo_bks,
        icons: mapArticle_bks,
        poi: selectRegion_bks
    },

    // 行政精英
    '42': {
        key: '42',
        name: '潮汐监狱',
        level: 'E',
        layer: 'map_cxjy',
        info: cxjyInfo,
        nav: navList_cxjy,
        navInfo: navListInfo_cxjy,
        icons: mapArticle_cxjy,
        poi: selectRegion_cxjy
    },

    // 火天基地
    '21': {
        key: '21',
        name: '航天基地',
        level: 'C',
        layer: 'map_htjd',
        info: htjdInfo,
        nav: navList_htjd,
        navInfo: navListInfo_htjd,
        icons: mapArticle_htjd,
        poi: selectRegion_htjd
    },
}