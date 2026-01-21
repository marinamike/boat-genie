import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import RoleSwitcher from "@/components/RoleSwitcher";
import ProviderDashboard from "./pages/ProviderDashboard";
import DockView from "./pages/DockView";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Membership from "./pages/Membership";
import MarinaManagement from "./pages/MarinaManagement";
import DryStackLaunch from "./pages/DryStackLaunch";
import Profile from "./pages/Profile";
import RegisterMarina from "./pages/RegisterMarina";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RoleSwitcher />
          <div className="pt-10"> {/* Offset for role switcher header */}
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/membership" element={<Membership />} />
              <Route path="/marina" element={<MarinaManagement />} />
              <Route path="/dry-stack" element={<DryStackLaunch />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/register-marina" element={<RegisterMarina />} />
              <Route path="/provider" element={<ProviderDashboard />} />
              <Route path="/dock" element={<DockView />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
