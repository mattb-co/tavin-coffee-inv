import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { api } from "@/lib/api";

export type Sale = {
  id: string;
  shopId: string;
  productId: string;
  quantity: number;
  soldAt: string;
  source: string;
  product?: { id: string; name: string };
};

export const useSalesStore = defineStore("sales", () => {
  const sales = ref<Sale[]>([]);
  const from = ref<string>("");
  const to = ref<string>("");

  const totalQuantity = computed(() =>
    sales.value.reduce((sum, s) => sum + s.quantity, 0)
  );

  const byProduct = computed(() => {
    const map: Record<string, { name: string; quantity: number }> = {};
    for (const s of sales.value) {
      const key = s.productId;
      if (!map[key]) {
        map[key] = { name: s.product?.name ?? "Unknown", quantity: 0 };
      }
      map[key].quantity += s.quantity;
    }
    return Object.values(map);
  });

  async function fetchSales(fromDate: string, toDate: string) {
    from.value = fromDate;
    to.value = toDate;
    const data = await api<Sale[]>(`/api/sales?from=${fromDate}&to=${toDate}`);
    sales.value = data;
  }

  async function submitSale(productId: string, quantity: number, soldAt?: string) {
    const res = await api<{ sale: Sale; lowStockWarning?: boolean }>("/api/sales", {
      method: "POST",
      body: JSON.stringify({
        productId,
        quantity,
        source: "MANUAL",
        ...(soldAt && { soldAt }),
      }),
    });
    return res;
  }

  return { sales, from, to, totalQuantity, byProduct, fetchSales, submitSale };
});
