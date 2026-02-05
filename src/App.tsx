import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { VesselProvider } from "@/contexts/VesselContext";
import { OwnerLayout, ProviderLayout, StaffLayout, BusinessLayout } from "@/layouts";
import { BusinessProvider } from "@/contexts/BusinessContext";
import { MarineLoadingScreen } from "@/components/ui/marine-loading";

// Page imports
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

// Owner pages
import Dashboard from "./pages/Dashboard";
import BoatLog from "./pages/BoatLog";
import Membership from "./pages/Membership";

// Provider pages
import ProviderDashboard from "./pages/ProviderDashboard";

// Staff pages
import DockView from "./pages/DockView";
import DryStackLaunch from "./pages/DryStackLaunch";
import Operations from "./pages/Operations";

// Business pages
import MarinaDetails from "./pages/MarinaDetails";
import MarinaSlipsPage from "./pages/MarinaSlipsPage";
import BusinessDashboard from "./pages/BusinessDashboard";
import BusinessSettings from "./pages/BusinessSettings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 30 * 1000,
    },
  },
});

/**
 * Three-Profile Architecture:
 * - Customer (boat_owner): Boat owners who need services
 * - Business (admin): Marina/yard operators who manage modules
 * - Staff (marina_staff): Employees assigned to specific modules
 * - Provider: Service providers (legacy, treated as independent contractors)
 */
function RoleBasedRoutes() {
  const { role, loading, user } = useAuth();

  if (loading) {
    return <MarineLoadingScreen message="Preparing your dashboard..." />;
  }

  // Public routes for unauthenticated users
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Strict role-based routing
  switch (role) {
    case "boat_owner":
      return (
        <Routes>
          <Route element={<OwnerLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/boat-log" element={<BoatLog />} />
            <Route path="/membership" element={<Membership />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="/marina/:id" element={<MarinaDetails />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      );

    case "provider":
      return (
        <Routes>
          <Route element={<ProviderLayout />}>
            <Route path="/provider" element={<ProviderDashboard />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="/" element={<Navigate to="/provider" replace />} />
          <Route path="*" element={<Navigate to="/provider" replace />} />
        </Routes>
      );

    case "marina_staff":
      return (
        <Routes>
          <Route element={<StaffLayout />}>
            <Route path="/dock" element={<DockView />} />
            <Route path="/operations" element={<Operations />} />
            <Route path="/dry-stack" element={<DryStackLaunch />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="/" element={<Navigate to="/dock" replace />} />
          <Route path="*" element={<Navigate to="/dock" replace />} />
        </Routes>
      );

    case "admin":
      // "admin" now means Business Profile (marina/yard manager)
      return (
        <BusinessProvider>
          <Routes>
            <Route element={<BusinessLayout />}>
              <Route path="/business" element={<BusinessDashboard />} />
              <Route path="/business/slips" element={<MarinaSlipsPage />} />
              <Route path="/business/jobs" element={<ProviderDashboard />} />
              <Route path="/business/settings" element={<BusinessSettings />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            <Route path="/" element={<Navigate to="/business" replace />} />
            <Route path="*" element={<Navigate to="/business" replace />} />
          </Routes>
        </BusinessProvider>
      );

    default:
      return (
        <Routes>
          <Route element={<OwnerLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      );
  }
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <VesselProvider>
            <RoleBasedRoutes />
          </VesselProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
