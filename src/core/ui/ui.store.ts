import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUiStore = defineStore('ui', () => {
  const menuMovilAbierto = ref(false);

  const abrirMenuMovil = () => {
    menuMovilAbierto.value = true;
  };

  const cerrarMenuMovil = () => {
    menuMovilAbierto.value = false;
  };

  const alternarMenuMovil = () => {
    menuMovilAbierto.value = !menuMovilAbierto.value;
  };

  return {
    menuMovilAbierto,
    abrirMenuMovil,
    cerrarMenuMovil,
    alternarMenuMovil,
  };
});
