/**
 * Prisma seed entrypoint.
 *
 * Run via `npm run db:seed`. Idempotent — uses upsert on `slug` so re-running
 * doesn't create duplicates. Add new categories/products by importing from
 * `prisma/seed-data/*.ts` and calling `seedProducts(db, [...])`.
 */
import { PrismaClient, type Prisma } from "@prisma/client";
import { boots } from "./seed-data/boots";

const db = new PrismaClient();

type ProductSeed = Omit<Prisma.ProductCreateInput, "id" | "createdAt" | "updatedAt">;

async function seedProducts(items: ProductSeed[]) {
  for (const item of items) {
    await db.product.upsert({
      where: { slug: item.slug },
      create: item,
      update: {
        name: item.name,
        brand: item.brand,
        category: item.category,
        description: item.description,
        specs: item.specs,
        imageUrl: item.imageUrl,
        msrp: item.msrp,
      },
    });
  }
  console.log(`  seeded ${items.length} ${items[0]?.category ?? "products"}`);
}

async function main() {
  console.log("Seeding TrueKit catalog...");
  await seedProducts(boots);
  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
