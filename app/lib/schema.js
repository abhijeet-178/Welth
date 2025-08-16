import z from "zod";

export const accountSchema=z.object({
    name:z.string().min(1,"Name is Required"),
    type:z.enum(["CURRENT","SAVINGS"]),
    balance:z.string().min(1,"Initial balance is required"),
    isDefault:z.boolean().default(false),
});

export const transactionSchema=z.object({
    type: z.enum(["EXPENSE", "INCOME"]),
    amount:z.string().min(1,"Amount isrequired"),
    description:z.string().optional(),
    date:z.date({required_error:"Date is required"}),
    accountId:z.string().min(1,"Account is Required"),
    category:z.string().min(1,"Category is Required"),
    isRecurring:z.boolean().default(false),
    recurringInterval:z
    .enum(["DAILY","WEEKLY","MONTHLY","YEARLY"])
    .optional()
}).superRefine((date,ctx)=>{
    if(date.isRecurring&&!date.recurringInterval){
        ctx.addIssue({
            code:z.ZodIssueCode.custom,
            message:"recurring intervals is required for Recurring Transaction",
            path:["recurringInterval"],
        });
    }

})