import { useGetReferrals } from "@workspace/api-client-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Users, Copy, Gift, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Referrals() {
  const { data: referrals, isLoading } = useGetReferrals();
  const { toast } = useToast();

  const referralLink = referrals?.referralCode
    ? `${window.location.origin}${import.meta.env.BASE_URL}register?ref=${referrals.referralCode}`
    : "";

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    toast({ title: "লিংক কপি হয়েছে! ✓", description: "বন্ধুকে পাঠিয়ে দিন।" });
  };

  const handleCopyCode = () => {
    if (!referrals?.referralCode) return;
    navigator.clipboard.writeText(referrals.referralCode);
    toast({ title: "কোড কপি হয়েছে! ✓" });
  };

  const handleShare = async () => {
    if (!referralLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Royal Ludo Arena — রেফারেল লিংক",
          text: `আমার রেফারেল দিয়ে Royal Ludo Arena-তে যোগ দাও এবং ৳${referrals?.referralBonus || 20} বোনাস পাও!`,
          url: referralLink,
        });
      } catch { /* cancelled */ }
    } else {
      handleCopyLink();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-48 bg-card/40 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="pb-24 space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Users className="w-6 h-6 text-primary" />
        রেফার করুন & উপার্জন করুন
      </h1>

      {/* Bonus card */}
      <GlassCard className="p-6 relative overflow-hidden text-center" variant="gold">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
        <Gift className="w-12 h-12 text-primary mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-1">
          প্রতিটি বন্ধুর জন্য ৳{referrals?.referralBonus ?? 20} বোনাস!
        </h2>
        <p className="text-sm text-white/70 mb-6">
          আপনার লিংক দিয়ে সাইন আপ করলেই উভয়ে বোনাস পাবেন।
        </p>

        {/* Referral Code */}
        <div className="bg-black/40 rounded-xl p-4 border border-primary/30 mb-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 text-left">
            আপনার রেফারেল কোড
          </div>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-mono font-black text-primary tracking-widest">
              {referrals?.referralCode}
            </div>
            <button
              onClick={handleCopyCode}
              className="w-10 h-10 bg-primary/20 text-primary rounded-lg flex items-center justify-center hover:bg-primary/30 active:scale-90 transition-all border border-primary/30"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Referral Link */}
        <div className="bg-black/40 rounded-xl p-4 border border-white/10 mb-4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 text-left">
            রেফারেল লিংক
          </div>
          <div className="text-xs text-white/60 break-all text-left mb-3 font-mono">
            {referralLink}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 py-2.5 bg-white/10 text-white text-sm font-bold rounded-xl hover:bg-white/20 active:scale-95 transition-all"
            >
              <Copy className="w-4 h-4" /> কপি
            </button>
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 py-2.5 bg-primary text-black text-sm font-bold rounded-xl hover:bg-primary/90 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,215,0,0.3)]"
            >
              <Share2 className="w-4 h-4" /> শেয়ার
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="p-4 text-center">
          <div className="text-3xl font-black text-white">{referrals?.totalReferred ?? 0}</div>
          <div className="text-xs text-muted-foreground uppercase mt-1 tracking-wider">মোট রেফার</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="text-3xl font-black text-green-400">
            ৳{referrals?.totalEarned ?? 0}
          </div>
          <div className="text-xs text-muted-foreground uppercase mt-1 tracking-wider">মোট উপার্জন</div>
        </GlassCard>
      </div>

      {/* Referred friends */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">আপনার রেফার করা বন্ধুরা</h3>
        <div className="space-y-3">
          {!referrals?.referredUsers?.length ? (
            <div className="text-center py-8 text-muted-foreground bg-card/20 rounded-xl">
              এখনো কাউকে রেফার করেননি।
            </div>
          ) : (
            referrals.referredUsers.map((u, i) => (
              <GlassCard key={i} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-white">
                    {u.name.substring(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-white">{u.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(u.joinedAt).toLocaleDateString("bn-BD")}
                    </div>
                  </div>
                </div>
                <div className="text-primary font-bold">+৳{referrals.referralBonus}</div>
              </GlassCard>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
