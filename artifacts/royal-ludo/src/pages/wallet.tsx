import { useGetWallet, useGetDeposits, useGetWithdrawals } from "@workspace/api-client-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Link } from "wouter";
import { PlusCircle, ArrowDownToLine, Wallet as WalletIcon, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Wallet() {
  const { data: wallet, isLoading: walletLoading } = useGetWallet();
  const { data: deposits } = useGetDeposits();
  const { data: withdrawals } = useGetWithdrawals();

  if (walletLoading) {
    return (
      <div className="space-y-4">
        <div className="h-48 bg-card/40 rounded-xl animate-pulse"></div>
        <div className="h-64 bg-card/40 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'approved') return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (status === 'rejected') return <XCircle className="w-4 h-4 text-red-500" />;
    return <Clock className="w-4 h-4 text-yellow-500" />;
  };

  return (
    <div className="pb-24 space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <WalletIcon className="w-6 h-6 text-primary" />
        My Wallet
      </h1>

      {/* Main Balance Card */}
      <GlassCard className="p-6 relative overflow-hidden" variant="gold">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 text-center mb-6">
          <div className="text-sm text-primary font-medium tracking-widest uppercase mb-1">Total Balance</div>
          <div className="text-4xl font-black text-white text-glow">৳ {wallet?.totalBalance?.toFixed(2) || "0.00"}</div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-black/30 rounded-lg p-3 text-center border border-white/5">
            <div className="text-xs text-muted-foreground mb-1">Deposit Balance</div>
            <div className="text-lg font-bold text-white">৳ {wallet?.mainBalance?.toFixed(2) || "0.00"}</div>
          </div>
          <div className="bg-black/30 rounded-lg p-3 text-center border border-white/5">
            <div className="text-xs text-muted-foreground mb-1">Winning Balance</div>
            <div className="text-lg font-bold text-green-400">৳ {wallet?.winningBalance?.toFixed(2) || "0.00"}</div>
          </div>
        </div>

        <div className="flex gap-3">
          <Link href="/add-cash" className="flex-1 bg-gradient-to-r from-primary to-yellow-600 hover:from-primary/90 hover:to-yellow-600/90 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,215,0,0.3)] transition-all active:scale-95">
            <PlusCircle className="w-5 h-5" />
            Add Cash
          </Link>
          <Link href="/withdraw" className="flex-1 bg-card border border-white/10 hover:bg-card/80 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
            <ArrowDownToLine className="w-5 h-5" />
            Withdraw
          </Link>
        </div>
      </GlassCard>

      {/* Bonus Balance */}
      <GlassCard className="p-4 flex items-center justify-between border-l-4 border-l-accent">
        <div>
          <div className="text-sm text-muted-foreground">Bonus Balance</div>
          <div className="text-sm text-accent">Cannot be withdrawn</div>
        </div>
        <div className="text-2xl font-bold text-white">৳ {wallet?.bonusBalance?.toFixed(2) || "0.00"}</div>
      </GlassCard>

      {/* Transaction History */}
      <div className="pt-4">
        <h2 className="text-lg font-bold text-white mb-4">Transaction History</h2>
        <Tabs defaultValue="deposits" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card border border-white/10">
            <TabsTrigger value="deposits" className="data-[state=active]:bg-primary data-[state=active]:text-black">Deposits</TabsTrigger>
            <TabsTrigger value="withdrawals" className="data-[state=active]:bg-primary data-[state=active]:text-black">Withdrawals</TabsTrigger>
          </TabsList>
          
          <TabsContent value="deposits" className="mt-4 space-y-3">
            {deposits?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No deposits yet.</div>
            ) : (
              deposits?.map(dep => (
                <GlassCard key={dep.id} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                      <PlusCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-white">{dep.method.toUpperCase()}</div>
                      <div className="text-xs text-muted-foreground">{new Date(dep.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-400">+ ৳ {dep.amount}</div>
                    <div className="flex items-center justify-end gap-1 mt-1 text-[10px] uppercase font-bold">
                      <StatusIcon status={dep.status} />
                      <span className={
                        dep.status === 'approved' ? 'text-green-500' :
                        dep.status === 'rejected' ? 'text-red-500' : 'text-yellow-500'
                      }>{dep.status}</span>
                    </div>
                  </div>
                </GlassCard>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="withdrawals" className="mt-4 space-y-3">
            {withdrawals?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No withdrawals yet.</div>
            ) : (
              withdrawals?.map(withd => (
                <GlassCard key={withd.id} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                      <ArrowDownToLine className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-white">{withd.method.toUpperCase()}</div>
                      <div className="text-xs text-muted-foreground">{new Date(withd.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-400">- ৳ {withd.amount}</div>
                    <div className="flex items-center justify-end gap-1 mt-1 text-[10px] uppercase font-bold">
                      <StatusIcon status={withd.status} />
                      <span className={
                        withd.status === 'approved' ? 'text-green-500' :
                        withd.status === 'rejected' ? 'text-red-500' : 'text-yellow-500'
                      }>{withd.status}</span>
                    </div>
                  </div>
                </GlassCard>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}