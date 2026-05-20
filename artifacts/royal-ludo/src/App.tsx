import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { useEffect } from "react";

// Components
import { BottomNav } from "@/components/layout/bottom-nav";
import { Header } from "@/components/layout/header";
import NotFound from "@/pages/not-found";

// Pages
import Home from "@/pages/home";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import AdminLogin from "@/pages/auth/admin-login";
import Rooms from "@/pages/rooms";
import Searching from "@/pages/searching";

const queryClient = new QueryClient();

// Protected Route Wrapper
function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!isAuthenticated) return null;

  // Don't show header/bottom nav on specific immersive pages
  const hideNav = location.startsWith('/game') || location.startsWith('/searching');

  return (
    <div className="min-h-screen bg-background w-full max-w-[430px] mx-auto relative shadow-2xl flex flex-col pb-20">
      {!hideNav && <Header />}
      <main className={`flex-1 px-4 overflow-x-hidden ${hideNav ? 'py-0' : 'py-2'}`}>
        <Component {...rest} />
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}

// Stubs for pages we haven't built yet
const Game = () => <div className="text-white">Game Page</div>;
const Wallet = () => <div className="text-white">Wallet Page</div>;
const AddCash = () => <div className="text-white">Add Cash Page</div>;
const Withdraw = () => <div className="text-white">Withdraw Page</div>;
const Referrals = () => <div className="text-white">Referrals Page</div>;
const Profile = () => <div className="text-white">Profile Page</div>;
const Notifications = () => <div className="text-white">Notifications Page</div>;
const AdminDashboard = () => <div className="text-white">Admin Dashboard</div>;

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/admin-login" component={AdminLogin} />
      
      {/* Protected Routes */}
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
      <Route path="/admin" component={() => <ProtectedRoute component={AdminDashboard} />} />
      
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