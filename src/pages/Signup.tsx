import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Anchor, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RoleSelector } from "@/components/onboarding/RoleSelector";
import type { AppRole } from "@/hooks/useUserRole";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("boat_owner");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Save the selected role to user_roles table
    if (data.user) {
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: data.user.id, role: selectedRole });

      if (roleError) {
        console.error("Failed to save role:", roleError);
      }
    }

    // If marina manager selected, redirect to registration
    if (selectedRole === "admin") {
      toast({
        title: "Welcome aboard!",
        description: "Let's set up your marina.",
      });
      navigate("/register-marina", { replace: true });
    } else {
      toast({
        title: "Welcome aboard!",
        description: "Your account has been created successfully.",
      });
      navigate("/dashboard", { replace: true });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-scale-in shadow-lg">
        <CardHeader className="text-center pb-2">
          <Link to="/" className="inline-flex items-center justify-center mb-4">
            <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center">
              <Anchor className="w-7 h-7 text-primary-foreground" strokeWidth={2.5} />
            </div>
          </Link>
          <CardTitle className="text-2xl font-bold tracking-tight">Create Account</CardTitle>
          <CardDescription>Join Boat Genie and start managing your vessel</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="font-medium">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Captain Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-12 touch-target"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="captain@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 touch-target"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-12 touch-target pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Label className="font-medium">I am a...</Label>
              <RoleSelector selectedRole={selectedRole} onSelect={setSelectedRole} />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-gold hover:opacity-90 shadow-gold text-foreground font-semibold touch-target" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-semibold">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
