import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { api } from "@/lib/api";

export type User = {
  id: string;
  email: string;
  role: string;
  shopId: string;
};

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const checked = ref(false);

  const isAuthenticated = computed(() => !!user.value);

  async function fetchUser() {
    try {
      const data = await api<{ user: User }>("/api/auth/me");
      user.value = data.user;
    } catch {
      user.value = null;
    } finally {
      checked.value = true;
    }
  }

  async function login(email: string, password: string) {
    const data = await api<{ user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    user.value = data.user;
  }

  async function register(email: string, password: string, shopName?: string) {
    const data = await api<{ user: User }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, shopName }),
    });
    user.value = data.user;
  }

  async function logout() {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } finally {
      user.value = null;
    }
  }

  return { user, checked, isAuthenticated, fetchUser, login, register, logout };
});
