import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateDeposit } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const formSchema = z.object({
  amount: z.coerce.number().min(50, "Minimum deposit is 50 Taka"),
  method: z.enum(["bkash", "nagad"]),
  phone: z.string().min(10, "Valid sender phone number required"),
  trxId: z.string().min(6, "Transaction ID required"),
});

export default function AddCash() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const depositMutation = useCreateDeposit();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 100,
      method: "bkash",
      phone: "",
      trxId: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    depositMutation.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Request Submitted", description: "Your deposit request is pending approval." });
        setLocation("/wallet");
      },
      onError: (error: any) => {
        toast({ 
          title: "Request Failed", 
          description: error?.message || "Something went wrong",
          variant: "destructive"
        });
      }
    });
  };

  const selectedMethod = form.watch("method");

  return (
    <div className="pb-24 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => window.history.back()} className="w-10 h-10 rounded-full bg-card flex items-center justify-center border border-white/10 hover:bg-card/80">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-2xl font-bold text-white">Add Cash</h1>
      </div>

      <GlassCard className="p-6 border-primary/30">
        <div className="bg-black/40 rounded-xl p-4 mb-6 border border-white/5">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">How to deposit:</h3>
          <ol className="text-xs text-white/80 space-y-2 list-decimal list-inside ml-2">
            <li>Copy our {selectedMethod.toUpperCase()} personal number.</li>
            <li>Send money (Send Money option) from your app.</li>
            <li>Enter the exact amount and Transaction ID below.</li>
          </ol>
          <div className="mt-3 p-3 bg-card border border-white/10 rounded-lg flex justify-between items-center">
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Our Number</div>
              <div className="font-bold text-white text-lg">017XXXXXXXX</div>
            </div>
            <button className="px-3 py-1.5 bg-primary/20 text-primary text-xs font-bold rounded-md hover:bg-primary/30">
              COPY
            </button>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Select Payment Method</FormLabel>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div 
                      className={`cursor-pointer rounded-xl border-2 p-3 text-center transition-all ${field.value === 'bkash' ? 'border-[#E2136E] bg-[#E2136E]/10' : 'border-card bg-card/50'}`}
                      onClick={() => field.onChange('bkash')}
                    >
                      <div className="font-black text-[#E2136E] text-lg">bKash</div>
                    </div>
                    <div 
                      className={`cursor-pointer rounded-xl border-2 p-3 text-center transition-all ${field.value === 'nagad' ? 'border-[#FF6B00] bg-[#FF6B00]/10' : 'border-card bg-card/50'}`}
                      onClick={() => field.onChange('nagad')}
                    >
                      <div className="font-black text-[#FF6B00] text-lg">Nagad</div>
                    </div>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Amount (৳)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-lg">৳</span>
                      <Input type="number" placeholder="100" {...field} className="pl-10 h-14 text-lg font-bold bg-black/50 border-white/10" />
                    </div>
                  </FormControl>
                  <p className="text-[10px] text-muted-foreground mt-1">Minimum deposit: ৳50</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Sender {selectedMethod.toUpperCase()} Number</FormLabel>
                  <FormControl>
                    <Input placeholder="01XXXXXXXXX" {...field} className="h-12 bg-black/50 border-white/10" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trxId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Transaction ID (TrxID)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter TrxID" {...field} className="h-12 bg-black/50 border-white/10 uppercase" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full h-14 bg-gradient-to-r from-primary to-yellow-600 hover:from-primary/90 hover:to-yellow-600/90 text-black font-bold text-lg shadow-[0_0_15px_rgba(255,215,0,0.4)] mt-4"
              disabled={depositMutation.isPending}
            >
              {depositMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </Form>
      </GlassCard>
    </div>
  );
}