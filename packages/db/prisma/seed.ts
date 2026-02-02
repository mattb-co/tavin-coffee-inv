import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env from repo root
config({ path: resolve(__dirname, "../../../.env") });

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

  // Generate sales data for the past 30 days
  console.log("Generating sales data for the past 30 days...");
  
  const now = new Date();
  const salesData: Array<{ productId: string; quantity: number; soldAt: Date; shopId: string; source: string }> = [];

  // Product IDs for easy reference
  const products = [
    { id: espresso.id, name: "Espresso", weight: 15 }, // Less popular
    { id: latte.id, name: "Latte", weight: 40 }, // Most popular
    { id: icedLatte.id, name: "Iced latte", weight: 35 }, // Very popular
    { id: foxtrot.id, name: "Foxtrot", weight: 10 }, // Signature specialty
  ];

  // Generate sales for each of the past 30 days
  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(0, 0, 0, 0);
    
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Base sales multiplier (weekends are busier)
    const dayMultiplier = isWeekend ? 1.4 : 1.0;
    
    // Slight upward trend over 30 days (business growing)
    const trendMultiplier = 0.85 + (daysAgo / 29) * 0.3; // 0.85 to 1.15
    
    // Generate sales throughout the day
    const openingHours = [
      { hour: 7, weight: 1.5 }, // Early morning rush
      { hour: 8, weight: 2.5 }, // Peak morning
      { hour: 9, weight: 2.0 }, // Morning continues
      { hour: 10, weight: 1.2 }, // Mid-morning
      { hour: 11, weight: 1.0 }, // Late morning
      { hour: 12, weight: 1.3 }, // Lunch
      { hour: 13, weight: 1.1 }, // After lunch
      { hour: 14, weight: 1.4 }, // Afternoon pick-me-up
      { hour: 15, weight: 1.6 }, // Afternoon rush
      { hour: 16, weight: 1.2 }, // Late afternoon
      { hour: 17, weight: 0.8 }, // Evening wind down
    ];

    for (const timeSlot of openingHours) {
      const baseOrdersThisHour = 8; // Base orders per hour
      const ordersThisHour = Math.round(
        baseOrdersThisHour * timeSlot.weight * dayMultiplier * trendMultiplier
      );

      for (let order = 0; order < ordersThisHour; order++) {
        // Weighted random product selection
        const totalWeight = products.reduce((sum, p) => sum + p.weight, 0);
        let random = Math.random() * totalWeight;
        let selectedProduct = products[0];
        
        for (const product of products) {
          random -= product.weight;
          if (random <= 0) {
            selectedProduct = product;
            break;
          }
        }

        // Random time within the hour
        const saleTime = new Date(date);
        saleTime.setHours(timeSlot.hour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));

        // Quantity (usually 1, occasionally 2-3 for groups)
        const quantity = Math.random() < 0.85 ? 1 : Math.random() < 0.7 ? 2 : 3;

        salesData.push({
          productId: selectedProduct.id,
          quantity,
          soldAt: saleTime,
          shopId: shop.id,
          source: "MANUAL",
        });
      }
    }
  }

  // Add some random variation - occasional slow/busy days
  const totalDays = 30;
  for (let i = 0; i < 5; i++) {
    const randomDay = Math.floor(Math.random() * totalDays);
    const extraSales = Math.floor(Math.random() * 20) + 10;
    const date = new Date(now);
    date.setDate(date.getDate() - randomDay);
    
    for (let j = 0; j < extraSales; j++) {
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      const saleTime = new Date(date);
      saleTime.setHours(8 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 60));
      
      salesData.push({
        productId: randomProduct.id,
        quantity: 1,
        soldAt: saleTime,
        shopId: shop.id,
        source: "MANUAL",
      });
    }
  }

  // Sort sales by date
  salesData.sort((a, b) => a.soldAt.getTime() - b.soldAt.getTime());

  // Delete existing sales for this shop to avoid duplicates
  await prisma.sale.deleteMany({ where: { shopId: shop.id } });

  // Batch insert sales (in chunks to avoid memory issues)
  const chunkSize = 500;
  for (let i = 0; i < salesData.length; i += chunkSize) {
    const chunk = salesData.slice(i, i + chunkSize);
    await prisma.sale.createMany({ data: chunk });
  }

  console.log(`Created ${salesData.length} sales records over the past 30 days`);
  
  // Summary by product
  const salesByProduct = salesData.reduce((acc, sale) => {
    const product = products.find((p) => p.id === sale.productId)!;
    acc[product.name] = (acc[product.name] || 0) + sale.quantity;
    return acc;
  }, {} as Record<string, number>);
  
  console.log("\nSales summary by product:");
  Object.entries(salesByProduct).forEach(([name, count]) => {
    console.log(`  ${name}: ${count} units`);
  });

  console.log("\nSeed complete: shop, owner (owner@demo.coffee / demo123), ingredients, products, recipes, and 30 days of sales data.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
