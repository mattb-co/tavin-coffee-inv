<template>
  <div class="flex min-h-screen items-center justify-center bg-stone-100">
    <div class="w-full max-w-sm rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
      <h1 class="text-xl font-semibold text-stone-900">Sign in</h1>
      <form @submit.prevent="submit" class="mt-4 space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-stone-700">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            class="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-stone-900"
          />
        </div>
        <div>
          <label for="password" class="block text-sm font-medium text-stone-700">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            class="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-stone-900"
          />
        </div>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded bg-stone-800 py-2 text-sm font-medium text-white hover:bg-stone-900 disabled:opacity-50"
        >
          {{ loading ? "Signing in…" : "Sign in" }}
        </button>
      </form>
      <p class="mt-4 text-center text-sm text-stone-500">
        No account?
        <button type="button" @click="showRegister = true" class="text-stone-700 underline">
          Register
        </button>
      </p>
      <div v-if="showRegister" class="mt-4 border-t border-stone-200 pt-4">
        <h2 class="text-sm font-semibold text-stone-800">Register</h2>
        <form @submit.prevent="doRegister" class="mt-2 space-y-2">
          <input
            v-model="regEmail"
            type="email"
            placeholder="Email"
            required
            class="w-full rounded border border-stone-300 px-3 py-2 text-sm text-stone-900"
          />
          <input
            v-model="regPassword"
            type="password"
            placeholder="Password"
            required
            class="w-full rounded border border-stone-300 px-3 py-2 text-sm text-stone-900"
          />
          <input
            v-model="regShopName"
            type="text"
            placeholder="Shop name (optional)"
            class="w-full rounded border border-stone-300 px-3 py-2 text-sm text-stone-900"
          />
          <p v-if="regError" class="text-sm text-red-600">{{ regError }}</p>
          <button
            type="submit"
            :disabled="regLoading"
            class="w-full rounded bg-stone-600 py-2 text-sm text-white hover:bg-stone-700 disabled:opacity-50"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const router = useRouter();
const auth = useAuthStore();

const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

const showRegister = ref(false);
const regEmail = ref("");
const regPassword = ref("");
const regShopName = ref("");
const regError = ref("");
const regLoading = ref(false);

async function submit() {
  error.value = "";
  loading.value = true;
  try {
    await auth.login(email.value, password.value);
    router.push("/");
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Sign in failed";
  } finally {
    loading.value = false;
  }
}

async function doRegister() {
  regError.value = "";
  regLoading.value = true;
  try {
    await auth.register(regEmail.value, regPassword.value, regShopName.value || undefined);
    router.push("/");
  } catch (e) {
    regError.value = e instanceof Error ? e.message : "Registration failed";
  } finally {
    regLoading.value = false;
  }
}
</script>
