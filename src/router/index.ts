import { createRouter, createWebHistory} from "vue-router";

const routes = [
    {
        path: '/',
        name: 'home',
        component: () => import('@/views/Home.vue'),
    },
    {
        path: '/anti-webview',
        name: 'anti-webview',
        component: () => import('@/views/403.vue'),
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;