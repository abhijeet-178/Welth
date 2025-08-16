export const updateDefaultAccountFetcher = async (accountId) => {
  const res = await fetch("/api/update-default-account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accountId }),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to update account");
  }

  return data;
};
