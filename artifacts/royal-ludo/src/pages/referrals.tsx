import { useGetReferrals } from "@workspace/api-client-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Users, Copy, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Referrals() {
  const { data: referrals, isLoading } = useGetReferrals();
  const { toast } = useToast();

  const handleCopy = () => {
    if (referrals?.referralCode) {
      navigator.clipboard.writeText(referrals.referralCode);
      toast({ title: "Copied!", description: "Referral code copied to clipboard." });
    }
  };

  if (isLoading) {
    return <div className="space-y-4"><div className="h-48 bg-card/40 rounded-xl animate-pulse"></div></div>;
  }

  return (
    <div className="pb-24 space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Users className="w-6 h-6 text-primary" />
        Refer & Earn
      </h1>

      <GlassCard className="p-6 relative overflow-hidden text-center" variant="gold">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
        <Gift className="w-12 h-12 text-primary mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Get ৳{referrals?.referralBonus} for each friend!</h2>
        <p className="text-sm text-white/80 mb-6">When they sign up using your code.</p>

        <div className="bg-black/40 rounded-xl p-4 border border-primary/30 flex items-center justify-between mb-4">
          <div className="text-left">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Your Code</div>
            <div className="text-2xl font-mono font-bold text-primary tracking-widest">{referrals?.referralCode}</div>
          </div>
          <button 
            onClick={handleCopy}
            className="w-12 h-12 bg-primary text-black rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(255,215,0,0.4)] active:scale-95"
          >
            <Copy className="w-5 h-5" />
          </button>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="p-4 text-center">
          <div className="text-3xl font-black text-white">{referrals?.totalReferred || 0}</div>
          <div className="text-xs text-muted-foreground uppercase mt-1 tracking-wider">Total Referrals</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="text-3xl font-black text-green-400">৳ {referrals?.totalEarned || 0}</div>
          <div className="text-xs text-muted-foreground uppercase mt-1 tracking-wider">Total Earned</div>
        </GlassCard>
      </div>

      <div className="pt-4">
        <h3 className="text-lg font-bold text-white mb-4">Your Referred Friends</h3>
        <div className="space-y-3">
          {referrals?.referredUsers?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">You haven't referred anyone yet.</div>
          ) : (
            referrals?.referredUsers?.map((user, i) => (
              <GlassCard key={i} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-white">
                    {user.name.substring(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-white">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{new Date(user.joinedAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="text-primary font-bold text-sm">+ ৳{referrals.referralBonus}</div>
              </GlassCard>
            ))
          )}
        </div>
      </div>
    </div>
  );
}