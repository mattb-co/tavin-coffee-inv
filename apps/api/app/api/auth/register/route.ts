import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession, setSessionCookie } from "@/lib/auth";
import { Role } from "@coffee-inventory/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, shopName } = body as {
      email?: string;
      password?: string;
      shopName?: string;
    };
    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }
    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }
    let shop = await prisma.shop.findFirst();
    let role: Role = Role.STAFF;
    if (!shop) {
      shop = await prisma.shop.create({
        data: {
          name: typeof shopName === "string" && shopName.trim() ? shopName.trim() : "My Shop",
          timezone: "America/New_York",
        },
      });
      role = Role.OWNER;
    }
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        passwordHash,
        role,
        shopId: shop.id,
      },
    });
    const token = await createSession(user.id);
    await setSessionCookie(token);
    return NextResponse.json({
      user: { id: user.id, email: user.email, role: user.role, shopId: user.shopId },
    });
  } catch (e) {
    console.error("Register error:", e);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
