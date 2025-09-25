// prisma/seed.ts
import {
  PrismaClient,
  Category,
  UserRole,
  OrderStatus,
  DiningType,
  PaymentMethod,
} from "@/generated/prisma";
import { hashPassword, generateSalt } from "@/lib/auth/passwordHasher";

const prisma = new PrismaClient();

// Helper functions
function subDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log("Seeding database...");

  // 1. Seed Admin User
  const adminSalt = generateSalt();
  const adminPassword = await hashPassword("asdasdasd", adminSalt);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@gmail.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@gmail.com",
      password: adminPassword,
      salt: adminSalt,
      role: UserRole.admin,
      emailVerified: new Date(),
    },
  });
  console.log(`✅ Admin user created/updated: ${adminUser.email}`);

  // 2. Seed Customer Users
  const CUSTOMERS = [
    { name: "Andi Wijaya", email: "andi.wijaya@example.com" },
    { name: "Budi Santoso", email: "budi.santoso@example.com" },
    { name: "Citra Lestari", email: "citra.lestari@example.com" },
    { name: "Dewi Anggraini", email: "dewi.anggraini@example.com" },
    { name: "Eko Prasetyo", email: "eko.prasetyo@example.com" },
  ];

  console.log("Seeding customer users...");
  for (const customer of CUSTOMERS) {
    const salt = generateSalt();
    const password = await hashPassword("asdasdasd", salt);
    await prisma.user.upsert({
      where: { email: customer.email },
      update: {},
      create: {
        ...customer,
        password,
        salt,
        role: UserRole.user,
        emailVerified: new Date(),
      },
    });
  }
  console.log(`✅ ${CUSTOMERS.length} customer users seeded.`);

  // 3. Seed Products
  const MENU_ITEMS = [
    {
      name: "Caesar Salad",
      category: Category.APPETIZER,
      price: 45000,
      imageUrl:
        "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&auto=format&fit=crop",
      stock: 20,
    },
    {
      name: "Grilled Salmon",
      category: Category.MAIN,
      price: 89000,
      imageUrl:
        "https://images.unsplash.com/photo-1604908176997-3bb3f1b3a3ff?w=600&auto=format&fit=crop",
      stock: 15,
    },
    {
      name: "Margherita Pizza",
      category: Category.MAIN,
      price: 65000,
      imageUrl:
        "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&auto=format&fit=crop",
      stock: 30,
    },
    {
      name: "Iced Coffee",
      category: Category.DRINK,
      price: 25000,
      imageUrl:
        "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&auto=format&fit=crop",
      stock: 50,
    },
    {
      name: "Fruit Smoothie",
      category: Category.DRINK,
      price: 30000,
      imageUrl:
        "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&auto=format&fit=crop",
      stock: 25,
    },
    {
      name: "Nasi Goreng Spesial",
      category: Category.MAIN,
      price: 55000,
      imageUrl:
        "https://images.unsplash.com/photo-1598515598522-25b4b830d937?w=600&auto=format&fit=crop",
      stock: 40,
    },
    {
      name: "Lemon Tea",
      category: Category.DRINK,
      price: 20000,
      imageUrl:
        "https://images.unsplash.com/photo-1575488433146-2d5dcf5b28c3?w=600&auto=format&fit=crop",
      stock: 60,
    },
  ] as const;

  const names = MENU_ITEMS.map((m) => m.name);
  const existing = await prisma.product.findMany({
    where: { name: { in: names } },
    select: { name: true },
  });
  const existingSet = new Set(existing.map((e) => e.name));
  const toCreate = MENU_ITEMS.filter((m) => !existingSet.has(m.name));

  if (toCreate.length === 0) {
    console.log("ℹ️ All menu items already exist.");
  } else {
    await prisma.product.createMany({
      data: toCreate.map((m) => ({ ...m, isActive: true })),
    });
    console.log(`✅ Products seeded: ${toCreate.length}`);
  }

  // 4. Seed Diverse Sales Data
  console.log("Seeding sales data...");
  const existingOrdersCount = await prisma.order.count();
  if (existingOrdersCount > 0) {
    console.log("ℹ️ Orders already exist. Skipping sales data seeding.");
  } else {
    const customers = await prisma.user.findMany({
      where: { role: UserRole.user },
    });
    const products = await prisma.product.findMany({
      where: { isActive: true },
    });
    if (customers.length === 0 || products.length === 0) {
      console.warn("⚠️ Cannot seed orders without customers or products.");
      return;
    }

    let orderCount = 0;
    const DAYS_TO_SEED = 30;

    for (let i = 0; i < DAYS_TO_SEED; i++) {
      const date = subDays(new Date(), i);
      const ordersPerDay = getRandomNumber(2, 10);

      for (let j = 0; j < ordersPerDay; j++) {
        const customer = getRandomElement(customers);
        const itemsToOrder = Array.from({ length: getRandomNumber(1, 4) }, () =>
          getRandomElement(products)
        );

        const orderItems = itemsToOrder.map((product) => {
          const qty = getRandomNumber(1, 2);
          return {
            productId: product.id,
            qty,
            price: product.price,
            total: product.price * qty,
          };
        });

        const subtotal = orderItems.reduce((acc, item) => acc + item.total, 0);
        const tax = Math.round(subtotal * 0.11);
        const total = subtotal + tax;

        // 80% chance to be PAID, 10% CANCELLED, 10% other
        const randomStatus = Math.random();
        let status: OrderStatus;
        if (randomStatus < 0.8) status = OrderStatus.PAID;
        else if (randomStatus < 0.9) status = OrderStatus.CANCELLED;
        else status = OrderStatus.AWAITING_PAYMENT;

        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
        const orderCode = `ORD-${dateStr}-${String(1000 + orderCount)}`;
        const queueNumber = String(j + 1);

        await prisma.order.create({
          data: {
            code: orderCode,
            queueNumber,
            serviceDate: date,
            createdAt: date,
            status,
            diningType: getRandomElement([
              DiningType.DINE_IN,
              DiningType.TAKE_AWAY,
            ]),
            subtotal,
            tax,
            total,
            customerId: customer.id,
            items: { create: orderItems },
            payments:
              status === OrderStatus.PAID
                ? {
                    create: {
                      method: getRandomElement([
                        PaymentMethod.CASH,
                        PaymentMethod.QRIS,
                        PaymentMethod.CARD,
                      ]),
                      amount: total,
                      paidAt: date,
                    },
                  }
                : undefined,
          },
        });
        orderCount++;
      }
    }
    console.log(`✅ Seeded ${orderCount} orders over ${DAYS_TO_SEED} days.`);
  }

  console.log("🎉 Seeding complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
