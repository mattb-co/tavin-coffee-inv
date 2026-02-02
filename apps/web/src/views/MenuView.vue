<template>
  <div>
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-stone-900">Menu</h1>
      <button
        type="button"
        @click="showAdd = true"
        class="rounded bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-900"
      >
        Add product
      </button>
    </div>

    <div class="mt-6 space-y-4">
      <div
        v-for="product in productStore.products"
        :key="product.id"
        class="rounded border border-stone-200 bg-white p-4"
      >
        <div class="flex items-start justify-between">
          <div>
            <h2 class="font-medium text-stone-900">{{ product.name }}</h2>
            <p class="text-sm text-stone-500">{{ product.sku }} · {{ product.isIced ? "Iced" : "Hot" }}</p>
            <p class="mt-1 text-sm text-stone-600">
              Cost per drink: {{ formatCost(productStore.costPerDrink(product)) }}
            </p>
          </div>
          <button
            type="button"
            @click="openRecipe(product)"
            class="text-sm text-stone-600 underline hover:text-stone-900"
          >
            Edit recipe
          </button>
        </div>
        <div v-if="product.recipeItems?.length" class="mt-2 text-sm text-stone-500">
          Recipe: {{ product.recipeItems.map((r) => `${r.ingredient?.name ?? "?"} ${r.quantity}${r.ingredient?.unit ?? ""}`).join(", ") }}
        </div>
      </div>
    </div>

    <!-- Recipe editor modal -->
    <div
      v-if="recipeModal.product"
      class="fixed inset-0 z-10 flex items-center justify-center bg-stone-900/50 overflow-y-auto py-8"
      @click.self="recipeModal.product = null"
    >
      <div class="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
        <h2 class="text-lg font-semibold text-stone-900">Recipe: {{ recipeModal.product.name }}</h2>
        <p class="mt-1 text-sm text-stone-600">Ingredients and quantity per drink</p>
        <div class="mt-4 space-y-3">
          <div
            v-for="(item, idx) in recipeModal.items"
            :key="idx"
            class="flex items-center gap-2"
          >
            <select
              v-model="item.ingredientId"
              class="flex-1 rounded border border-stone-300 px-3 py-2 text-sm text-stone-900"
            >
              <option value="">Select ingredient</option>
              <option
                v-for="ing in inventory.ingredients"
                :key="ing.id"
                :value="ing.id"
              >
                {{ ing.name }} ({{ ing.unit }})
              </option>
            </select>
            <input
              v-model.number="item.quantity"
              type="number"
              step="any"
              min="0"
              placeholder="Qty"
              class="w-24 rounded border border-stone-300 px-3 py-2 text-sm text-stone-900"
            />
            <button
              type="button"
              @click="recipeModal.items.splice(idx, 1)"
              class="text-stone-400 hover:text-red-600"
            >
              Remove
            </button>
          </div>
          <button
            type="button"
            @click="recipeModal.items.push({ ingredientId: '', quantity: 0 })"
            class="text-sm text-stone-600 underline"
          >
            + Add ingredient
          </button>
        </div>
        <p v-if="recipeError" class="mt-2 text-sm text-red-600">{{ recipeError }}</p>
        <div class="mt-6 flex gap-2">
          <button
            type="button"
            @click="saveRecipe"
            :disabled="recipeLoading"
            class="rounded bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-900 disabled:opacity-50"
          >
            Save recipe
          </button>
          <button
            type="button"
            @click="recipeModal.product = null"
            class="rounded border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Add product modal -->
    <div
      v-if="showAdd"
      class="fixed inset-0 z-10 flex items-center justify-center bg-stone-900/50"
      @click.self="showAdd = false"
    >
      <div class="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h2 class="text-lg font-semibold text-stone-900">Add product</h2>
        <form @submit.prevent="submitAdd" class="mt-4 space-y-4">
          <div>
            <label class="block text-sm font-medium text-stone-700">Name</label>
            <input
              v-model="addForm.name"
              type="text"
              required
              class="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-stone-900"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-stone-700">SKU</label>
            <input
              v-model="addForm.sku"
              type="text"
              required
              placeholder="e.g. LAT-HOT"
              class="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-stone-900"
            />
          </div>
          <div class="flex items-center gap-2">
            <input
              id="add-iced"
              v-model="addForm.isIced"
              type="checkbox"
              class="rounded border-stone-300"
            />
            <label for="add-iced" class="text-sm text-stone-700">Iced</label>
          </div>
          <p v-if="addError" class="text-sm text-red-600">{{ addError }}</p>
          <div class="flex gap-2">
            <button
              type="submit"
              :disabled="addLoading"
              class="flex-1 rounded bg-stone-800 py-2 text-sm font-medium text-white hover:bg-stone-900 disabled:opacity-50"
            >
              Add
            </button>
            <button
              type="button"
              @click="showAdd = false"
              class="rounded border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useProductStore } from "@/stores/productStore";
import { useInventoryStore } from "@/stores/inventoryStore";
import type { Product } from "@/stores/productStore";

const productStore = useProductStore();
const inventory = useInventoryStore();

const showAdd = ref(false);
const addForm = reactive({
  name: "",
  sku: "",
  isIced: false,
});
const addError = ref("");
const addLoading = ref(false);

const recipeModal = reactive<{
  product: Product | null;
  items: { ingredientId: string; quantity: number }[];
}>({
  product: null,
  items: [],
});
const recipeError = ref("");
const recipeLoading = ref(false);

function formatCost(c: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c);
}

onMounted(async () => {
  await Promise.all([productStore.fetchProducts(), inventory.fetchIngredients()]);
});

function openRecipe(product: Product) {
  recipeModal.product = product;
  recipeModal.items =
    product.recipeItems?.map((r) => ({
      ingredientId: r.ingredientId,
      quantity: r.quantity,
    })) ?? [];
  if (recipeModal.items.length === 0) {
    recipeModal.items.push({ ingredientId: "", quantity: 0 });
  }
  recipeError.value = "";
}

async function saveRecipe() {
  if (!recipeModal.product) return;
  const valid = recipeModal.items.filter(
    (i) => i.ingredientId && typeof i.quantity === "number" && i.quantity > 0
  );
  recipeError.value = "";
  recipeLoading.value = true;
  try {
    await productStore.setRecipe(recipeModal.product.id, valid);
    recipeModal.product = null;
  } catch (e) {
    recipeError.value = e instanceof Error ? e.message : "Failed";
  } finally {
    recipeLoading.value = false;
  }
}

async function submitAdd() {
  addError.value = "";
  addLoading.value = true;
  try {
    await productStore.createProduct({
      name: addForm.name,
      sku: addForm.sku,
      isIced: addForm.isIced,
    });
    showAdd.value = false;
    addForm.name = "";
    addForm.sku = "";
    addForm.isIced = false;
  } catch (e) {
    addError.value = e instanceof Error ? e.message : "Failed";
  } finally {
    addLoading.value = false;
  }
}
</script>
