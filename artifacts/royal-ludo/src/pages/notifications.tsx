import { useGetNotifications, useMarkNotificationRead } from "@workspace/api-client-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Bell, CheckCircle2 } from "lucide-react";

export default function Notifications() {
  const { data: notifications, isLoading, refetch } = useGetNotifications();
  const markReadMutation = useMarkNotificationRead();

  const handleMarkRead = (id: number) => {
    markReadMutation.mutate({ id }, {
      onSuccess: () => refetch()
    });
  };

  if (isLoading) {
    return <div className="space-y-4"><div className="h-24 bg-card/40 rounded-xl animate-pulse"></div></div>;
  }

  return (
    <div className="pb-24 space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Bell className="w-6 h-6 text-primary" />
        Notifications
      </h1>

      <div className="space-y-3">
        {notifications?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
            <Bell className="w-12 h-12 mb-3 opacity-20" />
            No new notifications.
          </div>
        ) : (
          notifications?.map(notif => (
            <GlassCard 
              key={notif.id} 
              className={`p-4 relative transition-all ${!notif.isRead ? 'border-primary/50 bg-primary/5' : 'opacity-70'}`}
              onClick={() => !notif.isRead && handleMarkRead(notif.id)}
            >
              {!notif.isRead && (
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(255,215,0,0.8)]"></div>
              )}
              <h3 className={`font-bold text-sm mb-1 ${!notif.isRead ? 'text-white' : 'text-white/80'}`}>{notif.title}</h3>
              <p className="text-xs text-muted-foreground mb-2 pr-4 leading-relaxed">{notif.message}</p>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                <span className="text-[10px] text-muted-foreground">{new Date(notif.createdAt).toLocaleString()}</span>
                {notif.isRead && <CheckCircle2 className="w-4 h-4 text-green-500/50" />}
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}