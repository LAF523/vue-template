import HomeView from '@/pages/home/index.vue';

const routes = [
  { path: '/', component: HomeView },
  { path: '/about', component: () => import('@/pages/page1/index.vue') }
];

export default routes;
