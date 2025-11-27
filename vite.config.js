import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import {ElementPlusResolver} from 'unplugin-vue-components/resolvers'
import {resolve} from "path";
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        AutoImport({
            resolvers: [
                ElementPlusResolver(),
                IconsResolver({
                    prefix: 'Icon',
                }),
            ],
        }),
        Components({
            resolvers: [ElementPlusResolver()],
        }),
        Icons({
            autoInstall: true,
        }),
    ],
    resolve:{
        alias:{
            '@': resolve(__dirname,'src'),
        }
    },
    build: {
        minify: 'terser',
        rollupOptions: {
            output: {
                globals: {
                    jquery: 'window.$'
                }
            }
        }
    }
})
