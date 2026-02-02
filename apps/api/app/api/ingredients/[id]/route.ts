import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getIngredient(id: string, shopId: string) {
  const ingredient = await prisma.ingredient.findFirst({
    where: { id, shopId },
  });
  return ingredient;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await params;
  const ingredient = await getIngredient(id, session.shopId);
  if (!ingredient) {
    return NextResponse.json({ error: "Ingredient not found" }, { status: 404 });
  }
  const body = await request.json().catch(() => ({}));
  const { name, unit, stockCurrent, reorderPoint, costPerUnit } = body as {
    name?: string;
    unit?: string;
    stockCurrent?: number;
    reorderPoint?: number;
    costPerUnit?: number;
  };
  const data: Record<string, unknown> = {};
  if (typeof name === "string" && name.trim()) data.name = name.trim();
  if (typeof unit === "string" && unit.trim()) data.unit = unit.trim();
  if (typeof stockCurrent === "number") data.stockCurrent = stockCurrent;
  if (typeof reorderPoint === "number") data.reorderPoint = reorderPoint;
  if (typeof costPerUnit === "number") data.costPerUnit = costPerUnit;
  const updated = await prisma.ingredient.update({
    where: { id },
    data,
  });
  return NextResponse.json(updated);
}
