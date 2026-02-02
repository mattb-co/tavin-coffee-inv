import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const products = await prisma.product.findMany({
    where: { shopId: session.shopId },
    include: { recipeItems: { include: { ingredient: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const { name, sku, isIced, isActive } = body as {
    name?: string;
    sku?: string;
    isIced?: boolean;
    isActive?: boolean;
  };
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }
  if (!sku || typeof sku !== "string" || !sku.trim()) {
    return NextResponse.json({ error: "SKU required" }, { status: 400 });
  }
  const product = await prisma.product.create({
    data: {
      shopId: session.shopId,
      name: name.trim(),
      sku: sku.trim(),
      isIced: !!isIced,
      isActive: typeof isActive === "boolean" ? isActive : true,
    },
  });
  return NextResponse.json(product);
}
