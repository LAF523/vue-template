import { computed } from 'vue';
import { piniaUserStore } from './index';

export const useUserGetters = () => {
  const store = piniaUserStore();

  const getUserState = computed(() => store.userState);

  return {
    getUserState
  };
};

export const useUserActions = () => {
  const { setUserState } = piniaUserStore();

  return {
    setUserState
  };
};
