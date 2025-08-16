

import { getDashboardData, getUserAccount } from '@/actions/dashboard';
import CreateAccountDrawer from '@/components/create-account-drawer';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import React, { Suspense } from 'react'
import AccountCard from './_components/account-card';
import { getCurrentBudget } from '@/actions/budget';
import BudgetProgress from './_components/budget-progress';
import { DashboardOverview } from './_components/transaction-OverView';

async function  DashboardPage() {
  
  const accounts=await getUserAccount();

  const defaultAccount=accounts?.find((account)=>account.isDefault);
  let budgetData=null;
  if(defaultAccount){
    budgetData=await getCurrentBudget(defaultAccount.id);
  }

  const transaction=await getDashboardData();


  return (
  <div className='space-y-8'>

    {defaultAccount&&
    <BudgetProgress
    initialBudget={budgetData?.budget}
    currentExpense={budgetData?.currentExpenses||0}
    
    
    />}
    <Suspense fallback={"Loading OverView..."}>
      <DashboardOverview
        accounts={accounts}
        transactions={transaction || []}
      />
    </Suspense>




    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
     <CreateAccountDrawer>
      <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed">
        <CardContent className="flex flex-col items-center justify-center text-muted-foreground
        h-full pt-5">
          <Plus className='h-10 w-10 mb-2'/>
          <p className='text-sm font-medium'>Add new Account</p>
        </CardContent>
      </Card>

     </CreateAccountDrawer>
     {accounts.length>0&&accounts?.map((accounts)=>{
      return <AccountCard key={accounts.id} account={accounts}/>
     })}

    </div>

  </div>
  )
}

export default DashboardPage;
