import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RecipeItemInput = { ingredientId: string; quantity: number };

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id: productId } = await params;
  const product = await prisma.product.findFirst({
    where: { id: productId, shopId: session.shopId },
    include: { recipeItems: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  const body = await request.json().catch(() => ({}));
  const items = body as RecipeItemInput[] | unknown;
  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "Body must be array of { ingredientId, quantity }" }, { status: 400 });
  }
  for (const item of items) {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof (item as RecipeItemInput).ingredientId !== "string" ||
      typeof (item as RecipeItemInput).quantity !== "number"
    ) {
      return NextResponse.json(
        { error: "Each item must have ingredientId (string) and quantity (number)" },
        { status: 400 }
      );
    }
  }
  const ingredientIds = items.map((i) => (i as RecipeItemInput).ingredientId);
  const ingredients = await prisma.ingredient.findMany({
    where: { id: { in: ingredientIds }, shopId: session.shopId },
  });
  if (ingredients.length !== ingredientIds.length) {
    return NextResponse.json({ error: "All ingredients must belong to your shop" }, { status: 400 });
  }
  await prisma.$transaction([
    prisma.recipeItem.deleteMany({ where: { productId } }),
    ...items.map((item: RecipeItemInput) =>
      prisma.recipeItem.create({
        data: {
          productId,
          ingredientId: item.ingredientId,
          quantity: item.quantity,
        },
      })
    ),
  ]);
  const updated = await prisma.product.findUnique({
    where: { id: productId },
    include: { recipeItems: { include: { ingredient: true } } },
  });
  return NextResponse.json(updated);
}
