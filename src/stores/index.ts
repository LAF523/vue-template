import { createPinia } from 'pinia';

export default createPinia();

export { useUserGetters, useUserActions } from './user/useUserStore.ts';
