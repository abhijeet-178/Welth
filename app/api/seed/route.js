import { seedTransactions } from "@/actions/seed";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await seedTransactions();

    return NextResponse.json(result, {
      status: 200,
    });
  } catch (error) {
    console.error("Seeding failed:", error);
    return NextResponse.json(
      { error: "Failed to seed transactions" },
      { status: 500 }
    );
  }
}
