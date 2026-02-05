import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { VesselProvider } from "@/contexts/VesselContext";
import RoleSwitcher from "@/components/RoleSwitcher";
import { OwnerLayout, ProviderLayout, StaffLayout, MarinaLayout, BusinessLayout } from "@/layouts";
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

// Staff/Admin pages
import DockView from "./pages/DockView";
import MarinaManagement from "./pages/MarinaManagement";
import MarinaDetails from "./pages/MarinaDetails";
import DryStackLaunch from "./pages/DryStackLaunch";
import RegisterMarina from "./pages/RegisterMarina";
import AdminDashboard from "./pages/AdminDashboard";
import Operations from "./pages/Operations";

// Marina Dashboard pages
import MarinaDashboard from "./pages/MarinaDashboard";
import MarinaSlipsPage from "./pages/MarinaSlipsPage";
import MarinaReservationsPage from "./pages/MarinaReservationsPage";
import MarinaLeasesPage from "./pages/MarinaLeasesPage";
import MarinaMessagesPage from "./pages/MarinaMessagesPage";
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

// Clear cache on role switch to ensure fresh data
if (typeof window !== "undefined") {
  const roleSwitchPending = localStorage.getItem("role_switch_pending");
  if (roleSwitchPending) {
    localStorage.removeItem("role_switch_pending");
    queryClient.clear();
  }
}

/**
 * Role-based route renderer with strict layout isolation.
 * Each role gets its own layout with only relevant routes.
 */
function RoleBasedRoutes() {
  const { role, loading, user } = useAuth();

  // Show marine-themed loading while auth is loading
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

  // Strict role-based routing switch
  switch (role) {
    case "boat_owner":
      return (
        <Routes>
          {/* Owner Layout - Home, Boat Log, Membership, Profile */}
          <Route element={<OwnerLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/boat-log" element={<BoatLog />} />
            <Route path="/membership" element={<Membership />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          {/* Public marina details page accessible to owners */}
          <Route path="/marina/:id" element={<MarinaDetails />} />
          {/* Redirect any non-owner routes to owner dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/provider" element={<Navigate to="/dashboard" replace />} />
          <Route path="/operations" element={<Navigate to="/dashboard" replace />} />
          <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
          <Route path="/marina" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dock" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      );

    case "provider":
      return (
        <Routes>
          {/* Provider Layout - Dashboard with tabs for Jobs, Services, Payouts */}
          <Route element={<ProviderLayout />}>
            <Route path="/provider" element={<ProviderDashboard />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          {/* Redirect any non-provider routes to provider dashboard */}
          <Route path="/" element={<Navigate to="/provider" replace />} />
          <Route path="/dashboard" element={<Navigate to="/provider" replace />} />
          <Route path="/boat-log" element={<Navigate to="/provider" replace />} />
          <Route path="/operations" element={<Navigate to="/provider" replace />} />
          <Route path="/admin" element={<Navigate to="/provider" replace />} />
          <Route path="/marina" element={<Navigate to="/provider" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      );

    case "marina_staff":
      return (
        <Routes>
          {/* Staff Layout - QC Queue, Dock View */}
          <Route element={<StaffLayout />}>
            <Route path="/dock" element={<DockView />} />
            <Route path="/operations" element={<Operations />} />
            <Route path="/dry-stack" element={<DryStackLaunch />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          {/* Redirect any non-staff routes to dock view */}
          <Route path="/" element={<Navigate to="/dock" replace />} />
          <Route path="/dashboard" element={<Navigate to="/dock" replace />} />
          <Route path="/provider" element={<Navigate to="/dock" replace />} />
          <Route path="/admin" element={<Navigate to="/dock" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      );

    case "admin":
      return (
        <BusinessProvider>
          <Routes>
            {/* Business Layout - Modular management with dynamic nav */}
            <Route element={<BusinessLayout />}>
              <Route path="/business" element={<BusinessDashboard />} />
              <Route path="/business/slips" element={<MarinaSlipsPage />} />
              <Route path="/business/jobs" element={<ProviderDashboard />} />
              <Route path="/business/settings" element={<BusinessSettings />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            {/* Legacy marina routes - redirect to new business routes */}
            <Route path="/marina" element={<Navigate to="/business" replace />} />
            <Route path="/marina/slips" element={<Navigate to="/business/slips" replace />} />
            <Route path="/marina/settings" element={<Navigate to="/business/settings" replace />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/register-marina" element={<RegisterMarina />} />
            {/* Default landing for Business Managers is /business */}
            <Route path="/" element={<Navigate to="/business" replace />} />
            <Route path="/dashboard" element={<Navigate to="/business" replace />} />
            <Route path="/provider" element={<Navigate to="/business" replace />} />
            <Route path="/dock" element={<Navigate to="/business" replace />} />
            <Route path="/operations" element={<Navigate to="/business" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BusinessProvider>
      );

    default:
      // Fallback to owner layout
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
            <RoleSwitcher />
            <div className="pt-10">
              <RoleBasedRoutes />
            </div>
          </VesselProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
