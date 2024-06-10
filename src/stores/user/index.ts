import { defineStore } from 'pinia';
import { ref } from 'vue';
import { userType } from './type.ts';

export const piniaUserStore = defineStore('user', () => {
  const userState = ref<userType>({
    name: 'ppp',
    age: 10,
    address: 'ppp'
  });

  const setUserState = (user: any) => {
    userState.value = user;
  };

  return {
    userState,
    setUserState
  };
});
