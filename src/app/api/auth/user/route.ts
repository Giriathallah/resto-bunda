import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Verify user session
    const userSession = await getCurrentUser({ withFullUser: true });
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user data from database
    const user = await prisma.user.findUnique({
      where: { email: userSession.email },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Format response data
    const profileData = {
      username: user.name || user.email.split("@")[0],
      name: user.name,
      avatar: user.avatarUrl,
      email: user.email,
    };

    const response = NextResponse.json(profileData);

    // Add caching headers (5 minutes)
    response.headers.set(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate"
    );

    return response;
  } catch (error) {
    console.error("[PROFILE_GET]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
