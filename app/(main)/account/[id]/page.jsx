import { getAccountTransactions } from '@/actions/accounts';
import TransactionTable from '@/components/transaction-table';
import { notFound } from 'next/navigation';
import React, { Suspense } from 'react';
import AccountChart from '../../dashboard/_components/account-chart';

export default async function AccountPage({ params }) {
  // Await params to fix the Next.js error
  const { id } = await params;

  const accountData = await getAccountTransactions(id);

  if (!accountData) {
    notFound();
  }

  return (
    <div className="space-y-8 px-5">
      <div className="flex gap-4 items-end justify-between flex-wrap">
        <div>
          <h1 className="text-5xl sm:text-6xl font-bold gradient-title capitalize">
            {accountData.name}
          </h1>
          <p className="text-muted-foreground">
            {accountData.type.charAt(0) + accountData.type.slice(1).toLowerCase()} Account
          </p>
        </div>

        <div className="text-right pb-2">
          <div className="text-xl sm:text-2xl font-bold">
            ${parseFloat(accountData.balance).toFixed(2)}
          </div>
          <p className="text-sm text-muted-foreground">
            {accountData._count.transactions} Transactions
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Loading Chart...</div>}>
        <AccountChart transactions={accountData.transactions} />
      </Suspense>

      <Suspense fallback={<div>Loading Transactions...</div>}>
        <TransactionTable transactions={accountData.transactions} />
      </Suspense>
    </div>
  );
}
