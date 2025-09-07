import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/wakelock/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        explicitly: resolve(__dirname, 'explicitly/index.html'),
        immediately: resolve(__dirname, 'immediately/index.html'),
      },
    },
  },
})
