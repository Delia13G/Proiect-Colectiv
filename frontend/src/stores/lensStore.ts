import { defineStore } from 'pinia';

export const useLensStore = defineStore('lens', {
  state: () => ({
    activeLens: 'SOCIAL'
  }),
  actions: {
    setLens(lensName: string) {
      this.activeLens = lensName;
    }
  }
});