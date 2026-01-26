"use server"

import { protect } from "@/app/lib/arcjet";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Recursively converts all Prisma Decimal fields to numbers
 * and Dates to ISO strings for safe Client Component usage
 */
function serializePrismaObject(obj) {
  if (Array.isArray(obj)) {
    return obj.map(serializePrismaObject);
  }

  if (obj && typeof obj === "object") {
    const result = {};
    for (const key in obj) {
      const value = obj[key];

      if (value instanceof Prisma.Decimal) {
        result[key] = value.toNumber();
      } else if (value instanceof Date) {
        result[key] = value.toISOString();
      } else if (typeof value === "object" && value !== null) {
        result[key] = serializePrismaObject(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  return obj;
}

/** ---------------- TRANSACTION FUNCTIONS ---------------- */

export async function createTransaction(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const reqHeaders = headers();
  const req = new Request("http://internal/transaction", {
    headers: reqHeaders,
  });

  const decision = await protect(req, { userId, requested: 1 });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      throw new Error("Too many requests. Please try again later.");
    }
    throw new Error("Request Blocked");
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  const account = await db.account.findFirst({
    where: { id: data.accountId, userId: user.id },
  });
  if (!account) throw new Error("Account not found");

  const balanceChange =
    data.type === "EXPENSE" ? -data.amount : data.amount;

  const newBalance =
    account.balance.toNumber() + balanceChange;

  const transaction = await db.$transaction(async (tx) => {
    const newTransaction = await tx.transaction.create({
      data: {
        ...data,
        userId: user.id,
        nextRecurringDate:
          data.isRecurring && data.recurringInterval
            ? calculateNextRecurringDate(
                data.date,
                data.recurringInterval
              )
            : null,
      },
    });

    await tx.account.update({
      where: { id: data.accountId },
      data: { balance: newBalance },
    });

    return newTransaction;
  });

  revalidatePath("/dashboard");
  revalidatePath(`/account/${transaction.accountId}`);

  return { success: true, data: serializePrismaObject(transaction) };
}

export async function getTransaction(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  const transaction = await db.transaction.findFirst({
    where: { id, userId: user.id },
  });

  if (!transaction) throw new Error("Transaction not found");

  return serializePrismaObject(transaction);
}

export async function updateTransaction(id, data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  const originalTransaction = await db.transaction.findFirst({
    where: { id, userId: user.id },
    include: { account: true },
  });

  if (!originalTransaction) throw new Error("Transaction not found");

  const oldChange =
    originalTransaction.type === "EXPENSE"
      ? -originalTransaction.amount.toNumber()
      : originalTransaction.amount.toNumber();

  const newChange =
    data.type === "EXPENSE" ? -data.amount : data.amount;

  const netChange = newChange - oldChange;

  const transaction = await db.$transaction(async (tx) => {
    const updated = await tx.transaction.update({
      where: { id },
      data: {
        ...data,
        nextRecurringDate:
          data.isRecurring && data.recurringInterval
            ? calculateNextRecurringDate(
                data.date,
                data.recurringInterval
              )
            : null,
      },
    });

    await tx.account.update({
      where: { id: data.accountId },
      data: { balance: { increment: netChange } },
    });

    return updated;
  });

  revalidatePath("/dashboard");
  revalidatePath(`/account/${data.accountId}`);

  return { success: true, data: serializePrismaObject(transaction) };
}

/** ---------------- RECURRENT DATE CALCULATION ---------------- */

function calculateNextRecurringDate(startDate, interval) {
  const date = new Date(startDate);

  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date;
}

/** ---------------- RECEIPT SCANNING ---------------- */

export async function scanReciept({ base64, mimetype }) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

  const prompt = `
Analyze this receipt image and extract the following information in JSON format:
{
  "amount": number,
  "date": "ISO date string",
  "description": "string",
  "merchantName": "string",
  "category": "string"
}
If it's not a receipt, return an empty object.
`;

  const result = await model.generateContent([
    { inlineData: { data: base64, mimeType: mimetype } },
    prompt,
  ]);

  const text = await result.response.text();
  const cleanedText = text.replace(/```(?:json)?/g, "").trim();
  const parsed = JSON.parse(cleanedText);

  return {
    amount: Number(parsed.amount),
    date: new Date(parsed.date),
    description: parsed.description,
    merchantName: parsed.merchantName,
    category: parsed.category,
  };
}
