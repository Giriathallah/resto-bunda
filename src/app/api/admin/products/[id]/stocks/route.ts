// app/api/products/[productId]/stock/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Pastikan path ke prisma client Anda benar
import { z } from "zod";

// Skema validasi menggunakan Zod
const stockAdjustmentSchema = z.object({
  type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
  qty: z.number().int().positive("Kuantitas harus lebih dari 0"),
  note: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { productId: string } }
) {
  const { productId } = params;

  if (!productId) {
    return NextResponse.json(
      { error: "Product ID tidak ditemukan" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const validation = stockAdjustmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Input tidak valid", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { type, qty, note } = validation.data;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Ambil data produk saat ini
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error("Produk tidak ditemukan");
      }

      // 2. Hitung stok baru berdasarkan tipe penyesuaian
      let newStock: number;
      switch (type) {
        case "IN":
          newStock = product.stock + qty;
          break;
        case "OUT":
          newStock = product.stock - qty;
          break;
        case "ADJUSTMENT":
          newStock = qty;
          break;
      }

      if (newStock < 0) {
        throw new Error("Stok produk tidak boleh negatif");
      }

      // 3. Update stok produk
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { stock: newStock },
      });

      // 4. Catat pergerakan stok
      await tx.stockMovement.create({
        data: {
          productId,
          type,
          qty,
          note,
        },
      });

      return updatedProduct;
    });

    return NextResponse.json(
      { message: "Stok berhasil diperbarui", product: result },
      { status: 200 }
    );
  } catch (error: any) {
    // Menangani error spesifik dari dalam transaksi
    if (
      error.message === "Produk tidak ditemukan" ||
      error.message === "Stok produk tidak boleh negatif"
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Menangani error umum
    console.error("Gagal menyesuaikan stok:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
