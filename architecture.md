# ☕ Coffee Inventory MVP — End-to-End Architecture & Build Plan

## 0. High-level goals (lock these in)

* Web-only MVP (desktop + tablet friendly)
* Single shop, **multi-user**, shop-level data isolation
* Real-time inventory deduction (but forgiving math)
* Manual sales entry (POS integrations stubbed)
* Visual insights > operational complexity
* Cheap / free hosting (Vercel)
* Clean enough to pitch, fast enough to ship

---

## 1. Recommended Tech Stack (Vue-centric, MVP-friendly)

### Frontend

* **Vue 3**
* **Vite**
* **TypeScript**
* **Pinia** (state management)
* **Tailwind CSS** (fast, clean, responsive)
* **Chart.js or ECharts** (lightweight visual insights)

### Backend

* **Next.js (App Router)**

  * Use it *only* for API routes
  * Deployed on Vercel (free tier)

Why Next instead of a separate server?

* Free hosting
* API routes live with frontend
* Easy future auth & integrations

### Database

* **PostgreSQL**
* **Prisma ORM**
* Hosted via:

  * **Supabase (free tier)** or
  * **Neon** (serverless Postgres)

### Auth (simple prototype)

* **Email + password**
* Session via HTTP-only cookies
* No OAuth for MVP

---

## 2. System Architecture (mental model)

```
[ Vue Web App ]
     |
     | fetch()
     v
[ Next.js API Routes ]
     |
     | Prisma
     v
[ PostgreSQL ]
```

Future:

```
[ Square / Toast ]
        |
        v
[ POS Adapter Layer ]
```

---

## 3. Core Domain Models (Prisma schema)

This is the **heart of the app**.

### Shop & Users

```ts
Shop
- id
- name
- timezone
- createdAt

User
- id
- email
- passwordHash
- role (OWNER | STAFF)
- shopId
```

---

### Ingredients

```ts
Ingredient
- id
- shopId
- name            // "Whole Milk"
- unit            // ml, g, pcs
- stockCurrent
- reorderPoint
- costPerUnit
- updatedAt
```

Milk is separate by type → ✔️

---

### Products (Drinks)

```ts
Product
- id
- shopId
- name            // "Latte", "Foxtrot"
- sku             // LAT-HOT, FOX-ICE
- isIced
- isActive
```

---

### Recipes

```ts
RecipeItem
- id
- productId
- ingredientId
- quantity        // per drink
```

This enables:

> sales × recipe → inventory deduction

---

### Sales

```ts
Sale
- id
- shopId
- productId
- quantity
- soldAt
- source          // MANUAL | POS
```

Manual now, POS later.

---

### Inventory Adjustments (manual waste, corrections)

```ts
InventoryAdjustment
- id
- ingredientId
- delta           // -500 ml milk
- reason          // waste, spill, correction
- createdAt
```

---

## 4. Inventory Logic (Real-Time but Forgiving)

### When a sale is recorded:

1. Look up product recipe
2. For each ingredient:

   ```
   stockCurrent -= recipe.quantity × sale.quantity
   ```
3. Write adjustment log

No batching. No background jobs. Simple + transparent.

---

## 5. Forecasting Engine (MVP Version)

### Day-of-week aware average

For each ingredient:

```
For upcoming Monday:
  avg(Mondays from last N weeks) × recipe usage
```

Fallback if not enough data:

* Use last 7-day rolling average

### Outputs:

* 7-day forecast
* 30-day forecast
* Suggested reorder date
* Suggested reorder quantity

No ML. No overfitting. Investors love this.

---

## 6. API Design (Cursor-ready)

### Inventory

```
GET    /api/ingredients
POST   /api/ingredients
PATCH  /api/ingredients/:id
```

### Products & Recipes

```
GET    /api/products
POST   /api/products
POST   /api/products/:id/recipe
```

### Sales

```
POST   /api/sales
GET    /api/sales?from=&to=
```

### Forecasting

```
GET /api/forecast?days=7
GET /api/forecast?days=30
```

### POS Placeholder

```ts
// /lib/posAdapters/square.ts
export async function fetchSalesFromSquare() {
  throw new Error("Square integration not implemented")
}
```

---

## 7. Frontend Pages (Minimal but Polished)

### `/dashboard`

* Today vs forecast
* Low stock alerts
* Sales trend (7 days)
* Foxtrot performance highlight

### `/inventory`

* Ingredient list
* Stock bars
* Reorder warnings
* Manual adjustment modal

### `/menu`

* Products
* Recipe editor
* Cost per drink (nice pitch feature)

### `/sales`

* Manual sales entry (bulk form)
* Daily breakdown

### `/settings`

* Shop info
* Users
* POS integration (disabled UI)

---

## 8. State Management (Pinia)

Global stores:

* `useAuthStore`
* `useShopStore`
* `useInventoryStore`
* `useSalesStore`

Keep derived values computed in-store (not components).

---

## 9. Hosting & Environment

### Vercel

* Frontend + API
* Environment vars:

  * DATABASE_URL
  * SESSION_SECRET

### Free-tier friendly

* No cron jobs
* No queues
* No background workers

---

## 10. Build Order (Very Important)

**Phase 1 — Skeleton**

1. Repo setup (Vue + Next + Prisma)
2. Auth + shop isolation
3. Ingredient CRUD

**Phase 2 — Core Value**
4. Products + recipes
5. Manual sales entry
6. Real-time inventory deduction

**Phase 3 — Intelligence**
7. Forecasting logic
8. Dashboard charts
9. Low-stock alerts

**Phase 4 — Polish**
10. POS placeholders
11. Seed data (Foxtrot demo)
12. Pitch-ready UI cleanup

---

## 11. What This MVP Is Optimized For

✅ Works in a real coffee shop
✅ Easy to explain to investors
✅ Extendable to multi-location SaaS
✅ Not embarrassing to show
✅ Actually useful day 1

