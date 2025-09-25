// src/app/api/auth/change-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromSession } from "@/lib/auth/session-edge";
import {
  comparePasswords,
  generateSalt,
  hashPassword,
} from "@/lib/auth/passwordHasher";
import { changePasswordSchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession(request.cookies);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = changePasswordSchema.safeParse(body); // Validasi menggunakan skema yang diimpor

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Data tidak valid",
          details: validation.error.flatten().fieldErrors, // Menggunakan flatten untuk error yang lebih rapi
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validation.data;

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        password: true,
        salt: true,
      },
    });

    if (!dbUser || !dbUser.password || !dbUser.salt) {
      return NextResponse.json(
        { error: "User tidak ditemukan atau tidak memiliki password" },
        { status: 404 }
      );
    }

    const isCurrentPasswordValid = await comparePasswords({
      hashedPassword: dbUser.password,
      password: currentPassword,
      salt: dbUser.salt,
    });

    if (!isCurrentPasswordValid) {
      // Memberikan pesan error yang lebih spesifik untuk field tertentu
      return NextResponse.json(
        { error: "Password saat ini salah", path: "currentPassword" },
        { status: 400 }
      );
    }

    const isSamePassword = await comparePasswords({
      hashedPassword: dbUser.password,
      password: newPassword,
      salt: dbUser.salt,
    });

    if (isSamePassword) {
      // Memberikan pesan error yang lebih spesifik untuk field tertentu
      return NextResponse.json(
        {
          error: "Password baru harus berbeda dari password saat ini",
          path: "newPassword",
        },
        { status: 400 }
      );
    }

    const newSalt = generateSalt();
    const hashedNewPassword = await hashPassword(newPassword, newSalt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedNewPassword,
        salt: newSalt,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Password berhasil diubah",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
