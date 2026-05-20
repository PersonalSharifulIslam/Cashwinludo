import { useState } from "react";
import { 
  useGetAdminStats, useGetAdminUsers, useGetAdminDeposits, useGetAdminWithdrawals,
  useApproveDeposit, useRejectDeposit, useApproveWithdrawal, useRejectWithdrawal,
  useBanUser, useEditUserBalance, useGetRooms, useCreateRoom, useUpdateRoom, useDeleteRoom,
  useGetAdminSettings, useUpdateAdminSettings, useSendNotification
} from "@workspace/api-client-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, TrendingUp, DollarSign, Activity, LogOut, CheckCircle, XCircle, Settings, Bell, Gamepad2, AlertTriangle } from "lucide-react";
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

  const approveDep = useApproveDeposit();
  const rejectDep = useRejectDeposit();
  const approveWith = useApproveWithdrawal();
  const rejectWith = useRejectWithdrawal();
  const banUser = useBanUser();
  const updateSettings = useUpdateAdminSettings();
  const sendNotif = useSendNotification();

  const handleLogout = () => {
    logout();
    setLocation("/admin-login");
  };

  const handleAction = (action: any, params: any, refetch: () => void, successMsg: string) => {
    action.mutate({ ...params }, {
      onSuccess: () => {
        toast({ title: "Success", description: successMsg });
        refetch();
        refetchStats();
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 pb-20 w-full max-w-full">
      {/* Admin Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          Admin Control
        </h1>
        <button onClick={handleLogout} className="text-zinc-400 hover:text-white p-2">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-6 max-w-7xl mx-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard className="p-4 bg-zinc-900/50 border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
              <Users className="w-4 h-4" />
              <span className="text-xs uppercase font-bold">Total Users</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</div>
          </GlassCard>
          <GlassCard className="p-4 bg-zinc-900/50 border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs uppercase font-bold">Total Matches</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats?.totalMatches || 0}</div>
          </GlassCard>
          <GlassCard className="p-4 bg-zinc-900/50 border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="text-xs uppercase font-bold">Total Deposited</span>
            </div>
            <div className="text-2xl font-bold text-green-400">৳{stats?.totalDeposited || 0}</div>
          </GlassCard>
          <GlassCard className="p-4 bg-zinc-900/50 border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
              <DollarSign className="w-4 h-4 text-blue-500" />
              <span className="text-xs uppercase font-bold">Total Revenue</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">৳{stats?.totalRevenue || 0}</div>
          </GlassCard>
        </div>

        {/* Pending Actions Alert */}
        {((stats?.pendingDeposits || 0) > 0 || (stats?.pendingWithdrawals || 0) > 0) && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-4 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div className="font-medium">
              You have pending tasks: {stats?.pendingDeposits || 0} deposits and {stats?.pendingWithdrawals || 0} withdrawals waiting.
            </div>
          </div>
        )}

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 bg-zinc-900 border-zinc-800 h-auto gap-2 p-2">
            <TabsTrigger value="users" className="py-2"><Users className="w-4 h-4 mr-2" /> Users</TabsTrigger>
            <TabsTrigger value="deposits" className="py-2"><DollarSign className="w-4 h-4 mr-2" /> Deposits</TabsTrigger>
            <TabsTrigger value="withdrawals" className="py-2"><DollarSign className="w-4 h-4 mr-2" /> Withdrawals</TabsTrigger>
            <TabsTrigger value="rooms" className="py-2"><Gamepad2 className="w-4 h-4 mr-2" /> Rooms</TabsTrigger>
            <TabsTrigger value="notifications" className="py-2"><Bell className="w-4 h-4 mr-2" /> Notify</TabsTrigger>
            <TabsTrigger value="settings" className="py-2"><Settings className="w-4 h-4 mr-2" /> Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users?.map(u => (
                <div key={u.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-white">{u.name} {u.isAdmin && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded ml-2">ADMIN</span>} {u.banned && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded ml-2">BANNED</span>}</div>
                    <div className="text-sm text-zinc-400">{u.phone}</div>
                    <div className="text-xs text-zinc-500 mt-1">Joined: {new Date(u.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="text-sm font-medium text-white">W: {u.wins} / L: {u.losses}</div>
                    <button 
                      onClick={() => handleAction(banUser, { id: u.id, data: { banned: !u.banned } }, refetchUsers, `User ${u.banned ? 'unbanned' : 'banned'}`)}
                      className={`text-xs px-3 py-1 rounded font-bold ${u.banned ? 'bg-zinc-800 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
                    >
                      {u.banned ? 'Unban' : 'Ban User'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="deposits" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deposits?.map(d => (
                <div key={d.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        {d.userName}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${d.method === 'bkash' ? 'bg-[#E2136E]/20 text-[#E2136E]' : 'bg-[#FF6B00]/20 text-[#FF6B00]'}`}>{d.method}</span>
                      </div>
                      <div className="text-xs text-zinc-400 mt-1">{d.phone}</div>
                      <div className="text-xs font-mono text-zinc-500 mt-1">TrxID: {d.trxId}</div>
                    </div>
                    <div className="text-xl font-bold text-green-400">৳{d.amount}</div>
                  </div>
                  {d.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleAction(approveDep, { id: d.id }, refetchDeposits, "Deposit approved")} className="flex-1 bg-green-600/20 text-green-500 hover:bg-green-600/30 text-sm font-bold py-2 rounded flex justify-center items-center gap-1"><CheckCircle className="w-4 h-4"/> Approve</button>
                      <button onClick={() => handleAction(rejectDep, { id: d.id }, refetchDeposits, "Deposit rejected")} className="flex-1 bg-red-600/20 text-red-500 hover:bg-red-600/30 text-sm font-bold py-2 rounded flex justify-center items-center gap-1"><XCircle className="w-4 h-4"/> Reject</button>
                    </div>
                  ) : (
                    <div className={`text-xs font-bold uppercase ${d.status === 'approved' ? 'text-green-500' : 'text-red-500'}`}>
                      {d.status}
                    </div>
                  )}
                </div>
              ))}
              {deposits?.length === 0 && <div className="text-zinc-500 text-center col-span-2 py-8">No deposits found.</div>}
            </div>
          </TabsContent>

          <TabsContent value="withdrawals" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {withdrawals?.map(w => (
                <div key={w.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        {w.userName}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${w.method === 'bkash' ? 'bg-[#E2136E]/20 text-[#E2136E]' : 'bg-[#FF6B00]/20 text-[#FF6B00]'}`}>{w.method}</span>
                      </div>
                      <div className="text-xs text-zinc-400 mt-1">Send to: <span className="text-white font-mono">{w.phone}</span></div>
                    </div>
                    <div className="text-xl font-bold text-red-400">৳{w.amount}</div>
                  </div>
                  {w.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleAction(approveWith, { id: w.id }, refetchWithdrawals, "Withdrawal approved")} className="flex-1 bg-green-600/20 text-green-500 hover:bg-green-600/30 text-sm font-bold py-2 rounded flex justify-center items-center gap-1"><CheckCircle className="w-4 h-4"/> Approve</button>
                      <button onClick={() => handleAction(rejectWith, { id: w.id }, refetchWithdrawals, "Withdrawal rejected")} className="flex-1 bg-red-600/20 text-red-500 hover:bg-red-600/30 text-sm font-bold py-2 rounded flex justify-center items-center gap-1"><XCircle className="w-4 h-4"/> Reject</button>
                    </div>
                  ) : (
                    <div className={`text-xs font-bold uppercase ${w.status === 'approved' ? 'text-green-500' : 'text-red-500'}`}>
                      {w.status}
                    </div>
                  )}
                </div>
              ))}
              {withdrawals?.length === 0 && <div className="text-zinc-500 text-center col-span-2 py-8">No withdrawals found.</div>}
            </div>
          </TabsContent>
          
          <TabsContent value="rooms" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms?.map(room => (
                <div key={room.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4" style={{ borderTopColor: room.color, borderTopWidth: '4px' }}>
                  <div className="flex justify-between">
                    <div>
                      <div className="font-bold text-white">{room.name}</div>
                      <div className="text-xs text-zinc-400">{room.tagline}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-green-400">Prize: ৳{room.winnerPrize}</div>
                      <div className="text-xs text-zinc-400">Fee: ৳{room.entryFee}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold py-1.5 rounded">Edit</button>
                  </div>
                </div>
              ))}
              <div className="bg-zinc-900/30 border border-dashed border-zinc-800 rounded-lg p-4 flex flex-col items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-600 cursor-pointer min-h-[120px] transition-colors">
                <Gamepad2 className="w-8 h-8 mb-2 opacity-50" />
                <span className="font-medium">Add New Room</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="mt-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 max-w-xl">
              <h2 className="text-lg font-bold text-white mb-4">Send Push Notification</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleAction(sendNotif, { 
                  data: { 
                    title: formData.get('title') as string, 
                    message: formData.get('message') as string,
                    userId: formData.get('userId') ? parseInt(formData.get('userId') as string) : undefined
                  } 
                }, () => {}, "Notification sent");
                e.currentTarget.reset();
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Target User ID (Optional - leave blank for all users)</label>
                  <input name="userId" type="number" className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-white" placeholder="e.g. 1" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Title</label>
                  <input name="title" required className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-white" placeholder="Notification Title" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Message</label>
                  <textarea name="message" required className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-white h-24" placeholder="Notification body..."></textarea>
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-md" disabled={sendNotif.isPending}>
                  {sendNotif.isPending ? "Sending..." : "Send Notification"}
                </button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 max-w-xl">
              <h2 className="text-lg font-bold text-white mb-4">Platform Settings</h2>
              {settings && (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleAction(updateSettings, { 
                    data: { 
                      telegramLink: formData.get('telegramLink') as string,
                      referralBonus: parseInt(formData.get('referralBonus') as string),
                      platformFeePercent: parseInt(formData.get('platformFeePercent') as string),
                      minDeposit: parseInt(formData.get('minDeposit') as string),
                      minWithdrawal: parseInt(formData.get('minWithdrawal') as string),
                    } 
                  }, refetchSettings, "Settings updated successfully");
                }} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Telegram Link</label>
                    <input name="telegramLink" defaultValue={settings.telegramLink} className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Referral Bonus (৳)</label>
                      <input name="referralBonus" type="number" defaultValue={settings.referralBonus} className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Platform Fee (%)</label>
                      <input name="platformFeePercent" type="number" defaultValue={settings.platformFeePercent} className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Min Deposit (৳)</label>
                      <input name="minDeposit" type="number" defaultValue={settings.minDeposit} className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Min Withdrawal (৳)</label>
                      <input name="minWithdrawal" type="number" defaultValue={settings.minWithdrawal} className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-white" />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-md mt-4" disabled={updateSettings.isPending}>
                    {updateSettings.isPending ? "Saving..." : "Save Settings"}
                  </button>
                </form>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}