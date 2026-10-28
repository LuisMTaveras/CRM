import 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    publica?: boolean;
    permiso?: string;
    permisoAlternativo?: string;
  }
}
