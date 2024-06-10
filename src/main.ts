import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import pinia from './stores/index.ts';
import router from '@/routes/index.ts';

const app = createApp(App);
app.use(router);
app.use(pinia);
app.mount('#app');
