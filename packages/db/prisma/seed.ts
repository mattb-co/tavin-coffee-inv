import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const shop = await prisma.shop.upsert({
    where: { id: "seed-shop-1" },
    update: {},
    create: {
      id: "seed-shop-1",
      name: "Demo Coffee Shop",
      timezone: "America/New_York",
    },
  });

  const passwordHash = await bcrypt.hash("demo123", 10);
  await prisma.user.upsert({
    where: { email: "owner@demo.coffee" },
    update: {},
    create: {
      email: "owner@demo.coffee",
      passwordHash,
      role: "OWNER",
      shopId: shop.id,
    },
  });

  const ingredients = await Promise.all([
    prisma.ingredient.upsert({
      where: { id: "seed-ing-espresso" },
      update: {},
      create: {
        id: "seed-ing-espresso",
        shopId: shop.id,
        name: "Espresso beans",
        unit: "g",
        stockCurrent: 5000,
        reorderPoint: 1000,
        costPerUnit: 0.02,
      },
    }),
    prisma.ingredient.upsert({
      where: { id: "seed-ing-milk" },
      update: {},
      create: {
        id: "seed-ing-milk",
        shopId: shop.id,
        name: "Whole milk",
        unit: "ml",
        stockCurrent: 10000,
        reorderPoint: 2000,
        costPerUnit: 0.001,
      },
    }),
    prisma.ingredient.upsert({
      where: { id: "seed-ing-oat" },
      update: {},
      create: {
        id: "seed-ing-oat",
        shopId: shop.id,
        name: "Oat milk",
        unit: "ml",
        stockCurrent: 5000,
        reorderPoint: 1000,
        costPerUnit: 0.002,
      },
    }),
    prisma.ingredient.upsert({
      where: { id: "seed-ing-orange" },
      update: {},
      create: {
        id: "seed-ing-orange",
        shopId: shop.id,
        name: "Orange flavoring",
        unit: "ml",
        stockCurrent: 500,
        reorderPoint: 100,
        costPerUnit: 0.01,
      },
    }),
    prisma.ingredient.upsert({
      where: { id: "seed-ing-cardamom" },
      update: {},
      create: {
        id: "seed-ing-cardamom",
        shopId: shop.id,
        name: "Cardamom",
        unit: "g",
        stockCurrent: 200,
        reorderPoint: 50,
        costPerUnit: 0.05,
      },
    }),
  ]);

  const espresso = await prisma.product.upsert({
    where: { id: "seed-prod-espresso" },
    update: {},
    create: {
      id: "seed-prod-espresso",
      shopId: shop.id,
      name: "Espresso",
      sku: "ESP",
      isIced: false,
      isActive: true,
    },
  });
  const latte = await prisma.product.upsert({
    where: { id: "seed-prod-latte" },
    update: {},
    create: {
      id: "seed-prod-latte",
      shopId: shop.id,
      name: "Latte",
      sku: "LAT-HOT",
      isIced: false,
      isActive: true,
    },
  });
  const icedLatte = await prisma.product.upsert({
    where: { id: "seed-prod-iced-latte" },
    update: {},
    create: {
      id: "seed-prod-iced-latte",
      shopId: shop.id,
      name: "Iced latte",
      sku: "LAT-ICE",
      isIced: true,
      isActive: true,
    },
  });
  const foxtrot = await prisma.product.upsert({
    where: { id: "seed-prod-foxtrot" },
    update: {},
    create: {
      id: "seed-prod-foxtrot",
      shopId: shop.id,
      name: "Foxtrot",
      sku: "FOX",
      isIced: false,
      isActive: true,
    },
  });

  const ingEspresso = ingredients.find((i) => i.name === "Espresso beans")!;
  const ingMilk = ingredients.find((i) => i.name === "Whole milk")!;
  const ingOrange = ingredients.find((i) => i.name === "Orange flavoring")!;
  const ingCardamom = ingredients.find((i) => i.name === "Cardamom")!;

  await prisma.recipeItem.deleteMany({ where: { productId: espresso.id } });
  await prisma.recipeItem.create({
    data: { productId: espresso.id, ingredientId: ingEspresso.id, quantity: 18 },
  });

  await prisma.recipeItem.deleteMany({ where: { productId: latte.id } });
  await prisma.recipeItem.createMany({
    data: [
      { productId: latte.id, ingredientId: ingEspresso.id, quantity: 18 },
      { productId: latte.id, ingredientId: ingMilk.id, quantity: 200 },
    ],
  });

  await prisma.recipeItem.deleteMany({ where: { productId: icedLatte.id } });
  await prisma.recipeItem.createMany({
    data: [
      { productId: icedLatte.id, ingredientId: ingEspresso.id, quantity: 18 },
      { productId: icedLatte.id, ingredientId: ingMilk.id, quantity: 200 },
    ],
  });

  await prisma.recipeItem.deleteMany({ where: { productId: foxtrot.id } });
  await prisma.recipeItem.createMany({
    data: [
      { productId: foxtrot.id, ingredientId: ingEspresso.id, quantity: 18 },
      { productId: foxtrot.id, ingredientId: ingOrange.id, quantity: 15 },
      { productId: foxtrot.id, ingredientId: ingCardamom.id, quantity: 2 },
    ],
  });

  console.log("Seed complete: shop, owner (owner@demo.coffee / demo123), ingredients, products, Foxtrot recipe.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
