import { useState } from "react";
import { 
  useGetAdminStats, useGetAdminUsers, useGetAdminDeposits, useGetAdminWithdrawals,
  useApproveDeposit, useRejectDeposit, useApproveWithdrawal, useRejectWithdrawal,
  useBanUser, useEditUserBalance, useGetRooms, useCreateRoom, useUpdateRoom,
  useGetAdminSettings, useUpdateAdminSettings, useSendNotification
} from "@workspace/api-client-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, TrendingUp, DollarSign, Activity, LogOut, CheckCircle, XCircle,
  Settings, Bell, Gamepad2, AlertTriangle, Pencil, X, Check, Plus
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { data: stats, refetch: refetchStats } = useGetAdminStats();
  const { data: users, refetch: refetchUsers } = useGetAdminUsers();
  const { data: deposits, refetch: refetchDeposits } = useGetAdminDeposits();
  const { data: withdrawals, refetch: refetchWithdrawals } = useGetAdminWithdrawals();
  const { data: rooms, refetch: refetchRooms } = useGetRooms();
  const { data: settings, refetch: refetchSettings } = useGetAdminSettings();

  const { logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const approveDep   = useApproveDeposit();
  const rejectDep    = useRejectDeposit();
  const approveWith  = useApproveWithdrawal();
  const rejectWith   = useRejectWithdrawal();
  const banUser      = useBanUser();
  const editBalance  = useEditUserBalance();
  const updateRoom   = useUpdateRoom();
  const createRoom   = useCreateRoom();
  const updateSettings = useUpdateAdminSettings();
  const sendNotif    = useSendNotification();

  // Balance edit state
  const [balanceEdit, setBalanceEdit] = useState<{
    userId: number; name: string;
    main: string; winning: string; bonus: string;
  } | null>(null);

  // Room edit state
  const [roomEdit, setRoomEdit] = useState<{
    id: number; name: string; entryFee: string; winnerPrize: string; tagline: string; color: string;
  } | null>(null);

  // New room state
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", label: "", entryFee: "", winnerPrize: "", tagline: "", color: "#6B21A8" });

  const handleAction = (action: any, params: any, refetch: () => void, successMsg: string) => {
    action.mutate({ ...params }, {
      onSuccess: () => {
        toast({ title: "সফল", description: successMsg });
        refetch();
        refetchStats();
      },
      onError: (err: any) => {
        toast({ title: "ত্রুটি", description: err.message, variant: "destructive" });
      },
    });
  };

  const saveBalance = () => {
    if (!balanceEdit) return;
    editBalance.mutate({
      id: balanceEdit.userId,
      data: {
        mainBalance: parseFloat(balanceEdit.main) || 0,
        winningBalance: parseFloat(balanceEdit.winning) || 0,
        bonusBalance: parseFloat(balanceEdit.bonus) || 0,
      }
    }, {
      onSuccess: () => {
        toast({ title: "ব্যালেন্স আপডেট হয়েছে ✓" });
        setBalanceEdit(null);
        refetchUsers();
      },
      onError: (err: any) => {
        toast({ title: "ত্রুটি", description: err.message, variant: "destructive" });
      },
    });
  };

  const saveRoom = () => {
    if (!roomEdit) return;
    updateRoom.mutate({
      id: roomEdit.id,
      data: {
        name: roomEdit.name,
        entryFee: parseFloat(roomEdit.entryFee),
        winnerPrize: parseFloat(roomEdit.winnerPrize),
        tagline: roomEdit.tagline,
        color: roomEdit.color,
      }
    }, {
      onSuccess: () => {
        toast({ title: "রুম আপডেট হয়েছে ✓" });
        setRoomEdit(null);
        refetchRooms();
      },
      onError: (err: any) => {
        toast({ title: "ত্রুটি", description: err.message, variant: "destructive" });
      },
    });
  };

  const saveNewRoom = () => {
    createRoom.mutate({
      data: {
        name: newRoom.name,
        label: newRoom.label || newRoom.name,
        entryFee: parseFloat(newRoom.entryFee),
        winnerPrize: parseFloat(newRoom.winnerPrize),
        tagline: newRoom.tagline,
        color: newRoom.color,
      }
    }, {
      onSuccess: () => {
        toast({ title: "নতুন রুম তৈরি হয়েছে ✓" });
        setShowAddRoom(false);
        setNewRoom({ name: "", label: "", entryFee: "", winnerPrize: "", tagline: "", color: "#6B21A8" });
        refetchRooms();
      },
      onError: (err: any) => {
        toast({ title: "ত্রুটি", description: err.message, variant: "destructive" });
      },
    });
  };

  const inputCls = "w-full bg-zinc-950 border border-zinc-700 rounded-md p-2 text-white text-sm focus:outline-none focus:border-blue-500";

  return (
    <div className="min-h-screen bg-zinc-950 pb-20 w-full">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          অ্যাডমিন কন্ট্রোল
        </h1>
        <button onClick={() => { logout(); setLocation("/admin-login"); }} className="text-zinc-400 hover:text-white p-2">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-6 max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "মোট ইউজার", value: stats?.totalUsers ?? 0, icon: <Users className="w-4 h-4" />, color: "text-white" },
            { label: "মোট ম্যাচ", value: stats?.totalMatches ?? 0, icon: <TrendingUp className="w-4 h-4" />, color: "text-white" },
            { label: "মোট জমা", value: `৳${stats?.totalDeposited ?? 0}`, icon: <DollarSign className="w-4 h-4 text-green-500" />, color: "text-green-400" },
            { label: "রাজস্ব", value: `৳${stats?.totalRevenue ?? 0}`, icon: <DollarSign className="w-4 h-4 text-blue-500" />, color: "text-blue-400" },
          ].map((s, i) => (
            <GlassCard key={i} className="p-4 bg-zinc-900/50 border-zinc-800">
              <div className="flex items-center gap-2 text-zinc-400 mb-2">
                {s.icon}
                <span className="text-xs uppercase font-bold">{s.label}</span>
              </div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            </GlassCard>
          ))}
        </div>

        {((stats?.pendingDeposits ?? 0) > 0 || (stats?.pendingWithdrawals ?? 0) > 0) && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-4 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div className="font-medium text-sm">
              {stats?.pendingDeposits ?? 0}টি ডিপোজিট এবং {stats?.pendingWithdrawals ?? 0}টি উইথড্রল অপেক্ষায়
            </div>
          </div>
        )}

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 bg-zinc-900 border-zinc-800 h-auto gap-1 p-2">
            <TabsTrigger value="users" className="py-2 text-xs"><Users className="w-3 h-3 mr-1" /> ইউজার</TabsTrigger>
            <TabsTrigger value="deposits" className="py-2 text-xs"><DollarSign className="w-3 h-3 mr-1" /> জমা</TabsTrigger>
            <TabsTrigger value="withdrawals" className="py-2 text-xs"><DollarSign className="w-3 h-3 mr-1" /> তোলা</TabsTrigger>
            <TabsTrigger value="rooms" className="py-2 text-xs"><Gamepad2 className="w-3 h-3 mr-1" /> রুম</TabsTrigger>
            <TabsTrigger value="notifications" className="py-2 text-xs"><Bell className="w-3 h-3 mr-1" /> নোটিশ</TabsTrigger>
            <TabsTrigger value="settings" className="py-2 text-xs"><Settings className="w-3 h-3 mr-1" /> সেটিং</TabsTrigger>
          </TabsList>

          {/* ── USERS ── */}
          <TabsContent value="users" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users?.map(u => (
                <div key={u.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-white flex items-center gap-2 flex-wrap">
                        {u.name}
                        {u.isAdmin && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">ADMIN</span>}
                        {u.banned && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded">BANNED</span>}
                      </div>
                      <div className="text-sm text-zinc-400 mt-0.5">{u.phone}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        W:{u.wins} / L:{u.losses} | {new Date(u.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => setBalanceEdit({
                          userId: u.id, name: u.name,
                          main: "0", winning: "0", bonus: "0"
                        })}
                        className="text-xs px-3 py-1 rounded font-bold bg-blue-600/20 text-blue-400 hover:bg-blue-600/30"
                      >
                        <Pencil className="w-3 h-3 inline mr-1" />ব্যালেন্স
                      </button>
                      <button
                        onClick={() => handleAction(banUser, { id: u.id, data: { banned: !u.banned } }, refetchUsers, `ইউজার ${u.banned ? "আনব্যান" : "ব্যান"} হয়েছে`)}
                        className={`text-xs px-3 py-1 rounded font-bold ${u.banned ? "bg-zinc-700 text-white" : "bg-red-500/20 text-red-500 hover:bg-red-500/30"}`}
                      >
                        {u.banned ? "আনব্যান" : "ব্যান"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ── DEPOSITS ── */}
          <TabsContent value="deposits" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deposits?.length === 0 && (
                <div className="text-zinc-500 text-center col-span-2 py-8">কোনো ডিপোজিট নেই।</div>
              )}
              {deposits?.map(d => (
                <div key={d.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        {d.userName}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${d.method === "bkash" ? "bg-[#E2136E]/20 text-[#E2136E]" : "bg-[#FF6B00]/20 text-[#FF6B00]"}`}>{d.method}</span>
                      </div>
                      <div className="text-xs text-zinc-400 mt-1">{d.phone}</div>
                      <div className="text-xs font-mono text-zinc-500 mt-1">TrxID: {d.trxId}</div>
                    </div>
                    <div className="text-xl font-bold text-green-400">৳{d.amount}</div>
                  </div>
                  {d.status === "pending" ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleAction(approveDep, { id: d.id }, refetchDeposits, "ডিপোজিট অনুমোদিত")} className="flex-1 bg-green-600/20 text-green-500 hover:bg-green-600/30 text-sm font-bold py-2 rounded flex justify-center items-center gap-1"><CheckCircle className="w-4 h-4" /> অনুমোদন</button>
                      <button onClick={() => handleAction(rejectDep, { id: d.id }, refetchDeposits, "ডিপোজিট বাতিল")} className="flex-1 bg-red-600/20 text-red-500 hover:bg-red-600/30 text-sm font-bold py-2 rounded flex justify-center items-center gap-1"><XCircle className="w-4 h-4" /> বাতিল</button>
                    </div>
                  ) : (
                    <div className={`text-xs font-bold uppercase ${d.status === "approved" ? "text-green-500" : "text-red-500"}`}>{d.status}</div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ── WITHDRAWALS ── */}
          <TabsContent value="withdrawals" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {withdrawals?.length === 0 && (
                <div className="text-zinc-500 text-center col-span-2 py-8">কোনো উইথড্রল নেই।</div>
              )}
              {withdrawals?.map(w => (
                <div key={w.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        {w.userName}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${w.method === "bkash" ? "bg-[#E2136E]/20 text-[#E2136E]" : "bg-[#FF6B00]/20 text-[#FF6B00]"}`}>{w.method}</span>
                      </div>
                      <div className="text-xs text-zinc-400 mt-1">পাঠান: <span className="text-white font-mono">{w.phone}</span></div>
                    </div>
                    <div className="text-xl font-bold text-red-400">৳{w.amount}</div>
                  </div>
                  {w.status === "pending" ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleAction(approveWith, { id: w.id }, refetchWithdrawals, "উইথড্রল অনুমোদিত")} className="flex-1 bg-green-600/20 text-green-500 hover:bg-green-600/30 text-sm font-bold py-2 rounded flex justify-center items-center gap-1"><CheckCircle className="w-4 h-4" /> অনুমোদন</button>
                      <button onClick={() => handleAction(rejectWith, { id: w.id }, refetchWithdrawals, "উইথড্রল বাতিল")} className="flex-1 bg-red-600/20 text-red-500 hover:bg-red-600/30 text-sm font-bold py-2 rounded flex justify-center items-center gap-1"><XCircle className="w-4 h-4" /> বাতিল</button>
                    </div>
                  ) : (
                    <div className={`text-xs font-bold uppercase ${w.status === "approved" ? "text-green-500" : "text-red-500"}`}>{w.status}</div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ── ROOMS ── */}
          <TabsContent value="rooms" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms?.map(room => (
                <div key={room.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4"
                  style={{ borderTopColor: room.color || "#6B21A8", borderTopWidth: 4 }}>
                  {roomEdit?.id === room.id ? (
                    <div className="space-y-2">
                      <input className={inputCls} placeholder="রুমের নাম"
                        value={roomEdit.name} onChange={e => setRoomEdit(r => r ? { ...r, name: e.target.value } : r)} />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-zinc-500">Entry Fee (৳)</label>
                          <input type="number" className={inputCls}
                            value={roomEdit.entryFee} onChange={e => setRoomEdit(r => r ? { ...r, entryFee: e.target.value } : r)} />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-500">Prize (৳)</label>
                          <input type="number" className={inputCls}
                            value={roomEdit.winnerPrize} onChange={e => setRoomEdit(r => r ? { ...r, winnerPrize: e.target.value } : r)} />
                        </div>
                      </div>
                      <input className={inputCls} placeholder="ট্যাগলাইন"
                        value={roomEdit.tagline} onChange={e => setRoomEdit(r => r ? { ...r, tagline: e.target.value } : r)} />
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-zinc-500">রঙ</label>
                        <input type="color" className="w-10 h-8 rounded cursor-pointer border border-zinc-700"
                          value={roomEdit.color} onChange={e => setRoomEdit(r => r ? { ...r, color: e.target.value } : r)} />
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={saveRoom} disabled={updateRoom.isPending}
                          className="flex-1 bg-green-600 text-white text-xs font-bold py-2 rounded flex items-center justify-center gap-1">
                          <Check className="w-3 h-3" /> সেভ
                        </button>
                        <button onClick={() => setRoomEdit(null)}
                          className="flex-1 bg-zinc-700 text-white text-xs font-bold py-2 rounded flex items-center justify-center gap-1">
                          <X className="w-3 h-3" /> বাতিল
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between mb-2">
                        <div>
                          <div className="font-bold text-white">{room.name}</div>
                          <div className="text-xs text-zinc-400">{room.tagline}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-green-400">Prize: ৳{room.winnerPrize}</div>
                          <div className="text-xs text-zinc-400">Entry: ৳{room.entryFee}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setRoomEdit({
                          id: room.id,
                          name: room.name,
                          entryFee: String(room.entryFee),
                          winnerPrize: String(room.winnerPrize),
                          tagline: room.tagline || "",
                          color: room.color || "#6B21A8",
                        })}
                        className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-bold py-1.5 rounded flex items-center justify-center gap-1"
                      >
                        <Pencil className="w-3 h-3" /> এডিট করুন
                      </button>
                    </>
                  )}
                </div>
              ))}

              {/* Add new room */}
              {showAddRoom ? (
                <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-4 space-y-2">
                  <div className="font-bold text-white text-sm mb-2">নতুন রুম</div>
                  <input className={inputCls} placeholder="নাম" value={newRoom.name}
                    onChange={e => setNewRoom(r => ({ ...r, name: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-500">Entry (৳)</label>
                      <input type="number" className={inputCls} value={newRoom.entryFee}
                        onChange={e => setNewRoom(r => ({ ...r, entryFee: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500">Prize (৳)</label>
                      <input type="number" className={inputCls} value={newRoom.winnerPrize}
                        onChange={e => setNewRoom(r => ({ ...r, winnerPrize: e.target.value }))} />
                    </div>
                  </div>
                  <input className={inputCls} placeholder="ট্যাগলাইন" value={newRoom.tagline}
                    onChange={e => setNewRoom(r => ({ ...r, tagline: e.target.value }))} />
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-zinc-500">রঙ</label>
                    <input type="color" className="w-10 h-8 rounded cursor-pointer border border-zinc-700"
                      value={newRoom.color} onChange={e => setNewRoom(r => ({ ...r, color: e.target.value }))} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveNewRoom} disabled={createRoom.isPending}
                      className="flex-1 bg-green-600 text-white text-xs font-bold py-2 rounded">
                      {createRoom.isPending ? "..." : "তৈরি করুন"}
                    </button>
                    <button onClick={() => setShowAddRoom(false)}
                      className="flex-1 bg-zinc-700 text-white text-xs font-bold py-2 rounded">বাতিল</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowAddRoom(true)}
                  className="bg-zinc-900/30 border border-dashed border-zinc-700 rounded-lg p-4 flex flex-col items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-500 cursor-pointer min-h-[120px] transition-colors w-full">
                  <Plus className="w-8 h-8 mb-2 opacity-50" />
                  <span className="font-medium text-sm">নতুন রুম যোগ করুন</span>
                </button>
              )}
            </div>
          </TabsContent>

          {/* ── NOTIFICATIONS ── */}
          <TabsContent value="notifications" className="mt-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 max-w-xl">
              <h2 className="text-lg font-bold text-white mb-4">নোটিশ পাঠান</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                handleAction(sendNotif, {
                  data: {
                    title: fd.get("title") as string,
                    message: fd.get("message") as string,
                    userId: fd.get("userId") ? parseInt(fd.get("userId") as string) : undefined,
                  }
                }, () => {}, "নোটিশ পাঠানো হয়েছে");
                e.currentTarget.reset();
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">ইউজার ID (ফাঁকা রাখলে সবাই পাবে)</label>
                  <input name="userId" type="number" className={inputCls} placeholder="যেমন: 1" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">শিরোনাম</label>
                  <input name="title" required className={inputCls} placeholder="নোটিশের শিরোনাম" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">বার্তা</label>
                  <textarea name="message" required className={`${inputCls} h-24 resize-none`} placeholder="বার্তা লিখুন..." />
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-md" disabled={sendNotif.isPending}>
                  {sendNotif.isPending ? "পাঠানো হচ্ছে..." : "পাঠান"}
                </button>
              </form>
            </div>
          </TabsContent>

          {/* ── SETTINGS ── */}
          <TabsContent value="settings" className="mt-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 max-w-xl">
              <h2 className="text-lg font-bold text-white mb-4">প্ল্যাটফর্ম সেটিং</h2>
              {settings && (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  handleAction(updateSettings, {
                    data: {
                      telegramLink: fd.get("telegramLink") as string,
                      referralBonus: parseInt(fd.get("referralBonus") as string),
                      welcomeBonus: parseInt(fd.get("welcomeBonus") as string),
                      withdrawalFee: parseInt(fd.get("withdrawalFee") as string),
                      minDeposit: parseInt(fd.get("minDeposit") as string),
                      minWithdrawal: parseInt(fd.get("minWithdrawal") as string),
                    }
                  }, refetchSettings, "সেটিং আপডেট হয়েছে");
                }} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Telegram Link</label>
                    <input name="telegramLink" defaultValue={(settings as any).telegramLink} className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">স্বাগত বোনাস (৳)</label>
                      <input name="welcomeBonus" type="number" defaultValue={(settings as any).welcomeBonus ?? 20} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">রেফারেল বোনাস (৳)</label>
                      <input name="referralBonus" type="number" defaultValue={(settings as any).referralBonus} className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">উইথড্রল চার্জ (৳)</label>
                      <input name="withdrawalFee" type="number" defaultValue={(settings as any).withdrawalFee ?? 20} className={inputCls} />
                      <div className="text-[10px] text-zinc-500 mt-1">প্রতিটি উইথড্রলে এই পরিমাণ কাটবে</div>
                    </div>
                    <div className="bg-zinc-800/40 rounded-lg p-3 flex flex-col justify-center">
                      <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">বর্তমান চার্জ</div>
                      <div className="text-xl font-bold text-yellow-400">৳{(settings as any).withdrawalFee ?? 20}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">সর্বনিম্ন ডিপোজিট (৳)</label>
                      <input name="minDeposit" type="number" defaultValue={(settings as any).minDeposit} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">সর্বনিম্ন উইথড্রল (৳)</label>
                      <input name="minWithdrawal" type="number" defaultValue={(settings as any).minWithdrawal} className={inputCls} />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-md" disabled={updateSettings.isPending}>
                    {updateSettings.isPending ? "সেভ হচ্ছে..." : "সেভ করুন"}
                  </button>
                </form>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Balance Edit Modal */}
      {balanceEdit && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-white mb-1">{balanceEdit.name}</h3>
            <p className="text-xs text-zinc-400 mb-4">ব্যালেন্স এডিট করুন (৳ যোগ/বিয়োগ)</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400">মেইন ব্যালেন্স (৳)</label>
                <input type="number" className={inputCls} value={balanceEdit.main}
                  onChange={e => setBalanceEdit(b => b ? { ...b, main: e.target.value } : b)}
                  placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-zinc-400">জিতের ব্যালেন্স (৳)</label>
                <input type="number" className={inputCls} value={balanceEdit.winning}
                  onChange={e => setBalanceEdit(b => b ? { ...b, winning: e.target.value } : b)}
                  placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-zinc-400">বোনাস ব্যালেন্স (৳)</label>
                <input type="number" className={inputCls} value={balanceEdit.bonus}
                  onChange={e => setBalanceEdit(b => b ? { ...b, bonus: e.target.value } : b)}
                  placeholder="0" />
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={saveBalance} disabled={editBalance.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg">
                  {editBalance.isPending ? "..." : "সেভ করুন"}
                </button>
                <button onClick={() => setBalanceEdit(null)}
                  className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2.5 rounded-lg">
                  বাতিল
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
