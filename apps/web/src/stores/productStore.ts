import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { api } from "@/lib/api";

export type RecipeItem = {
  id: string;
  productId: string;
  ingredientId: string;
  quantity: number;
  ingredient?: { id: string; name: string; unit: string; costPerUnit: number };
};

export type Product = {
  id: string;
  shopId: string;
  name: string;
  sku: string;
  isIced: boolean;
  isActive: boolean;
  recipeItems: RecipeItem[];
};

export const useProductStore = defineStore("product", () => {
  const products = ref<Product[]>([]);

  const activeProducts = computed(() => products.value.filter((p) => p.isActive));

  function costPerDrink(product: Product): number {
    if (!product.recipeItems?.length) return 0;
    return product.recipeItems.reduce((sum, item) => {
      const cost = (item.ingredient?.costPerUnit ?? 0) * item.quantity;
      return sum + cost;
    }, 0);
  }

  async function fetchProducts() {
    const data = await api<Product[]>("/api/products");
    products.value = data;
  }

  async function createProduct(body: {
    name: string;
    sku: string;
    isIced?: boolean;
    isActive?: boolean;
  }) {
    const created = await api<Product>("/api/products", {
      method: "POST",
      body: JSON.stringify(body),
    });
    products.value = [...products.value, created];
    return created;
  }

  async function setRecipe(productId: string, items: { ingredientId: string; quantity: number }[]) {
    const updated = await api<Product>(`/api/products/${productId}/recipe`, {
      method: "POST",
      body: JSON.stringify(items),
    });
    products.value = products.value.map((p) => (p.id === productId ? updated : p));
    return updated;
  }

  return {
    products,
    activeProducts,
    costPerDrink,
    fetchProducts,
    createProduct,
    setRecipe,
  };
});
