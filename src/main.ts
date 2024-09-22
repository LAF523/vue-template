import { createApp } from 'vue';
import App from './App.vue';
import pinia from './stores/index.ts';
import router from '@/routes/index.ts';
import './styles/rest.css';

const app = createApp(App);
app.use(router);
app.use(pinia);
app.mount('#app');
