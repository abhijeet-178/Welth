"use client";

import { createTransaction, updateTransaction } from '@/actions/transaction'
import { transactionSchema } from '@/app/lib/schema'
import CreateAccountDrawer from '@/components/create-account-drawer'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch';
import useFetch from '@/hooks/use-fetch'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns';
import {  CalendarIcon, Loader2, Receipt } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Label } from 'recharts';
import { toast } from 'sonner';
import ReceiptScanner from './receipt-Scanner';

const AddTransactionForm = ({ accounts, categories,
  editMode=false,initialData=null,
 }) => {

  const router=useRouter();
  const searchParams=useSearchParams();
  const editId=searchParams.get("edit");
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
    watch,
    getValues,
    reset,
  } = useForm({
    resolver: zodResolver(transactionSchema),
     defaultValues:
      editMode && initialData
        ? {
            type: initialData.type,
            amount: initialData.amount.toString(),
            description: initialData.description,
            accountId: initialData.accountId,
            category: initialData.category,
            date: new Date(initialData.date),
            isRecurring: initialData.isRecurring,
            ...(initialData.recurringInterval && {
              recurringInterval: initialData.recurringInterval,
            }),
          }
        : {
      type: "EXPENSE",
      amount: "",
      description: "",
      accountId: accounts.find((ac) => ac.isDefault)?.id,
      date: new Date(),
      isRecurring: false,
    },
  })

  const {
    loading: transactionLoading,
    fn: transactionFn,
    data: transactionResult,
  } = useFetch(
   editMode ? updateTransaction: createTransaction)

  const type = watch("type")
  const isRecurring = watch("isRecurring")
  const date = watch("date")

  const onSubmit = async (data) => {
    console.log("Submitting form with:", data);
    const formData={
      ...data,
      amount:parseFloat(data.amount),
    }
    if (editMode) {
      transactionFn(editId, formData);
    } else {
      transactionFn(formData);
    }
  }

  useEffect(()=>{
    if(transactionResult?.success&&!transactionLoading){
      toast.success(
        editMode
          ? "Transaction updated successfully"
          : "Transaction created successfully"
      );
      reset();
      router.push(`/account/${transactionResult.data.accountId}`)
    }
  },[transactionResult,transactionLoading,editMode])

  const filteredCategories=categories.filter(
    (category)=>category.type===type
  )

  const handleScanComplete=(scannedData)=>{
    if(scannedData){
      setValue("amount",scannedData.amount.toString());
      setValue("date",new Date(scannedData.date));
      if(scannedData.description){
        setValue("description",scannedData.description);
      }
      if(scannedData.category){
        setValue("category",scannedData.category)
        
      }
    }
  };
  const selectedCategory = watch("category");

  return (
    <form className='space-y-6' onSubmit={handleSubmit(onSubmit)}>
      {!editMode && <ReceiptScanner onScanComplete={handleScanComplete} />}



      {/* Type */}
      <div className='space-y-2'>
        <label className='text-sm font-medium'>Type</label>
        <Select
          onValueChange={(value) => setValue("type", value)}
          defaultValue={type}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EXPENSE">Expense</SelectItem>
            <SelectItem value="INCOME">Income</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && (
          <p className='text-sm text-red-500'>{errors.type.message}</p>
        )}
      </div>

      {/* Amount */}
      {/* Amount + Account in one row */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Amount */}
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">Amount</label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            className="w-full"
            {...register("amount")}
          />
          {errors.amount && (
            <p className="text-sm text-red-500">{errors.amount.message}</p>
          )}
        </div>

        {/* Account */}
        <div className="flex-1 space-y-2">
           <label className="text-sm font-medium">Account</label>
          <Select
            onValueChange={(value) => setValue("accountId", value)}
            defaultValue={getValues("accountId")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} (${parseFloat(account.balance).toFixed(2)})
                </SelectItem>
              ))}
              <CreateAccountDrawer>
                <Button
                  variant="ghost"
                  type="button"
                  className="w-full select-none items-center text-sm outline-none"
                >
                  Create Account
                </Button>
              </CreateAccountDrawer>
            </SelectContent>
          </Select>
         
          {errors.accountId && (
            <p className="text-sm text-red-500">{errors.accountId.message}</p>
          )}
        </div>
      </div>


  {/* Category */}
  <div className="flex-1 space-y-2">
    <label className="text-sm font-medium">Category</label>
       

        <Select
          value={selectedCategory}
          onValueChange={(value) => setValue("category", value)}
        >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        {filteredCategories.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    {errors.category && (
      <p className="text-sm text-red-500">{errors.category.message}</p>
    )}
  </div>

  <div className="flex-1 space-y-2">
    <label className="text-sm font-medium">Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant='outline' className="w-full pl-3 text-left font-normal"
            >
              {" "}
              {date? format(date,"PPP"):<span>Pick a date</span>}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50"/>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="Single"
            selected={date}
            onSelect={(date)=>setValue("date",date)}
            disabled={(date)=>
              date>new Date()||date<new Date("1900-01-01")
            }
            initialFocus
            />
          </PopoverContent>
        </Popover>
   
    {errors.category && (
      <p className="text-sm text-red-500">{errors.category.message}</p>
    )}
  </div>

  <div className='space-y-2'>
    <label className='text-sm font-medium '>Description</label>
    <Input placeholder="Enter Description"{...register("description")}/>
    {errors.description&&(
      <p className='text-sm text-red-500  '>{errors.description.message}</p>
    )}

  </div>
      <div className='flex items-center justify-between rounded-lg border p-3'>
        <div className='space-y-0.5'>
          <Label htmlFor="balance" className='text-sm font-medium cursor-pointer'>Set as default</Label>
          <p className='text-sm text-muted-foreground'> Set up a recurring schedule for this transactions</p>
        </div>
        <Switch 
        checked={isRecurring}
        onCheckedChange={(checked)=>setValue("isRecurring",checked)}
        />
  </div>


  {isRecurring&& <div className="flex-1 space-y-2">
    <label className="text-sm font-medium">Recurring Interval</label>
    <Select
      onValueChange={(value) => setValue("recurringInterval", value)}
      defaultValue={getValues("recurringInterval")}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select Interval" />
      </SelectTrigger>
      <SelectContent>
            <SelectItem value="DAILY">Daily</SelectItem>
            <SelectItem value="WEEKLY">Weakly</SelectItem>
            <SelectItem value="MONTHLY">Monthly</SelectItem>
            <SelectItem value="YEARLY">Yearly</SelectItem>
      
      </SelectContent>
    </Select>
    {errors.recurringInterval && (
      <p className="text-sm text-red-500">{errors.recurringInterval.message}</p>
    )}
  </div>}

 <div className="flex gap-4">
 <div className="flex w-full gap-2">
  <Button
    type="button"
    variant="outline"
    className="w-1/2 rounded-md"
    onClick={() => router.back()}
  >
    Cancel
  </Button>
  <Button
    type="submit"
    className="w-1/2 rounded-md flex justify-center items-center"
    disabled={transactionLoading}
  >
    {transactionLoading ? (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {editMode ? "Updating..." : "Creating..."}
      </>
    ) : (
      <span>{editMode ? "Update Transaction" : "Create Transaction"}</span>
    )}
  </Button>
</div>

</div>


      
    </form>
  )
}

export default AddTransactionForm
