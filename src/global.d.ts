import { ToastManager } from '@kong/kongponents'

declare module 'vue' {
  interface ComponentCustomProperties {
    $toaster: typeof ToastManager
  }
}
