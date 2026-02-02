import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id: ingredientId } = await params;
  const ingredient = await prisma.ingredient.findFirst({
    where: { id: ingredientId, shopId: session.shopId },
  });
  if (!ingredient) {
    return NextResponse.json({ error: "Ingredient not found" }, { status: 404 });
  }
  const body = await request.json().catch(() => ({}));
  const { delta, reason } = body as { delta?: number; reason?: string };
  if (typeof delta !== "number") {
    return NextResponse.json({ error: "delta (number) required" }, { status: 400 });
  }
  if (!reason || typeof reason !== "string" || !reason.trim()) {
    return NextResponse.json({ error: "reason required" }, { status: 400 });
  }
  const newStock = ingredient.stockCurrent + delta;
  const [updated, adjustment] = await prisma.$transaction([
    prisma.ingredient.update({
      where: { id: ingredientId },
      data: { stockCurrent: newStock },
    }),
    prisma.inventoryAdjustment.create({
      data: {
        ingredientId,
        delta,
        reason: reason.trim(),
      },
    }),
  ]);
  return NextResponse.json({ ingredient: updated, adjustment });
}
