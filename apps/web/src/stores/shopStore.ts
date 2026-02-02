import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { api } from "@/lib/api";

export type Shop = {
  id: string;
  name: string;
  timezone: string;
  createdAt: string;
};

export const useShopStore = defineStore("shop", () => {
  const shop = ref<Shop | null>(null);

  const shopName = computed(() => shop.value?.name ?? "");
  const timezone = computed(() => shop.value?.timezone ?? "America/New_York");

  async function fetchShop() {
    try {
      const data = await api<Shop>("/api/shop");
      shop.value = data;
    } catch {
      shop.value = null;
    }
  }

  return { shop, shopName, timezone, fetchShop };
});
