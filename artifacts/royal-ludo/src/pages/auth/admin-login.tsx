import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAdminLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Shield, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password required"),
});

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const adminLoginMutation = useAdminLogin();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    adminLoginMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        login(data.token, data.user);
        setLocation("/admin");
        toast({ title: "Admin Access Granted" });
      },
      onError: (error: any) => {
        toast({ 
          title: "Access Denied", 
          description: error?.message || "Invalid credentials",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 w-full max-w-[430px] mx-auto relative shadow-2xl flex flex-col items-center justify-center p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-zinc-950 to-zinc-950"></div>
      
      <div className="z-10 w-full max-w-sm space-y-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto border border-blue-500/50 shadow-[0_0_20px_rgba(37,99,235,0.3)]">
            <Shield className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Admin Portal</h1>
        </div>

        <GlassCard className="p-6 bg-zinc-900/60 border-zinc-800">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-400">Admin Email</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@example.com" {...field} className="bg-zinc-950 border-zinc-800 text-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-400">Secret Key</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <Input type="password" placeholder="••••••••" {...field} className="pl-9 bg-zinc-950 border-zinc-800 text-white" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full h-12 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                disabled={adminLoginMutation.isPending}
              >
                {adminLoginMutation.isPending ? "Authenticating..." : "Authorize"}
              </Button>
            </form>
          </Form>
        </GlassCard>
      </div>
    </div>
  );
}