import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/components/ModeSelection.vue'),
    },
    {
      path: '/solo',
      name: 'solo',
      component: () => import('@/components/SoloQuiz.vue'),
    },
    {
      path: '/vs',
      name: 'vs',
      component: () => import('@/components/VsMode.vue'),
    },
    {
      path: '/vs/:roomCode',
      name: 'vs-room',
      component: () => import('@/components/VsMode.vue'),
      props: true,
    },
  ],
})

export default router
