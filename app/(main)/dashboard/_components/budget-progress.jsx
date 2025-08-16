"use client";

import { updateBudget } from '@/actions/budget';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import useFetch from '@/hooks/use-fetch';
import { Check, Pencil, X } from 'lucide-react';
import React,{ useEffect, useState }  from 'react'
import { toast } from 'sonner';

const BudgetProgress = ({ initialBudget, currentExpense }) => {

  
  const [isEditing, setIsEditing] = useState(false);
  const [newBudget, setNewBudget] = useState(initialBudget?.amount?.toString() || "");
  const [localBudget, setLocalBudget] = useState(
     typeof initialBudget === "number" ? { amount: initialBudget } : initialBudget
  );

  const percentUsed = localBudget
    ? (currentExpense / localBudget.amount) * 100
    : 0;

  const {
    loading: isLoading,
    fn: updateBudgetFn,
    data: updatedBudget,
    error,
  } = useFetch(updateBudget);

  const handleBudgetUpdate = async () => {
    const amount = parseFloat(newBudget);

    if (isNaN(amount) || amount <= 0) {
      toast.error("Please Enter a valid amount");
      return;
    }
    await updateBudgetFn(amount);
  };

  useEffect(() => {
     console.log("updatedBudget:", updatedBudget);
    if (updatedBudget?.success) {
      setIsEditing(false);
      toast.success("Budget updated successfully");

      // Update localBudget state with new amount
      setLocalBudget(updatedBudget.data);

      // Reset the input field to updated amount
      setNewBudget(updatedBudget.data.amount.toString());
    }
  }, [updatedBudget]);



  // ...rest of your code


  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to Update budget");
    }
  }, [error]);

  const handleCancel = () => {
    setNewBudget(localBudget?.amount?.toString() || "");
    setIsEditing(false);
  };

  return (
    <div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex-1">
            <CardTitle>Monthly Budget (Default Account)</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              {isEditing ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    className="w-32"
                    placeholder="Enter Amount"
                    autoFocus
                    disabled={isLoading}
                  />
                  <Button variant="ghost" size="icon" onClick={handleBudgetUpdate}>
                    <Check className="h-4 w-4 text-green-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ) : (
                <>
                  <CardDescription>
                    {localBudget && typeof currentExpense === "number"
                      ? `$${currentExpense.toFixed(2)} of $${localBudget.amount.toFixed(2)} spent`
                      : "No Budget set"}
              
                  </CardDescription>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditing(true)}
                    className="h-3 w-3"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
            
          </div>
          <CardAction>Card Action</CardAction>
        </CardHeader>
        <CardContent>
          {initialBudget&&(
            <div className='space-y-2'>
              <Progress value={percentUsed}
              extraStyle={
                `${
                percentUsed>=90
                ?"bg-red-500"
                :percentUsed>=75
                ?"bg-yellow-500"
                :"bg-green-500"
                }`
              }/>
              <p className='text-xs text-muted-foreground text-right'>
                {percentUsed.toFixed(1)}%used</p>
            </div>
          )}
        </CardContent>
      </Card>
      
    </div>
    
  );
  
};

export default BudgetProgress;

