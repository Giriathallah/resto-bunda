import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { json, error, parsePagination } from "@/lib/http";
import { productCreateSchema, CategoryEnum } from "@/lib/validators/product";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const category = searchParams.get("category");
  const active = searchParams.get("active");
  const sort = searchParams.get("sort") ?? "createdAt_desc";
  const { skip, take, page, perPage } = parsePagination(searchParams);

  const where: any = {};
  if (q) where.name = { contains: q, mode: "insensitive" };
  if (category && CategoryEnum.options.includes(category as any))
    where.category = category;
  if (active === "true") where.isActive = true;
  if (active === "false") where.isActive = false;

  const orderBy =
    sort === "name_asc"
      ? { name: "asc" }
      : sort === "name_desc"
      ? { name: "desc" }
      : sort === "price_asc"
      ? { price: "asc" }
      : sort === "price_desc"
      ? { price: "desc" }
      : { createdAt: "desc" };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        id: true,
        name: true,
        price: true,
        category: true,
        stock: true,
        isActive: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.product.count({ where }),
  ]);

  return json({ items, page, perPage, total });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parse = productCreateSchema.safeParse({
    ...body,

    price: typeof body?.price === "string" ? Number(body.price) : body?.price,
    stock: typeof body?.stock === "string" ? Number(body.stock) : body?.stock,
  });
  if (!parse.success)
    return error("Invalid payload", 422, { issues: parse.error.flatten() });

  const data = parse.data;
  const created = await prisma.product.create({
    data: {
      name: data.name,
      price: data.price,
      category: data.category,
      stock: data.stock ?? 0,
      isActive: data.isActive ?? true,
      imageUrl: data.imageUrl || null,
    },
    select: { id: true },
  });
  return json({ id: created.id }, 201);
}
