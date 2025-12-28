import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user-service";

export async function GET() {
  try {
    const user = await getCurrentUser();
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
