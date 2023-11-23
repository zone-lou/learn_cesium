import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";


// 1. 配置路由
const routes: Array<RouteRecordRaw> = [
    {
        path: "/", // 默认路由 home页面
        component: () => import("../components/map/ArcGis.vue"),
    },
    {
        path: "/tianditu", // 默认路由 home页面
        component: () => import("../components/map/tianditu.vue"),
    },

];

// 2.返回一个 router 实列，为函数，配置 history 模式
const router = createRouter({
    history: createWebHistory(),
    routes,
});

// 3.导出路由   去 main.ts 注册 router.ts
export default router