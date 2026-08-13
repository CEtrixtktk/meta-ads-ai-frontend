/**
 * Configuración de rutas de la SPA.
 * Define qué componente se muestra en cada URL, y protege las rutas privadas:
 * sin sesión, cualquier intento de entrar al dashboard te manda al login.
 */
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginView from '@/views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Al entrar a la raíz, redirigimos al dashboard (que a su vez exige login).
    { path: '/', redirect: '/dashboard' },

    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      // Carga diferida: el componente del dashboard se descarga solo cuando se
      // necesita, aligerando la carga inicial. Lo crearemos en el próximo paso.
      component: () => import('@/views/DashboardView.vue'),
      // Marca personalizada: esta ruta requiere autenticación.
      meta: { requiresAuth: true },
    },
  ],
})

/**
 * Guardia de navegación global: se ejecuta ANTES de entrar a cualquier ruta.
 * Es el portero de la SPA: si la ruta requiere auth y no hay sesión, redirige al login.
 */
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    // Sin sesión en ruta protegida: al login.
    return { name: 'login' }
  }
  // Si ya está logueado e intenta ir al login, lo mandamos al dashboard.
  if (to.name === 'login' && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
})

export default router