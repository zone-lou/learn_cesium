import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import './style.css'
import router from "./router/index" // 引入router

declare global {
  interface Window {
    CESIUM_BASE_URL: string
  }
}

const app = createApp(App)

app.use(ElementPlus)
app.use(router)
app.mount('#app')
