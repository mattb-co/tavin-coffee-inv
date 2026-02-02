import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const ingredients = await prisma.ingredient.findMany({
    where: { shopId: session.shopId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(ingredients);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const { name, unit, stockCurrent, reorderPoint, costPerUnit } = body as {
    name?: string;
    unit?: string;
    stockCurrent?: number;
    reorderPoint?: number;
    costPerUnit?: number;
  };
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }
  if (!unit || typeof unit !== "string" || !unit.trim()) {
    return NextResponse.json({ error: "Unit required" }, { status: 400 });
  }
  const ingredient = await prisma.ingredient.create({
    data: {
      shopId: session.shopId,
      name: name.trim(),
      unit: unit.trim(),
      stockCurrent: typeof stockCurrent === "number" ? stockCurrent : 0,
      reorderPoint: typeof reorderPoint === "number" ? reorderPoint : 0,
      costPerUnit: typeof costPerUnit === "number" ? costPerUnit : 0,
    },
  });
  return NextResponse.json(ingredient);
}
