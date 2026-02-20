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
      redirect: '/solo/base-stats',
    },
    {
      path: '/solo/base-stats',
      name: 'solo-base-stats',
      component: () => import('@/components/SoloQuiz.vue'),
      meta: { quizMode: 'base-stat', vgc: false },
    },
    {
      path: '/solo/learnset',
      name: 'solo-learnset',
      component: () => import('@/components/SoloQuiz.vue'),
      meta: { quizMode: 'learnset', vgc: false },
    },
    {
      path: '/solo/damage',
      name: 'solo-damage',
      component: () => import('@/components/SoloQuiz.vue'),
      meta: { quizMode: 'damage', vgc: false },
    },
    {
      path: '/solo/damage/vgc',
      name: 'solo-damage-vgc',
      component: () => import('@/components/SoloQuiz.vue'),
      meta: { quizMode: 'damage', vgc: true },
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
