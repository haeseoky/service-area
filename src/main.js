import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'

const DEFAULT_TITLE = '고속도로 휴게소 정보 허브 🛣️'
const DEFAULT_DESCRIPTION = '전국 고속도로 휴게소 이벤트·브랜드·편의시설·날씨·교통량 종합 정보'

router.afterEach((to) => {
  const title = to.meta.title || DEFAULT_TITLE
  const description = to.meta.description || DEFAULT_DESCRIPTION
  
  document.title = title
  
  // meta description 업데이트
  let metaDescription = document.querySelector('meta[name="description"]')
  if (!metaDescription) {
    metaDescription = document.createElement('meta')
    metaDescription.setAttribute('name', 'description')
    document.head.appendChild(metaDescription)
  }
  metaDescription.setAttribute('content', description)
  
  // og:description도 함께 업데이트
  let ogDescription = document.querySelector('meta[property="og:description"]')
  if (ogDescription) {
    ogDescription.setAttribute('content', description)
  }
})

createApp(App).use(router).mount('#app')
