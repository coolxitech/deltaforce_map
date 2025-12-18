import {defineStore} from "pinia";

export const SettingStore = defineStore("settings", {
    state: () => ({
        type: 'un',
        playerNum: 0,
        mapId: 0,
        loading: true,
        playerSetting: {
            info: {
                name: true,
                weapon: true,
                health: true,
                armor: true,
                teammate: true,
                angleViewLine: true,
                storyHeight: true,
                angle: false,
                sightFollow: false,
            },
            color: {
                angleViewLine: '#ff0000',
            },
        },
        botSetting: {
            info: {
                display: true,
                displayBoss: true,
                name: true,
                health: true,
            },
        },
        itemSetting: {
            info: {
                display: true,
                name: true,
                price: true,
                filter: 10000, // 过滤价值
            },
            color: {
                1: '#ffffff',
                2: '#54ff9f',
                3: '#5feeff',
                4: '#b07eff',
                5: '#fff900',
                6: '#ff2802',
            },
        },
        boxSetting: {
            player: true,
            bot: true,
            color: {
                player: '#ff0000',
                bot: '#00ff00',
            }
        },
        otherSetting: {
            playerAvatarSize: 30,
            rayLength: 15,
            rayOpacity: 0.8,
            rayWidth: 3,
            teammateSelectorSize: 100,
        },
        itemsInfo: null,
    }),
    actions: {
        setItemsInfo(itemsInfo: Array<any>) {
            this.itemsInfo = itemsInfo
        },
    },
    getters: {
    },
    persist: true,
})