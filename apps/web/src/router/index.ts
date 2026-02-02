import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", name: "Login", component: () => import("@/views/LoginView.vue"), meta: { public: true } },
    {
      path: "/",
      component: () => import("@/layouts/AppLayout.vue"),
      meta: { requiresAuth: true },
      children: [
        { path: "", redirect: "/dashboard" },
        { path: "dashboard", name: "Dashboard", component: () => import("@/views/DashboardView.vue") },
        { path: "inventory", name: "Inventory", component: () => import("@/views/InventoryView.vue") },
        { path: "menu", name: "Menu", component: () => import("@/views/MenuView.vue") },
        { path: "sales", name: "Sales", component: () => import("@/views/SalesView.vue") },
        { path: "settings", name: "Settings", component: () => import("@/views/SettingsView.vue") },
      ],
    },
  ],
});

router.beforeEach(async (to, _from, next) => {
  if (to.meta.public) return next();
  const { useAuthStore } = await import("@/stores/authStore");
  const auth = useAuthStore();
  if (!auth.checked) await auth.fetchUser();
  if (!auth.isAuthenticated) {
    next({ path: "/login", query: { redirect: to.fullPath } });
  } else {
    next();
  }
});

export default router;
