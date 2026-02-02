import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { forecast } from "lib/forecasting";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const daysParam = searchParams.get("days");
  const days = daysParam === "30" ? 30 : 7;

  const [shop, ingredients, recipeItems, sales] = await Promise.all([
    prisma.shop.findUnique({ where: { id: session.shopId } }),
    prisma.ingredient.findMany({
      where: { shopId: session.shopId },
      select: { id: true, stockCurrent: true, reorderPoint: true },
    }),
    prisma.recipeItem.findMany({
      where: { product: { shopId: session.shopId } },
      select: { productId: true, ingredientId: true, quantity: true },
    }),
    prisma.sale.findMany({
      where: { shopId: session.shopId },
      select: { productId: true, quantity: true, soldAt: true },
    }),
  ]);

  if (!shop) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }

  const timezone = shop.timezone;
  const result = forecast({
    sales: sales.map((s) => ({
      productId: s.productId,
      quantity: s.quantity,
      soldAt: s.soldAt.toISOString(),
    })),
    recipes: recipeItems.map((r) => ({
      productId: r.productId,
      ingredientId: r.ingredientId,
      quantity: r.quantity,
    })),
    ingredients: ingredients.map((i) => ({
      id: i.id,
      stockCurrent: i.stockCurrent,
      reorderPoint: i.reorderPoint,
    })),
    timezone,
    days,
  });

  return NextResponse.json(result);
}
