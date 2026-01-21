import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Anchor, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarinaRegistrationForm } from "@/components/onboarding/MarinaRegistrationForm";
import { useUserRole } from "@/hooks/useUserRole";

const RegisterMarina = () => {
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const { registerMarina, hasMarina } = useUserRole();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          navigate("/login", { replace: true });
          return;
        }
      } catch (error) {
        console.error("RegisterMarina: auth check failed", error);
        // If something goes wrong, don't trap the user on a perpetual loader.
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (hasMarina) {
      navigate("/marina");
    }
  }, [hasMarina, navigate]);

  const handleSubmit = async (data: {
    marina_name: string;
    address: string;
    total_slips: number;
    staging_dock_linear_footage: number;
    amenities: string[];
  }) => {
    setLoading(true);
    const success = await registerMarina(data);
    setLoading(false);

    if (success) {
      navigate("/marina");
    }
    return success;
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Anchor className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-4 py-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <MarinaRegistrationForm onSubmit={handleSubmit} loading={loading} />

          <p className="text-center text-sm text-muted-foreground mt-6">
            Want to join as a boat owner instead?{" "}
            <Link to="/profile" className="text-primary hover:underline font-semibold">
              Change role
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default RegisterMarina;
