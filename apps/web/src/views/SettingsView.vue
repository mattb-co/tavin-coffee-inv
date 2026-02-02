<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-900">Settings</h1>
    <p class="mt-2 text-stone-600">Shop info, users, and POS integrations.</p>

    <section class="mt-6 rounded border border-stone-200 bg-white p-4">
      <h2 class="font-medium text-stone-900">Shop info</h2>
      <dl class="mt-3 space-y-2 text-sm">
        <div>
          <dt class="text-stone-500">Name</dt>
          <dd class="font-medium text-stone-900">{{ shopStore.shopName || "—" }}</dd>
        </div>
        <div>
          <dt class="text-stone-500">Timezone</dt>
          <dd class="font-medium text-stone-900">{{ shopStore.timezone }}</dd>
        </div>
      </dl>
      <!-- TODO: add PATCH /api/shop for editing name and timezone (future enhancement) -->
    </section>

    <section class="mt-6 rounded border border-stone-200 bg-white p-4">
      <h2 class="font-medium text-stone-900">Users</h2>
      <p class="mt-2 text-sm text-stone-500">Team members with access to this shop.</p>
      <p class="mt-2 text-sm text-stone-400">Placeholder — TODO: add GET /api/users and invite flow for multi-user.</p>
    </section>

    <section class="mt-6 rounded border border-stone-200 bg-white p-4">
      <h2 class="font-medium text-stone-900">POS integrations</h2>
      <p class="mt-2 text-sm text-stone-500">Connect your point-of-sale to sync sales automatically.</p>
      <ul class="mt-3 space-y-2">
        <li class="flex items-center justify-between rounded border border-stone-100 px-3 py-2">
          <span class="font-medium text-stone-700">Square</span>
          <span class="rounded bg-stone-100 px-2 py-1 text-xs text-stone-600">Coming Soon</span>
        </li>
        <li class="flex items-center justify-between rounded border border-stone-100 px-3 py-2">
          <span class="font-medium text-stone-700">Toast</span>
          <span class="rounded bg-stone-100 px-2 py-1 text-xs text-stone-600">Coming Soon</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useShopStore } from "@/stores/shopStore";

const shopStore = useShopStore();

onMounted(() => {
  if (!shopStore.shop) shopStore.fetchShop();
});
</script>
