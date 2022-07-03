import { createApp } from 'vue'
import { ToastManager } from '@kong/kongponents'
import './assets/index.css'
import '../node_modules/@kong/kongponents/dist/style.css'
import App from './App.vue'

const app = createApp(App)
app.mount('#app')
app.config.globalProperties.$toaster = new ToastManager()
