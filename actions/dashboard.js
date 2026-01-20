"use server"

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const serializeTransaction = (obj) => {
  const serialized = { ...obj };

  if (obj.balance) {
    serialized.balance = obj.balance.toNumber();
  }

  if (obj.amount) {
    serialized.amount = obj.amount.toNumber();
  }

  return serialized;
};

export async function createAccount(data) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized: No userId provided.");
    }

    // Fetch user by Clerk userId
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found in the database.");
    }

    // Convert balance to float before saving
    const balanceFloat = parseFloat(data.balance);
    if (isNaN(balanceFloat)) {
      throw new Error("Invalid balance amount provided.");
    }

    // Check if the user has existing accounts
    const existingAccounts = await db.account.findMany({
      where: { userId: user.id },
    });

    const shouldBeDefault = existingAccounts.length === 0 ? true : data.isDefault;

    if (shouldBeDefault) {
      // Set existing default accounts to non-default
      await db.account.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Create the new account
    const account = await db.account.create({
      data: {
        ...data,
        balance: balanceFloat,
        userId: user.id,
        isDefault: shouldBeDefault,
      },
    });

    const serializedAccount = serializeTransaction(account);

    // Revalidate dashboard path after account creation
    revalidatePath("/dashboard");

    return { success: true, data: serializedAccount };
  } catch (error) {
    console.error("Error creating account:", error);
    throw new Error(error.message || "An unexpected error occurred during account creation.");
  }
}

export async function getUserAccount() {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized: No userId provided.");
    }

    // Fetch user by Clerk userId
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found in the database.");
    }

    // Fetch user accounts with transaction count
    const accounts = await db.account.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    // Serialize Prisma Date objects
    return accounts.map(account => ({
      ...account,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt?.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching user account:", error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("An unexpected error occurred while fetching user account.");
  }
}


export async function getDashboardData() {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized: No userId provided.");
    }

    // Fetch user by Clerk userId
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found in the database.");
    }

    // Fetch user transactions
    const transactions = await db.transaction.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    });

    return transactions.map(serializeTransaction);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw new Error(error.message || "An unexpected error occurred while fetching dashboard data.");
  }
}
