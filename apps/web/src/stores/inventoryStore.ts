import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { api } from "@/lib/api";

export type Ingredient = {
  id: string;
  shopId: string;
  name: string;
  unit: string;
  stockCurrent: number;
  reorderPoint: number;
  costPerUnit: number;
  updatedAt?: string;
};

export const useInventoryStore = defineStore("inventory", () => {
  const ingredients = ref<Ingredient[]>([]);

  const lowStockIngredients = computed(() =>
    ingredients.value.filter((i) => i.stockCurrent <= i.reorderPoint)
  );

  async function fetchIngredients() {
    const data = await api<Ingredient[]>("/api/ingredients");
    ingredients.value = data;
  }

  async function createIngredient(body: {
    name: string;
    unit: string;
    stockCurrent?: number;
    reorderPoint?: number;
    costPerUnit?: number;
  }) {
    const created = await api<Ingredient>("/api/ingredients", {
      method: "POST",
      body: JSON.stringify(body),
    });
    ingredients.value = [...ingredients.value, created];
    return created;
  }

  async function updateIngredient(
    id: string,
    body: Partial<Pick<Ingredient, "name" | "unit" | "stockCurrent" | "reorderPoint" | "costPerUnit">>
  ) {
    const updated = await api<Ingredient>(`/api/ingredients/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    ingredients.value = ingredients.value.map((i) => (i.id === id ? updated : i));
    return updated;
  }

  async function addAdjustment(ingredientId: string, delta: number, reason: string) {
    const res = await api<{ ingredient: Ingredient }>(
      `/api/ingredients/${ingredientId}/adjustments`,
      {
        method: "POST",
        body: JSON.stringify({ delta, reason }),
      }
    );
    ingredients.value = ingredients.value.map((i) =>
      i.id === ingredientId ? res.ingredient : i
    );
    return res.ingredient;
  }

  return {
    ingredients,
    lowStockIngredients,
    fetchIngredients,
    createIngredient,
    updateIngredient,
    addAdjustment,
  };
});
