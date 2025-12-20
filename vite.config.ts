import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { resolve } from "node:path";
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'

export default defineConfig({
    plugins: [
        vue(),
        AutoImport({
            resolvers: [
                ElementPlusResolver(),
                IconsResolver({ prefix: 'Icon' }),
            ],
        }),
        Components({
            resolvers: [ElementPlusResolver()],
        }),
        Icons({ autoInstall: true }),
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        }
    },
    build: {
        minify: 'terser',
        chunkSizeWarningLimit: 1000, // 既然依赖多，适当调高警告阈值
        rollupOptions: {
            output: {
                // 移除 globals 中的 jquery，除非你是通过 CDN 引入 jquery 的
                // 如果是 pnpm 安装的，Rollup 会自动处理

                chunkFileNames: 'assets/js/[name]-[hash].js',
                entryFileNames: 'assets/js/[name]-[hash].js',
                assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',

                manualChunks(id) {
                    // 1. 核心框架（几乎不变）
                    if (id.includes('node_modules/vue') || id.includes('node_modules/@vue') || id.includes('node_modules/pinia')) {
                        return 'vendor-framework';
                    }

                    if (id.includes('node_modules/@fortawesome') || id.includes('node_modules/font-awesome')) {
                        return 'vendor-icons';
                    }

                    // 3. 地图渲染引擎：Leaflet 系列
                    if (id.includes('node_modules/leaflet')) {
                        return 'vendor-leaflet';
                    }

                    // 4. UI 库：Element Plus
                    if (id.includes('node_modules/element-plus')) {
                        return 'vendor-element';
                    }

                    // 5. 较大的工具库独立拆分
                    if (id.includes('node_modules/pako') || id.includes('node_modules/@msgpack')) return 'vendor-compress';
                    if (id.includes('node_modules/axios')) return 'vendor-axios';
                    if (id.includes('node_modules/@vueuse')) return 'vendor-vueuse';

                    // 6. 剩下的琐碎 node_modules
                    if (id.includes('node_modules')) {
                        return 'vendor-others';
                    }

                    // 7. 业务代码分包
                    if (id.includes('/src/components/')) return 'common-components';
                    if (id.includes('/src/store') || id.includes('/src/utils')) return 'app-core';
                }
            }
        }
    },
    server: {
        allowedHosts: [
            "map.coolxi.eu.org",
        ],
    }
})