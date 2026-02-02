<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-900">Sales</h1>
    <p class="mt-1 text-sm text-stone-600">Manual daily sales entry</p>

    <div class="mt-6 rounded border border-stone-200 bg-white p-4">
      <h2 class="font-medium text-stone-900">Record sale</h2>
      <form @submit.prevent="submitSale" class="mt-3 flex flex-wrap items-end gap-4">
        <div>
          <label class="block text-sm font-medium text-stone-700">Product</label>
          <select
            v-model="saleForm.productId"
            required
            class="mt-1 rounded border border-stone-300 px-3 py-2 text-stone-900"
          >
            <option value="">Select product</option>
            <option
              v-for="p in productStore.activeProducts"
              :key="p.id"
              :value="p.id"
            >
              {{ p.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-stone-700">Quantity</label>
          <input
            v-model.number="saleForm.quantity"
            type="number"
            min="1"
            required
            class="mt-1 w-24 rounded border border-stone-300 px-3 py-2 text-stone-900"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-stone-700">Date (optional)</label>
          <input
            v-model="saleForm.soldAt"
            type="date"
            class="mt-1 rounded border border-stone-300 px-3 py-2 text-stone-900"
          />
        </div>
        <button
          type="submit"
          :disabled="saleLoading"
          class="rounded bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-900 disabled:opacity-50"
        >
          Record sale
        </button>
      </form>
      <p v-if="saleError" class="mt-2 text-sm text-red-600">{{ saleError }}</p>
      <p v-if="saleSuccess" class="mt-2 text-sm text-green-600">{{ saleSuccess }}</p>
      <p v-if="lowStockWarning" class="mt-2 text-sm text-amber-600">One or more ingredients are below reorder point.</p>
    </div>

    <div class="mt-6 rounded border border-stone-200 bg-white p-4">
      <h2 class="font-medium text-stone-900">Sales by date range</h2>
      <form @submit.prevent="loadSales" class="mt-3 flex flex-wrap items-end gap-4">
        <div>
          <label class="block text-sm font-medium text-stone-700">From</label>
          <input
            v-model="rangeFrom"
            type="date"
            required
            class="mt-1 rounded border border-stone-300 px-3 py-2 text-stone-900"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-stone-700">To</label>
          <input
            v-model="rangeTo"
            type="date"
            required
            class="mt-1 rounded border border-stone-300 px-3 py-2 text-stone-900"
          />
        </div>
        <button
          type="submit"
          class="rounded border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          Load
        </button>
      </form>
      <div v-if="salesStore.sales.length" class="mt-4">
        <p class="text-sm text-stone-600">Total quantity: {{ salesStore.totalQuantity }}</p>
        <table class="mt-2 min-w-full divide-y divide-stone-200 text-sm">
          <thead>
            <tr>
              <th class="text-left font-medium text-stone-700">Product</th>
              <th class="text-right font-medium text-stone-700">Quantity</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            <tr v-for="row in salesStore.byProduct" :key="row.name">
              <td class="py-1 text-stone-900">{{ row.name }}</td>
              <td class="py-1 text-right text-stone-700">{{ row.quantity }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useProductStore } from "@/stores/productStore";
import { useSalesStore } from "@/stores/salesStore";

const productStore = useProductStore();
const salesStore = useSalesStore();

const saleForm = reactive({
  productId: "",
  quantity: 1,
  soldAt: "",
});
const saleError = ref("");
const saleSuccess = ref("");
const saleLoading = ref(false);
const lowStockWarning = ref(false);

const rangeFrom = ref("");
const rangeTo = ref("");

onMounted(() => {
  productStore.fetchProducts();
  const today = new Date().toISOString().slice(0, 10);
  rangeFrom.value = today;
  rangeTo.value = today;
  loadSales();
});

async function submitSale() {
  saleError.value = "";
  saleSuccess.value = "";
  lowStockWarning.value = false;
  saleLoading.value = true;
  try {
    const res = await salesStore.submitSale(
      saleForm.productId,
      saleForm.quantity,
      saleForm.soldAt || undefined
    );
    saleSuccess.value = `Recorded ${saleForm.quantity} sale(s).`;
    saleForm.quantity = 1;
    if (res.lowStockWarning) lowStockWarning.value = true;
    if (rangeFrom.value && rangeTo.value) {
      await salesStore.fetchSales(rangeFrom.value, rangeTo.value);
    }
  } catch (e) {
    saleError.value = e instanceof Error ? e.message : "Failed";
  } finally {
    saleLoading.value = false;
  }
}

async function loadSales() {
  if (!rangeFrom.value || !rangeTo.value) return;
  await salesStore.fetchSales(rangeFrom.value, rangeTo.value);
}
</script>
