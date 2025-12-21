import {createApp} from 'vue'
import './style.css'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import App from './App.vue'
import ElementPlus from 'element-plus'
import { createPinia } from "pinia";
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import router from '@/router/index';
import {useWebViewDetector} from "@/utils/antiWebView.ts";
import {
    fpjsPlugin, FpjsVueOptions
} from '@fingerprintjs/fingerprintjs-pro-vue-v3';

const app = createApp(App);
const pinia = createPinia();

pinia.use(piniaPluginPersistedstate);
app.use(ElementPlus)
app.use(pinia);
app.use(router);
app.use(fpjsPlugin, {
    loadOptions: {
        apiKey: "bFxHShSNwE9M8wI5IuM8",
        region: "ap"
    },
} as FpjsVueOptions);
app.mount('#app')

router.isReady().then(async () => {
    console.log('%c 三角洲行动 %c 挂狗地图 ','background: #000; padding: 1px; border-radius: 3px 0 0 3px; color: #0FF796; font-weight: bold;','background:#fff ; padding: 1px; border-radius: 0 3px 3px 0; color: #000; font-weight: bold;');
})
