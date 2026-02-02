import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SaleSource } from "@coffee-inventory/db";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from || !to) {
    return NextResponse.json({ error: "Query params from and to required (ISO date)" }, { status: 400 });
  }
  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return NextResponse.json({ error: "Invalid from or to date" }, { status: 400 });
  }
  const sales = await prisma.sale.findMany({
    where: {
      shopId: session.shopId,
      soldAt: { gte: fromDate, lte: toDate },
    },
    include: { product: true },
    orderBy: { soldAt: "asc" },
  });
  return NextResponse.json(sales);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const { productId, quantity, source, soldAt } = body as {
    productId?: string;
    quantity?: number;
    source?: string;
    soldAt?: string;
  };
  if (!productId || typeof productId !== "string" || !productId.trim()) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }
  if (typeof quantity !== "number" || quantity < 1) {
    return NextResponse.json({ error: "quantity must be a positive number" }, { status: 400 });
  }
  const product = await prisma.product.findFirst({
    where: { id: productId, shopId: session.shopId },
    include: { recipeItems: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  if (product.recipeItems.length === 0) {
    return NextResponse.json({ error: "Product has no recipe" }, { status: 400 });
  }
  const soldAtDate = soldAt ? new Date(soldAt) : new Date();
  if (Number.isNaN(soldAtDate.getTime())) {
    return NextResponse.json({ error: "Invalid soldAt date" }, { status: 400 });
  }
  const saleSource = source === "POS" ? SaleSource.POS : SaleSource.MANUAL;

  let lowStockWarning = false;

  const created = await prisma.$transaction(async (tx) => {
    for (const item of product.recipeItems) {
      const deduct = item.quantity * quantity;
      const ingredient = await tx.ingredient.findUnique({
        where: { id: item.ingredientId },
      });
      if (!ingredient) continue;
      if (ingredient.shopId !== session.shopId) continue;
      const newStock = ingredient.stockCurrent - deduct;
      if (newStock < 0) lowStockWarning = true;
      await tx.ingredient.update({
        where: { id: item.ingredientId },
        data: { stockCurrent: newStock },
      });
      await tx.inventoryAdjustment.create({
        data: {
          ingredientId: item.ingredientId,
          delta: -deduct,
          reason: "sale",
        },
      });
    }
    const sale = await tx.sale.create({
      data: {
        shopId: session.shopId,
        productId: product.id,
        quantity,
        soldAt: soldAtDate,
        source: saleSource,
      },
    });
    return tx.sale.findUnique({
      where: { id: sale.id },
      include: { product: true },
    });
  });

  return NextResponse.json(
    { sale: created, lowStockWarning: lowStockWarning || undefined },
    { status: 201 }
  );
}
