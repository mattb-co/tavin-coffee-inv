import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const shop = await prisma.shop.findUnique({
    where: { id: session.shopId },
  });
  if (!shop) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }
  return NextResponse.json(shop);
}
