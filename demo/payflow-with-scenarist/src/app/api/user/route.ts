import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user-service";
import { getScenaristHeaders } from "@scenarist/nextjs-adapter/app";

export async function GET(request: NextRequest) {
  try {
    // Propagate Scenarist headers to backend calls for test isolation
    const scenaristHeaders = getScenaristHeaders(request);
    const user = await getCurrentUser(scenaristHeaders);
    return NextResponse.json(user);
  } catch (error) {
    // Only log full error details in development
    if (process.env.NODE_ENV !== "production") {
      console.error("User service error:", error);
    }
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 503 },
    );
  }
}
