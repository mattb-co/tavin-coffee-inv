export type SaleRecord = {
  productId: string;
  quantity: number;
  soldAt: string; // ISO date string
};

export type RecipeRecord = {
  productId: string;
  ingredientId: string;
  quantity: number;
};

export type IngredientRecord = {
  id: string;
  stockCurrent: number;
  reorderPoint: number;
};

export type DailyUsage = {
  date: string; // YYYY-MM-DD in shop timezone
  byIngredient: Record<string, number>;
  totalByIngredient: Record<string, number>; // cumulative up to this date (optional, or we compute client-side)
};

export type ForecastResult = {
  daily: DailyUsage[];
  totalUsageByIngredient: Record<string, number>;
  suggestedReorderDate: string | null;
  suggestedReorderQuantity: Record<string, number>;
};
