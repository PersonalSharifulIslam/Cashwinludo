import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { useEffect } from "react";

import { BottomNav } from "@/components/layout/bottom-nav";
import { Header } from "@/components/layout/header";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import AdminLogin from "@/pages/auth/admin-login";
import Rooms from "@/pages/rooms";
import Searching from "@/pages/searching";
import Game from "@/pages/game";
import Wallet from "@/pages/wallet";
import AddCash from "@/pages/add-cash";
import Withdraw from "@/pages/withdraw";
import Referrals from "@/pages/referrals";
import Profile from "@/pages/profile";
import Notifications from "@/pages/notifications";
import AdminDashboard from "@/pages/admin/dashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const hideNav = location.startsWith("/game") || location.startsWith("/searching");

  return (
    <div className="min-h-screen bg-background w-full max-w-[430px] mx-auto relative shadow-2xl flex flex-col pb-20">
      {!hideNav && <Header />}
      <main className={`flex-1 px-4 overflow-x-hidden ${hideNav ? "py-0" : "py-2"}`}>
        <Component {...rest} />
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}

function AdminRoute({ component: Component }: any) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        setLocation("/admin-login");
      } else if (!user?.isAdmin) {
        setLocation("/");
      }
    }
  }, [isLoading, isAuthenticated, user, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user?.isAdmin) return null;

  return (
    <div className="min-h-screen bg-zinc-950 w-full">
      <Component />
    </div>
  );
}

function PublicOnlyRoute({ component: Component }: any) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (user?.isAdmin) {
      return <Redirect to="/admin" />;
    }
    return <Redirect to="/" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={() => <PublicOnlyRoute component={Login} />} />
      <Route path="/register" component={() => <PublicOnlyRoute component={Register} />} />
      <Route path="/admin-login" component={() => <PublicOnlyRoute component={AdminLogin} />} />

      <Route path="/admin" component={() => <AdminRoute component={AdminDashboard} />} />

      <Route path="/" component={() => <ProtectedRoute component={Home} />} />
      <Route path="/rooms" component={() => <ProtectedRoute component={Rooms} />} />
      <Route path="/searching/:matchId" component={() => <ProtectedRoute component={Searching} />} />
      <Route path="/game/:matchId" component={() => <ProtectedRoute component={Game} />} />
      <Route path="/wallet" component={() => <ProtectedRoute component={Wallet} />} />
      <Route path="/add-cash" component={() => <ProtectedRoute component={AddCash} />} />
      <Route path="/withdraw" component={() => <ProtectedRoute component={Withdraw} />} />
      <Route path="/referrals" component={() => <ProtectedRoute component={Referrals} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
      <Route path="/notifications" component={() => <ProtectedRoute component={Notifications} />} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="bg-black min-h-screen w-full flex justify-center">
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
          </div>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
