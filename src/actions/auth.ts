// actions/auth.ts
"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";
import { redirect } from "next/navigation";
import { signInSchema, signUpSchema } from "@/lib/schemas";
import {
  comparePasswords,
  generateSalt,
  hashPassword,
} from "@/lib/auth/passwordHasher";
import { cookies } from "next/headers";
import { createUserSession, removeUserFromSession } from "@/lib/auth/session";
import { OAuthProvider } from "@/generated/prisma";
import { getOAuthClient } from "@/lib/auth/oauth/base";
import { sendVerificationEmail } from "@/lib/email"; // Import fungsi pengiriman email
import { generateVerificationToken } from "@/lib/token"; // Akan kita buat nanti

type ActionResult = {
  error?: string;
};
export async function signIn(
  unsafeData: z.infer<typeof signInSchema>
): Promise<ActionResult> {
  try {
    const { success, data } = signInSchema.safeParse(unsafeData);
    if (!success) {
      return { error: "Data yang Anda masukkan tidak valid." };
    }

    const user = await prisma.user.findUnique({
      where: { email: data.email },
      select: {
        id: true,
        email: true,
        password: true,
        salt: true,
        role: true,
        emailVerified: true,
      },
    });

    // Pesan error umum untuk keamanan (mencegah user enumeration)
    const invalidCredentialsError = {
      error: "Email atau password yang Anda masukkan salah.",
    };

    if (!user || !user.password || !user.salt) {
      return invalidCredentialsError;
    }

    // Cek verifikasi email secara spesifik, karena ini bukan celah keamanan
    if (!user.emailVerified) {
      return {
        error:
          "Email Anda belum diverifikasi. Silakan periksa email Anda untuk tautan verifikasi.",
      };
    }

    const isCorrectPassword = await comparePasswords({
      hashedPassword: user.password,
      password: data.password,
      salt: user.salt,
    });

    if (!isCorrectPassword) {
      return invalidCredentialsError;
    }

    // Jika semua valid, buat sesi dan redirect
    await createUserSession(user, await cookies());
  } catch (error) {
    console.error("[SIGN_IN_ERROR]", error);
    return { error: "Terjadi kesalahan pada server. Silakan coba lagi." };
  }

  // Redirect harus dipanggil di luar try-catch
  redirect("/");
}

export async function signUp(unsafeData: z.infer<typeof signUpSchema>) {
  const { success, data } = signUpSchema.safeParse(unsafeData);

  if (!success)
    return "Data yang dimasukkan tidak valid. Silakan periksa kembali.";

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) return "Email ini sudah digunakan oleh akun lain.";

  try {
    const salt = generateSalt();
    const hashedPassword = await hashPassword(data.password, salt);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        salt: salt,
        role: "user",
        emailVerified: null,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    const verificationToken = await generateVerificationToken(user.id);
    await sendVerificationEmail({
      to: user.email,
      token: verificationToken.token,
    });

    return {
      message:
        "Akun Anda berhasil dibuat! Silakan periksa email Anda untuk memverifikasi akun Anda.",
    };
  } catch (error) {
    console.error("Sign up error:", error);
    return "Tidak dapat membuat akun. Silakan coba lagi.";
  }
}

export async function logOut() {
  const cookieStore = await cookies();
  await removeUserFromSession(cookieStore);

  cookieStore.delete("oAuthState");
  cookieStore.delete("oAuthCodeVerifier");

  redirect("/");
}

export async function oAuthSignIn(provider: OAuthProvider) {
  const oAuthClient = getOAuthClient(provider);
  redirect(oAuthClient.createAuthUrl(await cookies()));
}
