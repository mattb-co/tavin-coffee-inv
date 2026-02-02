<template>
  <div class="flex min-h-screen">
    <aside class="w-56 border-r border-stone-200 bg-amber-50 p-4">
      <nav class="space-y-1">
        <router-link
          v-for="link in navLinks"
          :key="link.path"
          :to="link.path"
          class="block rounded px-3 py-2 text-sm text-stone-600 hover:bg-stone-100"
          active-class="bg-amber-600 font-medium text-amber-50"
        >
          {{ link.label }}
        </router-link>
      </nav>
      <div class="mt-4 border-t border-stone-200 pt-4">
        <p class="truncate px-3 text-xs text-stone-500">{{ auth.user?.email }}</p>
        <button
          type="button"
          @click="logout"
          class="mt-2 w-full rounded px-3 py-2 text-left text-sm text-stone-600 hover:bg-stone-100"
        >
          Sign out
        </button>
      </div>
    </aside>
    <main class="flex-1 p-6">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { useShopStore } from "@/stores/shopStore";

const router = useRouter();
const auth = useAuthStore();
const shop = useShopStore();

onMounted(() => {
  if (auth.isAuthenticated && !shop.shop) shop.fetchShop();
});

const navLinks = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/inventory", label: "Inventory" },
  { path: "/menu", label: "Menu" },
  { path: "/sales", label: "Sales" },
  { path: "/settings", label: "Settings" },
];

async function logout() {
  await auth.logout();
  router.push("/login");
}
</script>
