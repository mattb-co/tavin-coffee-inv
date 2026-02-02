<template>
  <div>
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-stone-900">Inventory</h1>
      <button
        type="button"
        @click="showAdd = true"
        class="rounded bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-900"
      >
        Add ingredient
      </button>
    </div>

    <div v-if="inventory.lowStockIngredients.length" class="mt-4 rounded border border-amber-200 bg-amber-50 p-3">
      <p class="text-sm font-medium text-amber-800">Low stock (at or below reorder point)</p>
      <ul class="mt-1 list-inside list-disc text-sm text-amber-700">
        <li v-for="i in inventory.lowStockIngredients" :key="i.id">
          {{ i.name }}: {{ i.stockCurrent }} {{ i.unit }}
        </li>
      </ul>
    </div>

    <div class="mt-6 overflow-hidden rounded border border-stone-200 bg-white">
      <table class="min-w-full divide-y divide-stone-200">
        <thead class="bg-stone-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase text-stone-500">Name</th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase text-stone-500">Stock</th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase text-stone-500">Reorder at</th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase text-stone-500">Unit</th>
            <th class="px-4 py-3 text-right text-xs font-medium uppercase text-stone-500">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-200">
          <tr v-for="i in inventory.ingredients" :key="i.id" class="hover:bg-stone-50">
            <td class="px-4 py-3 text-sm font-medium text-stone-900">{{ i.name }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <div class="h-2 w-24 overflow-hidden rounded-full bg-stone-200">
                  <div
                    class="h-full rounded-full bg-stone-600"
                    :style="{ width: stockPercent(i) + '%' }"
                  />
                </div>
                <span class="text-sm text-stone-700">{{ i.stockCurrent }} {{ i.unit }}</span>
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-stone-600">{{ i.reorderPoint }} {{ i.unit }}</td>
            <td class="px-4 py-3 text-sm text-stone-600">{{ i.unit }}</td>
            <td class="px-4 py-3 text-right">
              <button
                type="button"
                @click="openAdjust(i)"
                class="text-sm text-stone-600 underline hover:text-stone-900"
              >
                Adjust
              </button>
              <button
                type="button"
                @click="openEdit(i)"
                class="ml-3 text-sm text-stone-600 underline hover:text-stone-900"
              >
                Edit
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Manual adjustment modal: uses POST /api/ingredients/:id/adjustments -->
    <div
      v-if="adjustModal.ingredient"
      class="fixed inset-0 z-10 flex items-center justify-center bg-stone-900/50"
      @click.self="adjustModal.ingredient = null"
    >
      <div class="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h2 class="text-lg font-semibold text-stone-900">Adjust stock</h2>
        <p class="mt-1 text-sm text-stone-600">{{ adjustModal.ingredient.name }} ({{ adjustModal.ingredient.unit }})</p>
        <form @submit.prevent="submitAdjust" class="mt-4 space-y-4">
          <div>
            <label for="adj-delta" class="block text-sm font-medium text-stone-700">Change (positive = add, negative = remove)</label>
            <input
              id="adj-delta"
              v-model.number="adjustModal.delta"
              type="number"
              step="any"
              required
              class="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-stone-900"
            />
          </div>
          <div>
            <label for="adj-reason" class="block text-sm font-medium text-stone-700">Reason</label>
            <select
              id="adj-reason"
              v-model="adjustModal.reason"
              class="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-stone-900"
            >
              <option value="waste">Waste</option>
              <option value="spill">Spill</option>
              <option value="correction">Correction</option>
              <option value="delivery">Delivery</option>
              <option value="other">Other</option>
            </select>
          </div>
          <p v-if="adjustError" class="text-sm text-red-600">{{ adjustError }}</p>
          <div class="flex gap-2">
            <button
              type="submit"
              :disabled="adjustLoading"
              class="flex-1 rounded bg-stone-800 py-2 text-sm font-medium text-white hover:bg-stone-900 disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              @click="adjustModal.ingredient = null"
              class="rounded border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit ingredient modal: PATCH for metadata only -->
    <div
      v-if="editModal.ingredient"
      class="fixed inset-0 z-10 flex items-center justify-center bg-stone-900/50"
      @click.self="editModal.ingredient = null"
    >
      <div class="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h2 class="text-lg font-semibold text-stone-900">Edit ingredient</h2>
        <form @submit.prevent="submitEdit" class="mt-4 space-y-4">
          <div>
            <label class="block text-sm font-medium text-stone-700">Name</label>
            <input
              v-model="editModal.name"
              type="text"
              required
              class="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-stone-900"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-stone-700">Unit</label>
            <input
              v-model="editModal.unit"
              type="text"
              required
              class="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-stone-900"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-stone-700">Reorder point</label>
            <input
              v-model.number="editModal.reorderPoint"
              type="number"
              step="any"
              min="0"
              class="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-stone-900"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-stone-700">Cost per unit</label>
            <input
              v-model.number="editModal.costPerUnit"
              type="number"
              step="any"
              min="0"
              class="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-stone-900"
            />
          </div>
          <p v-if="editError" class="text-sm text-red-600">{{ editError }}</p>
          <div class="flex gap-2">
            <button
              type="submit"
              :disabled="editLoading"
              class="flex-1 rounded bg-stone-800 py-2 text-sm font-medium text-white hover:bg-stone-900 disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              @click="editModal.ingredient = null"
              class="rounded border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Add ingredient modal -->
    <div
      v-if="showAdd"
      class="fixed inset-0 z-10 flex items-center justify-center bg-stone-900/50"
      @click.self="showAdd = false"
    >
      <div class="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h2 class="text-lg font-semibold text-stone-900">Add ingredient</h2>
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
            <label class="block text-sm font-medium text-stone-700">Unit</label>
            <input
              v-model="addForm.unit"
              type="text"
              required
              placeholder="e.g. ml, g, pcs"
              class="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-stone-900"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-stone-700">Initial stock</label>
            <input
              v-model.number="addForm.stockCurrent"
              type="number"
              step="any"
              min="0"
              class="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-stone-900"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-stone-700">Reorder point</label>
            <input
              v-model.number="addForm.reorderPoint"
              type="number"
              step="any"
              min="0"
              class="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-stone-900"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-stone-700">Cost per unit</label>
            <input
              v-model.number="addForm.costPerUnit"
              type="number"
              step="any"
              min="0"
              class="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-stone-900"
            />
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
import { ref, reactive, onMounted, computed } from "vue";
import { useInventoryStore } from "@/stores/inventoryStore";
import type { Ingredient } from "@/stores/inventoryStore";

const inventory = useInventoryStore();

const showAdd = ref(false);
const addForm = reactive({
  name: "",
  unit: "",
  stockCurrent: 0,
  reorderPoint: 0,
  costPerUnit: 0,
});
const addError = ref("");
const addLoading = ref(false);

const adjustModal = reactive<{
  ingredient: Ingredient | null;
  delta: number;
  reason: string;
}>({
  ingredient: null,
  delta: 0,
  reason: "waste",
});
const adjustError = ref("");
const adjustLoading = ref(false);

const editModal = reactive<{
  ingredient: Ingredient | null;
  name: string;
  unit: string;
  reorderPoint: number;
  costPerUnit: number;
}>({
  ingredient: null,
  name: "",
  unit: "",
  reorderPoint: 0,
  costPerUnit: 0,
});
const editError = ref("");
const editLoading = ref(false);

const maxStock = computed(() => {
  const list = inventory.ingredients;
  if (!list.length) return 1;
  return Math.max(...list.map((i) => i.stockCurrent), 1);
});

function stockPercent(i: Ingredient) {
  const m = maxStock.value;
  return m > 0 ? Math.min(100, (i.stockCurrent / m) * 100) : 0;
}

onMounted(() => inventory.fetchIngredients());

function openAdjust(i: Ingredient) {
  adjustModal.ingredient = i;
  adjustModal.delta = 0;
  adjustModal.reason = "waste";
  adjustError.value = "";
}

function openEdit(i: Ingredient) {
  editModal.ingredient = i;
  editModal.name = i.name;
  editModal.unit = i.unit;
  editModal.reorderPoint = i.reorderPoint;
  editModal.costPerUnit = i.costPerUnit;
  editError.value = "";
}

async function submitAdjust() {
  if (!adjustModal.ingredient) return;
  adjustError.value = "";
  adjustLoading.value = true;
  try {
    await inventory.addAdjustment(
      adjustModal.ingredient.id,
      adjustModal.delta,
      adjustModal.reason
    );
    adjustModal.ingredient = null;
  } catch (e) {
    adjustError.value = e instanceof Error ? e.message : "Failed";
  } finally {
    adjustLoading.value = false;
  }
}

async function submitEdit() {
  if (!editModal.ingredient) return;
  editError.value = "";
  editLoading.value = true;
  try {
    await inventory.updateIngredient(editModal.ingredient.id, {
      name: editModal.name,
      unit: editModal.unit,
      reorderPoint: editModal.reorderPoint,
      costPerUnit: editModal.costPerUnit,
    });
    editModal.ingredient = null;
  } catch (e) {
    editError.value = e instanceof Error ? e.message : "Failed";
  } finally {
    editLoading.value = false;
  }
}

async function submitAdd() {
  addError.value = "";
  addLoading.value = true;
  try {
    await inventory.createIngredient({
      name: addForm.name,
      unit: addForm.unit,
      stockCurrent: addForm.stockCurrent,
      reorderPoint: addForm.reorderPoint,
      costPerUnit: addForm.costPerUnit,
    });
    showAdd.value = false;
    addForm.name = "";
    addForm.unit = "";
    addForm.stockCurrent = 0;
    addForm.reorderPoint = 0;
    addForm.costPerUnit = 0;
  } catch (e) {
    addError.value = e instanceof Error ? e.message : "Failed";
  } finally {
    addLoading.value = false;
  }
}
</script>
