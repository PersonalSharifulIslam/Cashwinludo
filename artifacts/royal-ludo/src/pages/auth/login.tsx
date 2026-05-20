import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  phone: z.string().min(10, "Valid phone number required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    loginMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        login(data.token, data.user);
        setLocation("/");
        toast({ title: "Welcome back!", description: "Login successful." });
      },
      onError: (error: any) => {
        toast({ 
          title: "Login failed", 
          description: error?.message || "Invalid credentials",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background w-full max-w-[430px] mx-auto relative shadow-2xl flex flex-col items-center justify-center p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>
      
      <div className="z-10 w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-primary to-yellow-600 text-glow">
            ROYAL LUDO
          </h1>
          <p className="text-muted-foreground text-sm font-medium tracking-widest uppercase">Arena</p>
        </div>

        <GlassCard className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your phone" {...field} className="bg-black/50 border-white/10 text-white placeholder:text-muted-foreground h-12" />
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
                    <FormLabel className="text-white">Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter password" {...field} className="bg-black/50 border-white/10 text-white placeholder:text-muted-foreground h-12" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full h-12 mt-4 bg-gradient-to-r from-primary to-yellow-600 hover:from-primary/90 hover:to-yellow-600/90 text-black font-bold text-lg shadow-[0_0_15px_rgba(255,215,0,0.4)]"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Logging in..." : "Login to Play"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary font-bold hover:underline text-glow">
              Register Now
            </Link>
          </div>
        </GlassCard>

        <div className="text-center">
          <Link href="/admin-login" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-white transition-colors">
            <ShieldAlert className="w-3 h-3" />
            Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
}