"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { format, formatDate } from 'date-fns';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Checkbox } from './ui/checkbox';
import { categoryColors } from '@/data/category';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { ChevronDown, ChevronUp, Clock, MoreHorizontal, RefreshCcw, RefreshCw, Search, Trash, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from './ui/dropdown-menu';
import { Button } from './ui/button';
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { useRouter } from 'next/navigation';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import useFetch from '@/hooks/use-fetch';
import { BarLoader } from 'react-spinners';
import { bulkDeleteTransactions } from '@/actions/accounts';
import { toast } from 'sonner';

const RECURRING_INTERVAL={
  DALIY:"daily",
  WEEKLY:"Weekly",
  MONTHLY:"Monthly",
  YEARLY:"Yearly",
};

const TransactionTable = ({transactions}) => {
    const router=useRouter();

    const[selectedId,setSelectedIds]=useState([]);
    const[sortConfig,setSortConfig]=useState({
        field:"date",
        direction:"desc"
    });
   

    
    const handleClearFilters=()=>{
        setSearchTerm("");
        setTypeFilter("");
        setRecurringFilter("");
        setSelectedIds([]);

    }

    const[searchTerm,setSearchTerm]=useState("");
    const[typeFilter,setTypeFilter]=useState("");
    const[recurringFilter,setRecurringFilter]=useState("");

    const {
        Loading:deleteLoading,
        fn:deleteFn,
        data:deleted,
        }=useFetch(bulkDeleteTransactions)

      const handleBulkDelete=async()=>{
        if(!window.confirm(
            `Are you sure you want to delete ${selectedId.length} transactions?`
        )
        ){
        return;
    }
    deleteFn(selectedId)
    } 
    useEffect(()=>{
        if(deleted&&!deleteLoading){
            toast.error("Transaction deleted SuccessFully");
        }
    },[deleted,deleteLoading]);

   



  const filteredAndSortedTransactions = useMemo(() => {
  console.log("Running sort + filter logic"); // Debug: should appear on sort/filter change

  let result = [...transactions];

  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    result = result.filter((transaction) =>
      transaction.description?.toLowerCase().includes(searchLower)
    );
  }

  if (recurringFilter) {
    result = result.filter((transaction) => {
      if (recurringFilter === "recurring") return transaction.isRecurring;
      if (recurringFilter === "non-recurring") return !transaction.isRecurring;
      return true;
    });
  }

  if (typeFilter) {
    result = result.filter((transaction) => transaction.type === typeFilter);
  }

 result.sort((a, b) => {
  let comparison = 0;

  switch (sortConfig.field) {
    case "date": {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      comparison = dateA - dateB;
      break;
    }
    case "amount":
      comparison = a.amount - b.amount;
      break;
    case "category":
      comparison = a.category.localeCompare(b.category);
      break;
    default:
      break;
  }

  return sortConfig.direction === "asc" ? comparison : -comparison;
});


  return result;
}, [transactions, searchTerm, typeFilter, recurringFilter, sortConfig]);

    const handleSort=(field)=>{
        setSortConfig(current=>({ 
            field,
            direction:current.field==field&& current.direction==="asc"?"desc":"asc",
        }))

    }

    const handleSelect=(id)=>{
        setSelectedIds(current=>current.includes(id)?current.filter(item=>item!=id):[...current,id])

    }
    const handleSelectAll = () => {
  setSelectedIds((current) =>
    current.length === filteredAndSortedTransactions.length
      ? []
      : filteredAndSortedTransactions.map((t) => t.id)
  );
};




  return (
    <div className='space-y-4'>

    {deleteLoading &&(<BarLoader className='mt-4'  width={"100%"} color="#9333ea"></BarLoader>)}





        <div className='rounded-md border'>
         <div className='flex flex-col sm:flex-row gap-4'>
            <div className='relative flex-1'>
                <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground'/>
                <Input 
                placeholder="Search transactions.."
                value={searchTerm}
                onChange={(e)=>setSearchTerm(e.target.value)}
                 className="pl-8"/>

            </div>
            <div className='flex gap-2'>
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                          <SelectTrigger>
                              <SelectValue placeholder="All Types" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="INCOME">Income</SelectItem>
                              <SelectItem value="EXPENSE">Expense</SelectItem>
                          </SelectContent>
                      </Select>

                       <Select value={recurringFilter} onValueChange={(value)=>setRecurringFilter(value)}>
                          <SelectTrigger className="w-[140px]" >
                              <SelectValue placeholder="All Transactions" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="recurring">Recurring Only</SelectItem>
                              <SelectItem value="non-recurring">Non-recurring Only</SelectItem>
                          </SelectContent>
                      </Select>

                      {selectedId.length>0&&(
                        <div>
                            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                                <Trash className='h-4 w-4 mr-2'/>
                                Delete Selected({selectedId.length})</Button>
                        </div>
                      )}

                      {(searchTerm||typeFilter||recurringFilter)&&(
                        <Button variant="outline" size="icon" onClick={handleClearFilters}
                        title="Clear Filter">
                            <X className='h-4 w-5'/>
                        </Button>
                      )}
            </div>
        </div>  

        
    <Table>
        <TableHeader>
        <TableRow>
        <TableHead className="w-[50px]">
           <Checkbox onCheckedChange={handleSelectAll}
                        checked={
                            selectedId.length===
                            filteredAndSortedTransactions.length&&
                            filteredAndSortedTransactions.length>0
                        }/>
        </TableHead>
        <TableHead className="cursor-pointer"
        onClick={()=>handleSort("date")}> <div className='flex items-center'>Date{sortConfig.field
        ==='date'&&(
            sortConfig.direction==="asc"?<ChevronUp className='ml-1 h-4 w-4'/>:
            <ChevronDown className='ml-1 h-4 w-4'/>
        )}</div></TableHead>
        <TableHead>
             <div>Description</div></TableHead>
        <TableHead className="cursor-pointer"
        onClick={()=>handleSort("category")}><div className='flex items-center'>Category
        {sortConfig.field
        ==='category'&&(
            sortConfig.direction==="asc"?<ChevronUp className='ml-1 h-4 w-4'/>:
            <ChevronDown className='ml-1 h-4 w-4'/>
        )}</div></TableHead>
        <TableHead className="cursor-pointer"
        onClick={()=>handleSort("amount")}><div className='flex items-center justify-end'>Amount
        {sortConfig.field
        ==='amount'&&(
            sortConfig.direction==="asc"?<ChevronUp className='ml-1 h-4 w-4'/>:
            <ChevronDown className='ml-1 h-4 w-4'/>
        )}</div></TableHead>
        <TableHead>Recurring</TableHead>
        <TableHead className="w-[50px]"/>
        </TableRow>
        </TableHeader>
        <TableBody >
            {filteredAndSortedTransactions.length===0?(
                <TableRow>
                    <TableCell colSpan={7}
                    className="text-center text-muted-foreground">
                        No Transaction Found
                    </TableCell>
                </TableRow>
            ):(
                filteredAndSortedTransactions.map((transaction)=>(
                 <TableRow key={transaction.id}>
                <TableCell>
                    <Checkbox onCheckedChange={()=>handleSelect(transaction.id)}
                        checked={selectedId.includes(transaction.id)}/>
                    </TableCell>
                <TableCell>
                 {transaction.date && !isNaN(new Date(transaction.date)) 
                 ? format(new Date(transaction.date), "PP") 
                 : "Invalid date"}
                </TableCell>
                <TableCell>{transaction.description}</TableCell>
                 <TableCell className="capitalize">
                    <span style={{
                        background:categoryColors[ transaction.category],
                    }}
                    className='px-2 py-1 rounded text-white text-sm'
                    >
                        {transaction.category}

                    </span></TableCell>
                <TableCell 
                className="text-right font-medium
                "

                style={{
                    color:transaction.type==="EXPENSE"?"red":"green",
                }}>
                    {transaction.type==="EXPENSE"?"-":"+"}$
                    {transaction.amount.toFixed(2)}
                </TableCell>
                <TableCell>
                    {transaction.isRecurring?(
                        <Tooltip>
                    <TooltipTrigger>
                         <Badge variant="outline"
                          className="gap-1 bg-purple-100 text-purple-700
                          hover:bg-purple-200">
                    <RefreshCw className='h-3 w-3'/>
                   {RECURRING_INTERVAL[
                    transaction.recurringInterval
                   ]}</Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                    <div className='text-sm'>
                        <div className='font-medium'>Next Date:</div>
                        <div>
                            {transaction.date && !isNaN(new Date(transaction.nextRecurringDate)) 
                          ? format(new Date(transaction.nextRecurringDate), "PP") 
                          : "Invalid date"} 

                        </div>
                        
                    </div>
                    </TooltipContent>
                    </Tooltip>):(
                   <Badge variant="outline" className="gap-1">
                    <Clock className='h-3 w-3'/>
                    One-Time</Badge>
                    )}
                </TableCell>
                <TableCell>
                    <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <MoreHorizontal className='h-4 w-4' />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuLabel
                                    onClick={()=>{
                                        router.push(
                                            `/transaction/create?edit=${transaction.id}`
                                        )
                                    }}
                                    
                                    >Edit</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive"
                                    onClick={()=>deleteFn([transaction.id])}>Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                    </DropdownMenu> 
                </TableCell>





                </TableRow>
                ))
        
        )}
        </TableBody>
    </Table>
    </div>
    </div>
  )
}

export default TransactionTable;
