import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateWithdrawal, useGetWallet } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, AlertTriangle } from "lucide-react";

const formSchema = z.object({
  amount: z.coerce.number().min(100, "Minimum withdrawal is 100 Taka"),
  method: z.enum(["bkash", "nagad"]),
  phone: z.string().min(10, "Valid phone number required"),
});

export default function Withdraw() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: wallet } = useGetWallet();
  const withdrawalMutation = useCreateWithdrawal();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 100,
      method: "bkash",
      phone: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (wallet && values.amount > wallet.winningBalance) {
      toast({ title: "Error", description: "Insufficient winning balance.", variant: "destructive" });
      return;
    }

    withdrawalMutation.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Request Submitted", description: "Your withdrawal will be processed soon." });
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
        <h1 className="text-2xl font-bold text-white">Withdraw Cash</h1>
      </div>

      <GlassCard className="p-6 border-red-500/30">
        <div className="bg-red-500/10 rounded-xl p-4 mb-6 border border-red-500/20 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-red-400 mb-1">Important Notice</h3>
            <p className="text-xs text-red-200/80">You can only withdraw your Winning Balance. Bonus and Deposit balances cannot be withdrawn.</p>
          </div>
        </div>

        <div className="mb-6 flex justify-between items-center bg-black/30 p-4 rounded-xl border border-white/5">
          <span className="text-sm text-muted-foreground">Available to Withdraw</span>
          <span className="text-xl font-bold text-green-400">৳ {wallet?.winningBalance?.toFixed(2) || "0.00"}</span>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Receive Money In</FormLabel>
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
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-bold text-lg">৳</span>
                      <Input type="number" placeholder="100" {...field} className="pl-10 h-14 text-lg font-bold bg-black/50 border-white/10" />
                    </div>
                  </FormControl>
                  <p className="text-[10px] text-muted-foreground mt-1">Minimum withdrawal: ৳100</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Your {selectedMethod.toUpperCase()} Account Number</FormLabel>
                  <FormControl>
                    <Input placeholder="01XXXXXXXXX" {...field} className="h-12 bg-black/50 border-white/10" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full h-14 bg-white hover:bg-gray-200 text-black font-bold text-lg mt-4"
              disabled={withdrawalMutation.isPending || !wallet || wallet.winningBalance < 100}
            >
              {withdrawalMutation.isPending ? "Processing..." : "Withdraw Now"}
            </Button>
          </form>
        </Form>
      </GlassCard>
    </div>
  );
}