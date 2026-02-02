import type { SaleRecord, RecipeRecord, IngredientRecord } from "./types";
import {
  dateInTimezone,
  weekdayInTimezone,
  todayInTimezone,
  addDays,
} from "./dayOfWeek";

/**
 * Compute average quantity sold per product per weekday (in shop timezone).
 * Returns map: productId -> weekday (0-6) -> average daily quantity.
 */
function avgByProductAndWeekday(
  sales: SaleRecord[],
  timezone: string
): Map<string, Map<number, number>> {
  // Group by (productId, dateInTZ) -> total quantity that day
  const dailyByProduct = new Map<string, Map<string, number>>();
  for (const s of sales) {
    const date = dateInTimezone(new Date(s.soldAt), timezone);
    const key = s.productId;
    if (!dailyByProduct.has(key)) dailyByProduct.set(key, new Map());
    const dayMap = dailyByProduct.get(key)!;
    dayMap.set(date, (dayMap.get(date) ?? 0) + s.quantity);
  }
  // For each product, group by weekday and average
  const out = new Map<string, Map<number, number>>();
  for (const [productId, dayMap] of dailyByProduct) {
    const byWeekday = new Map<number, number[]>();
    for (const [dateStr, qty] of dayMap) {
      const d = new Date(dateStr + "T12:00:00Z");
      const wd = weekdayInTimezone(d, timezone);
      if (!byWeekday.has(wd)) byWeekday.set(wd, []);
      byWeekday.get(wd)!.push(qty);
    }
    const avgByWd = new Map<number, number>();
    for (const [wd, qtys] of byWeekday) {
      const avg = qtys.reduce((a, b) => a + b, 0) / qtys.length;
      avgByWd.set(wd, avg);
    }
    out.set(productId, avgByWd);
  }
  return out;
}

/**
 * Fallback: last 7 days average per product (in shop timezone).
 */
function last7DayAvg(sales: SaleRecord[], timezone: string): Map<string, number> {
  const productTotals = new Map<string, number>();
  const productDays = new Map<string, Set<string>>();
  const today = todayInTimezone(timezone);
  const sevenDaysAgo = addDays(today, -7);
  for (const s of sales) {
    const date = dateInTimezone(new Date(s.soldAt), timezone);
    if (date < sevenDaysAgo || date >= today) continue;
    const key = s.productId;
    productTotals.set(key, (productTotals.get(key) ?? 0) + s.quantity);
    if (!productDays.has(key)) productDays.set(key, new Set());
    productDays.get(key)!.add(date);
  }
  const avg = new Map<string, number>();
  for (const [productId, total] of productTotals) {
    const days = productDays.get(productId)!.size;
    avg.set(productId, days > 0 ? total / days : 0);
  }
  return avg;
}

/**
 * Build product -> ingredient -> quantity (per drink) from recipe records.
 */
function recipeMap(recipes: RecipeRecord[]): Map<string, Map<string, number>> {
  const out = new Map<string, Map<string, number>>();
  for (const r of recipes) {
    if (!out.has(r.productId)) out.set(r.productId, new Map());
    out.get(r.productId)!.set(r.ingredientId, r.quantity);
  }
  return out;
}

export type ForecastInput = {
  sales: SaleRecord[];
  recipes: RecipeRecord[];
  ingredients: IngredientRecord[];
  timezone: string;
  days: 7 | 30;
};

export type DailyUsageEntry = {
  date: string;
  byIngredient: Record<string, number>;
};

export type ForecastOutput = {
  daily: DailyUsageEntry[];
  totalUsageByIngredient: Record<string, number>;
  suggestedReorderDate: string | null;
  suggestedReorderQuantity: Record<string, number>;
};

/**
 * Forecast ingredient usage for the next `days` days using shop timezone.
 * Day-of-week aware; fallback to last 7-day average when insufficient history.
 */
export function forecast(input: ForecastInput): ForecastOutput {
  const { sales, recipes, ingredients, timezone, days } = input;
  const avgByProductWeekday = avgByProductAndWeekday(sales, timezone);
  const fallbackAvg = last7DayAvg(sales, timezone);
  const productToIngredient = recipeMap(recipes);
  const ingredientIds = new Set(ingredients.map((i) => i.id));
  const today = todayInTimezone(timezone);

  const daily: DailyUsageEntry[] = [];
  const totalUsageByIngredient: Record<string, number> = {};
  for (const id of ingredientIds) totalUsageByIngredient[id] = 0;

  for (let i = 0; i < days; i++) {
    const date = addDays(today, i);
    const d = new Date(date + "T12:00:00Z");
    const wd = weekdayInTimezone(d, timezone);

    const byIngredient: Record<string, number> = {};
    for (const id of ingredientIds) byIngredient[id] = 0;

    for (const [productId, ingMap] of productToIngredient) {
      const avgMap = avgByProductWeekday.get(productId);
      let qty: number;
      if (avgMap?.has(wd)) {
        qty = avgMap.get(wd)!;
      } else {
        qty = fallbackAvg.get(productId) ?? 0;
      }
      for (const [ingredientId, perDrink] of ingMap) {
        if (!ingredientIds.has(ingredientId)) continue;
        byIngredient[ingredientId] = (byIngredient[ingredientId] ?? 0) + qty * perDrink;
      }
    }

    daily.push({ date, byIngredient });
    for (const id of ingredientIds) {
      totalUsageByIngredient[id] = (totalUsageByIngredient[id] ?? 0) + (byIngredient[id] ?? 0);
    }
  }

  // Suggested reorder: first date when any ingredient would go below reorder point
  const ingById = new Map(ingredients.map((i) => [i.id, i]));
  let suggestedReorderDate: string | null = null;
  const suggestedReorderQuantity: Record<string, number> = {};

  const runningStock: Record<string, number> = {};
  for (const ing of ingredients) runningStock[ing.id] = ing.stockCurrent;

  for (const day of daily) {
    for (const id of ingredientIds) {
      runningStock[id] = (runningStock[id] ?? 0) - (day.byIngredient[id] ?? 0);
      const ing = ingById.get(id);
      if (ing && runningStock[id] <= ing.reorderPoint && !suggestedReorderDate) {
        suggestedReorderDate = day.date;
      }
    }
  }

  for (const ing of ingredients) {
    const total = totalUsageByIngredient[ing.id] ?? 0;
    const current = ing.stockCurrent;
    if (total > 0 && current < total) {
      suggestedReorderQuantity[ing.id] = Math.max(ing.reorderPoint, Math.ceil(total - current));
    } else if (ing.reorderPoint > 0) {
      suggestedReorderQuantity[ing.id] = Math.max(0, Math.ceil(ing.reorderPoint - (runningStock[ing.id] ?? 0)));
    }
  }

  return {
    daily,
    totalUsageByIngredient,
    suggestedReorderDate,
    suggestedReorderQuantity,
  };
}
