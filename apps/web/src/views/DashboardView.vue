<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-900">Dashboard</h1>
    <p class="mt-1 text-sm text-stone-600">{{ shopStore.shopName }}</p>

    <div class="mt-6 grid gap-6 md:grid-cols-2">
      <div class="rounded border border-stone-200 bg-white p-4">
        <h2 class="font-medium text-stone-900">Sales trend (7 days)</h2>
        <div class="mt-3 h-48">
          <canvas ref="salesChartEl"></canvas>
        </div>
      </div>
      <div class="rounded border border-stone-200 bg-white p-4">
        <h2 class="font-medium text-stone-900">Low stock</h2>
        <ul v-if="inventory.lowStockIngredients.length" class="mt-2 space-y-1 text-sm text-stone-700">
          <li v-for="i in inventory.lowStockIngredients" :key="i.id">
            {{ i.name }}: {{ i.stockCurrent }} {{ i.unit }} (reorder at {{ i.reorderPoint }})
          </li>
        </ul>
        <p v-else class="mt-2 text-sm text-stone-500">All ingredients above reorder point.</p>
      </div>
    </div>

    <div class="mt-6 grid gap-6 md:grid-cols-2">
      <div class="rounded border border-stone-200 bg-white p-4">
        <h2 class="font-medium text-stone-900">Today vs forecast (7-day)</h2>
        <p v-if="forecastData" class="mt-2 text-sm text-stone-600">
          Forecast total usage over next 7 days (by ingredient): see reorder suggestions below.
        </p>
        <p v-if="forecastData?.suggestedReorderDate" class="mt-2 text-sm text-amber-700">
          Suggested reorder date: {{ forecastData.suggestedReorderDate }}
        </p>
        <p v-else-if="forecastData" class="mt-2 text-sm text-stone-500">No reorder needed in forecast window.</p>
        <p v-else-if="forecastLoading" class="mt-2 text-sm text-stone-500">Loading forecast…</p>
        <p v-else class="mt-2 text-sm text-stone-500">Run seed and add sales to see forecast.</p>
      </div>
      <div class="rounded border border-stone-200 bg-white p-4">
        <h2 class="font-medium text-stone-900">Foxtrot (signature drink)</h2>
        <p class="mt-2 text-sm text-stone-600">
          Sales (last 7 days): <strong>{{ foxtrotSales }}</strong>
        </p>
        <p class="mt-1 text-sm text-stone-500">Highlight signature drink performance.</p>
      </div>
    </div>

    <div v-if="forecastData?.totalUsageByIngredient && Object.keys(forecastData.totalUsageByIngredient).length" class="mt-6 rounded border border-stone-200 bg-white p-4">
      <h2 class="font-medium text-stone-900">7-day forecast usage by ingredient</h2>
      <ul class="mt-2 space-y-1 text-sm text-stone-700">
        <li v-for="(qty, ingId) in forecastData.totalUsageByIngredient" :key="ingId">
          {{ ingredientName(ingId) }}: {{ qty.toFixed(1) }} (suggested reorder: {{ forecastData.suggestedReorderQuantity?.[ingId] ?? "—" }})
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { Chart, registerables } from "chart.js";
import { useInventoryStore } from "@/stores/inventoryStore";
import { useShopStore } from "@/stores/shopStore";
import { api } from "@/lib/api";

Chart.register(...registerables);

const shopStore = useShopStore();
const inventory = useInventoryStore();

const salesChartEl = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

const forecastData = ref<{
  daily: { date: string; byIngredient: Record<string, number> }[];
  totalUsageByIngredient: Record<string, number>;
  suggestedReorderDate: string | null;
  suggestedReorderQuantity: Record<string, number>;
} | null>(null);
const forecastLoading = ref(false);

const salesByDay = ref<{ date: string; total: number; foxtrot: number }[]>([]);

const foxtrotSales = computed(() => {
  return salesByDay.value.reduce((sum, d) => sum + d.foxtrot, 0);
});

function ingredientName(ingId: string): string {
  const ing = inventory.ingredients.find((i) => i.id === ingId);
  return ing?.name ?? ingId;
}

async function loadSalesTrend() {
  const today = new Date().toISOString().slice(0, 10);
  const from = new Date();
  from.setDate(from.getDate() - 6);
  const fromStr = from.toISOString().slice(0, 10);
  const data = await api<{ productId: string; product?: { name: string }; quantity: number; soldAt: string }[]>(
    `/api/sales?from=${fromStr}&to=${today}`
  );
  const byDate = new Map<string, { total: number; foxtrot: number }>();
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    byDate.set(dateStr, { total: 0, foxtrot: 0 });
  }
  for (const s of data) {
    const dateStr = s.soldAt.slice(0, 10);
    if (!byDate.has(dateStr)) byDate.set(dateStr, { total: 0, foxtrot: 0 });
    const row = byDate.get(dateStr)!;
    row.total += s.quantity;
    if (s.product?.name === "Foxtrot") row.foxtrot += s.quantity;
  }
  salesByDay.value = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, total: v.total, foxtrot: v.foxtrot }));
}

async function loadForecast() {
  forecastLoading.value = true;
  try {
    const data = await api<typeof forecastData.value>("/api/forecast?days=7");
    forecastData.value = data;
  } catch {
    forecastData.value = null;
  } finally {
    forecastLoading.value = false;
  }
}

function drawChart() {
  if (!salesChartEl.value || !salesByDay.value.length) return;
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(salesChartEl.value, {
    type: "bar",
    data: {
      labels: salesByDay.value.map((d) => d.date.slice(5)),
      datasets: [
        {
          label: "Total sales",
          data: salesByDay.value.map((d) => d.total),
          backgroundColor: "rgba(120, 113, 108, 0.6)",
          borderColor: "rgb(120, 113, 108)",
          borderWidth: 1,
        },
        {
          label: "Foxtrot",
          data: salesByDay.value.map((d) => d.foxtrot),
          backgroundColor: "rgba(180, 83, 9, 0.6)",
          borderColor: "rgb(180, 83, 9)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true },
      },
    },
  });
}

onMounted(async () => {
  await inventory.fetchIngredients();
  await loadSalesTrend();
  await loadForecast();
  drawChart();
});

watch(salesByDay, drawChart, { deep: true });
</script>
