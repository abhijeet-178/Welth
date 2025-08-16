// app/api/update-default-account/route.js
import { updateDefaultAccount } from "@/actions/accounts";

export async function POST(req) {
  try {
    const { accountId } = await req.json();

    const result = await updateDefaultAccount(accountId);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
    });
  }
}
