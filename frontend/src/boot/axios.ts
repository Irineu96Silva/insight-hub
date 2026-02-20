import { boot } from 'quasar/wrappers';
import axios, { type AxiosInstance } from 'axios';
import { Notify } from 'quasar';
import { useAuthStore } from 'src/stores/auth.store';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default boot..." function below (which runs individually
// for each client)
// Função para determinar a URL da API dinamicamente
const getApiUrl = () => {
  // Se houver uma variável de ambiente definida, usa ela (útil para prod)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Se estiver no browser, usa o hostname atual com a porta 3000
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:3000/api`;
  }

  // Fallback padrão
  return 'http://localhost:3000/api';
};

const api = axios.create({ baseURL: getApiUrl() });

// Auto-unwrap: o backend envelopa respostas em { success, data, timestamp }
// Este interceptor extrai o payload real para que os services recebam os dados diretamente
api.interceptors.response.use((response) => {
  if (response.data && response.data.success !== undefined && response.data.data !== undefined) {
    response.data = response.data.data;
  }
  return response;
});

export default boot(({ app, router }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api

  app.config.globalProperties.$axios = axios;
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  app.config.globalProperties.$api = api;
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API

  const authStore = useAuthStore();

  api.interceptors.request.use((config) => {
    const token = authStore.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;
      
      if (status === 401) {
        authStore.logout();
        router.push('/auth/login');
        Notify.create({
          type: 'warning',
          message: 'Sessão expirada. Por favor, faça login novamente.'
        });
      } else if (status === 403) {
        Notify.create({
           type: 'negative',
           message: 'Acesso negado. Você não tem permissão para realizar esta ação.'
        });
      } else if (status >= 500) {
        Notify.create({
          type: 'negative',
          message: 'Erro no servidor. Tente novamente mais tarde.'
        });
      } else if (!status) {
         Notify.create({
            type: 'negative',
            message: 'Erro de conexão. Verifique sua internet.'
         });
      }

      return Promise.reject(error);
    }
  );
});

export { api };
